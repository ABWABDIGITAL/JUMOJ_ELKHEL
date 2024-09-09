const pool = require('../config/db'); // Adjust path to your PostgreSQL connection configuration

const LocationModel = {
  // Create a new location
  createLocation: async (name, area, city, latitude, longitude) => {
    try {
      const result = await pool.query(
        `INSERT INTO locations (name, area, city, latitude, longitude)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [name, area, city, latitude, longitude]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error creating location:', error);
      throw new Error('Error creating location');
    }
  },

  // Get location by ID
  getLocationById: async (id) => {
    try {
      const result = await pool.query('SELECT * FROM locations WHERE id = $1', [id]);
      return result.rows[0];
    } catch (error) {
      console.error('Error retrieving location:', error);
      throw new Error('Error retrieving location');
    }
  },

  // Get all locations
  getAllLocations: async () => {
    try {
      const result = await pool.query('SELECT * FROM locations');
      return result.rows;
    } catch (error) {
      console.error('Error retrieving locations:', error);
      throw new Error('Error retrieving locations');
    }
  },

  // Update a location
  updateLocation: async (id, { name, area, city, latitude, longitude }) => {
    try {
      const result = await pool.query(
        `UPDATE locations
         SET name = $1, area = $2, city = $3, latitude = $4, longitude = $5
         WHERE id = $6
         RETURNING *`,
        [name, area, city, latitude, longitude, id]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error updating location:', error);
      throw new Error('Error updating location');
    }
  },

  // Delete a location
  deleteLocation: async (id) => {
    try {
      const result = await pool.query('DELETE FROM locations WHERE id = $1 RETURNING *', [id]);
      return result.rows[0];
    } catch (error) {
      console.error('Error deleting location:', error);
      throw new Error('Error deleting location');
    }
  },
};

module.exports = LocationModel;
