// flyticket-backend/src/routes/flightRoutes.js
const express = require('express');
const router = express.Router();
const flightController = require('../controllers/flightController');

// Route: GET /api/flights
// Description: Get all flights or search with query params
router.get('/', flightController.getAllFlights);

router.get('/:id', flightController.getFlightById);

// Route: POST /api/flights
// Description: Create a new flight (Requires strict runway validation)
router.post('/', flightController.createFlight);

router.put('/:id', flightController.updateFlight); // Added Update Route
router.delete('/:id', flightController.deleteFlight); // Added Delete Route

module.exports = router;