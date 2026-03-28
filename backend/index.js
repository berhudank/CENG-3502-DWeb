const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const morgan = require('morgan'); // Added Morgan
require('dotenv').config();

const pool = require('./src/config/db.js');

const flightRoutes = require('./src/routes/flightRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const ticketRoutes = require('./src/routes/ticketRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// 1. Assign UUID to the request FIRST
app.use((req, res, next) => {
    req.id = crypto.randomUUID();
    next();
});

// 2. Configure Morgan to use our custom UUID
// We define a custom token so Morgan knows how to print 'req.id'
morgan.token('req-id', (req) => req.id);

// We define a custom log format that includes our ID and the standard Morgan output
const morganFormat = '[-->] [:req-id] :method :url - Status: :status - :response-time ms';
app.use(morgan(morganFormat));

// 3. Optional: Native payload logger for deep debugging
// Morgan doesn't log request bodies by default (for security). We will log them manually here.
app.use((req, res, next) => {
    if (req.body && Object.keys(req.body).length > 0) {
        console.log(`[DATA] [${req.id}] Payload:`, JSON.stringify(req.body));
    }
    next();
});

// --- ROUTES ---

app.use('/api/flights', flightRoutes);

app.use('/api/admin', adminRoutes);

app.use('/api/tickets', ticketRoutes);

app.get('/api/health', async (req, res, next) => {
    console.log(`[ACTION] [${req.id}] Pinging database...`);
    try {
        const [rows] = await pool.query('SELECT 1 + 1 AS solution');
        console.log(`[ACTION] [${req.id}] Database ping successful.`);
        res.status(200).json({ success: true, message: 'Server healthy!', data: rows[0].solution });
    } catch (error) {
        next(error);
    }
});

// --- CENTRALIZED ERROR HANDLING ---
app.use((err, req, res, next) => {
    console.error(`[ERROR] [${req.id}] Unhandled Exception:`, err.message);
    res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Internal Server Error',
        requestId: req.id
    });
});

app.listen(PORT, () => {
    console.log(`🚀 FlyTicket Backend running on port ${PORT}`);
});