const pool = require("../config/db");
const bcrypt = require("bcryptjs");

const UserModel = {
  createUser: async (name, phone, email, key, password, status) => {
    console.log({ name, phone, email, key, password, status });

    if (!password) {
      throw new Error("Password is undefined or empty");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (name, phone, email, key, password, status) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, phone, email, key, hashedPassword, status]
    );
    return result.rows[0];
  },

  getUserByPhone: async (phone) => {
    const result = await pool.query(`SELECT * FROM users WHERE phone = $1`, [phone]);
    return result.rows[0];
  },

  getUserByPhoneAndKey: async (phone, key) => {
    const query = "SELECT * FROM users WHERE phone = $1 AND key = $2 LIMIT 1";
    const result = await pool.query(query, [phone, key]);
    return result.rows[0];
  },

  setOtpForUser: async (userId, otp, otpExpiresInSeconds, otpLastSent) => {
    const otpExpires = new Date(otpExpiresInSeconds * 1000);
    const query = `UPDATE users
                   SET otp = $1, otp_expires = $2, otp_last_sent = $3
                   WHERE id = $4`;
    await pool.query(query, [otp, otpExpires, new Date(otpLastSent * 1000), userId]);
  },

  updateUserStatus: async (userId, status) => {
    const result = await pool.query(
      `UPDATE users SET status = $1 WHERE id = $2 RETURNING *`,
      [status, userId]
    );
    return result.rows[0];
  },

  resetPassword: async (userId, newPassword) => {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query(
      "UPDATE users SET password = $1 WHERE id = $2",
      [hashedPassword, userId]
    );
  },

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

    return result.rows[0] || null;
  },
};

module.exports = UserModel;
