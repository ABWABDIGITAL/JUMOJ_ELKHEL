const pool = require("../config/db");

const SuppliesModel = {
  // Create new supply with multiple images and new fields
  createSupply: async ({
    name,
    description,
    userId,
    locationId,
    images,
    comment,
    advId,
  }) => {
    const client = await pool.connect(); // Ensure atomic transaction

    try {
      await client.query("BEGIN");

      // Insert the supply with updated fields
      const result = await client.query(
        `INSERT INTO supplies (name, description, user_id, location_id, comment, adv_id, commission_rate)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [name, description, userId, locationId, comment, advId, 2.5]
      );

      const supply = result.rows[0];

      // Insert images if provided
      if (images && images.length > 0) {
        console.log("Inserting images:", images); // Log image URLs for debugging
        const imagePromises = images.map((imageUrl) => {
          return client.query(
            `INSERT INTO supply_images (supply_id, image_url) VALUES ($1, $2)`,
            [supply.id, imageUrl]
          );
        });
        await Promise.all(imagePromises);
      }

      await client.query("COMMIT");
      return supply;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },

  // Get supply by ID including user and location details
  getSupplyById: async (supplyId) => {
    const result = await pool.query(
      `SELECT 
          s.id, 
          s.name, 
          s.description, 
          s.comment, 
          s.adv_id, 
          s.commission_rate,
          s.created_at,
          
          -- User details
          u.id as user_id, 
          u.name as user_name, 
          u.email as user_email, 
          u.phone as user_phone, 
          
          -- Location details
          l.id as location_id, 
          l.name as location_name, 
          l.city, 
          l.area, 
          l.latitude, 
          l.longitude,
  
          -- Adv details
          a.id as adv_id,
          a.title as adv_title,
          a.description as adv_description,
  
          -- Images
          ARRAY_AGG(si.image_url) AS images
  
      FROM supplies s
      LEFT JOIN users u ON s.user_id::VARCHAR = u.id::VARCHAR
      LEFT JOIN locations l ON s.location_id::VARCHAR = l.id::VARCHAR
      LEFT JOIN advertisements a ON s.adv_id::VARCHAR = a.id::VARCHAR
      LEFT JOIN supply_images si ON s.id = si.supply_id
      WHERE s.id = $1
      GROUP BY s.id, u.id, l.id, a.id`,
      [supplyId]
    );

    return result.rows[0];
  },

  // Create a comment for a supply
  createComment: async ({ supplyId, name, comment }) => {
    const result = await pool.query(
      `INSERT INTO comments (supply_id, name, comment) 
       VALUES ($1, $2, $3) RETURNING *`,
      [supplyId, name, comment]
    );

    return result.rows[0];
  },
};

module.exports = SuppliesModel;
