const pool = require("../config/db"); // Import the pool from db.js

const PannerModel = {
  createPanner: async (description, image, link) => {
    const result = await pool.query(
      `INSERT INTO panners (description, image, link) VALUES ($1, $2, $3) RETURNING *`,
      [description, image, link]
    );
    return result.rows[0];
  },

  getPannerById: async (id) => {
    const result = await pool.query(`SELECT * FROM panners WHERE id = $1`, [
      id,
    ]);
    return result.rows[0];
  },

   updatePanner :async (id, description, image, link) => {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        // Use a query that handles null values
        const result = await client.query(
            `UPDATE panners SET
            description = COALESCE($1, description),
            image = COALESCE($2, image),
            link = COALESCE($3, link)
            WHERE id = $4 RETURNING *`,
            [description, image, link, id]
        );

        const updatedPanner = result.rows[0];
        await client.query("COMMIT");
        return updatedPanner;
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
},


  deletePanner: async (id) => {
    const result = await pool.query(
      `DELETE FROM panners WHERE id = $1 RETURNING *`,
      [id]
    );
    return result.rows[0];
  },

  // Get all panners
  getAllPanners: async () => {
    try {
      const result = await pool.query("SELECT * FROM panners"); // Use 'pool' here
      return result.rows;
    } catch (error) {
      console.error("Error fetching all panners:", error);
      throw error;
    }
  },
};

module.exports = PannerModel;
