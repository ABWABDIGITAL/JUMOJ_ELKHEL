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
    const { phone, key, password } = req.body;
  
    // Validate input
    if (!phone || !key || !password) {
      return res
        .status(400)
        .json(formatErrorResponse("Phone number, key (country code), and password are required"));
    }
  
    try {
      // Fetch the user using both phone and key
      const user = await UserModel.getUserByPhoneAndKey(phone, key);
  
      // Check if the user exists and validate the password
      if (user && user.password && (await bcrypt.compare(password, user.password))) {
        // Generate tokens if login is successful
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);
        
        return res
          .status(200)
          .json(
            formatSuccessResponse(
              { accessToken, refreshToken },
              "Login successful"
            )
          );
      } else {
        return res
          .status(401)
          .json(formatErrorResponse("Invalid phone number, key, or password"));
      }
    } catch (error) {
      // Capture any errors that occur during the process
      Sentry.captureException(error); // Capture error with Sentry
      return res.status(500).json(formatErrorResponse(error.message));
    }
  }
,  

resetPassword: async (req, res) => {
  const { password, confirmPassword, userId } = req.body;

  // Validate password fields
  if (!password || !confirmPassword) {
      return res.status(400).json(formatErrorResponse("Password and confirm password are required"));
  }

  // Check if passwords match
  if (password !== confirmPassword) {
      return res.status(400).json(formatErrorResponse("Passwords do not match"));
  }

  try {
      // Check if userId is provided (this should come from a verified OTP)
      if (!userId) {
          return res.status(400).json(formatErrorResponse("User ID is required to reset the password"));
      }

      // Fetch the user by ID
      const user = await UserModel.getUserById(userId);
      if (!user) {
          return res.status(404).json(formatErrorResponse("User not found"));
      }

      // Reset the password (ensure it's hashed)
      await UserModel.resetPassword(user.id, password);

      return res.status(200).json(formatSuccessResponse(null, "Password reset successfully"));
  } catch (error) {
      console.error("Error resetting password:", error.message);
      Sentry.captureException(error); // Capture error with Sentry
      return res.status(500).json(formatErrorResponse("An error occurred while resetting the password"));
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
  verifyForgotPasswordOtp: async (req, res) => {
    const { phone, key, otp } = req.body;

    // Validate input fields
    if (!phone || !key || !otp) {
        return res.status(400).json(formatErrorResponse("Phone, country code, and OTP are required"));
    }

    try {
        // Fetch the user by phone number and country key
        const user = await UserModel.getUserByPhoneAndKey(phone, key);

        if (!user) {
            return res.status(404).json(formatErrorResponse("User not found"));
        }

        // Check if OTP has expired
        const nowInSeconds = Math.floor(Date.now() / 1000);
        if (nowInSeconds > user.otpExpiresInSeconds) {
            return res.status(400).json(formatErrorResponse("OTP has expired"));
        }

        // Check if the OTP matches
        if (otp !== user.otp) {
            return res.status(400).json(formatErrorResponse("Invalid OTP"));
        }

        // OTP is valid, allow the user to reset the password (pass user ID to the next step)
        return res.status(200).json(
            formatSuccessResponse({ userId: user.id }, "OTP verified successfully. You can now reset your password.")
        );
    } catch (error) {
        console.error("Error verifying OTP:", error.message);
        Sentry.captureException(error);
        return res.status(500).json(formatErrorResponse(error.message));
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
      return res.status(400).json(formatErrorResponse("User ID is required"));
    }

    // Get the uploaded image URL
    let imageUrl;
    if (req.file) {
      imageUrl = `http://91.108.102.81:9098/${req.file.path.replace(/\\/g, '/')}`; // Convert Windows-style backslashes to forward slashes
    }

    // Call updateUser with the image URL
    const updatedUser = await UserModel.updateUser(userId, {
      name,
      email,
      phone,
      identity,
      birthday,
      locationId,
      password,
      imageUrl,
    });

    if (updatedUser) {
      res.status(200).json(formatSuccessResponse(updatedUser, "User updated successfully"));
    } else {
      res.status(404).json(formatErrorResponse("User not found"));
    }
  } catch (error) {
    res.status(500).json(formatErrorResponse(error.message));
  }
},
 logoutUser : async (req, res) => {
  const accessToken = req.headers.authorization?.split(" ")[1];
  if (!accessToken) {
      return res.status(401).json(formatErrorResponse("Access token is required"));
  }

  try {
      // Invalidate the access token
      await UserModel.invalidateAccessToken(accessToken);

      return res.status(200).json(formatSuccessResponse(null, "Logged out successfully"));
  } catch (error) {
      console.error("Error logging out:", error.message);
      return res.status(500).json(formatErrorResponse("An internal error occurred"));
  }},

};

module.exports = UserController;
