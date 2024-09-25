const pool = require('../config/db');

// Function to create a new payment
const createPayment = async (image, name, price, paymentMethod) => {
  const query = `
    INSERT INTO my_payments (image, name, price, payment_method)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;
  const values = [image, name, price, paymentMethod];
  const result = await pool.query(query, values);
  return result.rows[0];
};

// Function to get all payments
const getAllPayments = async () => {
  const query = `
    SELECT * FROM my_payments;
  `;
  const result = await pool.query(query);
  return result.rows;
};

// Function to get a payment by ID
const getPaymentById = async (paymentId) => {
  const query = `
    SELECT * FROM my_payments WHERE id = $1;
  `;
  const values = [paymentId];
  const result = await pool.query(query, values);
  return result.rows[0];
};

module.exports = {
  createPayment,
  getAllPayments,
  getPaymentById
};
