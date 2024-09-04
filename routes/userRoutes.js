// routes/userRoutes.js
const express = require('express');
const UserController = require('../controllers/userController');
const authenticateToken = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes
router.post('/auth/signup', UserController.createUser);
router.post('/auth/login', UserController.loginUser);
router.post('/reset-password', UserController.resetPassword);

router.post("/forgot-password", UserController.forgotPassword);


router.post('/create-custom-token', UserController.createCustomToken);

// Protected routes
router.get('/email/:email', authenticateToken, UserController.getUserByPhone);
router.get('/test-localization', (req, res) => {
    res.json({
      message: req.t('welcome_message') // Localized message
    });
  });

module.exports = router;
