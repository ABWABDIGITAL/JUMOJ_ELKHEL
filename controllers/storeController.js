const StoreModel = require("../models/storeModel");
const path = require("path");
const fs = require("fs");
const {
  formatSuccessResponse,
  formatErrorResponse,
} = require("../utils/responseFormatter");
const { addUserPoints } = require("../routes/addPonitRoutes");

const StoreController = {
  // Create a new store with an image and files
  createStore: async (req, res) => {
    const { name, locationId, timeOfWorks } = req.body;
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
      await addUserPoints(userId, 2, 10);
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
};

module.exports = StoreController;
