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

  getAllTrainings: async (req, res) => {
    const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
    const limit = parseInt(req.query.limit) || 10; // Default to 10 items per page if not provided

    try {
        // Get the total number of trainings
        const totalTrainings = await TrainingModel.getTotalTrainingsCount(); // Ensure this method is defined

        // Get the trainings for the current page
        const trainings = await TrainingModel.getAllTrainingsWithPagination(page, limit); // Ensure this method is defined

        // Calculate pagination details
        const totalPages = Math.ceil(totalTrainings / limit);
        const pagination = {
            currentPage: page,
            totalPages,
            totalItems: totalTrainings,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1,
        };

        // Generate HTML content for trainings
        let htmlContent = `<h1>Trainings List</h1>`;
        trainings.forEach((training) => {
            htmlContent += `
              <div>
                <h2>${training.title}</h2>
                <p><strong>Description:</strong> ${training.description}</p>
                <p><strong>Price:</strong> ${training.price}</p>
                <p><strong>Period:</strong> ${training.period}</p>
                <p><strong>Age Group:</strong> ${training.age}</p>
                <p><strong>Training For:</strong> ${training.training_for}</p>
                <p><strong>Training Type:</strong> ${training.training_type}</p>
                <img src="${training.image_url}" alt="${training.title}" style="width:200px;height:auto;" />
              </div>
              <hr />
            `;
        });

        // Add pagination controls at the bottom
        htmlContent += `
          <div>
            <p>Page ${pagination.currentPage} of ${pagination.totalPages}</p>
            ${pagination.hasPreviousPage ? `<a href="?page=${pagination.currentPage - 1}&limit=${limit}">Previous</a>` : ""}
            ${pagination.hasNextPage ? `<a href="?page=${pagination.currentPage + 1}&limit=${limit}">Next</a>` : ""}
          </div>
        `;

        // Send the HTML as the response
        res.status(200).send(`
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Trainings</title>
          </head>
          <body>
            ${htmlContent}
          </body>
          </html>
        `);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error retrieving trainings",
            error: error.message,
        });
    }
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
