const express = require('express');
const authenticateToken = require('../middleware/authMiddleware');
const UserModel = require('../models/userModel'); // Import your UserModel
const router = express.Router();

// Search for users by location with authentication
router.get('/api/search', authenticateToken, async (req, res) => {
    const { page = 1, limit = 10, locationId } = req.query; // Get query parameters

    if (!locationId) {
        return res.status(400).json({
            success: false,
            message: "Location ID is required.",
            data: null
        });
    }

    try {
        // Debug log for parameters
        console.log('Searching for users with locationId:', locationId, 'Page:', page, 'Limit:', limit);

        const users = await UserModel.searchByLocation(locationId, page, limit); // Call the search function in your model

        // Debug log for results
        console.log('Users found:', users);

        return res.status(200).json({
            success: true,
            message: "Results retrieved successfully",
            data: users
        });
    } catch (error) {
        console.error('Error fetching users:', error.message); // Log the error message
        return res.status(500).json({
            success: false,
            message: `Error fetching results: ${error.message}`,
            data: null
        });
    }
});

module.exports = router;
