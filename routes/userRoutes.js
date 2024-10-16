// routes/userRoutes.js
const express = require('express');
const UserController = require('../controllers/userController');
const authenticateToken = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/users'); // Save images to this directory
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    cb(null, true);
  } else {
    cb(new Error('Only images (jpeg, jpg, png) are allowed!'), false);
  }
};

// Initialize multer for image uploads
const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB file size limit
  fileFilter: fileFilter,
});

const router = express.Router();

// Public routes
router.post('/auth/signup', UserController.createUser);
router.post('/auth/login', UserController.loginUser);
router.post('/reset-password', UserController.resetPassword);

router.post("/forgot-password", UserController.forgotPassword);
// Route to verify OTP
router.post('/verify-otp', UserController.verifyOtp);
router.post('/verifyForgotPasswordOtp', UserController.verifyForgotPasswordOtp);

router.post('/create-custom-token', UserController.createCustomToken);
// Route to get user profile
router.get('/user/profile', UserController.getProfile);

// Update user profile (Requires authentication)
router.put('/auth/:userId', upload.single('image'), UserController.updateUser);
router.post('/auth/logout',authenticateToken , UserController.logoutUser);


// Route to update user contact information
router.put('/contact-info', UserController.updateUserContactInfo);



// Protected routes
//router.get('/email/:email', authenticateToken, UserController.getUserByPhone);
router.get('/test-localization', (req, res) => {
    res.json({
      message: req.t('welcome_message') // Localized message
    });
  });

module.exports = router;
