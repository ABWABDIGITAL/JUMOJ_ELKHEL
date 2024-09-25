const pool = require('../config/db');  // Ensure to connect to your database

const FAQ = {
  // Create a new FAQ
  create: async (question, answer) => {
    const result = await pool.query(
      `INSERT INTO faqs (question, answer) 
       VALUES ($1, $2) RETURNING *`,
      [question, answer]
    );
    return result.rows[0];
  },

  // Get all FAQs
  getAll: async () => {
    const result = await pool.query('SELECT * FROM faqs ORDER BY created_at DESC');
    return result.rows;
  },

  // Get a specific FAQ by ID
  getById: async (id) => {
    const result = await pool.query('SELECT * FROM faqs WHERE id = $1', [id]);
    return result.rows[0];
  },

  // Update an FAQ
  update: async (id, question, answer) => {
    const result = await pool.query(
      `UPDATE faqs 
       SET question = $1, answer = $2, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $3 RETURNING *`,
      [question, answer, id]
    );
    return result.rows[0];
  },

  // Delete an FAQ
  delete: async (id) => {
    const result = await pool.query('DELETE FROM faqs WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  }
};

module.exports = FAQ;
