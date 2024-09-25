const {
    createCommissionPayment,
    getCommissionPayments,
    getCommissionPaymentById
  } = require('../models/commissionPaymentModel');
  
  // Controller to create a new commission payment
  const createPayment = async (req, res) => {
    const { purchaseValue, commissionValue, coupon, total, paymentMethod } = req.body;
    try {
      const payment = await createCommissionPayment(purchaseValue, commissionValue, coupon, total, paymentMethod);
      res.status(201).json({
        success: true,
        message: "Commission payment created successfully",
        data: payment
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to create commission payment",
        error: error.message
      });
    }
  };
  
  // Controller to get all commission payments
  const getAllPayments = async (req, res) => {
    try {
      const payments = await getCommissionPayments();
      res.status(200).json({
        success: true,
        data: payments
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch commission payments",
        error: error.message
      });
    }
  };
  
  // Controller to get a commission payment by ID
  const getPaymentById = async (req, res) => {
    const { id } = req.params;
    try {
      const payment = await getCommissionPaymentById(id);
      if (!payment) {
        return res.status(404).json({
          success: false,
          message: "Commission payment not found"
        });
      }
      res.status(200).json({
        success: true,
        data: payment
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch commission payment",
        error: error.message
      });
    }
  };
  
  module.exports = {
    createPayment,
    getAllPayments,
    getPaymentById
  };
  