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
        a.image AS advertisement_image,     -- Include image
        
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
        a.image AS advertisement_image,     -- Include image
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
  
  

module.exports = {
  createPromotion,
  linkAdvertisementPromotion,
  getPromotions,
  getPromotionById,
};
