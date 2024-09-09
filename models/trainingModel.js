const pool = require("../config/db");

const TrainingModel = {
  // Create new training with a single image
  createTraining: async ({ title, description, price, period, age, trainingFor, contactUs, image }) => {
    const client = await pool.connect(); // Ensure atomic transaction

    try {
      await client.query("BEGIN");

      // Insert the training
      const result = await client.query(
        `INSERT INTO trainings (title, description, price, period, age, training_for, contact_us, image_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [title, description, price, period, age, trainingFor, contactUs, image]
      );

      const training = result.rows[0];

      await client.query("COMMIT");
      return training;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },

  // Get a training by ID with image
  getTrainingById: async (trainingId) => {
    const result = await pool.query(
      `SELECT id, title, description, price, period, age, training_for, contact_us, image_url
       FROM trainings
       WHERE id = $1`,
      [trainingId]
    );

    return result.rows[0]; // Return the training with image
  },

  // Get all trainings
  getAllTrainings: async () => {
    const result = await pool.query(
      `SELECT id, title, description, price, period, age, training_for, contact_us, image_url
       FROM trainings`
    );

    return result.rows; // Return all trainings
  }
};

module.exports = TrainingModel;
