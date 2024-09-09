

const TrainingModel = require('../models/trainingModel');
const jwt = require("jsonwebtoken");
const { formatSuccessResponse, formatErrorResponse } = require('../utils/responseFormatter');
const TrainingController = {
    // Create a new training with a single image
    createTraining: async (req, res) => {
      const { title, description, price, period, age, trainingFor, contactUs } = req.body;
  
      const image = req.file
        ? `http://${process.env.VPS_IP}:${process.env.PORT}/uploads/trainings/${req.file.filename}`
        : null;
  
      const accessToken = req.headers.authorization?.split(" ")[1];
      if (!accessToken) {
        return res.status(401).json({ success: false, message: 'Access token is required' });
      }
  
      try {
        const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
        const userId = decoded.userId;
  
        // Validate required fields
        if (!title || !price) {
          return res.status(400).json({ success: false, message: 'Title and price are required' });
        }
  
        // Create the training
        const training = await TrainingModel.createTraining({
          title,
          description,
          price,
          period,
          age,
          trainingFor,
          contactUs,
          image
        });
  
        res.status(201).json({ success: true, message: 'Training created successfully', data: training });
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
          res.status(200).json({ success: true, message: 'Training retrieved successfully', data: training });
        } else {
          res.status(404).json({ success: false, message: 'Training not found' });
        }
      } catch (error) {
        res.status(500).json({ success: false, message: error.message });
      }
    },
  
    // Get all trainings
    getAllTrainings: async (req, res) => {
      try {
        const trainings = await TrainingModel.getAllTrainings();
        res.status(200).json({ success: true, message: 'Trainings retrieved successfully', data: trainings });
      } catch (error) {
        res.status(500).json({ success: false, message: error.message });
      }
    }
  };
  
  module.exports = TrainingController;
  