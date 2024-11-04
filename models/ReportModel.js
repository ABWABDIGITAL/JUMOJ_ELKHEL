const pool = require("../config/db");

const ReportModel = {
  // Create a new report
  createReport: async ({
    userId,
    reportedContentId,
    reportType,
    description = null, // Optional description
    status = "Pending", // Default status
  }) => {
    const result = await pool.query(
      `INSERT INTO reports (user_id, reported_content_id, report_type, description, status, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [userId, reportedContentId, reportType, description, status]
    );
    return result.rows[0];
  },

  // Get report by ID
  getReportById: async (id) => {
    const result = await pool.query(
      `SELECT r.*, u.name AS user_name
       FROM reports r
       JOIN users u ON r.user_id = u.id
       WHERE r.id = $1`,
      [id]
    );
    return result.rows[0];
  },
  // Get all reports with pagination
getAllReportsWithPagination: async (limit, offset) => {
    const result = await pool.query(
      `SELECT r.*, u.name AS user_name
       FROM reports r
       JOIN users u ON r.user_id = u.id
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  },
  

  // Count total reports for pagination purposes
  getTotalReportsCount: async () => {
    const result = await pool.query(`SELECT COUNT(*) AS total FROM reports`);
    return parseInt(result.rows[0].total, 10);
  },

  // Update report status
  updateReportStatus: async (id, newStatus) => {
    const result = await pool.query(
      `UPDATE reports
       SET status = $1
       WHERE id = $2
       RETURNING *`,
      [newStatus, id]
    );
    return result.rows[0];
  },

  // Delete a report by ID
  deleteReport: async (id) => {
    const result = await pool.query(
      `DELETE FROM reports WHERE id = $1 RETURNING *`,
      [id]
    );
    return result.rows[0];
  },

  // Get reports by status (e.g., Pending, Resolved)
  getReportsByStatus: async (status) => {
    const result = await pool.query(
      `SELECT r.*, u.username AS user_name
       FROM reports r
       JOIN users u ON r.user_id = u.id
       WHERE r.status = $1`,
      [status]
    );
    return result.rows;
  },

  // Check if a user has already reported specific content (to avoid duplicate reports)
  isContentReportedByUser: async (userId, reportedContentId) => {
    const result = await pool.query(
      `SELECT * FROM reports WHERE user_id = $1 AND reported_content_id = $2`,
      [userId, reportedContentId]
    );
    return result.rowCount > 0;
  },
};

module.exports = ReportModel;
