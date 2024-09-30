const SuppliesModel = require('../models/suppliesModel');
const jwt = require("jsonwebtoken");
const Joi = require('joi');
const { formatSuccessResponse, formatErrorResponse } = require('../utils/responseFormatter');
const { addUserPoints } = require("../models/addUserPointsModel");

// Define schemas
const supplySchema = Joi.object({
  name: Joi.string().min(3).max(255).required(),
  description: Joi.string().allow(null, '').optional(),
  locationId: Joi.number().integer().required(),
  advId: Joi.number().integer().required(),
  images: Joi.array().items(Joi.string().uri()).optional(),
});

const commentSchema = Joi.object({
  supplyId: Joi.number().integer().required(),
  name: Joi.string().min(3).max(255).required(),
  comment: Joi.string().allow(null, '').optional(),
});

const SupplyController = {
  // Create a new supply with multiple images
  createSupply: async (req, res) => {
    const { name, description, locationId, advId } = req.body;
    const images = req.files ? req.files.map(file => `http://${process.env.VPS_IP}:${process.env.PORT}/uploads/supplies/${file.filename}`) : [];

    const accessToken = req.headers.authorization?.split(" ")[1];
    if (!accessToken) {
      return res.status(401).json(formatErrorResponse('Access token is required'));
    }

    try {
      const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
      const userId = decoded.userId;

      // Validate the input with Joi schema
      const { error } = supplySchema.validate({ name, description, locationId, advId, images });
      if (error) {
        return res.status(400).json(formatErrorResponse(error.details[0].message));
      }

      // Create the supply
      const supply = await SuppliesModel.createSupply({
        name,
        description,
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

// Create a comment for a supply
createComment: async (req, res) => {
  const { supplyId, name, comment } = req.body;
  const userId = req.user.id; // Assuming you have user authentication

  // Validate comment input
  const { error } = commentSchema.validate({ supplyId, name, comment });
  if (error) {
    return res.status(400).json(formatErrorResponse(error.details[0].message));
  }

  try {
    // Ensure comment is not null
    if (!comment || comment.trim() === "") {
      return res.status(400).json(formatErrorResponse("Comment cannot be empty"));
    }

    // Create the comment
    const newComment = await SuppliesModel.createComment({
      supplyId,
      name,
      comment
    });

    // Optionally reward user points
    await addUserPoints(userId, 1, 10);

    return res.status(201).json(formatSuccessResponse('Comment created successfully', newComment));
  } catch (error) {
    return res.status(500).json(formatErrorResponse(error.message));
  }
},

// Get supply by ID including user contact info, location, and comments
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


  // Get supplies with pagination support
  // Get supplies with pagination support
getAllSupplies: async (req, res) => {
  const { page = 1, limit = 10 } = req.query; // Default to page 1 and 10 items per page

  // Validate page and limit to be positive integers
  const pageNumber = parseInt(page);
  const limitNumber = parseInt(limit);

  if (isNaN(pageNumber) || pageNumber < 1 || isNaN(limitNumber) || limitNumber < 1) {
    return res.status(400).json(formatErrorResponse('Page and limit must be positive integers.'));
  }

  try {
    const supplies = await SuppliesModel.getAllSupplies({
      page: pageNumber,
      limit: limitNumber
    });

    return res.status(200).json(formatSuccessResponse('Supplies retrieved successfully', supplies));
  } catch (error) {
    return res.status(500).json(formatErrorResponse('Error fetching supplies: ' + error.message));
  }
}

};

module.exports = SupplyController;
