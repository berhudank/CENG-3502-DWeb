// flyticket/backend/src/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Route: POST /api/admin/login
router.post('/login', adminController.loginAdmin);

router.post('/logout', adminController.logoutAdmin); // New

router.get('/check-session', adminController.checkSession); // New

// Route: GET /api/admin/bookings
router.get('/bookings', adminController.getAllBookings);

module.exports = router;