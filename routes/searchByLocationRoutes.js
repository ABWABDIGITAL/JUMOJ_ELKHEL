const express = require('express');
const router = express.Router();
const LocationSearchModel = require('./models/LocationSearchModel'); // Adjust the path accordingly

// Search by location
router.get('/api/search', async (req, res) => {
  const { locationId, page = 1, limit = 10 } = req.query;

  if (!locationId) {
    return res.status(400).json({ success: false, message: 'Location ID is required.' });
  }

  try {
    const results = await LocationSearchModel.searchByLocation({
      page: parseInt(page),
      limit: parseInt(limit),
      locationId: parseInt(locationId)
    });

    return res.status(200).json({
      success: true,
      message: 'Results retrieved successfully',
      data: results
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching results: ' + error.message });
  }
});

module.exports = router;
