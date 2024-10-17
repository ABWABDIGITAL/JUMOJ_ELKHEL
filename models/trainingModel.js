const pool = require("../config/db");

const TrainingModel = {
  // Create new training with a single image
  createTraining: async ({ title, description, price, period, age, trainingFor,training_type, image }) => {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const result = await client.query(
        `INSERT INTO trainings (title, description, price, period, age, training_for,training_type, image_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [title, description, price, period, age, trainingFor,training_type, image]
      );

      const training = result.rows[0];
      await client.query("COMMIT");

      return `<h2>${training.title}</h2>
              <p><strong>Description:</strong> ${training.description}</p>
              <p><strong>Price:</strong> ${training.price}</p>
              <p><strong>Period:</strong> ${training.period}</p>
              <p><strong>Age Group:</strong> ${training.age}</p>
              <p><strong>Training For:</strong> ${training.training_for}</p>
              <p><strong>Contact Us:</strong> ${training.training_type}</p>
              <img src="${training.image_url}" alt="${training.title}" />`;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },

  // Get a training by ID with HTML response
  getTrainingById: async (trainingId) => {
    const result = await pool.query(
      `SELECT id, title, description, price, period, age, training_for, training_type, image_url
       FROM trainings
       WHERE id = $1`,
      [trainingId]
    );

    const training = result.rows[0];
    return `<h2>${training.title}</h2>
            <p><strong>Description:</strong> ${training.description}</p>
            <p><strong>Price:</strong> ${training.price}</p>
            <p><strong>Period:</strong> ${training.period}</p>
            <p><strong>Age Group:</strong> ${training.age}</p>
            <p><strong>Training For:</strong> ${training.training_for}</p>
            <p><strong>Contact Us:</strong> ${training.training_type}</p>
            <img src="${training.image_url}" alt="${training.title}" />`;
  },
  // Function to get all trainings with pagination
  getAllTrainings: async (req, res) => {
    const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
    const limit = parseInt(req.query.limit) || 10; // Default to 10 items per page if not provided

    try {
      // Get the total number of trainings
      const totalTrainings = await TrainingModel.getTotalTrainingsCount();

      // Get the trainings for the current page
      const trainings = await TrainingModel.getAllTrainingsWithPagination(page, limit);

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
  },

  // Function to get the total number of trainings
  getTotalTrainingsCount: async () => {
    const result = await pool.query('SELECT COUNT(*) FROM trainings');
    return parseInt(result.rows[0].count, 10); // Return the total count as an integer
  },

  // Function to get trainings with pagination
  getAllTrainingsWithPagination: async (page, limit) => {
    const offset = (page - 1) * limit; // Calculate the offset for the current page

    const result = await pool.query(
      `SELECT id, title, description, price, period, age, training_for, training_type, image_url
       FROM trainings
       LIMIT $1 OFFSET $2`, 
      [limit, offset]
    );

    return result.rows; 
  },
  // Update training with HTML response
  updateTraining: async (trainingId, { title, description, price, period, age, trainingFor, training_type, image }) => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const result = await client.query(
        `UPDATE trainings
         SET title = COALESCE($2, title),
             description = COALESCE($3, description),
             price = COALESCE($4, price),
             period = COALESCE($5, period),
             age = COALESCE($6, age),
             training_for = COALESCE($7, training_for),
             training_type = COALESCE($8, training_type),
             image_url = COALESCE($9, image_url)
         WHERE id = $1
         RETURNING *`,
        [trainingId, title, description, price, period, age, trainingFor, training_type, image]
      );

      const updatedTraining = result.rows[0];
      await client.query("COMMIT");

      return `<h2>${updatedTraining.title}</h2>
              <p><strong>Description:</strong> ${updatedTraining.description}</p>
              <p><strong>Price:</strong> ${updatedTraining.price}</p>
              <p><strong>Period:</strong> ${updatedTraining.period}</p>
              <p><strong>Age Group:</strong> ${updatedTraining.age}</p>
              <p><strong>Training For:</strong> ${updatedTraining.training_for}</p>
              <p><strong>Contact Us:</strong> ${updatedTraining.training_type}</p>
              <img src="${updatedTraining.image_url}" alt="${updatedTraining.title}" />`;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },

  // Delete training with HTML response
  deleteTraining: async (trainingId) => {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `DELETE FROM trainings WHERE id = $1 RETURNING *`,
        [trainingId]
      );

      if (result.rowCount === 0) {
        return `<p>Training with ID ${trainingId} not found.</p>`;
      }

      const deletedTraining = result.rows[0];
      return `<p>Training titled "${deletedTraining.title}" was successfully deleted.</p>`;
    } catch (error) {
      throw error;
    } finally {
      client.release();
    }
  },
};

module.exports = TrainingModel;
