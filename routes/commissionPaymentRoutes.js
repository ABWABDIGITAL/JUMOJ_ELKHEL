const express = require('express');
const { createPayment, getAllPayments, getPaymentById } = require('../controllers/commissionPaymentController');
const router = express.Router();

// Route to create a new commission payment
router.post('/create', createPayment);

// Route to get all commission payments
router.get('/payments', getAllPayments);

// Route to get a commission payment by ID
router.get('/payment/:id', getPaymentById);

module.exports = router;
