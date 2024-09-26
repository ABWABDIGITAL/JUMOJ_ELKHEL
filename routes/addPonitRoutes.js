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

// Export only the router
module.exports = router;
