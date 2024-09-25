const pool = require('../config/db');

// Function to create a new commission payment
const createCommissionPayment = async (purchaseValue, commissionValue, coupon, total, paymentMethod) => {
  const query = `
    INSERT INTO commission_payments (purchase_value, commission_value, coupon, total, payment_method)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;
  const values = [purchaseValue, commissionValue, coupon, total, paymentMethod];
  const result = await pool.query(query, values);
  return result.rows[0];
};

// Function to get all commission payments
const getCommissionPayments = async () => {
  const query = `
    SELECT * FROM commission_payments;
  `;
  const result = await pool.query(query);
  return result.rows;
};

// Function to get a specific commission payment by ID
const getCommissionPaymentById = async (paymentId) => {
  const query = `
    SELECT * FROM commission_payments WHERE id = $1;
  `;
  const values = [paymentId];
  const result = await pool.query(query, values);
  return result.rows[0];
};

module.exports = {
  createCommissionPayment,
  getCommissionPayments,
  getCommissionPaymentById
};
