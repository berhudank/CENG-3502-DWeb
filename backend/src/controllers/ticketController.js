// flyticket/backend/src/controllers/ticketController.js
const pool = require('../config/db');
const crypto = require('crypto');

/**
 * POST /api/tickets
 * Books a ticket for a user.
 * Expects: { passenger_name, passenger_surname, passenger_email, flight_ids: ['FLT-123'] }
 */
const bookTicket = async (req, res, next) => {
    const { passenger_name, passenger_surname, passenger_email, flight_ids } = req.body;

    console.log(`[ACTION] [${req.id}] Booking attempt for ${passenger_email} on flights:`, flight_ids);

    // Validate input
    if (!flight_ids || !Array.isArray(flight_ids) || flight_ids.length === 0) {
        const err = new Error('No flights selected for booking.');
        err.status = 400;
        return next(err);
    }

    const booking_id = `BKG-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();
        console.log(`[ACTION] [${req.id}] Transaction started for booking ${booking_id}.`);

        // 1. Create the main Booking record
        const insertBookingQuery = `
            INSERT INTO Bookings (booking_id, passenger_name, passenger_surname, passenger_email)
            VALUES (?, ?, ?, ?)
        `;
        await connection.query(insertBookingQuery, [
            booking_id, passenger_name, passenger_surname, passenger_email
        ]);

        // 2. Loop through each flight segment to check capacity and create tickets
        // (Even though it's an array of 1 for now, this future-proofs it for transit flights)
        for (let i = 0; i < flight_ids.length; i++) {
            const flight_id = flight_ids[i];
            const segment_order = i + 1;

            // Step A & B & C: Atomically attempt to deduct a seat without explicit read-locks
            const [updateResult] = await connection.query(
                'UPDATE Flights SET seats_available = seats_available - 1 WHERE flight_id = ? AND seats_available > 0',
                [flight_id]
            );

            if (updateResult.affectedRows === 0) {
                // If 0 rows affected, check if it was because of capacity or non-existence
                const [checkFlight] = await connection.query('SELECT flight_id FROM Flights WHERE flight_id = ?', [flight_id]);
                if (checkFlight.length === 0) {
                    throw new Error(`Flight ${flight_id} does not exist.`);
                }
                throw new Error(`Flight ${flight_id} is completely sold out.`);
            }

            // Step D: Create the Ticket Segment record
            const ticket_id = `TKT-${crypto.randomUUID().slice(0, 12).toUpperCase()}`;
            const insertTicketQuery = `
                INSERT INTO Ticket_Segments (ticket_id, booking_id, flight_id, segment_order)
                VALUES (?, ?, ?, ?)
            `;
            await connection.query(insertTicketQuery, [ticket_id, booking_id, flight_id, segment_order]);

            console.log(`[ACTION] [${req.id}] Seat secured on ${flight_id}. Ticket generated: ${ticket_id}.`);
        }

        // 3. Commit the transaction if everything succeeded
        await connection.commit();
        console.log(`[ACTION] [${req.id}] Booking ${booking_id} committed successfully.`);

        res.status(201).json({
            success: true,
            message: 'Booking successful!',
            booking_id: booking_id
        });

    } catch (error) {
        console.log(`[ERROR] [${req.id}] Booking failed. Rolling back. Reason: ${error.message}`);
        await connection.rollback();

        // If it's our custom capacity error, send a 400 Bad Request
        if (error.message.includes('sold out') || error.message.includes('does not exist')) {
            error.status = 400;
        }
        next(error);
    } finally {
        connection.release();
    }
};

/**
 * GET /api/tickets/:email
 * Retrieves all bookings for a specific customer.
 */
const getUserBookings = async (req, res, next) => {
    const { email } = req.params;
    console.log(`[ACTION] [${req.id}] Fetching bookings for user: ${email}`);

    try {
        const query = `
            SELECT 
                b.booking_id, b.booking_date,
                ts.ticket_id, ts.seat_number, ts.segment_order,
                f.flight_id, f.from_city, f.to_city, f.departure_time, f.arrival_time, f.price,
                c1.city_name AS from_city_name, c2.city_name AS to_city_name
            FROM Bookings b
            JOIN Ticket_Segments ts ON b.booking_id = ts.booking_id
            JOIN Flights f ON ts.flight_id = f.flight_id
            JOIN Cities c1 ON f.from_city = c1.city_id
            JOIN Cities c2 ON f.to_city = c2.city_id
            WHERE b.passenger_email = ?
            ORDER BY b.booking_date DESC, ts.segment_order ASC
        `;

        const [bookings] = await pool.query(query, [email]);
        console.log(`[ACTION] [${req.id}] Found ${bookings.length} ticket segments for ${email}.`);

        res.status(200).json({ success: true, data: bookings });

    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/tickets/booking/:booking_id
 * Retrieves booking details by Booking ID.
 */
const getBookingById = async (req, res, next) => {
    const { booking_id } = req.params;
    console.log(`[ACTION] [${req.id}] Fetching booking details for ID: ${booking_id}`);

    try {
        const query = `
            SELECT 
                b.booking_id, b.passenger_name, b.passenger_surname, b.passenger_email, b.booking_date,
                ts.ticket_id, ts.seat_number, ts.segment_order,
                f.flight_id, f.from_city, f.to_city, f.departure_time, f.arrival_time, f.price,
                c1.city_name AS from_city_name, c2.city_name AS to_city_name
            FROM Bookings b
            JOIN Ticket_Segments ts ON b.booking_id = ts.booking_id
            JOIN Flights f ON ts.flight_id = f.flight_id
            JOIN Cities c1 ON f.from_city = c1.city_id
            JOIN Cities c2 ON f.to_city = c2.city_id
            WHERE b.booking_id = ?
            ORDER BY ts.segment_order ASC
        `;

        const [bookings] = await pool.query(query, [booking_id]);

        if (bookings.length === 0) {
            const err = new Error('Booking not found.');
            err.status = 404;
            return next(err);
        }

        console.log(`[ACTION] [${req.id}] Found booking ${booking_id}.`);
        res.status(200).json({ success: true, data: bookings });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    bookTicket,
    getUserBookings,
    getBookingById
};