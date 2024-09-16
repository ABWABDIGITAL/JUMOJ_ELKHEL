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
    const { name, key, phone, password, confirmPassword } = req.body;
  
    // Validate required fields
    if (!name || !key || !phone || !password || !confirmPassword) {
      return res
        .status(400)
        .json(formatErrorResponse("All fields are required"));
    }
  
    // Validate the phone and key lengths
    if (phone.length > 15 || isNaN(phone)) {
      return res.status(400).json(formatErrorResponse("Invalid phone number"));
    }
    if (key.length > 5 || !key.startsWith('+')) {
      return res.status(400).json(formatErrorResponse("Invalid country code"));
    }
  
    // Check if passwords match
    if (password !== confirmPassword) {
      return res.status(400).json(formatErrorResponse("Passwords do not match"));
    }
  
    try {
      // Check if the phone number already exists
      const existingUser = await UserModel.getUserByPhoneAndKey(phone, key);
      if (existingUser) {
        return res.status(409).json(formatErrorResponse("Phone number is already in use"));
      }
  
      // Save OTP (hardcoded for testing)
      const otp = "1234";
  
      // Create the user with 'pending' status until OTP is verified
      const user = await UserModel.createUser({
        name,
        key,
        phone,
        password,
        otp,
        status: 'pending'
      });
  
      res.status(201).json(
        formatSuccessResponse(
          null,
          "User created successfully. Please verify your phone number using the OTP sent."
        )
      );
    } catch (error) {
      Sentry.captureException(error);
      res.status(500).json(formatErrorResponse(error.message));
    }
  },
  

  verifyOtp: async (req, res) => {
    const { phone, key, otp } = req.body;
  
    // Validate fields
    if (!phone || !key || !otp) {
      return res.status(400).json(formatErrorResponse("Phone, country code, and OTP are required"));
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
        const refreshToken = generateRefreshToken( user);
  
        // Send response with user details and tokens
        return res.status(200).json(
          formatSuccessResponse(
            {
              username: user.name,
              phone: user.phone,
              key: user.key,  // Country key
              type: user.type || 'user',  // Default to 'user'
              accessToken,
              refreshToken
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
        .json(formatErrorResponse("Phone number and country code are required"));
    }
  
    try {
      const user = await UserModel.getUserByPhone(phone);
      if (!user) {
        return res.status(404).json(formatErrorResponse("User not found"));
      }
  
      // Check if an OTP was already sent within the last 30 seconds
      const now = Date.now();
      const otpLastSentInSeconds = Math.floor(now / 1000); // Convert milliseconds to seconds
  
      // Check the last OTP sent time (also in seconds) and compare
      if (user.otpLastSent && otpLastSentInSeconds - user.otpLastSent < 30) {
        return res
          .status(429) // Too many requests
          .json(formatErrorResponse("Please wait 30 seconds before resending the OTP."));
      }
  
      // Generate a fixed 4-digit OTP
      const otp = Math.floor(1000 + Math.random() * 9000).toString(); // Always a 4-digit OTP
      const otpExpiresInSeconds = otpLastSentInSeconds + 3600; // OTP valid for 1 hour (3600 seconds)
  
      // Send OTP to the user's phone (mocked for now)
      console.log(`OTP for ${phone}: ${otp}`);
  
      // Save OTP, OTP expiration, and OTP last sent time in seconds
      await UserModel.setOtpForUser(user.id, otp, otpExpiresInSeconds, otpLastSentInSeconds);
  
      res.status(200).json(
        formatSuccessResponse(
          { message: "OTP sent successfully to your phone. Please verify your OTP." }
        )
      );
    } catch (error) {
      Sentry.captureException(error); // Capture error with Sentry
      res.status(500).json(formatErrorResponse(error.message));
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

    const { name, email, phone, identity, birthday, locationId, password } =
      req.body;

    try {
      if (!userId) {
        return res.status(400).json(formatErrorResponse("User ID is required"));
      }

      const updatedUser = await UserModel.updateUser(userId, {
        name,
        email,
        phone,
        identity,
        birthday,
        locationId,
        password,
      });
      if (updatedUser) {
        res
          .status(200)
          .json(
            formatSuccessResponse(updatedUser, "User updated successfully")
          );
      } else {
        res.status(404).json(formatErrorResponse("User not found"));
      }
    } catch (error) {
      res.status(500).json(formatErrorResponse(error.message));
    }
  },
};

module.exports = UserController;
