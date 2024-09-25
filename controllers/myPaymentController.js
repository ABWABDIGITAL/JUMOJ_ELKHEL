const { createPayment, getAllPayments, getPaymentById } = require('../models/myPaymentModel');

// Controller to create a new payment
const createNewPayment = async (req, res) => {
  const {  name, price, paymentMethod } = req.body;
 const image = req.file
 ? `http://${process.env.VPS_IP}:${process.env.PORT}/uploads/Payments/${req.file.filename}`
 : null;
  try {
    const payment = await createPayment(image, name, price, paymentMethod);
    res.status(201).json({
      success: true,
      message: "Payment created successfully",
      data: payment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create payment",
      error: error.message
    });
  }
};

// Controller to get all payments
const getPayments = async (req, res) => {
  try {
    const payments = await getAllPayments();
    res.status(200).json({
      success: true,
      data: payments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch payments",
      error: error.message
    });
  }
};

// Controller to get a payment by ID
const getPaymentByIdController = async (req, res) => {
  const { id } = req.params;
  try {
    const payment = await getPaymentById(id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }
    res.status(200).json({
      success: true,
      data: payment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch payment",
      error: error.message
    });
  }
};

module.exports = {
  createNewPayment,
  getPayments,
  getPaymentByIdController
};
