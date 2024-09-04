const { Pool } = require('pg');

// Create a new pool using your PostgreSQL database configuration
const pool = new Pool({
  host: '127.0.0.1',
  user: 'fatmamaged',  
  password: 'Fatmamaged', 
  database: 'jomoh', 
  port: 5432, 
});

// Connect to PostgreSQL
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to PostgreSQL:', err.stack);
    return;
  }
  console.log('Connected to PostgreSQL');
  release();  // Release the client back to the pool
});

// Export the pool for use in your application
module.exports = pool;
