const LocationModel = require('../models/locationModel'); // Adjust the path as needed
const { formatSuccessResponse, formatErrorResponse } = require('../utils/responseFormatter');

const LocationController = {
  createLocation: async (req, res) => {
    try {
      const { name, area, city, latitude, longitude } = req.body;
      const newLocation = await LocationModel.createLocation(name, area, city, latitude, longitude);
      return res.status(201).json(formatSuccessResponse(newLocation, "Location created successfully"));
    } catch (error) {
      return res.status(500).json(formatErrorResponse("Error creating location", error.message));
    }
  },

  getLocationById: async (req, res) => {
    const { id } = req.params;
    try {
      const location = await LocationModel.getLocationById(id);
      if (!location) {
        return res.status(404).json(formatErrorResponse("Location not found"));
      }
      return res.status(200).json(formatSuccessResponse(location));
    } catch (error) {
      return res.status(500).json(formatErrorResponse("Error retrieving location", error.message));
    }
  },

  getAllLocations: async (req, res) => {
    try {
      const locations = await LocationModel.getAllLocations();
      return res.status(200).json(formatSuccessResponse(locations));
    } catch (error) {
      return res.status(500).json(formatErrorResponse("Error retrieving locations", error.message));
    }
  },

  updateLocation: async (req, res) => {
    const { id } = req.params;
    const fieldsToUpdate = req.body;
    try {
      const updatedLocation = await LocationModel.updateLocation(id, fieldsToUpdate);
      if (!updatedLocation) {
        return res.status(404).json(formatErrorResponse("Location not found"));
      }
      return res.status(200).json(formatSuccessResponse(updatedLocation, "Location updated successfully"));
    } catch (error) {
      return res.status(500).json(formatErrorResponse("Error updating location", error.message));
    }
  },

  deleteLocation: async (req, res) => {
    const { id } = req.params;
    try {
      const deletedLocation = await LocationModel.deleteLocation(id);
      if (!deletedLocation) {
        return res.status(404).json(formatErrorResponse("Location not found"));
      }
      return res.status(200).json(formatSuccessResponse(null, "Location deleted successfully"));
    } catch (error) {
      return res.status(500).json(formatErrorResponse("Error deleting location", error.message));
    }
  },
};

module.exports = LocationController;
