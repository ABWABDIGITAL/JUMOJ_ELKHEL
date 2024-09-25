// routes/promotionRoutes.js
const express = require("express");
const {
  createPromotion,
  getPromotionsController,
  getPromotionByIdController,
} = require("../controllers/promotionController");

const router = express.Router();

// Create a new promotion
router.post("", createPromotion);

// Get all promotions
router.get("/", getPromotionsController);
router.get("/:id", getPromotionByIdController);
module.exports = router;
