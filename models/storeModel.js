const pool = require('../config/db');

const StoreModel = {
  // Create new store with image and files
  createStore: async ({ name, locationId, timeOfWorks, imageUrl, fileUrls }) => {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const result = await client.query(
        `INSERT INTO stores (name, location_id, time_of_works, image_url, file_urls)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [name, locationId, timeOfWorks, imageUrl, JSON.stringify(fileUrls)]
      );

      const store = result.rows[0];
      await client.query('COMMIT');
      return store;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // Get all stores
  getAllStores: async () => {
    const result = await pool.query('SELECT * FROM stores');
    return result.rows;
  },
  // Get store by ID
  getStoreById: async (id) => {
    const result = await pool.query(
      `SELECT id, name, location_id, time_of_works, image_url, file_urls
       FROM stores
       WHERE id = $1`,
      [id]
    );
    
    return result.rows[0]; // Return the store with image and files
  },// Update store by ID with new image and files
  updateStoreById: async ({ id, imageUrl, fileUrls }) => {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const result = await client.query(
        `UPDATE stores
         SET image_url = $1, file_urls = $2
         WHERE id = $3 RETURNING *`,
        [imageUrl, JSON.stringify(fileUrls), id]
      );

      const store = result.rows[0];
      await client.query('COMMIT');
      return store;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
};

module.exports = StoreModel;
