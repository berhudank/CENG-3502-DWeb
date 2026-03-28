// backend/src/controllers/flightController.js
const pool = require('../config/db');
const crypto = require('crypto');

/**
 * GET /api/flights
 * Retrieves all available flights. Supports optional query parameters for search[cite: 16, 17].
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
 * Creates a new flight[cite: 83]. Enforces the single runway rule using strict DB transactions.
 */
const createFlight = async (req, res, next) => {
    const { from_city, to_city, departure_time, arrival_time, price, seats_total } = req.body;
    const flight_id = `FLT-${crypto.randomUUID().slice(0, 8).toUpperCase()}`; // e.g., FLT-A1B2C3D4

    console.log(`[ACTION] [${req.id}] Attempting to create flight ${flight_id} from ${from_city} to ${to_city}`);

    // Grab a dedicated connection from the pool to manage our transaction
    const connection = await pool.getConnection();

    try {
        // 1. START TRANSACTION
        await connection.beginTransaction();
        console.log(`[ACTION] [${req.id}] Transaction started.`);

        // 2. LOCK THE AIRPORTS (Concurrency Control)
        // By selecting the departure and arrival cities FOR UPDATE, we lock these rows.
        // If another admin is trying to add a flight for IST right now, their request
        // will pause here and wait for our transaction to finish.
        await connection.query(
            'SELECT city_id FROM Cities WHERE city_id IN (?, ?) FOR UPDATE',
            [from_city, to_city]
        );

        // 3. VALIDATE DEPARTURE RUNWAY RULE [cite: 50, 51]
        // Check if any flight departs from this city at the exact same hour
        const [depCheck] = await connection.query(
            `SELECT flight_id FROM Flights 
             WHERE from_city = ? 
             AND DATE_FORMAT(departure_time, '%Y-%m-%d %H') = DATE_FORMAT(?, '%Y-%m-%d %H')`,
            [from_city, departure_time]
        );

        if (depCheck.length > 0) {
            throw new Error(`Runway rule violation: Another flight already departs from ${from_city} during this hour.`);
        }

        // 4. VALIDATE ARRIVAL RUNWAY RULE [cite: 52, 53]
        // Check if any flight arrives at this city at the exact same hour
        const [arrCheck] = await connection.query(
            `SELECT flight_id FROM Flights 
             WHERE to_city = ? 
             AND DATE_FORMAT(arrival_time, '%Y-%m-%d %H') = DATE_FORMAT(?, '%Y-%m-%d %H')`,
            [to_city, arrival_time]
        );

        if (arrCheck.length > 0) {
            throw new Error(`Runway rule violation: Another flight already arrives in ${to_city} during this hour.`);
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

        // Calculate the new available seats.
        // If an admin increases total seats by 10, available seats go up by 10.
        const seatDifference = seats_total - existingFlight.seats_total;
        const new_seats_available = existingFlight.seats_available + seatDifference;

        if (new_seats_available < 0) {
            throw new Error(`Cannot reduce seats. There are already ${existingFlight.seats_total - existingFlight.seats_available} seats booked.`);
        }

        // 2. Lock the airports for concurrency control
        await connection.query(
            'SELECT city_id FROM Cities WHERE city_id IN (?, ?) FOR UPDATE',
            [from_city, to_city]
        );

        // 3. Validate Departure Runway Rule (Excluding the current flight)
        const [depCheck] = await connection.query(
            `SELECT flight_id FROM Flights 
             WHERE from_city = ? 
             AND DATE_FORMAT(departure_time, '%Y-%m-%d %H') = DATE_FORMAT(?, '%Y-%m-%d %H')
             AND flight_id != ?`,
            [from_city, departure_time, id]
        );

        if (depCheck.length > 0) {
            throw new Error(`Runway rule violation: Another flight already departs from ${from_city} during this hour.`);
        }

        // 4. Validate Arrival Runway Rule (Excluding the current flight)
        const [arrCheck] = await connection.query(
            `SELECT flight_id FROM Flights 
             WHERE to_city = ? 
             AND DATE_FORMAT(arrival_time, '%Y-%m-%d %H') = DATE_FORMAT(?, '%Y-%m-%d %H')
             AND flight_id != ?`,
            [to_city, arrival_time, id]
        );

        if (arrCheck.length > 0) {
            throw new Error(`Runway rule violation: Another flight already arrives in ${to_city} during this hour.`);
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

        if (error.message.includes('Runway rule violation') || error.message.includes('Cannot reduce seats')) {
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
    getAllFlights,
    createFlight,
    updateFlight,
    deleteFlight
};