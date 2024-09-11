const { createNotification, getNotifications, markNotificationAsRead, deleteNotification } = require('../models/notificationModel');

const createNotificationController = async (req, res) => {
  const { userId, type, message } = req.body;

  try {
    const notification = await createNotification(userId, type, message);
    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      data: notification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create notification',
      error: error.message
    });
  }
};

const getNotificationsController = async (req, res) => {
  const { userId } = req.params;

  try {
    const notifications = await getNotifications(userId);
    res.status(200).json({
      success: true,
      data: notifications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
};

const markNotificationAsReadController = async (req, res) => {
  const { id } = req.params;

  try {
    const notification = await markNotificationAsRead(id);
    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message
    });
  }
};

const deleteNotificationController = async (req, res) => {
  const { id } = req.params;

  try {
    const notification = await deleteNotification(id);
    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully',
      data: notification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: error.message
    });
  }
};

module.exports = {
  createNotificationController,
  getNotificationsController,
  markNotificationAsReadController,
  deleteNotificationController,
};
