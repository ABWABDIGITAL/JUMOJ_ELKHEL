// controllers/promotionController.js
const { createPromotion, linkAdvertisementPromotion, getPromotions, getPromotionById } = require('../models/promotionModel');
const { formatSuccessResponse, formatErrorResponse } = require('../utils/responseFormatter');

const createPromotionController = async (req, res) => {
  const { period, startDate, endDate, paymentDetails, advertisementIds } = req.body;

  try {
    // Create the promotion
    const promotion = await createPromotion(period, startDate, endDate, paymentDetails);

    // Link the promotion with advertisements
    for (const advertisementId of advertisementIds) {
      await linkAdvertisementPromotion(advertisementId, promotion.id);
    }

    res.status(201).json(formatSuccessResponse(promotion, 'Promotion created successfully'));
  } catch (error) {
    res.status(500).json(formatErrorResponse('Failed to create promotion', error.message));
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
  createPromotionController,
  getPromotionsController,
  getPromotionByIdController,
};
