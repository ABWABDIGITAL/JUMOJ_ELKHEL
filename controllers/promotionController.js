const { 
  linkAdvertisementPromotion, 
  getPromotions, 
  getPromotionById, 
  
  updatePromotion,    // Import update function
  deletePromotion     // Import delete function
} = require('../models/promotionModel');
const { formatSuccessResponse, formatErrorResponse } = require('../utils/responseFormatter');

// Controller to create a new promotion
const createPromotion = async (req, res) => {
    const { period, startDate, endDate, paymentDetails, advertisementId } = req.body;
  
    try {
      const newPromotion = await createPromotion(period, startDate, endDate, paymentDetails, advertisementId);
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

// Controller to get all promotions
const getPromotionsController = async (req, res) => {
  try {
    const promotions = await getPromotions();
    res.status(200).json(formatSuccessResponse(promotions, 'Promotions fetched successfully'));
  } catch (error) {
    res.status(500).json(formatErrorResponse('Failed to fetch promotions', error.message));
  }
};

// Controller to get a promotion by ID
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

// Controller to update a promotion
const updatePromotionController = async (req, res) => {
  const { id } = req.params;
  const { period, startDate, endDate, paymentDetails, advertisementId } = req.body;

  try {
    const updatedPromotion = await updatePromotion(id, { period, startDate, endDate, paymentDetails, advertisementId });

    if (!updatedPromotion) {
      return res.status(404).json(formatErrorResponse('Promotion not found'));
    }

    res.status(200).json(formatSuccessResponse('Promotion updated successfully', updatedPromotion));
  } catch (error) {
    res.status(500).json(formatErrorResponse('Error updating promotion: ' + error.message));
  }
};

// Controller to delete a promotion
const deletePromotionController = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedPromotion = await deletePromotion(id);

    if (!deletedPromotion) {
      return res.status(404).json(formatErrorResponse('Promotion not found'));
    }

    res.status(200).json(formatSuccessResponse('Promotion deleted successfully'));
  } catch (error) {
    res.status(500).json(formatErrorResponse('Error deleting promotion: ' + error.message));
  }
};

module.exports = {
  createPromotion,
  getPromotionsController,
  getPromotionByIdController,
  updatePromotionController,    // Export update controller
  deletePromotionController,    // Export delete controller
};
