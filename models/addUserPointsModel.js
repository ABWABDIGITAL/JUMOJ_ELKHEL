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
    const actionData = await pool.query(`SELECT points FROM actions WHERE id = $1`, [actionId]);
    
    if (actionData.rows.length === 0) {
      console.error('Invalid action ID:', actionId);
      return;
    }
    
    const points = actionData.rows[0].points;
    const canEarn = await canEarnPoints(userId, actionId);

    if (canEarn) {
      await pool.query(
        `INSERT INTO user_points (user_id, action_id, points) VALUES ($1, $2, $3)`,
        [userId, actionId, points]
      );
      console.log(`User ${userId} earned ${points} points for action ${actionId}`);
    } else {
      console.log(`User ${userId} cannot earn points for action ${actionId} due to throttle.`);
    }
  } catch (error) {
    console.error('Error adding user points:', error.message);
  }
};

// Sample usage
//addUserPoints(1, 'add_advertisement');  // Example of awarding points when a user adds an advertisement
module.exports = { addUserPoints };