const pool  = require('../config/db'); // Import your PostgreSQL connection pool

// Function to create a notification
const createNotification = async (userId, type, message) => {
  try {
    const result = await pool.query(
      'INSERT INTO notifications (userId, type, message, read) VALUES ($1, $2, $3, $4) RETURNING *',
      [userId, type, message, false]
    );
    return result.rows[0]; // Return the newly created notification
  } catch (error) {
    throw new Error('Error creating notification: ' + error.message);}
  };

// Function to get all notifications for a user
const getNotifications = async (userId) => {
  try {
    const query = `
      SELECT * FROM notifications
      WHERE userId = $1
      ORDER BY created_at DESC;
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw new Error('Failed to fetch notifications');
  }
};

// Function to mark a notification as read
const markNotificationAsRead = async (notificationId) => {
  try {
    const query = `
      UPDATE notifications
      SET read = TRUE
      WHERE id = $1
      RETURNING *;
    `;
    const result = await pool.query(query, [notificationId]);
    return result.rows[0];
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw new Error('Failed to mark notification as read');
  }
};

// Function to delete a notification
const deleteNotification = async (notificationId) => {
  try {
    const query = `
      DELETE FROM notifications
      WHERE id = $1
      RETURNING *;
    `;
    const result = await pool.query(query, [notificationId]);
    return result.rows[0];
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw new Error('Failed to delete notification');
  }
};

module.exports = {
  createNotification,
  getNotifications,
  markNotificationAsRead,
  deleteNotification,
};
