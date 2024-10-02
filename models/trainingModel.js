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

  // Get all trainings with HTML response
  getAllTrainings: async () => {
    const result = await pool.query(
      `SELECT id, title, description, price, period, age, training_for,training_type, image_url
       FROM trainings`
    );

    const trainings = result.rows;
    return trainings.map(training => 
      `<div>
         <h2>${training.title}</h2>
         <p><strong>Description:</strong> ${training.description}</p>
         <p><strong>Price:</strong> ${training.price}</p>
         <p><strong>Period:</strong> ${training.period}</p>
         <p><strong>Age Group:</strong> ${training.age}</p>
         <p><strong>Training For:</strong> ${training.training_for}</p>
         <p><strong>Contact Us:</strong> ${training.training_type}</p>
         <img src="${training.image_url}" alt="${training.title}" />
       </div>`
    ).join('');
  },// Update training with HTML response
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
