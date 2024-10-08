const AdvertisementModel = require("../models/AdvertisementModel");
const {
  formatSuccessResponse,
  formatErrorResponse,
} = require("../utils/responseFormatter");
const { addUserPoints } = require("../models/addUserPointsModel");

const AdvertisementController = {
  // Create a new advertisement
   createAdvertisement :async (req, res) => {
    try {
      // Extract userId from the authenticated request
      const userId = req.user.id;
     
      // Destructure required fields from the request body
      const {
        title,
        description,
        price,
        departmentId,
        type,
        createdAt,
        endedAt,
        marketName,
        locationId,
        father,
        mother,
        classification,
        age,
        height,
        priceType,
        isTrending = false,   // Default is false if not provided
        isPromotion = false,  // Default is false if not provided
      } = req.body;
  
      // Validate required fields
      if (!title || !description || !price || !departmentId || !locationId) {
        return res.status(400).json(formatErrorResponse("Missing required fields"));
      }
  
      // Handle image upload (assuming multer is handling the file upload)
      const image = req.files?.image
        ? `http://${process.env.VPS_IP}:${process.env.PORT}/uploads/advertisements/${req.files["image"][0].filename}`
        : null;
  
      // Handle video upload or use URL from request body
      const videoUrl = req.files?.video
        ? `http://${process.env.VPS_IP}:${process.env.PORT}/uploads/videos/${req.files["video"][0].filename}`
        : req.body.video || null;
  
      // Ensure price is a valid number
      const formattedPrice = parseFloat(price);
      if (isNaN(formattedPrice)) {
        return res.status(400).json(formatErrorResponse("Invalid price format"));
      }
  
      // Prepare the advertisement data for insertion
      const advertisementData = {
        title,
        description,
        price: formattedPrice,
        departmentId,
        type,
        videoUrl,
        image,
        createdAt,
        endedAt,
        marketName,
        locationId,
        father,
        mother,
        classification,
        age,
        height,
        priceType,
        isTrending,     // Add trending flag
        isPromotion,    // Add promotion flag
      };
  
      // Call the model to create the advertisement
      const newAd = await AdvertisementModel.createAdvertisement(advertisementData);
  
      // Award points to the user for creating the advertisement
      await addUserPoints(userId, 1, 10); // Assuming 10 points are awarded for this action
  
      // Respond with success
      return res
        .status(201)
        .json(formatSuccessResponse(newAd, "Advertisement created successfully"));
  
    } catch (error) {
      console.error("Error creating advertisement:", error);
      return res
        .status(500)
        .json(formatErrorResponse("Error creating advertisement", error.message));
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
  // Function to add a rating for an advertisement
// Function to add a rating for an advertisement
rateAdvertisement: async (req, res) => {
  const { advertisementId, rating } = req.body;
  const userId = req.user?.userId;  // Corrected from req.user.id to req.user.userId

  // Log user information for debugging
  console.log("User Info:", req.user);

  // Validate input
  if (!userId) {
      return res.status(400).json({ error: "User ID is missing" });
  }

  if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
  }

  try {
      // Insert rating into the database
      const newRating = await AdvertisementModel.addRating(advertisementId, userId, rating);
      const averageRating = await AdvertisementModel.getAverageRating(advertisementId);
      return res.status(201).json({ newRating, averageRating });
  } catch (error) {
      console.error("Error rating advertisement:", error.message);
      return res.status(500).json({ error: "Internal server error" });
  }
}




};

module.exports = AdvertisementController;
