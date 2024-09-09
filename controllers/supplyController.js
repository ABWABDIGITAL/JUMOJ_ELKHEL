const SuppliesModel = require('../models/suppliesModel');
const jwt = require("jsonwebtoken");
const { formatSuccessResponse, formatErrorResponse } = require('../utils/responseFormatter');

const SupplyController = {
  // Create a new supply with multiple images
  createSupply: async (req, res) => {
    const { name, description, price, age, health, mother, father, locationId } = req.body;
    const images = req.files ? req.files.map(file => `http://${process.env.VPS_IP}:${process.env.PORT}/uploads/subblies/${file.filename}`) : [];

    const accessToken = req.headers.authorization?.split(" ")[1];
    if (!accessToken) {
      return res.status(401).json({ success: false, message: 'Access token is required' });
    }

    try {
      const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
      const userId = decoded.userId;

      // Validate required fields
      if (!name || !price || !locationId) {
        return res.status(400).json({ success: false, message: 'Name, price, and locationId are required' });
      }

      // Create the supply
      const supply = await SuppliesModel.createSupply({
        name,
        description,
        price,
        age,
        health,
        mother,
        father,
        userId,
        locationId,
        images
      });

      res.status(201).json({ success: true, message: 'Supply created successfully', data: supply });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Get supply by ID including user contact info, location, and reviews
  getSupplyById: async (req, res) => {
    const { supplyId } = req.params;

    try {
      const supply = await SuppliesModel.getSupplyById(supplyId);
      if (supply) {
        res.status(200).json({ success: true, message: 'Supply retrieved successfully', data: supply });
      } else {
        res.status(404).json({ success: false, message: 'Supply not found' });
      }
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
  // Create a review for a supply
  createReview: async (req, res) => {
    const { supplyId, rating, comment } = req.body;
    const accessToken = req.headers.authorization?.split(" ")[1];

    if (!accessToken) {
      return res.status(401).json({ success: false, message: 'Access token is required' });
    }

    try {
      const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
      const userId = decoded.userId;

      // Validate required fields
      if (!supplyId || !rating) {
        return res.status(400).json({ success: false, message: 'Supply ID and rating are required' });
      }

      // Create the review
      const review = await SuppliesModel.createReview({
        supplyId,
        userId,
        rating,
        comment
      });

      res.status(201).json({ success: true, message: 'Review created successfully', data: review });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

};


module.exports = SupplyController;
