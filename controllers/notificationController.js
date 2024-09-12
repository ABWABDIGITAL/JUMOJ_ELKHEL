// controllers/notificationController.js
const { createNotification, getNotifications, markNotificationAsRead, deleteNotification } = require('../models/notificationModel');
const { formatSuccessResponse, formatErrorResponse } = require('../utils/responseFormatter');

const createNotificationController = async (req, res) => {
  const { userId, type, message } = req.body;

  try {
    const notification = await createNotification(userId, type, message);
    res.status(201).json(formatSuccessResponse(notification, 'Notification created successfully'));
  } catch (error) {
    res.status(500).json(formatErrorResponse('Failed to create notification', error.message));
  }
};

const getNotificationsController = async (req, res) => {
  const { userId } = req.params;

  try {
    const notifications = await getNotifications(userId);
    res.status(200).json(formatSuccessResponse(notifications, 'Notifications fetched successfully'));
  } catch (error) {
    res.status(500).json(formatErrorResponse('Failed to fetch notifications', error.message));
  }
};

const markNotificationAsReadController = async (req, res) => {
  const { id } = req.params;

  try {
    const notification = await markNotificationAsRead(id);
    res.status(200).json(formatSuccessResponse(notification, 'Notification marked as read'));
  } catch (error) {
    res.status(500).json(formatErrorResponse('Failed to mark notification as read', error.message));
  }
};

const deleteNotificationController = async (req, res) => {
  const { id } = req.params;

  try {
    const notification = await deleteNotification(id);
    res.status(200).json(formatSuccessResponse(notification, 'Notification deleted successfully'));
  } catch (error) {
    res.status(500).json(formatErrorResponse('Failed to delete notification', error.message));
  }
};

module.exports = {
  createNotificationController,
  getNotificationsController,
  markNotificationAsReadController,
  deleteNotificationController,
};
