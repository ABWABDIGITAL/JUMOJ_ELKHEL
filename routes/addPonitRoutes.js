const express = require("express");
const router = express.Router();
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
        `SELECT up.points, up.action, up.created_at, a.name AS action_name 
         FROM user_points up
         JOIN actions a ON up.action = a.id
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
  module.exports = router;