const pool = require('../config/db');


const canEarnPoints = async (userId, actionId) => {
  try {
    const throttleQuery = `
      SELECT ap.created_at 
      FROM user_points ap
      WHERE ap.user_id = $1 AND ap.action_id = $2
      ORDER BY ap.created_at DESC
      LIMIT 1;
    `;
    const result = await pool.query(throttleQuery, [userId, actionId]);

    if (result.rows.length === 0) return true; // No points earned for this action before

    const lastEarnedAt = result.rows[0].created_at;
    const actionConfig = await pool.query(
      `SELECT throttle_seconds FROM actions WHERE id = $1`,
      [actionId]
    );

    // Calculate if enough time has passed since last earned points
    const throttlePeriod = actionConfig.rows[0].throttle_seconds * 1000; // Convert to milliseconds
    return (new Date() - new Date(lastEarnedAt) > throttlePeriod);
  } catch (error) {
    console.error('Error checking points eligibility:', error);
    return false;
  }
};

// Add points to the user's account
const addUserPoints = async (userId, actionId) => {
  try {
    // Ensure actionId is defined
    if (!actionId) {
      console.error('Action ID is undefined or null.');
      return;
    }

    // Fetch action points based on actionId
    const actionData = await pool.query(`SELECT points FROM actions WHERE id = $1`, [actionId]);

    // Check if action exists
    if (actionData.rows.length === 0) {
      console.error('Invalid action ID:', actionId);
      return;
    }

    const points = actionData.rows[0].points;

    // Check if the user is eligible to earn points (throttle check)
    const canEarn = await canEarnPoints(userId, actionId);

    // If eligible, insert points
    if (canEarn) {
      const insertResult = await pool.query(
        `INSERT INTO user_points (user_id, action_id, points) VALUES ($1, $2, $3) RETURNING *`,
        [userId, actionId, points]
      );

      // Log the result of the insert operation
      console.log(`User ${userId} earned ${points} points for action ${actionId}`, insertResult.rows[0]);

    } else {
      console.log(`User ${userId} cannot earn points for action ${actionId} due to throttle.`);
    }
  } catch (error) {
    // Log the error for debugging
    console.error('Error adding user points:', error.message);
  }
};

// Sample usage
//addUserPoints(1, 'add_advertisement');  // Example of awarding points when a user adds an advertisement
module.exports = { addUserPoints };