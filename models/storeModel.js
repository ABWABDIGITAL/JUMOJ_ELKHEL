const pool = require('../config/db');

const StoreModel = {
  // Create new store with image and files
  createStore: async ({ name, locationId, timeOfWorks = 'Always Open', imageUrl, fileUrls = [] }) => {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const result = await client.query(
        `INSERT INTO stores (name, location_id, time_of_works, image_url, file_urls)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [name, locationId, timeOfWorks, imageUrl, JSON.stringify(fileUrls)]
      );

      const store = result.rows[0];
      await client.query('COMMIT');
      return store;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

 
    // Get store by ID with location details
    getStoreById: async (id) => {
      const result = await pool.query(
        `SELECT 
            s.id, 
            s.name, 
            s.time_of_works, 
            s.image_url, 
            s.file_urls, 
            s.created_at,
  
            -- Location details
            l.id as location_id, 
            l.name as location_name, 
            l.city, 
            l.area, 
            l.latitude, 
            l.longitude
  
         FROM stores s
         LEFT JOIN locations l ON s.location_id = l.id  -- Join on location_id
         WHERE s.id = $1`,
        [id]
      );
      
      return result.rows[0]; // Return store with location details
    },
  
    // Get all stores with location details
    getAllStores: async () => {
      const result = await pool.query(
        `SELECT 
            s.id, 
            s.name, 
            s.time_of_works, 
            s.image_url, 
            s.file_urls, 
            s.created_at,
            
            -- Location details
            l.id as location_id, 
            l.name as location_name, 
            l.city, 
            l.area, 
            l.latitude, 
            l.longitude
  
         FROM stores s
         LEFT JOIN locations l ON s.location_id = l.id` // Join on location_id
      );
  
      return result.rows; // Return all stores with location details
    
  },  

 // Update store by ID with new information
 updateStoreById: async ({ id, name, locationId, timeOfWorks, imageUrl, fileUrls }) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const result = await client.query(
      `UPDATE stores
       SET name = COALESCE($1, name), 
           location_id = COALESCE($2, location_id), 
           time_of_works = COALESCE($3, time_of_works), 
           image_url = COALESCE($4, image_url), 
           file_urls = COALESCE($5, file_urls)
       WHERE id = $6 RETURNING *`,
      [name, locationId, timeOfWorks, imageUrl, JSON.stringify(fileUrls), id]
    );

    const store = result.rows[0];
    await client.query('COMMIT');
    return store;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
},
// Get all stores with pagination
getAllStoresWithPagination: async (limit, offset) => {
  const query = `
    SELECT * FROM stores
    LIMIT $1 OFFSET $2
  `;
  const result = await pool.query(query, [limit, offset]);
  return result.rows; // Return the array of stores
},

// Optionally, add a function to count total stores for pagination purposes
getTotalStoresCount: async () => {
  const query = `
    SELECT COUNT(*) AS total FROM stores
  `;
  const result = await pool.query(query);
  return parseInt(result.rows[0].total, 10); // Return the total count
},

// Delete store by ID
deleteStoreById: async (id) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const result = await client.query(
      `DELETE FROM stores WHERE id = $1 RETURNING *`,
      [id]
    );

    const deletedStore = result.rows[0];
    await client.query('COMMIT');
    return deletedStore; // return deleted store details if needed
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
};


module.exports = StoreModel;
