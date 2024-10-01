const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const UserModel = require("../models/userModel");
const Sentry = require("@sentry/node");

const {
  formatSuccessResponse,
  formatErrorResponse,
} = require("../utils/responseFormatter");
const {
  generateAccessToken,
  generateRefreshToken,
  createToken,
} = require("../utils/createToken");

const UserController = {
  createUser: async (req, res) => {
    const { name, key, email, phone, password, confirmPassword } = req.body;

    // Validate required fields
    if (!name || !key || !email || !phone || !password || !confirmPassword) {
        return res.status(400).json(formatErrorResponse("All fields are required"));
    }

    // Log the received parameters for debugging
    console.log("Request body:", req.body);

    // Check if password matches confirmPassword
    if (password !== confirmPassword) {
        return res.status(400).json(formatErrorResponse("Passwords do not match"));
    }

    try {
        const existingUser = await UserModel.getUserByPhoneAndKey(phone, key);
        if (existingUser) {
            return res.status(409).json(formatErrorResponse("Phone number is already in use"));
        }

        // Pass 'pending' status and confirmPassword to UserModel.createUser method
        const user = await UserModel.createUser(name, phone, email, key, password, confirmPassword, "pending");

        res.status(201).json(formatSuccessResponse(null, "User created successfully. Please verify your phone number using the OTP sent."));
    } catch (error) {
        console.error("Error creating user:", error.message);
        res.status(500).json(formatErrorResponse("An internal error occurred"));
    }
}
,

  verifyOtp: async (req, res) => {
    const { phone, key, otp } = req.body;

    // Validate fields
    if (!phone || !key || !otp) {
      return res
        .status(400)
        .json(formatErrorResponse("Phone, country code, and OTP are required"));
    }

    try {
      // Fetch the user by phone number and country key
      const user = await UserModel.getUserByPhoneAndKey(phone, key);

      if (!user) {
        return res.status(404).json(formatErrorResponse("User not found"));
      }

      // Check if the OTP matches the fixed OTP
      if (otp === "1234") {
        // If OTP is correct, activate the user
        const userId = user.id;
        await UserModel.updateUserStatus(userId, "active");

        // Generate access and refresh tokens
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        // Send response with user details and tokens
        return res.status(200).json(
          formatSuccessResponse(
            {
              username: user.name,
              phone: user.phone,
              key: user.key, // Country key
              type: user.type || "user", // Default to 'user'
              accessToken,
              refreshToken,
            },
            "OTP verified successfully. User account is now active."
          )
        );
      } else {
        return res.status(400).json(formatErrorResponse("Invalid OTP"));
      }
    } catch (error) {
      Sentry.captureException(error);
      return res.status(500).json(formatErrorResponse(error.message));
    }
  },

  getUserByPhone: async (req, res) => {
    const { email } = req.params;
    try {
      const user = await UserModel.getUserByPhone(email);
      if (user) {
        res
          .status(200)
          .json(formatSuccessResponse(user, "User retrieved successfully"));
      } else {
        res.status(404).json(formatErrorResponse("User not found"));
      }
    } catch (error) {
      Sentry.captureException(error); // Capture error with Sentry
      res.status(500).json(formatErrorResponse(error.message));
    }
  },

  loginUser: async (req, res) => {
    const { phone, password } = req.body;
    try {
      if (!phone || !password) {
        return res
          .status(400)
          .json(formatErrorResponse("Phone number and password are required"));
      }

      const user = await UserModel.getUserByPhone(phone);
      if (
        user &&
        user.password &&
        (await bcrypt.compare(password, user.password))
      ) {
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);
        res
          .status(200)
          .json(
            formatSuccessResponse(
              { accessToken, refreshToken },
              "Login successful"
            )
          );
      } else {
        res
          .status(401)
          .json(formatErrorResponse("Invalid phone number or password"));
      }
    } catch (error) {
      Sentry.captureException(error); // Capture error with Sentry
      res.status(500).json(formatErrorResponse(error.message));
    }
  },

  resetPassword: async (req, res) => {
    const { password, confirmPassword } = req.body;

    if (!password || !confirmPassword) {
      return res
        .status(400)
        .json(
          formatErrorResponse("Password and confirm password are required")
        );
    }

    if (password !== confirmPassword) {
      return res
        .status(400)
        .json(formatErrorResponse("Passwords do not match"));
    }

    try {
      const accessToken = req.headers.authorization?.split(" ")[1];
      if (!accessToken) {
        return res
          .status(400)
          .json(formatErrorResponse("Access token is required"));
      }

      const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
      const user = await UserModel.getUserById(decoded.userId);
      if (!user) {
        return res
          .status(400)
          .json(formatErrorResponse("Invalid or expired token"));
      }

      await UserModel.resetPassword(user.id, password);
      res
        .status(200)
        .json(formatSuccessResponse(null, "Password reset successfully"));
    } catch (error) {
      Sentry.captureException(error); // Capture error with Sentry
      res.status(500).json(formatErrorResponse(error.message));
    }
  },

  forgotPassword: async (req, res) => {
    const { phone, key } = req.body;

    // Validate phone and key
    if (!phone || !key) {
      return res
        .status(400)
        .json(
          formatErrorResponse("Phone number and country code are required")
        );
    }

    // Combine country code (key) and phone
    const phoneNumber = `${key}${phone}`;
    const phoneRegex = /^\+?\d{10,15}$/;

    // Validate phone number format
    if (!phoneRegex.test(phoneNumber)) {
      return res
        .status(400)
        .json(formatErrorResponse("Invalid phone number format"));
    }

    try {
      const user = await UserModel.getUserByPhoneAndKey(phone, key);
      if (!user) {
        console.log(`User not found for phone: ${phoneNumber}`);
        return res.status(404).json(formatErrorResponse("User not found"));
      }

      const nowInSeconds = Math.floor(Date.now() / 1000); // Convert milliseconds to seconds

      // Check if an OTP was already sent within the last 30 seconds
      if (user.otpLastSent && nowInSeconds - user.otpLastSent < 30) {
        console.log(
          `OTP already sent recently to phone: ${phoneNumber}, please wait 30 seconds.`
        );
        return res
          .status(429)
          .json(
            formatErrorResponse(
              "Please wait 30 seconds before resending the OTP."
            )
          );
      }

      // Generate a 4-digit OTP
      const otp = Math.floor(1000 + Math.random() * 9000).toString();
      const otpExpiresInSeconds = nowInSeconds + 3600; // OTP valid for 1 hour

      // Log OTP for debugging purposes
      console.log(`Generated OTP for phone ${phoneNumber}: ${otp}`);

      // Save OTP, expiration time, and last sent time in seconds
      await UserModel.setOtpForUser(
        user.id,
        otp,
        otpExpiresInSeconds,
        nowInSeconds
      );

      // Respond with success
      return res.status(200).json(
        formatSuccessResponse({
          message:
            "OTP sent successfully to your phone. Please verify your OTP.",
        })
      );
    } catch (error) {
      // Log and report the error
      console.error(`Error sending OTP to phone ${phoneNumber}:`, error);
      Sentry.captureException(error); // Capture error with Sentry

      // Return generic error response
      return res
        .status(500)
        .json(
          formatErrorResponse("An error occurred while processing your request")
        );
    }
  },

  createCustomToken: (req, res) => {
    const { userId } = req.body;
    try {
      const token = createToken(userId);
      res
        .status(200)
        .json(
          formatSuccessResponse({ token }, "Custom token created successfully")
        );
    } catch (error) {
      Sentry.captureException(error); // Capture error with Sentry
      res.status(500).json(formatErrorResponse(error.message));
    }
  },

  // Update User Contact Information and LocationId
  updateUserContactInfo: async (req, res) => {
    const { name, email, phone, locationId } = req.body;

    // Extract userId from token (assuming it's sent in the authorization header)
    const accessToken = req.headers.authorization?.split(" ")[1];
    if (!accessToken) {
      return res
        .status(401)
        .json(formatErrorResponse("Access token is required"));
    }

    try {
      const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
      const userId = decoded.userId;

      // Validate required fields
      if (
        !userId ||
        (name === undefined &&
          email === undefined &&
          phone === undefined &&
          locationId === undefined)
      ) {
        return res
          .status(400)
          .json(formatErrorResponse("No update information provided"));
      }

      // Update user and populate location
      const updatedUser = await UserModel.updateUser(userId, {
        name,
        email,
        phone,
        locationId,
      });

      if (updatedUser) {
        res
          .status(200)
          .json(
            formatSuccessResponse(
              updatedUser,
              "User contact information updated successfully"
            )
          );
      } else {
        res.status(404).json(formatErrorResponse("User not found"));
      }
    } catch (error) {
      Sentry.captureException(error); // Capture error with Sentry
      res.status(500).json(formatErrorResponse(error.message));
    }
  },
  
 // Update user profile
 updateUser: async (req, res) => {
  const { userId } = req.params;
  const { name, email, phone, identity, birthday, locationId, password } = req.body;

  try {
    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    // Log the incoming request details for debugging
    console.log('Request Params (userId):', userId);
    console.log('Request Body:', req.body);
    console.log('Uploaded File:', req.file); // Check if the file has been uploaded

    // Handle the image if it was uploaded
    const imageUrl = req.file
      ? `http://${process.env.VPS_IP}:${process.env.PORT}/uploads/users/${req.file.filename}`
      : null;

    // Update user with the new information and image URL
    const updatedUser = await UserModel.updateUser(userId, {
      name,
      email,
      phone,
      identity,
      birthday,
      locationId,
      password,
      imageUrl, // Pass the image URL to the model
    });

    if (updatedUser) {
      return res.status(200).json({
        success: true,
        message: "User updated successfully",
        data: updatedUser,
      });
    } else {
      return res.status(404).json({ success: false, message: "User not found" });
    }
  } catch (error) {
    console.error("Error in updateUser controller:", error); // Log the exact error
    return res.status(500).json({ success: false, message: error.message || "An error occurred, and it has been reported." });
  }
},

};

module.exports = UserController;
