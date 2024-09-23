const SuppliesModel = require('../models/suppliesModel');
const jwt = require("jsonwebtoken");
const Joi = require('joi');
const { formatSuccessResponse, formatErrorResponse } = require('../utils/responseFormatter');

// Define a schema for validation using Joi
const supplySchema = Joi.object({
  name: Joi.string().min(3).max(255).required(),
  description: Joi.string().allow(null, '').optional(),
  locationId: Joi.number().integer().required(),
  advId: Joi.number().integer().required(),
  comment: Joi.string().allow(null, '').optional(),
  images: Joi.array().items(Joi.string().uri()).optional()
});

const reviewSchema = Joi.object({
  supplyId: Joi.number().integer().required(),
  rating: Joi.number().min(1).max(5).required(),
  comment: Joi.string().allow(null, '').optional(),
});

const SupplyController = {
  // Create a new supply with multiple images
  createSupply: async (req, res) => {
    const { name, description, locationId, comment, advId } = req.body;
    const images = req.files ? req.files.map(file => `http://${process.env.VPS_IP}:${process.env.PORT}/uploads/supplies/${file.filename}`) : [];

    const accessToken = req.headers.authorization?.split(" ")[1];
    if (!accessToken) {
      return res.status(401).json(formatErrorResponse('Access token is required'));
    }

    try {
      const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
      const userId = decoded.userId;

      // Validate the input with Joi schema
      const { error } = supplySchema.validate({ name, description, locationId, comment, advId, images });
      if (error) {
        return res.status(400).json(formatErrorResponse(error.details[0].message));
      }

      // Create the supply
      const supply = await SuppliesModel.createSupply({
        name,
        description,
        comment,   
        advId,    
        userId,
        locationId,
        images
      });

      return res.status(201).json(formatSuccessResponse('Supply created successfully', supply));
    } catch (error) {
      return res.status(500).json(formatErrorResponse(error.message));
    }
  },

  // Get supply by ID including user contact info, location, and reviews
  getSupplyById: async (req, res) => {
    const { supplyId } = req.params;

    try {
      const supply = await SuppliesModel.getSupplyById(supplyId);
      if (supply) {
        return res.status(200).json(formatSuccessResponse('Supply retrieved successfully', supply));
      } else {
        return res.status(404).json(formatErrorResponse('Supply not found'));
      }
    } catch (error) {
      return res.status(500).json(formatErrorResponse(error.message));
    }
  },

  // Create a review for a supply
  createReview: async (req, res) => {
    const { supplyId, rating, comment } = req.body;
    const accessToken = req.headers.authorization?.split(" ")[1];

    if (!accessToken) {
      return res.status(401).json(formatErrorResponse('Access token is required'));
    }

    try {
      const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
      const userId = decoded.userId;

      // Validate review input
      const { error } = reviewSchema.validate({ supplyId, rating, comment });
      if (error) {
        return res.status(400).json(formatErrorResponse(error.details[0].message));
      }

      // Create the review
      const review = await SuppliesModel.createReview({
        supplyId,
        userId,
        rating,
        comment
      });

      return res.status(201).json(formatSuccessResponse('Review created successfully', review));
    } catch (error) {
      return res.status(500).json(formatErrorResponse(error.message));
    }
  },

  // Get supplies with pagination support
  getAllSupplies: async (req, res) => {
    const { page = 1, limit = 10 } = req.query; // Default to page 1 and 10 items per page

    try {
      const supplies = await SuppliesModel.getAllSupplies({
        page: parseInt(page),
        limit: parseInt(limit)
      });

      return res.status(200).json(formatSuccessResponse('Supplies retrieved successfully', supplies));
    } catch (error) {
      return res.status(500).json(formatErrorResponse(error.message));
    }
  }
};

module.exports = SupplyController;
