// routes/reportRoutes.js
const express = require("express");
const ReportController = require("../controllers/ReportController");

const router = express.Router();

router.post("/reports", ReportController.createReport); // Create a new report
router.get("/reports/:id", ReportController.getReportById); // Get a report by ID
router.get("/reports", ReportController.getAllReports); // Get all reports with pagination
router.put("/reports/:id/status", ReportController.updateReportStatus); // Update report status
router.delete("/reports/:id", ReportController.deleteReport); // Delete a report by ID

module.exports = router;
