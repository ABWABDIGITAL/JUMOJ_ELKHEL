const express = require('express');
const router = express.Router();
const {
  createNotificationController,
  getNotificationsController,
  markNotificationAsReadController,
  deleteNotificationController,
} = require('../controllers/notificationController');

// Route to create a notification
router.post('/', createNotificationController);

// Route to get all notifications for a user
router.get('/:userId', getNotificationsController);

// Route to mark a notification as read
router.put('/:id/read', markNotificationAsReadController);

// Route to delete a notification
router.delete('/:id', deleteNotificationController);

module.exports = router;
