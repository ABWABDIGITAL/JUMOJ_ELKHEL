// routes/advertisementRoutes.js
const express = require('express');
const { rateAdvertisement } = require('../controllers/advertisementController');
const authenticateToken = require('../middleware/authMiddleware'); // Ensure the user is authenticated

const router = express.Router();

router.post('/rate', authenticateToken, rateAdvertisement);

module.exports = router;
