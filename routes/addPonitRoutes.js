const express = require("express");
const router = express.Router();
const pool = require('../config/db');

// Fetch user points with pagination
router.get('/user/:userId/points', async (req, res) => {
    const userId = req.params.userId;
    const { page = 1, limit = 10 } = req.query; // Pagination with defaults

    try {
        // Query for total points
        const totalPointsResult = await pool.query(
            `SELECT SUM(points) AS total_points FROM user_points WHERE user_id = $1`,
            [userId]
        );

        const totalPoints = totalPointsResult.rows[0].total_points || 0; // If no points, return 0

        // Query for detailed points history (paginated)
        const offset = (page - 1) * limit;
        const detailedPointsResult = await pool.query(
            `SELECT up.points, up.action_id, up.created_at, a.name AS action_name 
             FROM user_points up
             JOIN actions a ON up.action_id = a.id
             WHERE up.user_id = $1
             ORDER BY up.created_at DESC
             LIMIT $2 OFFSET $3`,
            [userId, limit, offset]
        );

        const pointsBreakdown = detailedPointsResult.rows;

        // Get the total count of actions (for pagination purposes)
        const totalActionsResult = await pool.query(
            `SELECT COUNT(*) AS total FROM user_points WHERE user_id = $1`,
            [userId]
        );
        const totalActions = parseInt(totalActionsResult.rows[0].total, 10);

        res.json({
            success: true,
            points: totalPoints,
            pointsBreakdown, // Array of points history
            totalActions,
            page: parseInt(page, 10),
            totalPages: Math.ceil(totalActions / limit),
        });

    } catch (error) {
        console.error('Error fetching user points:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve points' });
    }
});

// Function to check if user can earn points
const canEarnPoints = async (userId, actionId) => {
    try {
        const throttleQuery = `
            SELECT created_at 
            FROM user_points
            WHERE user_id = $1 AND action_id = $2
            ORDER BY created_at DESC
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



// Add points to the user's account using actionId
router.post('/user/:userId/points', async (req, res) => {
    const userId = req.params.userId;
    const { actionId } = req.body;

    if (!actionId) {
        return res.status(400).json({ success: false, message: 'Action ID is required.' });
    }

    try {
        // Log inputs for debugging
        console.log('Inserting points for user:', { userId, actionId });

        const actionData = await pool.query(`SELECT points FROM actions WHERE id = $1`, [actionId]);

        if (actionData.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Action not found.' });
        }

        const points = actionData.rows[0].points;

        // Insert into user_points
        const result = await pool.query(
            `INSERT INTO user_points (user_id, action_id, points) VALUES ($1, $2, $3) RETURNING *`,
            [userId, actionId, points]
        );

        const newPointEntry = result.rows[0];
        res.status(201).json({
            success: true,
            message: 'Points added successfully',
            point: newPointEntry,
        });

    } catch (error) {
        console.error('Error adding user points:', error.message);
        res.status(500).json({ success: false, message: 'Failed to add points' });
    }
});
// Fetch total points for a user
router.get('/user/:userId/total-points', async (req, res) => {
    const userId = req.params.userId;

    try {
        // Query to sum up the points for the user
        const totalPointsResult = await pool.query(
            `SELECT SUM(points) AS total_points FROM user_points WHERE user_id = $1`,
            [userId]
        );

        const totalPoints = totalPointsResult.rows[0].total_points || 0; // Return 0 if no points

        res.json({
            success: true,
            totalPoints
        });
    } catch (error) {
        console.error('Error fetching total points:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve total points' });
    }
});

// Export only the router
module.exports = 
   
    router;
