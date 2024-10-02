const PannerModel = require("../models/pannerModel");
const { formatSuccessResponse, formatErrorResponse } = require("../utils/responseFormatter");

// Create a new panner with image upload
const createPanner = async (req, res,next) => {
  
    try {  const { description, link } = req.body;
  const image = req.file
    ? `http://${process.env.VPS_IP}:${process.env.PORT}/uploads/panner/${req.file.filename}`
    : null;

  
    const newPanner = await PannerModel.createPanner(description, image, link);
    res.status(201).json(formatSuccessResponse(newPanner, 'Panner created successfully'));
  } catch (error) {
    console.error("Error creating panner:", error);
    res.status(500).json(formatErrorResponse('Failed to create panner'));
  }
  next();
};

// Get a panner by ID
const getPannerById = async (req, res) => {
  const { id } = req.params;

  try {
    const panner = await PannerModel.getPannerById(id);
    if (panner) {
      res.status(200).json(formatSuccessResponse(panner, 'Panner fetched successfully'));
    } else {
      res.status(404).json(formatErrorResponse('Panner not found'));
    }
  } catch (error) {
    console.error("Error fetching panner:", error);
    res.status(500).json(formatErrorResponse('Failed to fetch panner'));
  }
};

// Update a panner by ID
// Update a panner by ID with file handling
const updatePanner = async (req, res) => {
  const { id } = req.params;
  const { description, link } = req.body;
  
  // File handling (if image is provided)
  const image = req.file 
    ? `http://${process.env.VPS_IP}:${process.env.PORT}/uploads/panners/${req.file.filename}`
    : null;

  try {
    // Update panner with new fields
    const updatedPanner = await PannerModel.updatePanner(id, description, image, link);
    
    if (updatedPanner) {
      res.status(200).json(formatSuccessResponse(updatedPanner, 'Panner updated successfully'));
    } else {
      res.status(404).json(formatErrorResponse('Panner not found'));
    }
  } catch (error) {
    console.error("Error updating panner:", error);
    res.status(500).json(formatErrorResponse('Failed to update panner'));
  }
};


// Delete a panner by ID
const deletePanner = async (req, res) => {
  const { id } = req.params;  // Panner ID from URL

  try {
    // Attempt to delete the panner
    const deletedPanner = await PannerModel.deletePanner(id);
    
    if (deletedPanner) {
      // Panner deleted successfully
      return res.status(200).json(formatSuccessResponse(null, 'Panner deleted successfully'));
    } else {
      // Panner with provided ID not found
      return res.status(404).json(formatErrorResponse('Panner not found'));
    }
  } catch (error) {
    console.error("Error deleting panner:", error);
    // Internal server error
    return res.status(500).json(formatErrorResponse('Failed to delete panner'));
  }
};

  // Get all panners
const getAllPanners = async (req, res) => {
    try {
      const panners = await PannerModel.getAllPanners();
      res.status(200).json(formatSuccessResponse(panners, "Panners retrieved successfully"));
    } catch (error) {
      console.error("Error fetching all panners:", error);
      res.status(500).json(formatErrorResponse("Failed to fetch panners"));
    }}


module.exports = {
  createPanner,
  getPannerById,
  updatePanner,
  deletePanner,
  getAllPanners
};
