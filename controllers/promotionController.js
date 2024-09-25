// controllers/promotionController.js
const { linkAdvertisementPromotion, getPromotions, getPromotionById } = require('../models/promotionModel');
const promotionModel = require('../models/promotionModel');
const { formatSuccessResponse, formatErrorResponse } = require('../utils/responseFormatter');

// Controller to create a new promotion
const createPromotion = async (req, res) => {
    const { period, startDate, endDate, paymentDetails, advertisementId } = req.body;
  
    try {
      const newPromotion = await promotionModel.createPromotion(period, startDate, endDate, paymentDetails, advertisementId);
      res.status(201).json({
        success: true,
        message: 'Promotion created successfully',
        data: newPromotion,
      });
    } catch (error) {
      console.error('Error creating promotion:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create promotion',
        data: error.message,
      });
    }
  };

const getPromotionsController = async (req, res) => {
  try {
    const promotions = await getPromotions();
    res.status(200).json(formatSuccessResponse(promotions, 'Promotions fetched successfully'));
  } catch (error) {
    res.status(500).json(formatErrorResponse('Failed to fetch promotions', error.message));
  }
};

const getPromotionByIdController = async (req, res) => {
  const { id } = req.params;

  try {
    const promotion = await getPromotionById(id);
    if (promotion) {
      res.status(200).json(formatSuccessResponse(promotion, 'Promotion fetched successfully'));
    } else {
      res.status(404).json(formatErrorResponse('Promotion not found'));
    }
  } catch (error) {
    res.status(500).json(formatErrorResponse('Failed to fetch promotion', error.message));
  }
};

module.exports = {
  createPromotion,
  getPromotionsController,
  getPromotionByIdController,
};
