const express = require('express');
const { createNewPayment, getPayments, getPaymentByIdController } = require('../controllers/myPaymentController');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ApiError = require('../utils/ApiError');



//const { uploadSingleImage } = require('../middleware/uploadImageMiddleware');
// Multer storage configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.join(__dirname, '../uploads/panner/'));
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + '-' + file.originalname);
    },
  });
  
  // File filter to allow only images
  const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
      cb(null, true);
    } else {
      cb(new ApiError('Only image files are allowed!', 400), false);
    }
  };
  
  // Multer instance
  const upload = multer({ storage, fileFilter });
// Route to create a new payment
router.post('/create', upload.single("image"), createNewPayment);

// Route to get all payments
router.get('/payments', getPayments);

// Route to get a payment by ID
router.get('/payment/:id', getPaymentByIdController);

module.exports = router;
