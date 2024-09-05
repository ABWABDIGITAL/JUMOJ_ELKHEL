const AdvertisementModel = require("../models/AdvertisementModel");
const {
  formatSuccessResponse,
  formatErrorResponse,
} = require("../utils/responseFormatter");

const AdvertisementController = {
  // Create a new advertisement
  createAdvertisement: async (req, res) => {
    try {
      const { title, description, price, departmentId, type, createdAt, endedAt } = req.body;

      // Check if files were uploaded
      const image = req.files && req.files['image']
        ? `http://${process.env.VPS_IP}:${process.env.PORT}/uploads/advertisements/${req.files['image'][0].filename}`
        : null;

      const videoUrl = req.files && req.files['video']
        ? `http://${process.env.VPS_IP}:${process.env.PORT}/uploads/videos/${req.files['video'][0].filename}`
        : req.body.video; // Handle video link if provided via body

      // Call the model to save advertisement to DB
      const newAd = await AdvertisementModel.createAdvertisement(
        title, description, price, departmentId, type, videoUrl, image, createdAt, endedAt
      );

      // Return success response
      return res.status(201).json(formatSuccessResponse(newAd, "Advertisement created successfully"));
    } catch (error) {
      // Log the full error for debugging
      console.error('Error creating advertisement:', error);

      // Return a more detailed error response
      return res.status(500).json(formatErrorResponse("Error creating advertisement", error.message));
    }
  },
  // Get advertisement by ID
  getAdvertisementById: async (req, res) => {
    const { id } = req.params;

    try {
      const ad = await AdvertisementModel.getAdvertisementById(id);
      if (!ad) {
        return res
          .status(404)
          .json(formatErrorResponse("Advertisement not found"));
      }
      return res.status(200).json(formatSuccessResponse(ad));
    } catch (error) {
      return res
        .status(500)
        .json(
          formatErrorResponse("Error retrieving advertisement", error.message)
        );
    }
  },

  // Update an advertisement
  updateAdvertisement: async (req, res) => {
    const { id } = req.params;
    const fieldsToUpdate = req.body;

    try {
      const updatedAd = await AdvertisementModel.updateAdvertisement(
        id,
        fieldsToUpdate
      );
      if (!updatedAd) {
        return res
          .status(404)
          .json(formatErrorResponse("Advertisement not found"));
      }
      return res
        .status(200)
        .json(
          formatSuccessResponse(updatedAd, "Advertisement updated successfully")
        );
    } catch (error) {
      return res
        .status(500)
        .json(
          formatErrorResponse("Error updating advertisement", error.message)
        );
    }
  },

  // Delete an advertisement
  deleteAdvertisement: async (req, res) => {
    const { id } = req.params;

    try {
      const deletedAd = await AdvertisementModel.deleteAdvertisement(id);
      if (!deletedAd) {
        return res
          .status(404)
          .json(formatErrorResponse("Advertisement not found"));
      }
      return res
        .status(200)
        .json(
          formatSuccessResponse(null, "Advertisement deleted successfully")
        );
    } catch (error) {
      return res
        .status(500)
        .json(
          formatErrorResponse("Error deleting advertisement", error.message)
        );
    }
  },

  // Get all advertisements
  getAllAdvertisements: async (req, res) => {
    try {
      const ads = await AdvertisementModel.getAllAdvertisements();
      return res.status(200).json(formatSuccessResponse(ads));
    } catch (error) {
      return res
        .status(500)
        .json(
          formatErrorResponse("Error retrieving advertisements", error.message)
        );
    }
  },

  // Get advertisements by department ID
  getAdvertisementsByDepartmentId: async (req, res) => {
    const { departmentId } = req.params;

    try {
      const ads = await AdvertisementModel.getAdvertisementsByDepartmentId(
        departmentId
      );
      if (ads.length === 0) {
        return res
          .status(404)
          .json(
            formatErrorResponse("No advertisements found for this department")
          );
      }
      return res.status(200).json(formatSuccessResponse(ads));
    } catch (error) {
      return res
        .status(500)
        .json(
          formatErrorResponse("Error retrieving advertisements", error.message)
        );
    }
  },
};

module.exports = AdvertisementController;
