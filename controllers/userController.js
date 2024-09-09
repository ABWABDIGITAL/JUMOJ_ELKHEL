// controllers/userController.js
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
    const { name, email, phone, password, confirmPassword } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !password || !confirmPassword) {
      return res
        .status(400)
        .json(formatErrorResponse("All fields are required"));
    }

    // Validate length constraints
    if (phone.length > 50) {
      return res
        .status(400)
        .json(formatErrorResponse("Phone number is too long"));
    }
    if (email.length > 100) {
      return res.status(400).json(formatErrorResponse("Email is too long"));
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      return res
        .status(400)
        .json(formatErrorResponse("Passwords do not match"));
    }

    try {
      // Check if the email already exists
      const existingUser = await UserModel.getUserByEmail(email);
      if (existingUser) {
        return res
          .status(409)
          .json(formatErrorResponse("Email is already in use"));
      }

      // Create the user
      const user = await UserModel.createUser(name, email, phone, password);

      // Generate tokens
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      res
        .status(201)
        .json(
          formatSuccessResponse(
            { user, accessToken, refreshToken },
            "User created successfully"
          )
        );
    } catch (error) {
      Sentry.captureException(error); // Capture error with Sentry
      res.status(500).json(formatErrorResponse(error.message));
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
    const { phone } = req.body;

    if (!phone) {
      return res
        .status(400)
        .json(formatErrorResponse("Phone number is required"));
    }

    try {
      const user = await UserModel.getUserByPhone(phone);
      if (!user) {
        return res.status(404).json(formatErrorResponse("User not found"));
      }

      const accessToken = generateAccessToken(user);
      const resetExpires = Date.now() + 3600000; // 1 hour

      await UserModel.setResetToken(user.id, accessToken, resetExpires);

      res
        .status(200)
        .json(
          formatSuccessResponse(
            { accessToken },
            "Password reset token sent successfully"
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
      return res.status(401).json(formatErrorResponse('Access token is required'));
    }

    try {
      const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
      const userId = decoded.userId;

      // Validate required fields
      if (!userId || (name === undefined && email === undefined && phone === undefined && locationId === undefined)) {
        return res.status(400).json(formatErrorResponse('No update information provided'));
      }

      // Update user and populate location
      const updatedUser = await UserModel.updateUser(userId, { name, email, phone, locationId });

      if (updatedUser) {
        res.status(200).json(formatSuccessResponse(updatedUser, 'User contact information updated successfully'));
      } else {
        res.status(404).json(formatErrorResponse('User not found'));
      }
    } catch (error) {
      Sentry.captureException(error);  // Capture error with Sentry
      res.status(500).json(formatErrorResponse(error.message));
    }
  },
};

module.exports = UserController;
