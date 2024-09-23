const pool = require("../config/db");
const AdvertisementModel = {
  // Create a new advertisement
  createAdvertisement: async ({
    title,
    description,
    price,
    departmentId,
    type,
    videoUrl = null,  // Set default to null
    image = null,     // Set default to null
    createdAt,
    endedAt,
    marketName,
    locationId,
    father = null,    // Set optional fields default to null
    mother = null,    // Set optional fields default to null
    classification,
    age,
    height,
    priceType,
  }) => {
    const result = await pool.query(
      `INSERT INTO advertisements (title, description, price, department_id, type, video, image, created_at, ended_at, market_name, location_id, father, mother, classification, age, height, price_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING *`,
      [title, description, price, departmentId, type, videoUrl, image, createdAt, endedAt, marketName, locationId, father, mother, classification, age, height, priceType]
    );
    


    // Fetch the full advertisement details with populated department and location info
    const adWithDetails = await pool.query(
      `SELECT a.*, d.name AS department_name, l.name AS location_name, l.city AS location_city, l.latitude, l.longitude
       FROM advertisements a
       JOIN departments d ON a.department_id = d.id
       JOIN locations l ON a.location_id = l.id
       WHERE a.id = $1`,
      [result.rows[0].id]
    );

    return adWithDetails.rows[0];
  },
  // Get advertisement by ID
  getAdvertisementById: async (id) => {
    const result = await pool.query(
      `SELECT a.*, 
              d.name AS department_name, 
              l.name AS location_name 
       FROM advertisements a
       JOIN departments d ON a.department_id = d.id
       JOIN locations l ON a.location_id = l.id
       WHERE a.id = $1`,
      [id]
    );
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
      throw new Error("No fields to update");
    }

    values.push(id);

    const result = await pool.query(
      `UPDATE advertisements
       SET ${setClauses.join(", ")}
       WHERE id = $${index}
       RETURNING *`,
      values
    );

    return result.rows[0];
  },

  // Delete an advertisement by ID
  deleteAdvertisement: async (id) => {
    const result = await pool.query(
      "DELETE FROM advertisements WHERE id = $1 RETURNING *",
      [id]
    );
    return result.rows[0];
  },

  // Get all advertisements
  getAllAdvertisements: async () => {
    const result = await pool.query(`
      SELECT a.*, d.name AS department_name, l.name AS location_name 
      FROM advertisements a
      JOIN departments d ON a.department_id = d.id
      JOIN locations l ON a.location_id = l.id
    `);
    return result.rows;
  },

  // Get advertisements by department
  getAdvertisementsByDepartmentId: async (departmentId) => {
    const result = await pool.query(
      `SELECT a.*, d.name AS department_name 
       FROM advertisements a 
       JOIN departments d ON a.department_id = d.id
       WHERE department_id = $1`,
      [departmentId]
    );
    return result.rows;
  },
};

module.exports = AdvertisementModel;
