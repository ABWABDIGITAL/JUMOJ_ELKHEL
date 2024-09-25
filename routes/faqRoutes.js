const express = require('express');
const router = express.Router();
const FAQ = require('../models/faqModel');  // Import the FAQ model

// Get all FAQs
router.get('/', async (req, res) => {
  try {
    const faqs = await FAQ.getAll();
    res.status(200).json({ success: true, data: faqs });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to retrieve FAQs", error: error.message });
  }
});

// Get FAQ by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const faq = await FAQ.getById(id);
    if (!faq) {
      return res.status(404).json({ success: false, message: "FAQ not found" });
    }
    res.status(200).json({ success: true, data: faq });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to retrieve FAQ", error: error.message });
  }
});

// Create a new FAQ
router.post('/', async (req, res) => {
  const { question, answer } = req.body;
  if (!question || !answer) {
    return res.status(400).json({ success: false, message: "Question and answer are required" });
  }
  try {
    const newFAQ = await FAQ.create(question, answer);
    res.status(201).json({ success: true, message: "FAQ created successfully", data: newFAQ });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to create FAQ", error: error.message });
  }
});

// Update an FAQ
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { question, answer } = req.body;
  if (!question || !answer) {
    return res.status(400).json({ success: false, message: "Question and answer are required" });
  }
  try {
    const updatedFAQ = await FAQ.update(id, question, answer);
    if (!updatedFAQ) {
      return res.status(404).json({ success: false, message: "FAQ not found" });
    }
    res.status(200).json({ success: true, message: "FAQ updated successfully", data: updatedFAQ });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update FAQ", error: error.message });
  }
});

// Delete an FAQ
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const deletedFAQ = await FAQ.delete(id);
    if (!deletedFAQ) {
      return res.status(404).json({ success: false, message: "FAQ not found" });
    }
    res.status(200).json({ success: true, message: "FAQ deleted successfully", data: deletedFAQ });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete FAQ", error: error.message });
  }
});

module.exports = router;
