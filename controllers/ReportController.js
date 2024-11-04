const ReportModel = require("../models/ReportModel");
const { formatSuccessResponse, formatErrorResponse } = require("../utils/responseFormatter");

const ReportController = {
  createReport: async (req, res) => {
    try {
      const newReport = await ReportModel.createReport(req.body);
      res.status(201).json(formatSuccessResponse(newReport, "Report created successfully"));
    } catch (error) {
      console.error("Error creating report:", error.message || error);
      res.status(500).json(formatErrorResponse("Error creating report", error.message || error));
    }
  },

  getReportById: async (req, res) => {
    try {
      const report = await ReportModel.getReportById(req.params.id);
      if (!report) {
        return res.status(404).json(formatErrorResponse("Report not found"));
      }
      res.json(formatSuccessResponse(report, "Report retrieved successfully"));
    } catch (error) {
      res.status(500).json(formatErrorResponse("Error retrieving report", error.message || error));
    }
  },

  getAllReports: async (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;
    try {
      const reports = await ReportModel.getAllReportsWithPagination(limit, offset);
      const total = await ReportModel.getTotalReportsCount();
      res.json(formatSuccessResponse({ total, reports }, "Reports retrieved successfully"));
    } catch (error) {
      res.status(500).json(formatErrorResponse("Error retrieving reports", error.message || error));
    }
  },

  updateReportStatus: async (req, res) => {
    try {
      const updatedReport = await ReportModel.updateReportStatus(req.params.id, req.body.status);
      if (!updatedReport) {
        return res.status(404).json(formatErrorResponse("Report not found"));
      }
      res.json(formatSuccessResponse(updatedReport, "Report status updated successfully"));
    } catch (error) {
      res.status(500).json(formatErrorResponse("Error updating report status", error.message || error));
    }
  },

  deleteReport: async (req, res) => {
    try {
      const deletedReport = await ReportModel.deleteReport(req.params.id);
      if (!deletedReport) {
        return res.status(404).json(formatErrorResponse("Report not found"));
      }
      res.json(formatSuccessResponse(deletedReport, "Report deleted successfully"));
    } catch (error) {
      res.status(500).json(formatErrorResponse("Error deleting report", error.message || error));
    }
  },
};

module.exports = ReportController;
