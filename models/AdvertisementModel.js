const pool = require("../config/db");
const AdvertisementModel = {
  // Create a new advertisement
  createAdvertisement: async ({
    title,
    description,
    price,
    departmentId,
    type,
    videoUrl = null,  
    image = null,     
    createdAt,
    endedAt,
    marketName,
    locationId,
    father = null,    
    mother = null,    
    classification,
    age,
    height,
    priceType,
    isTrending = false, // Default to false
    isPromotion = false // Default to false
  }) => {
    const result = await pool.query(
      `INSERT INTO advertisements (title, description, price, department_id, type, video, image, created_at, ended_at, market_name, location_id, father, mother, classification, age, height, price_type, is_trending, is_promotion)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19) RETURNING *`,
      [title, description, price, departmentId, type, videoUrl, image, createdAt, endedAt, marketName, locationId, father, mother, classification, age, height, priceType, isTrending, isPromotion]
    );

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
  getAllAdvertisementsWithPagination: async (limit, offset) => {
    const query = `
      SELECT * FROM advertisements
      LIMIT $1 OFFSET $2
    `;
    const result = await pool.query(query, [limit, offset]);
    return result.rows; // Return the array of advertisements
  },

  // Optionally, add a function to count total advertisements
  getTotalAdvertisementsCount: async () => {
    const query = `
      SELECT COUNT(*) AS total FROM advertisements
    `;
    const result = await pool.query(query);
    return parseInt(result.rows[0].total, 10); // Return the total count
  },

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
  // Get trending advertisements
getTrendingAdvertisements: async () => {
  const result = await pool.query(
    `SELECT a.*, d.name AS department_name, l.name AS location_name 
     FROM advertisements a
     JOIN departments d ON a.department_id = d.id
     JOIN locations l ON a.location_id = l.id
     WHERE a.is_trending = TRUE`
  );
  return result.rows;
},

// Get promotion advertisements
getPromotionAdvertisements: async () => {
  const result = await pool.query(
    `SELECT a.*, d.name AS department_name, l.name AS location_name 
     FROM advertisements a
     JOIN departments d ON a.department_id = d.id
     JOIN locations l ON a.location_id = l.id
     WHERE a.is_promotion = TRUE`
  );
  return result.rows;
},
addRating: async (advertisementId, userId, rating) => {
  const query = `
      INSERT INTO advertisement_ratings (advertisement_id, user_id, rating)
      VALUES ($1, $2, $3)
      ON CONFLICT (advertisement_id, user_id) DO UPDATE SET rating = EXCLUDED.rating
      RETURNING *;
  `;
  const values = [advertisementId, userId, rating];  
  const result = await pool.query(query, values);

  // Debug: Log the inserted rating
  console.log("Inserted/Updated Rating:", result.rows[0]);

  // Query to check if the rating was inserted correctly
  const checkRatings = await pool.query(`SELECT * FROM advertisement_ratings WHERE advertisement_id = $1`, [advertisementId]);
  console.log("Existing ratings for advertisement after insert:", checkRatings.rows);

  return result.rows[0];
},


// Function to retrieve average rating for an advertisement
getAverageRating: async (advertisementId) => {
  const query = `
    SELECT AVG(rating) AS average_rating
    FROM advertisement_ratings
    WHERE advertisement_id = $1;
  `;
  const values = [advertisementId];
  const result = await pool.query(query, values);

  // Debugging: log the result of the query
  console.log("Average rating result:", result.rows[0]);

  // Return null if no ratings exist, otherwise return the average_rating rounded to two decimal places
  return result.rows[0].average_rating ? parseFloat(result.rows[0].average_rating).toFixed(2) : null;
}



};

module.exports = AdvertisementModel;
