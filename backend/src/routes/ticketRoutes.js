// flyticket/backend/src/routes/ticketRoutes.js
const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');

// Route: POST /api/tickets
// Description: Book a ticket by entering passenger information
router.post('/', ticketController.bookTicket);

// Route: GET /api/tickets/:email
// Description: List tickets by user email
router.get('/:email', ticketController.getUserBookings);
// Route: GET /api/tickets/booking/:booking_id
// Description: Get ticket details by Booking ID
router.get('/booking/:booking_id', ticketController.getBookingById);

module.exports = router;