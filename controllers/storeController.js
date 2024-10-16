const StoreModel = require("../models/storeModel");
const path = require("path");
const fs = require("fs");
const {
  formatSuccessResponse,
  formatErrorResponse,
} = require("../utils/responseFormatter");
const { addUserPoints } = require("../models/addUserPointsModel");

const StoreController = {
  // Create a new store with an image and files
  createStore: async (req, res) => {
    const { name, locationId, timeOfWorks } = req.body;
    const userId = req.user.id;  
    const image = req.files["image"] ? req.files["image"][0] : null; // Single image
    const files = req.files["files"] || []; // Array of files

    // Construct image URL
    const imageUrl = image
      ? `http://${process.env.VPS_IP}:${process.env.PORT}/uploads/stores/${image.filename}`
      : null;

    // Get URLs for uploaded files
    const fileUrls = files.map(
      (file) =>
        `http://${process.env.VPS_IP}:${process.env.PORT}/uploads/stores/${file.filename}`
    );

    try {
      // Validate required fields
      if (!name || !locationId) {
        return res
          .status(400)
          .json(formatErrorResponse("Name and locationId are required"));
      }

      // Default timeOfWorks if not provided
      const formattedTimeOfWorks = timeOfWorks || "Always Open";

      // Create the store
      const store = await StoreModel.createStore({
        name,
        locationId,
        timeOfWorks: formattedTimeOfWorks, // Store the provided time or the default
        imageUrl, // Store the image URL
        fileUrls, // Store the file URLs
      });
      await addUserPoints(userId,'create_store');
      res
        .status(201)
        .json(formatSuccessResponse(store, "Store created successfully"));
    } catch (error) {
      res.status(500).json(formatErrorResponse(error.message));
    }
  },

  // Get all stores
  getAllStores: async (req, res) => {
    try {
      const stores = await StoreModel.getAllStores();
      res
        .status(200)
        .json(formatSuccessResponse(stores, "Stores retrieved successfully"));
    } catch (error) {
      res.status(500).json(formatErrorResponse(error.message));
    }
  },
// Inside storeController.js

 getAllStoresWithPagination : async (req, res) => {
  const { page = 1, limit = 10 } = req.query; // Default to page 1 and limit 10 if not provided

  const pageInt = parseInt(page, 10);
  const limitInt = parseInt(limit, 10);
  const offset = (pageInt - 1) * limitInt; // Calculate the offset for pagination

  try {
    // Fetch paginated stores
    const stores = await StoreModel.getAllStoresWithPagination(limitInt, offset);
    const total = await StoreModel.getTotalStoresCount(); // Get total number of stores

    const totalPages = Math.ceil(total / limitInt); // Calculate total number of pages

    const response = {
      total,
      totalPages,
      currentPage: pageInt,
      limit: limitInt,
      stores,
    };

    res.status(200).json(formatSuccessResponse(response, "Stores retrieved successfully"));
  } catch (error) {
    res.status(500).json(formatErrorResponse("Error retrieving stores", error.message));
  }
},
  // Get store by ID
  getStoreById: async (req, res) => {
    const { id } = req.params;

    try {
      const store = await StoreModel.getStoreById(id);

      if (store) {
        res
          .status(200)
          .json(formatSuccessResponse(store, "Store retrieved successfully"));
      } else {
        res.status(404).json(formatErrorResponse("Store not found"));
      }
    } catch (error) {
      res.status(500).json(formatErrorResponse(error.message));
    }
  },
  updateStore: async (req, res) => {
    const { id } = req.params;
    const { name, locationId, timeOfWorks } = req.body;
  
    // Check if files exist and correctly extract image and files
    const image = req.files && req.files["image"] ? req.files["image"][0] : null; // Single image
    const files = req.files && req.files["files"] ? req.files["files"] : []; // Array of files
  
    // Construct image URL if image is provided
    const imageUrl = image
      ? `http://${process.env.VPS_IP}:${process.env.PORT}/uploads/stores/${image.filename}`
      : null;
  
    // Get file URLs for uploaded files
    const fileUrls = files.map(
      (file) => `http://${process.env.VPS_IP}:${process.env.PORT}/uploads/stores/${file.filename}`
    );
  
    try {
      if (!id) {
        return res.status(400).json(formatErrorResponse("Store ID is required"));
      }
  
      const updatedStore = await StoreModel.updateStoreById({
        id,
        name,
        locationId,
        timeOfWorks,
        imageUrl,  // Only include image URL if image is provided
        fileUrls,  // Only include file URLs if files are provided
      });
  
      if (updatedStore) {
        res.status(200).json(formatSuccessResponse(updatedStore, "Store updated successfully"));
      } else {
        res.status(404).json(formatErrorResponse("Store not found"));
      }
    } catch (error) {
      console.error("Error updating store:", error);
      res.status(500).json(formatErrorResponse("Failed to update store"));
    }
  },
   
  // Delete store by ID
  deleteStore: async (req, res) => {
    const { id } = req.params;

    try {
      const deletedStore = await StoreModel.deleteStoreById(id); // Make sure this method exists in StoreModel
      if (deletedStore) {
        res
          .status(200)
          .json(formatSuccessResponse(null, "Store deleted successfully"));
      } else {
        res.status(404).json(formatErrorResponse("Store not found"));
      }
    } catch (error) {
      res.status(500).json(formatErrorResponse(error.message));
    }
  },
};

module.exports = StoreController;
