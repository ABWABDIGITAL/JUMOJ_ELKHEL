const pool = require("../config/db");

const AdvertisementModel = {
  // Create a new advertisement
   createAdvertisement : async (title, description, price, departmentId, type, video, image, createdAt, endedAt) => {
    try {
      const result = await pool.query(
        `INSERT INTO advertisements (title, description, price, department_id, type, video, image, created_at, ended_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
        [title, description, price, departmentId, type, video, image, createdAt, endedAt]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Database error while creating advertisement:', error); // Log database errors
      throw error;
    }
  },
  
  // Get advertisement by ID
  getAdvertisementById: async (id) => {
    const result = await pool.query('SELECT * FROM advertisements WHERE id = $1', [id]);
    return result.rows[0];
  },

  // Update advertisement details
  updateAdvertisement: async (id, fieldsToUpdate) => {
    const setClauses = [];
    const values = [];
    let index = 1;

    for (const field in fieldsToUpdate) {
      setClauses.push(`${field} = $${index}`);
      values.push(fieldsToUpdate[field]);
      index++;
    }

    if (setClauses.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(id);

    const result = await pool.query(
      `UPDATE advertisements
       SET ${setClauses.join(', ')}
       WHERE id = $${index}
       RETURNING *`,
      values
    );

    return result.rows[0];
  },

  // Delete an advertisement by ID
  deleteAdvertisement: async (id) => {
    const result = await pool.query('DELETE FROM advertisements WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  },

  // Get all advertisements
  getAllAdvertisements: async () => {
    const result = await pool.query('SELECT * FROM advertisements');
    return result.rows;
  },

  // Get advertisements by department
  getAdvertisementsByDepartmentId: async (departmentId) => {
    const result = await pool.query('SELECT * FROM advertisements WHERE department_id = $1', [departmentId]);
    return result.rows;
  }
};

module.exports = AdvertisementModel;
