const pool = require('../config/db');
const bcrypt = require('bcryptjs');


  // Create a new user with hashed password
  

const UserModel = {
  // Create a user with phone, key, pending status, and OTP
  createUser: async (name, phone, key, password, otp, status) => {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (name, phone, key, password, otp, status) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, phone, key, hashedPassword, otp, status]
    );
    return result.rows[0];
  },

  // Get a user by phone number
  getUserByPhone: async (phone) => {
    const result = await pool.query(`SELECT * FROM users WHERE phone = $1`, [
      phone,
    ]);
    return result.rows[0];
  },
  getUserByPhoneAndKey: async (phone, key) => {
    const query = 'SELECT * FROM users WHERE phone = $1 AND key = $2 LIMIT 1';
    const result = await pool.query(query, [phone, key]);
    return result.rows[0];
  },
  // Get a user by key
  getUserByKey: async (key) => {
    const result = await pool.query(`SELECT * FROM users WHERE key = $1`, [
      key,
    ]);
    return result.rows[0];
  },

setOtpForUser: async (userId, otp, otpExpires, otpLastSent) => {
  const query = `UPDATE users
   SET otp = $1, otp_expires = $2, otp_last_sent = $3
   WHERE id = $4`;
  await pool.query(query, [otp, otpExpires, otpLastSent, userId]);
},

  // Update user status to 'active' after OTP verification
  updateUserStatus: async (userId, status) => {
    const result = await pool.query(
      `UPDATE users SET status = $1 WHERE id = $2 RETURNING *`,
      [status, userId]
    );
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

  // Get user by ID with location details and WhatsApp link
  getUserByIdWithDetails: async (userId) => {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.phone, u.location_id, u.identity, u.birthday, 
              l.name as location_name, l.area, l.city
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
  updateUser: async (userId, { name, email, phone, identity, birthday, locationId, password }) => {
    let query = `UPDATE users SET 
                  name = COALESCE($2, name), 
                  email = COALESCE($3, email), 
                  phone = COALESCE($4, phone), 
                  identity = COALESCE($5, identity),
                  birthday = COALESCE($6, birthday),
                  location_id = COALESCE($7, location_id)`;
    
    const values = [userId, name, email, phone, identity, birthday, locationId];
    
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      query += `, password = $8`;
      values.push(hashedPassword);
    }
    
    query += ` WHERE id = $1 RETURNING id, name, email, phone, identity, birthday, location_id`;

    const result = await pool.query(query, values);

    if (result.rows[0]) {
      // Fetch the user with populated location after update and include WhatsApp link
      return await UserModel.getUserByIdWithDetails(userId);
    }

    return null;
  },
};

module.exports = UserModel;
