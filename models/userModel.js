// models/userModel.js
const db = require("../config/db");

const bcrypt = require("bcryptjs");



const UserModel = {
  createUser: async (name, email, phone, sortOfAccount, password) => {
    // Validate phone length
    if (phone.length > 50) {
        throw new Error('Phone number is too long');
    }

    // Hash password before storing it in the database
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await db.query(
        `INSERT INTO users (name, email, phone, sort_of_account, password)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [name, email, phone, sortOfAccount, hashedPassword]
    );

    return result.rows[0];
  },
  
    getUserByPhone: async (phone) => {
        if (!phone) {
            throw new Error('Phone number is required');
        }
        const result = await db.query('SELECT * FROM users WHERE phone = $1', [phone]);
        return result.rows[0];
    },
    resetPassword: async (userId, newPassword) => {
      const hashedPassword = await bcrypt.hash(newPassword, 10); // Hash the new password
      await db.query(
          'UPDATE users SET password = $1, resetPasswordToken = NULL, resetPasswordExpires = NULL WHERE id = $2',
          [hashedPassword, userId]
      );
  },getUserById: async (id) => {
    const result = await db.query(
        'SELECT * FROM users WHERE id = $1',
        [id]
    );
    return result.rows[0];
},
setResetToken: async (userId, resetToken, resetTokenExpires) => {
  const result = await db.query(
      `UPDATE users
       SET reset_password_token = $2, reset_password_expires = $3
       WHERE id = $1
       RETURNING *`,
      [userId, resetToken, resetTokenExpires]
  );
  return result.rows[0];
},

   
};

module.exports = UserModel;


