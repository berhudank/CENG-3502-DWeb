// backend/src/controllers/flightController.js
const pool = require('../config/db');
const crypto = require('crypto');

/** GET /api/flights/:id */
const getFlightById = async (req, res, next) => {
    try {
        const [rows] = await pool.query('SELECT * FROM Flights WHERE flight_id = ?', [req.params.id]);
        if (rows.length === 0) {
            const err = new Error('Flight not found.');
            err.status = 404;
            throw err;
        }
        res.status(200).json({ success: true, data: rows[0] });
    } catch (error) { next(error); }
};

/**
 * GET /api/flights
 * Retrieves all available flights. Supports optional query parameters for search.
 */
const getAllFlights = async (req, res, next) => {
    console.log(`[ACTION] [${req.id}] Fetching flights...`);
    try {
        const { from_city, to_city, date } = req.query;
        let query = 'SELECT * FROM Flights WHERE 1=1';
        const queryParams = [];

        // Dynamically build the SQL query based on user search parameters
        if (from_city) {
            query += ' AND from_city = ?';
            queryParams.push(from_city);
        }
        if (to_city) {
            query += ' AND to_city = ?';
            queryParams.push(to_city);
        }
        if (date) {
            // Match the date portion of the DATETIME column
            query += ' AND DATE(departure_time) = ?';
            queryParams.push(date);
        }

        // Order by departure time for better UX
        query += ' ORDER BY departure_time ASC';

        const [flights] = await pool.query(query, queryParams);
        console.log(`[ACTION] [${req.id}] Found ${flights.length} flights.`);

        res.status(200).json({ success: true, data: flights });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/flights
 * Creates a new flight. Enforces the single runway rule using strict DB transactions.
 */
const createFlight = async (req, res, next) => {
    const { from_city, to_city, departure_time, arrival_time, price, seats_total } = req.body;

    if (price < 0) {
        const err = new Error('Price cannot be negative.');
        err.status = 400;
        return next(err);
    }

    if (seats_total <= 0) {
        const err = new Error('Total seats must be greater than zero.');
        err.status = 400;
        return next(err);
    }

    const now = new Date();
    const depTime = new Date(departure_time);
    const arrTime = new Date(arrival_time);

    if (depTime < now || arrTime < now) {
        const err = new Error('Cannot select a past date or time.');
        err.status = 400;
        return next(err);
    }

    if (arrTime <= depTime) {
        const err = new Error('Arrival time must be after departure time.');
        err.status = 400;
        return next(err);
    }
    const flight_id = `FLT-${crypto.randomUUID().slice(0, 8).toUpperCase()}`; // e.g., FLT-A1B2C3D4

    console.log(`[ACTION] [${req.id}] Attempting to create flight ${flight_id} from ${from_city} to ${to_city}`);

    // Grab a dedicated connection from the pool to manage our transaction
    const connection = await pool.getConnection();

    try {
        // 1. START TRANSACTION
        await connection.beginTransaction();
        console.log(`[ACTION] [${req.id}] Transaction started.`);

        // 2. VALIDATE RUNWAY RULES (Concurrency Control)
        // By checking for conflicts and using FOR UPDATE on Flights, we lock the relevant index gaps
        // and eliminate the need for locking the entire Cities rows which unnecessarily blocked parallel transactions.
        const [conflictCheck] = await connection.query(
            `SELECT flight_id, 
                    CASE 
                        WHEN from_city = ? AND DATE_FORMAT(departure_time, '%Y-%m-%d %H') = DATE_FORMAT(?, '%Y-%m-%d %H') THEN 'departure'
                        ELSE 'arrival'
                    END as conflict_type
             FROM Flights 
             WHERE (from_city = ? AND DATE_FORMAT(departure_time, '%Y-%m-%d %H') = DATE_FORMAT(?, '%Y-%m-%d %H'))
                OR (to_city = ? AND DATE_FORMAT(arrival_time, '%Y-%m-%d %H') = DATE_FORMAT(?, '%Y-%m-%d %H'))
             FOR UPDATE`,
            [from_city, departure_time, from_city, departure_time, to_city, arrival_time]
        );

        if (conflictCheck.length > 0) {
            const conflict = conflictCheck[0];
            if (conflict.conflict_type === 'departure') {
                throw new Error(`Runway rule violation: Another flight already departs from ${from_city} during this hour.`);
            } else {
                throw new Error(`Runway rule violation: Another flight already arrives in ${to_city} during this hour.`);
            }
        }

        // 5. INSERT THE FLIGHT
        console.log(`[ACTION] [${req.id}] Runway checks passed. Inserting flight...`);
        const insertQuery = `
            INSERT INTO Flights (flight_id, from_city, to_city, departure_time, arrival_time, price, seats_total, seats_available) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        await connection.query(insertQuery, [
            flight_id, from_city, to_city, departure_time, arrival_time, price, seats_total, seats_total
        ]);

        // 6. COMMIT TRANSACTION
        await connection.commit();
        console.log(`[ACTION] [${req.id}] Transaction committed successfully.`);

        res.status(201).json({
            success: true,
            message: 'Flight created successfully.',
            flight_id: flight_id
        });

    } catch (error) {
        // If ANYTHING fails (including our custom errors), reverse all database changes
        console.log(`[ERROR] [${req.id}] Transaction failed. Rolling back. Reason: ${error.message}`);
        await connection.rollback();

        // Handle MySQL foreign key constraint error specifically for Cities table
        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
            const match = error.message.match(/FOREIGN KEY \(\`(from_city|to_city)\`\) REFERENCES \`Cities\`/);
            if (match) {
                const fieldName = match[1];
                const badCode = fieldName === 'from_city' ? req.body.from_city : req.body.to_city;
                error.message = `Airport code ${badCode} is not defined`;
                error.status = 400;
            }
        }

        // Pass to the centralized error handler. If it's our custom error, set status to 400 (Bad Request)
        if (error.message.includes('Runway rule violation')) {
            error.status = 400;
        }
        next(error);
    } finally {
        // ALWAYS release the connection back to the pool, even if it crashed
        connection.release();
    }
};

/**
 * PUT /api/flights/:id
 * Updates an existing flight. Strictly re-validates runway rules.
 */
const updateFlight = async (req, res, next) => {
    const { id } = req.params;
    const { from_city, to_city, departure_time, arrival_time, price, seats_total } = req.body;

    if (price < 0) {
        const err = new Error('Price cannot be negative.');
        err.status = 400;
        return next(err);
    }

    if (seats_total <= 0) {
        const err = new Error('Total seats must be greater than zero.');
        err.status = 400;
        return next(err);
    }

    const now = new Date();
    const depTime = new Date(departure_time);
    const arrTime = new Date(arrival_time);

    if (depTime < now || arrTime < now) {
        const err = new Error('Cannot select a past date or time.');
        err.status = 400;
        return next(err);
    }

    if (arrTime <= depTime) {
        const err = new Error('Arrival time must be after departure time.');
        err.status = 400;
        return next(err);
    }

    console.log(`[ACTION] [${req.id}] Attempting to update flight ${id}...`);

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();
        console.log(`[ACTION] [${req.id}] Transaction started for update.`);

        // 1. Fetch the existing flight to check seat differences and ensure it exists
        const [existingFlightRows] = await connection.query(
            'SELECT seats_total, seats_available FROM Flights WHERE flight_id = ?',
            [id]
        );

        if (existingFlightRows.length === 0) {
            throw new Error('Flight not found.');
        }

        const existingFlight = existingFlightRows[0];

        if (parseInt(seats_total) !== existingFlight.seats_total) {
            throw new Error('Cannot change total seats after flight is created.');
        }

        // Available seats remain unchanged because total seats cannot be changed
        const new_seats_available = existingFlight.seats_available;

        // 2. Validate Runway Rules (Concurrency Control)
        // Combined into a single query to eliminate redundancy and unnecessary Cities table locks.
        const [conflictCheck] = await connection.query(
            `SELECT flight_id, 
                    CASE 
                        WHEN from_city = ? AND DATE_FORMAT(departure_time, '%Y-%m-%d %H') = DATE_FORMAT(?, '%Y-%m-%d %H') THEN 'departure'
                        ELSE 'arrival'
                    END as conflict_type
             FROM Flights 
             WHERE ((from_city = ? AND DATE_FORMAT(departure_time, '%Y-%m-%d %H') = DATE_FORMAT(?, '%Y-%m-%d %H'))
                OR (to_city = ? AND DATE_FORMAT(arrival_time, '%Y-%m-%d %H') = DATE_FORMAT(?, '%Y-%m-%d %H')))
               AND flight_id != ?
             FOR UPDATE`,
            [from_city, departure_time, from_city, departure_time, to_city, arrival_time, id]
        );

        if (conflictCheck.length > 0) {
            const conflict = conflictCheck[0];
            if (conflict.conflict_type === 'departure') {
                throw new Error(`Runway rule violation: Another flight already departs from ${from_city} during this hour.`);
            } else {
                throw new Error(`Runway rule violation: Another flight already arrives in ${to_city} during this hour.`);
            }
        }

        // 5. Execute Update
        console.log(`[ACTION] [${req.id}] Runway checks passed. Updating flight...`);
        const updateQuery = `
            UPDATE Flights 
            SET from_city = ?, to_city = ?, departure_time = ?, arrival_time = ?, price = ?, seats_total = ?, seats_available = ?
            WHERE flight_id = ?
        `;
        await connection.query(updateQuery, [
            from_city, to_city, departure_time, arrival_time, price, seats_total, new_seats_available, id
        ]);

        await connection.commit();
        console.log(`[ACTION] [${req.id}] Flight ${id} updated successfully.`);

        res.status(200).json({ success: true, message: 'Flight updated successfully.' });

    } catch (error) {
        console.log(`[ERROR] [${req.id}] Update failed. Rolling back. Reason: ${error.message}`);
        await connection.rollback();

        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
            const match = error.message.match(/FOREIGN KEY \(\`(from_city|to_city)\`\) REFERENCES \`Cities\`/);
            if (match) {
                const fieldName = match[1];
                const badCode = fieldName === 'from_city' ? req.body.from_city : req.body.to_city;
                error.message = `Airport code ${badCode} is not defined`;
                error.status = 400;
            }
        }

        if (error.message.includes('Runway rule violation') || error.message.includes('Cannot change total seats')) {
            error.status = 400;
        } else if (error.message === 'Flight not found.') {
            error.status = 404;
        }
        next(error);
    } finally {
        connection.release();
    }
};

/**
 * DELETE /api/flights/:id
 * Deletes a flight.
 */
const deleteFlight = async (req, res, next) => {
    const { id } = req.params;
    console.log(`[ACTION] [${req.id}] Attempting to delete flight ${id}...`);

    try {
        // Because of relational DB constraints, if this flight has bookings attached in the
        // Ticket_Segments table, MySQL will automatically reject the deletion (which is what we want).
        const [result] = await pool.query('DELETE FROM Flights WHERE flight_id = ?', [id]);

        if (result.affectedRows === 0) {
            const err = new Error('Flight not found.');
            err.status = 404;
            throw err;
        }

        console.log(`[ACTION] [${req.id}] Flight ${id} deleted successfully.`);
        res.status(200).json({ success: true, message: 'Flight deleted successfully.' });

    } catch (error) {
        // Handle MySQL foreign key constraint error specifically
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            console.log(`[ERROR] [${req.id}] Cannot delete flight: active bookings exist.`);
            error.message = 'Cannot delete flight. There are active bookings associated with it.';
            error.status = 409; // 409 Conflict
        }
        next(error);
    }
};

// DO NOT FORGET TO UPDATE YOUR EXPORTS:
module.exports = {
    getFlightById,
    getAllFlights,
    createFlight,
    updateFlight,
    deleteFlight
};