// models/promotionModel.js
const pool = require('../config/db');

// Function to create a new promotion
const createPromotion = async (period, startDate, endDate, paymentDetails) => {
  const query = `
    INSERT INTO promotions (period, startdate, enddate, paymentdetails)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;
  const values = [period, startDate, endDate, paymentDetails];
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

// Function to get all promotions with advertisements
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
      a.description AS advertisement_description
    FROM promotions p
    JOIN advertisement_promotion ap ON p.id = ap.promotion_id
    JOIN advertisements a ON ap.advertisement_id = a.id;
  `;
  const result = await pool.query(query);
  return result.rows;
};

// Function to get a promotion by ID
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
      a.description AS advertisement_description
    FROM promotions p
    JOIN advertisement_promotion ap ON p.id = ap.promotion_id
    JOIN advertisements a ON ap.advertisement_id = a.id
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
