const TrainingModel = require("../models/trainingModel");
const jwt = require("jsonwebtoken");
const {
  formatSuccessResponse,
  formatErrorResponse,
} = require("../utils/responseFormatter");
const TrainingController = {
  // Create a new training with a single image
  createTraining: async (req, res) => {
    const {
      title,
      description,
      price,
      period,
      age,
      trainingFor,
      training_type,
    } = req.body;

    const image = req.file
      ? `http://${process.env.VPS_IP}:${process.env.PORT}/uploads/trainings/${req.file.filename}`
      : null;

    const accessToken = req.headers.authorization?.split(" ")[1];
    if (!accessToken) {
      return res
        .status(401)
        .json({ success: false, message: "Access token is required" });
    }

    try {
      const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
      const userId = decoded.userId;

      // Validate required fields
      if (!title || !price) {
        return res
          .status(400)
          .json({ success: false, message: "Title and price are required" });
      }

      // Create the training
      const training = await TrainingModel.createTraining({
        title,
        description,
        price,
        period,
        age,
        trainingFor,
        training_type,
        image,
      });

      res
        .status(201)
        .json({
          success: true,
          message: "Training created successfully",
          data: training,
        });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Get training by ID including image
  getTrainingById: async (req, res) => {
    const { trainingId } = req.params;

    try {
      const training = await TrainingModel.getTrainingById(trainingId);
      if (training) {
        res
          .status(200)
          .json({
            success: true,
            message: "Training retrieved successfully",
            data: training,
          });
      } else {
        res.status(404).json({ success: false, message: "Training not found" });
      }
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Get all trainings
 getAllTrainings: async (req, res) => {
    const { page = 1, limit = 10 } = req.query; // Default to page 1 and limit 10 if not provided
  
    const pageInt = parseInt(page, 10);
    const limitInt = parseInt(limit, 10);
    const offset = (pageInt - 1) * limitInt; // Calculate the offset for pagination
  
    try {
      // Fetch paginated trainings
      const trainings = await TrainingModel.getAllTrainingsWithPagination(limitInt, offset);
      const total = await TrainingModel.getTotalTrainingsCount(); // Get total number of trainings
  
      const totalPages = Math.ceil(total / limitInt); // Calculate total number of pages
  
      const response = {
        total,
        totalPages,
        currentPage: pageInt,
        limit: limitInt,
        trainings,
      };
  
      res.status(200).json({
        success: true,
        message: "Trainings retrieved successfully",
        data: response,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Error retrieving trainings", error: error.message });
    }
 ,
// Update training by ID
updateTraining: async (req, res) => {
  const { trainingId } = req.params;
  const { title, description, price, period, age, trainingFor, training_type } = req.body;

  const image = req.file
    ? `http://${process.env.VPS_IP}:${process.env.PORT}/uploads/trainings/${req.file.filename}`
    : null;

  try {
    const updatedTraining = await TrainingModel.updateTraining(trainingId, {
      title,
      description,
      price,
      period,
      age,
      trainingFor,
      training_type,
      image,
    });

    if (updatedTraining) {
      res.status(200).json({
        success: true,
        message: "Training updated successfully",
        data: updatedTraining,
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Training not found",
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
},

// Delete training by ID
deleteTraining: async (req, res) => {
  const { trainingId } = req.params;

  try {
    const deletedTraining = await TrainingModel.deleteTraining(trainingId);
    if (deletedTraining) {
      res.status(200).json({
        success: true,
        message: `Training titled "${deletedTraining.title}" was successfully deleted.`,
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Training not found",
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
},


};

module.exports = TrainingController;
