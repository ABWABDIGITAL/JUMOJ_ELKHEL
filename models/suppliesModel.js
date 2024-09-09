const pool = require("../config/db");

const SuppliesModel = {
  // Create new supply with multiple images
  createSupply: async ({ name, description, price, age, health, mother, father, userId, locationId, images }) => {
    const client = await pool.connect(); // Ensure atomic transaction

    try {
      await client.query("BEGIN");

      // Insert the supply
      const result = await client.query(
        `INSERT INTO supplies (name, description, price, age, health, mother, father, user_id, location_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
        [name, description, price, age, health, mother, father, userId, locationId]
      );

      const supply = result.rows[0];

      // Insert images if provided
      if (images && images.length > 0) {
        console.log('Inserting images:', images); // Log image URLs for debugging
        const imagePromises = images.map(imageUrl => {
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
     // console.error('Error creating supply:', error); // Log the error
      throw error;
    } finally {
      client.release();
    }
  },

  // Get a supply by ID with user contact info, locationId populated, and reviews
  getSupplyById: async (supplyId) => {
    const result = await pool.query(
      `SELECT s.id, s.name, s.description, s.price, s.age, s.health, s.mother, s.father, 
              u.name as user_name, u.email as user_email, u.phone as user_phone,
              l.name as location_name, l.area, l.city, l.latitude, l.longitude,
              ARRAY_AGG(si.image_url) AS images,
              COALESCE(json_agg(json_build_object('rating', r.rating, 'comment', r.comment)) FILTER (WHERE r.id IS NOT NULL), '[]') AS reviews
       FROM supplies s
       LEFT JOIN users u ON s.user_id = u.id
       LEFT JOIN locations l ON s.location_id = l.id
       LEFT JOIN supply_images si ON s.id = si.supply_id
       LEFT JOIN reviews r ON s.id = r.supply_id
       WHERE s.id = $1
       GROUP BY s.id, u.id, l.id`,
      [supplyId]
    );

   // console.log('Fetched Supply:', result.rows[0]);
    return result.rows[0]; 
  },
  // Create a review
  createReview: async ({ supplyId, userId, rating, comment }) => {
    const result = await pool.query(
      `INSERT INTO reviews (supply_id, user_id, rating, comment)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [supplyId, userId, rating, comment]
    );

    return result.rows[0];
  }
};

module.exports = SuppliesModel;
