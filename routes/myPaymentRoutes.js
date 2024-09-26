const express = require('express');
const { createNewPayment, getPayments, getPaymentByIdController } = require('../controllers/myPaymentController');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const ApiError = require('../utils/ApiError');

// Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Correct file path for uploading images
    cb(null, path.join(__dirname, '../uploads/Payments/'));
  },
  filename: function (req, file, cb) {
    // Use Date.now() to ensure a unique filename
    cb(null, Date.now() + '-' + file.originalname);
  },
});

// File filter to allow only images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    // Pass an error if the file is not an image
    cb(new ApiError('Only image files are allowed!', 400), false);
  }
};

// Create the Multer instance with the storage and file filter
const upload = multer({ storage, fileFilter });

// Route to create a new payment with an image upload
router.post('/create', upload.single('image'), createNewPayment);

// Route to get all payments
router.get('/payments', getPayments);

// Route to get a payment by ID
router.get('/payment/:id', getPaymentByIdController);

module.exports = router;
