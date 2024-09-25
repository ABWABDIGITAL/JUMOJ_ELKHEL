const pool = require('./config/db'); // PostgreSQL connection pool

// Function to check if the user can earn points for an action based on the throttle period
const canEarnPoints = async (userId, actionName) => {
  try {
    const throttleQuery = `
      SELECT ap.created_at 
      FROM user_points ap
      JOIN actions a ON ap.action = a.name
      WHERE ap.user_id = $1 AND ap.action = $2
      ORDER BY ap.created_at DESC
      LIMIT 1;
    `;
    
    const result = await pool.query(throttleQuery, [userId, actionName]);

    if (result.rows.length === 0) return true; // No points earned for this action before

    const lastEarnedAt = result.rows[0].created_at;
    const actionConfig = await pool.query(`SELECT throttle_seconds FROM actions WHERE name = $1`, [actionName]);

    // Calculate if the last time is greater than the throttle period
    const throttlePeriod = actionConfig.rows[0].throttle_seconds * 1000; // Convert to milliseconds
    return (new Date() - new Date(lastEarnedAt)) > throttlePeriod;
  } catch (error) {
    console.error('Error checking points eligibility:', error.message);
    return false;
  }
};

// Function to add points for a user action
const addUserPoints = async (userId, actionName) => {
  try {
    // Check if the user is eligible to earn points
    const isEligible = await canEarnPoints(userId, actionName);
    
    if (!isEligible) {
      console.log(`User ${userId} is not eligible to earn points for action: ${actionName} due to throttling.`);
      return;
    }

    // Get the points value for the action
    const pointsQuery = `SELECT points FROM actions WHERE name = $1`;
    const pointsResult = await pool.query(pointsQuery, [actionName]);

    if (pointsResult.rows.length === 0) {
      console.log(`Action ${actionName} not found.`);
      return;
    }

    const points = pointsResult.rows[0].points;

    // Award points to the user
    await pool.query(
      `INSERT INTO user_points (user_id, points, action) VALUES ($1, $2, $3)`,
      [userId, points, actionName]
    );

    console.log(`User ${userId} earned ${points} points for action: ${actionName}`);
  } catch (error) {
    console.error('Error adding user points:', error.message);
  }
};

// Sample usage
addUserPoints(1, 'add_advertisement');  // Example of awarding points when a user adds an advertisement
