// flyticket/backend/src/routes/ticketRoutes.js
const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');

// Route: POST /api/tickets
// Description: Book a ticket by entering passenger information [cite: 18]
router.post('/', ticketController.bookTicket);

// Route: GET /api/tickets/:email
// Description: List tickets by user email
router.get('/:email', ticketController.getUserBookings);

module.exports = router;