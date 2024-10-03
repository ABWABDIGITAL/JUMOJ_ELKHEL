// routes/promotionRoutes.js
const express = require("express");
const {
  createPromotion,
  getPromotionsController,
  getPromotionByIdController,
  updatePromotionController ,
  deletePromotionController
} = require("../controllers/promotionController");

const router = express.Router();

// Create a new promotion
router.post("", createPromotion);

// Get all promotions
router.get("/", getPromotionsController);
router.get("/:id", getPromotionByIdController);
router.put("/:id", updatePromotionController);
router.delete("/:id", deletePromotionController);

module.exports = router;
