// flyticket/backend/src/controllers/adminController.js
const pool = require('../config/db');
const bcrypt = require('bcrypt');

/**
 * POST /api/admin/login
 * Verifies admin credentials.
 */
const loginAdmin = async (req, res, next) => {
    const { username, password } = req.body;
    console.log(`[ACTION] [${req.id}] Admin login attempt for username: ${username}`);

    try {
        // 1. Find the admin by username
        const [rows] = await pool.query('SELECT * FROM Admins WHERE username = ?', [username]);

        if (rows.length === 0) {
            console.log(`[AUTH] [${req.id}] Login failed: Username not found.`);
            return res.status(401).json({ success: false, message: 'Invalid username or password.' });
        }

        const admin = rows[0];

        // 2. Compare the plain-text password with the hashed password in the DB
        const isMatch = await bcrypt.compare(password, admin.password);

        if (!isMatch) {
            console.log(`[AUTH] [${req.id}] Login failed: Incorrect password.`);
            return res.status(401).json({ success: false, message: 'Invalid username or password.' });
        }

        console.log(`[AUTH] [${req.id}] Admin ${username} logged in successfully.`);

        // In a strictly minimal setup, returning a success flag and username is enough.
        // The React frontend will store this flag in memory/localStorage to allow access to the dashboard.
        res.status(200).json({
            success: true,
            message: 'Login successful.',
            admin: { username: admin.username }
        });

    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/admin/bookings
 * Retrieves all ticket bookings across the entire system for the admin dashboard.
 */
const getAllBookings = async (req, res, next) => {
    console.log(`[ACTION] [${req.id}] Admin fetching all system bookings...`);

    try {
        // We join the Bookings, Ticket_Segments, and Flights tables to give the admin
        // a complete, readable overview of who is flying where.
        const query = `
            SELECT 
                b.booking_id, b.passenger_name, b.passenger_surname, b.passenger_email, b.booking_date,
                ts.ticket_id, ts.seat_number,
                f.flight_id, f.from_city, f.to_city, f.departure_time, f.arrival_time, f.price
            FROM Bookings b
            JOIN Ticket_Segments ts ON b.booking_id = ts.booking_id
            JOIN Flights f ON ts.flight_id = f.flight_id
            ORDER BY b.booking_date DESC
        `;

        const [bookings] = await pool.query(query);
        console.log(`[ACTION] [${req.id}] Retrieved ${bookings.length} total bookings.`);

        res.status(200).json({ success: true, data: bookings });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    loginAdmin,
    getAllBookings
};