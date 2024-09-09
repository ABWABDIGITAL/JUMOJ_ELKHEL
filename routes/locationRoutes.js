const express = require('express');
const router = express.Router();
const LocationController = require('../controllers/LocationController'); // Adjust the path as needed

// Routes for locations
router.post('/', LocationController.createLocation);
router.get('/:id', LocationController.getLocationById);
router.get('/', LocationController.getAllLocations);
router.put('/:id', LocationController.updateLocation);
router.delete('/:id', LocationController.deleteLocation);

module.exports = router;
