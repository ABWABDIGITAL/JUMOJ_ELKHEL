const pool = require("../config/db");
const bcrypt = require("bcryptjs");

const UserModel = {
  // Create a new user with hashed password
  createUser: async (name, email, phone, password) => {
    if (phone.length > 50) {
      throw new Error('Phone number is too long');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (name, email, phone, password)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, email, phone, hashedPassword]
    );

    return result.rows[0];
  },

  // Get user by phone number
  getUserByPhone: async (phone) => {
    if (!phone) {
      throw new Error('Phone number is required');
    }

    const result = await pool.query('SELECT * FROM users WHERE phone = $1', [phone]);
    return result.rows[0];
  },

  // Get user by email address
  getUserByEmail: async (email) => {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0];
  },

  // Reset user password
  resetPassword: async (userId, newPassword) => {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE users SET password = $1, reset_password_token = NULL, reset_password_expires = NULL WHERE id = $2',
      [hashedPassword, userId]
    );
  },

  // Get user by ID
  getUserById: async (id) => {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0];
  },

  // Set reset token and expiry for password reset
  setResetToken: async (userId, resetToken, resetTokenExpires) => {
    const result = await pool.query(
      `UPDATE users
       SET reset_password_token = $2, reset_password_expires = $3
       WHERE id = $1
       RETURNING *`,
      [userId, resetToken, resetTokenExpires]
    );
    return result.rows[0];
  },
  // Get user by ID with location details (without sensitive info)
 // Get user by ID with location details and WhatsApp link
 getUserById: async (userId) => {
  const result = await pool.query(
    `SELECT u.id, u.name, u.email, u.phone, u.location_id, 
            l.name as location_name, 
            l.area, 
            l.city
          
     FROM users u
     LEFT JOIN locations l ON u.location_id = l.id
     WHERE u.id = $1`,
    [userId]
  );

  const user = result.rows[0];
  
  if (user) {
    // Add WhatsApp link based on phone number
    user.whatsapp_link = `https://wa.me/${user.phone.replace(/[^0-9]/g, '')}`;
  }

  return user;
},

// Update user contact information and locationId
updateUser: async (userId, { name, email, phone, locationId }) => {
  const result = await pool.query(
    `UPDATE users 
     SET name = COALESCE($2, name), 
         email = COALESCE($3, email), 
         phone = COALESCE($4, phone), 
         location_id = COALESCE($5, location_id) 
     WHERE id = $1 
     RETURNING id, name, email, phone, location_id`,
    [userId, name, email, phone, locationId]
  );

  if (result.rows[0]) {
    // Fetch the user with populated location after update and include WhatsApp link
    return await UserModel.getUserById(userId);
  }

  return null;
},
};

module.exports = UserModel;
