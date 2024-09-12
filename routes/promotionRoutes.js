// routes/promotionRoutes.js
const express = require("express");
const {
  createPromotionController,
  getPromotionsController,
  getPromotionByIdController,
} = require("../controllers/promotionController");

const router = express.Router();

// Create a new promotion
router.post("", createPromotionController);

// Get all promotions
router.get("/", getPromotionsController);
router.get("/:id", getPromotionByIdController);
module.exports = router;
