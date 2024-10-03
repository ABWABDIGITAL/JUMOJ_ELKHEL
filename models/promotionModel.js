// models/promotionModel.js
const pool = require('../config/db');

// Function to create a new promotion
const createPromotion = async (period, startDate, endDate, paymentDetails, advertisementId) => {
    const query = `
      INSERT INTO promotions (period, startdate, enddate, paymentdetails, advertisement_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const values = [period, startDate, endDate, paymentDetails, advertisementId];
    const result = await pool.query(query, values);
    return result.rows[0];
  };

// Function to link advertisement with a promotion
const linkAdvertisementPromotion = async (advertisementId, promotionId) => {
  const query = `
    INSERT INTO advertisement_promotion (advertisement_id, promotion_id)
    VALUES ($1, $2);
  `;
  const values = [advertisementId, promotionId];
  await pool.query(query, values);
};

// Function to get all promotions with associated advertisement information
const getPromotions = async () => {
    const query = `
      SELECT 
        p.id, 
        p.period, 
        p.startdate, 
        p.enddate, 
        p.paymentdetails, 
        p.createdat, 
        p.updatedat,
        a.id AS advertisement_id, 
        a.title AS advertisement_title, 
        a.description AS advertisement_description,
        a.price AS advertisement_price,     -- Include price
        a.image AS advertisement_image    -- Include image
        
      FROM promotions p
      LEFT JOIN advertisements a ON p.advertisement_id = a.id
      LEFT JOIN locations l ON a.location_id = l.id;  -- Join with locations table
    `;
    const result = await pool.query(query);
    return result.rows;
  };
  
  // Function to get a promotion by ID with associated advertisements
  const getPromotionById = async (promotionId) => {
    const query = `
      SELECT 
        p.id, 
        p.period, 
        p.startdate, 
        p.enddate, 
        p.paymentdetails, 
        p.createdat, 
        p.updatedat,
        a.id AS advertisement_id, 
        a.title AS advertisement_title, 
        a.description AS advertisement_description,
        a.price AS advertisement_price,     -- Include price
        a.image AS advertisement_image    -- Include image
        -- Fetch city from locations table
       
      FROM promotions p
      LEFT JOIN advertisements a ON p.advertisement_id = a.id
      LEFT JOIN locations l ON a.location_id = l.id
      WHERE p.id = $1;
    `;
    const values = [promotionId];
    const result = await pool.query(query, values);
    return result.rows[0];
  };
  
  // Function to update an existing promotion
const updatePromotion = async (promotionId, updatedFields) => {
  const fields = [];
  const values = [];

  Object.keys(updatedFields).forEach((key, index) => {
    if (updatedFields[key] !== undefined) {  // Skip undefined fields
      fields.push(`${key} = $${index + 1}`);
      values.push(updatedFields[key]);
    }
  });

  if (fields.length === 0) return null; // Nothing to update

  const query = `
    UPDATE promotions
    SET ${fields.join(', ')}
    WHERE id = $${values.length + 1}
    RETURNING *;
  `;

  const result = await pool.query(query, [...values, promotionId]);
  return result.rows[0];
};

// Function to delete a promotion
const deletePromotion = async (promotionId) => {
  const query = `DELETE FROM promotions WHERE id = $1 RETURNING *;`;
  const values = [promotionId];
  const result = await pool.query(query, values);
  return result.rows[0]; // Return the deleted promotion
};



module.exports = {
  createPromotion,
  linkAdvertisementPromotion,
  getPromotions,
  getPromotionById,
  updatePromotion,   // Export update function
  deletePromotion,   // Export delete function
};

