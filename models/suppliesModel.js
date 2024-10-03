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
        [name, description, userId, locationId, comment, advId, 2.5] // You can make commission_rate dynamic
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
      throw new Error("Error creating supply: " + error.message);
    } finally {
      client.release();
    }
  },

  getSupplyById :async (supplyId) => {
    const query = `
      SELECT 
        s.id,
        s.name,
        s.description,
        s.adv_id,
        s.commission_rate,
        s.created_at,
        s.user_id,
        u.name as user_name,
        u.email as user_email,
        u.phone as user_phone,
        l.id as location_id,
        l.name as location_name,
        l.city,
        l.area,
        l.latitude,
        l.longitude,
        a.title as adv_title,
        a.description as adv_description,
        ARRAY_AGG(i.image_url) AS images, -- Corrected column name
        COALESCE(JSON_AGG(c.* ORDER BY c.created_at) FILTER (WHERE c.id IS NOT NULL), '[]') AS comments -- Ensure comments are ordered and empty array returned when no comments
      FROM 
        supplies s
        LEFT JOIN users u ON s.user_id = u.id
        LEFT JOIN locations l ON s.location_id = l.id
        LEFT JOIN advertisements a ON s.adv_id = a.id
        LEFT JOIN supply_images i ON s.id = i.supply_id
        LEFT JOIN comments c ON s.id = c.supply_id
      WHERE s.id = $1
      GROUP BY s.id, u.name, u.email, u.phone, l.id, l.name, l.city, l.area, l.latitude, l.longitude, a.title, a.description;
    `;
  
    const result = await pool.query(query, [supplyId]);
    return result.rows[0]; // Return the first supply (should only be one)
  },
  
  getAllSupplies: async ({ page = 1, limit = 10 }) => {
    const offset = (page - 1) * limit;
  
    const query = `
      SELECT 
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
  
        -- Images (handle null values and empty arrays)
        COALESCE(ARRAY_AGG(si.image_url) FILTER (WHERE si.image_url IS NOT NULL), '{}') AS images,
  
        -- Comments (ordered by created_at, no DISTINCT)
        COALESCE(JSON_AGG(c ORDER BY c.created_at) FILTER (WHERE c.id IS NOT NULL), '[]') AS comments
  
      FROM supplies s
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN locations l ON s.location_id = l.id
      LEFT JOIN advertisements a ON s.adv_id = a.id
      LEFT JOIN supply_images si ON s.id = si.supply_id
      LEFT JOIN comments c ON s.id = c.supply_id
      GROUP BY s.id, u.id, l.id, a.id
      ORDER BY s.created_at DESC -- Ordering results by creation time
      LIMIT $1 OFFSET $2;
    `;
  
    const totalSuppliesQuery = `SELECT COUNT(*) FROM supplies`; // To get the total count for pagination
  
    try {
      const client = await pool.connect();
  
      // Run both queries in parallel for better performance
      const [suppliesResult, totalSuppliesResult] = await Promise.all([
        client.query(query, [limit, offset]),
        client.query(totalSuppliesQuery),
      ]);
  
      const totalSupplies = parseInt(totalSuppliesResult.rows[0].count, 10);
  
      return {
        supplies: suppliesResult.rows,
        pagination: {
          total: totalSupplies,
          page: page,
          limit: limit,
          totalPages: Math.ceil(totalSupplies / limit),
        },
      };
    } catch (error) {
      throw new Error(`Error fetching supplies: ${error.message}`);
    }
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
   // Update supply by supplyId
   updateSupply: async (supplyId, updatedFields) => {
    const client = await pool.connect();
  
    try {
      await client.query("BEGIN");
  
      // Build the dynamic update query, using the correct snake_case column names
      const setValues = [];
      const queryParams = [];
      let paramIndex = 1;
  
      // Map camelCase fields to their corresponding snake_case database columns
      const fieldMapping = {
        name: 'name',
        description: 'description',
        locationId: 'location_id', // Corrected from locationId to location_id
        advId: 'adv_id', // Corrected from advId to adv_id
        images: 'images'
      };
  
      // Loop through updated fields and add only valid ones to the query
      for (const [field, value] of Object.entries(updatedFields)) {
        if (value !== undefined && fieldMapping[field]) {
          setValues.push(`${fieldMapping[field]} = $${paramIndex}`);
          queryParams.push(value);
          paramIndex++;
        }
      }
  
      if (setValues.length === 0) {
        throw new Error("No valid fields provided for update");
      }
  
      // Add supplyId as the last parameter to the query
      queryParams.push(supplyId);
  
      const updateQuery = `UPDATE supplies SET ${setValues.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
  
      const result = await client.query(updateQuery, queryParams);
      await client.query("COMMIT");
  
      return result.rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      throw new Error('Error updating supply: ' + error.message);
    } finally {
      client.release();
    }
  },
  

  // Update comment by commentId
  updateComment: async (commentId, { name, comment }) => {
    const result = await pool.query(
      `UPDATE comments SET name = $1, comment = $2, updated_at = NOW() WHERE id = $3 RETURNING *`,
      [name, comment, commentId]
    );
    return result.rows[0];
  },
  updateSupply: async (supplyId, updatedFields) => {
    const client = await pool.connect();
  
    try {
      await client.query("BEGIN");
  
      // Build the dynamic update query
      const setValues = [];
      const queryParams = [];
      let paramIndex = 1;
  
      for (const [field, value] of Object.entries(updatedFields)) {
        if (value !== undefined) { // Only update fields that are provided
          setValues.push(`${field} = $${paramIndex}`);
          queryParams.push(value);
          paramIndex++;
        }
      }
  
      if (setValues.length === 0) {
        throw new Error("No valid fields provided for update");
      }
  
      queryParams.push(supplyId); // Add supplyId as the last parameter
  
      const updateQuery = `UPDATE supplies SET ${setValues.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
  
      const result = await client.query(updateQuery, queryParams);
      await client.query("COMMIT");
  
      return result.rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      throw new Error('Error updating supply: ' + error.message);
    } finally {
      client.release();
    }
  },
  
  // Delete a comment
  deleteComment: async (req, res) => {
    const { commentId } = req.params;

    try {
      // Delete the comment
      const deletedComment = await SuppliesModel.deleteComment(commentId);
      if (!deletedComment) {
        return res.status(404).json(formatErrorResponse('Comment not found'));
      }

      return res.status(200).json(formatSuccessResponse('Comment deleted successfully'));
    } catch (error) {
      return res.status(500).json(formatErrorResponse('Error deleting comment: ' + error.message));
    }
  },// Delete supply by supplyId
  deleteSupply: async (supplyId) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // First, delete associated images
      await client.query(`DELETE FROM supply_images WHERE supply_id = $1`, [supplyId]);

      // Then, delete the supply itself
      const result = await client.query(`DELETE FROM supplies WHERE id = $1 RETURNING *`, [supplyId]);

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw new Error('Error deleting supply: ' + error.message);
    } finally {
      client.release();
    }
  },

  // Delete comment by commentId
  deleteComment: async (commentId) => {
    const result = await pool.query(`DELETE FROM comments WHERE id = $1 RETURNING *`, [commentId]);
    return result.rows[0];
  },
};

module.exports = SuppliesModel;
