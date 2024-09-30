const pool = require("../config/db");

const LocationSearchModel = {
  // Search by location only (can be expanded for different types later)
  searchByLocation: async ({ page = 1, limit = 10, locationId }) => {
    const offset = (page - 1) * limit;

    const query = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        l.id AS location_id,
        l.name AS location_name,
        l.city,
        l.area,
        l.latitude,
        l.longitude
      FROM 
        users u
      LEFT JOIN 
        locations l ON u.location_id = l.id
      WHERE 
        l.id = $1
      LIMIT $2 OFFSET $3
    `;

    const result = await pool.query(query, [locationId, limit, offset]);
    return result.rows;
  }
};

module.exports = LocationSearchModel;
