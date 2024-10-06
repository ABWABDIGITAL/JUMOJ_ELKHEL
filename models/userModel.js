const pool = require("../config/db");
const bcrypt = require("bcryptjs");

// Create a new user with hashed password

const UserModel = {
  // Create a user with phone, key, pending status, and fixed OTP
  createUser: async (
    name,
    phone,
    email,
    key,
    password,
    confirmPassword,
    status
  ) => {
    // Log the values being passed
    console.log({ name, phone, email, key, password, confirmPassword, status });

    // Check for empty password and confirmPassword
    if (!password || !confirmPassword) {
      throw new Error("Password or confirm password is undefined or empty");
    }

    // Check if password matches confirmPassword
    if (password !== confirmPassword) {
      throw new Error("Passwords do not match");
    }

    const hashedPassword = await bcrypt.hash(password, 10); // Hash the password

    // Generate a fixed OTP
    const otp = "1234";
    const otpExpiresInSeconds = Math.floor(Date.now() / 1000) + 3600; // OTP valid for 1 hour

    // Insert user into the database
    const result = await pool.query(
      `INSERT INTO users (name, phone, email, key, password, otp, otp_expires,confirmPassword, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8,$9) RETURNING *`,
      [
        name,
        phone,
        email,
        key,
        hashedPassword,
        otp,
        otpExpiresInSeconds,
        confirmPassword,
        status,
      ]
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
    const query = "SELECT * FROM users WHERE phone = $1 AND key = $2 LIMIT 1";
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

  setOtpForUser: async (userId, otp, otpExpiresInSeconds, otpLastSent) => {
    // Convert Unix timestamp to JavaScript Date object
    const otpExpires = new Date(otpExpiresInSeconds * 1000); // Multiply by 1000 to convert seconds to milliseconds

    const query = `UPDATE users
                   SET otp = $1, otp_expires = $2, otp_last_sent = $3
                   WHERE id = $4`;
    await pool.query(query, [
      otp,
      otpExpires,
      new Date(otpLastSent * 1000),
      userId,
    ]);
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
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    return result.rows[0];
  },

  // Reset user password
  resetPassword: async (userId, newPassword) => {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query(
      "UPDATE users SET password = $1, reset_password_token = NULL, reset_password_expires = NULL WHERE id = $2",
      [hashedPassword, userId]
    );
  },

  // Get user by ID
  getUserById: async (id) => {
    const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
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
  // Get user by ID with location details and WhatsApp link
  getUserByIdWithDetails: async (userId) => {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.phone, u.location_id, u.identity, u.birthday, u.image_url, 
            l.name as location_name, l.area, l.city
     FROM users u
     LEFT JOIN locations l ON u.location_id = l.id
     WHERE u.id = $1`,
      [userId]
    );

    const user = result.rows[0];

    if (user) {
      // Add WhatsApp link based on phone number
      user.whatsapp_link = `https://wa.me/${user.phone.replace(/[^0-9]/g, "")}`;
    }

    return user;
  },

  // Update user contact information and locationId
  updateUser: async (
    userId,
    { name, email, phone, identity, birthday, locationId, password, imageUrl }
  ) => {
    console.log("Updating user with ID:", userId);
    console.log("Incoming data:", {
      name,
      email,
      phone,
      identity,
      birthday,
      locationId,
      password,
      imageUrl,
    });

    let query = `UPDATE users SET 
                name = COALESCE($2, name), 
                email = COALESCE($3, email), 
                phone = COALESCE($4, phone), 
                identity = COALESCE($5, identity),
                birthday = COALESCE($6, birthday),
                location_id = COALESCE($7, location_id)`;

    const values = [userId, name, email, phone, identity, birthday, locationId];

    // Check if password is provided and hash it
    if (password) {
      const hashedPassword = await bcrypt.hash(password.trim(), 10);
      query += `, password = $8`;
      values.push(hashedPassword);
    }

    // Check if imageUrl is provided, and if so, add it to the query
    if (imageUrl) {
      query += `, image_url = $9`;
      values.push(imageUrl);
    }

    query += ` WHERE id = $1 RETURNING id, name, email, phone, identity, birthday, location_id, image_url`;

    try {
      const result = await pool.query(query, values);
      console.log("Query result:", result.rows);

      if (result.rows.length > 0) {
        // Return the updated user details
        const updatedUser = await UserModel.getUserByIdWithDetails(userId);
        return updatedUser;
      }

      return null; // No user found
    } catch (error) {
      console.error("Error in UserModel.updateUser:", error.message);
      throw new Error("An error occurred while updating user information");
    }
  },

  searchByLocation: async (locationId, page, limit) => {
    const offset = (page - 1) * limit;

    try {
      const result = await pool.query(
        `SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        l.id as location_id,
        l.name as location_name,
        l.city,
        l.area,
        l.latitude,
        l.longitude
      FROM 
        users u
      LEFT JOIN 
        locations l ON u.location_id = l.id
      WHERE 
        l.id = $1
      LIMIT $2 OFFSET $3`,
        [locationId, limit, offset]
      );

      return result.rows; // Return the array of users found
    } catch (error) {
      throw new Error(`Database query failed: ${error.message}`); // Handle any database errors
    }
  }, // Function to invalidate the access token
  invalidateAccessToken: async (token) => {
    const query =
      "INSERT INTO invalidated_tokens (token) VALUES ($1) ON CONFLICT (token) DO NOTHING"; // Insert token and ignore if it already exists
    const values = [token];
    await pool.query(query, values);
  },

  // Function to check if an access token is invalidated
  isTokenInvalidated: async (token) => {
    const query = "SELECT * FROM invalidated_tokens WHERE token = $1";
    const values = [token];
    const result = await pool.query(query, values);
    return result.rowCount > 0;
  }, // Return true if the token is found
  
};

module.exports = UserModel;
