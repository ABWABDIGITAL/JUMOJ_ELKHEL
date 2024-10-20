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
  getAllAdvertisements : async (req, res) => {
    const { page = 1, limit = 10 } = req.query; // Default to page 1 and limit 10 if not provided
  
    const pageInt = parseInt(page, 10);
    const limitInt = parseInt(limit, 10);
    const offset = (pageInt - 1) * limitInt; // Calculate the offset
  
    try {
      // Fetch paginated advertisements
      const ads = await AdvertisementModel.getAllAdvertisementsWithPagination(limitInt, offset);
      const total = await AdvertisementModel.getTotalAdvertisementsCount(); // Get total number of advertisements
  
      const totalPages = Math.ceil(total / limitInt); // Calculate total pages
  
      const response = {
        total,
        totalPages,
        currentPage: pageInt,
        limit: limitInt,
        advertisements: ads,
      };
  
      return res.status(200).json(formatSuccessResponse(response, "Advertisements fetched successfully"));
    } catch (error) {
      return res
        .status(500)
        .json(formatErrorResponse("Error retrieving advertisements", error.message));
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
// Add advertisement to favorites
addToFavorites: async (req, res) => {
  const { advertisementId } = req.params;
  const userId = req.user?.userId; // Assuming user ID is available in req.user
  try {
    const success = await AdvertisementModel.addFavorite(userId, advertisementId);
    if (success) {
      return res.status(200).json(formatSuccessResponse(null, "Advertisement added to favorites"));
    } else {
      return res.status(400).json(formatErrorResponse("Advertisement is already a favorite"));
    }
  } catch (error) {
    console.error("Error adding advertisement to favorites:", error);
    return res.status(500).json(formatErrorResponse("Error adding advertisement to favorites", error.message));
  }
},
// Remove advertisement from favorites
removeFromFavorites: async (req, res) => {
  const { advertisementId } = req.params;
  const userId = req.user?.userId; // Assuming user ID is available in req.user
  try {
    const success = await AdvertisementModel.removeFavorite(userId, advertisementId);
    if (success) {
      return res.status(200).json(formatSuccessResponse(null, "Advertisement removed from favorites"));
    } else {
      return res.status(404).json(formatErrorResponse("Advertisement not found in favorites"));
    }
  } catch (error) {
    console.error("Error removing advertisement from favorites:", error);
    return res.status(500).json(formatErrorResponse("Error removing advertisement from favorites", error.message));
  }
},
// Get all favorite advertisements for the user
getFavorites: async (req, res) => {
  const userId = req.user.id; // Assuming user ID is available in req.user
  try {
    const favoriteAds = await AdvertisementModel.getFavoriteAdvertisements(userId);
    return res.status(200).json(formatSuccessResponse(favoriteAds, "Favorite advertisements retrieved successfully"));
  } catch (error) {
    console.error("Error retrieving favorite advertisements:", error);
    return res.status(500).json(formatErrorResponse("Error retrieving favorite advertisements", error.message));
  }
},

  // Function to add a rating for an advertisement
  rateAdvertisement: async (req, res) => {
    const { advertisementId, rating } = req.body;
    const userId = req.user?.userId;
  
    // Log user information for debugging
    console.log("User Info:", req.user);
  
    // Validate input
    if (!userId) {
        return res.status(400).json({ error: "User ID is missing" });
    }
    
    // Validate rating (ensure it's between 1 and 5)
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }
  
    // Log the userId and advertisementId for debugging
    console.log(`Adding rating for advertisementId: ${advertisementId}, userId: ${userId}, rating: ${rating}`);
  
    try {
        // Insert rating into the database
        const newRating = await AdvertisementModel.addRating(advertisementId, userId, rating);
        const averageRating = await AdvertisementModel.getAverageRating(advertisementId);
        return res.status(201).json({ success: true, newRating, averageRating });
    } catch (error) {
        console.error("Error rating advertisement:", error.message);
        return res.status(500).json({ error: "Internal server error" });
    }
  },
  
  // Controller method to get the average rating of an advertisement
  getRateAdvertisement: async (req, res) => {
    const { advertisementId } = req.params;
  
    try {
      const averageRating = await AdvertisementModel.getAverageRating(advertisementId);
  
      // Return a message if no ratings are found
      if (averageRating === null) {
        return res.status(200).json({
          success: true,
          message: "No ratings found for this advertisement",
          data: { averageRating: 0 }
        });
      }
  
      // Return the average rating
      return res.status(200).json({
        success: true,
        message: "Average rating retrieved successfully",
        data: { averageRating }
      });
    } catch (error) {
      console.error("Error getting advertisement rating:", error.message);
      return res.status(500).json({ error: "Error getting advertisement rating" });
    }
  }
  




};

module.exports = AdvertisementController;
