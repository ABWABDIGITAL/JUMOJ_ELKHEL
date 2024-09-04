const jwt = require("jsonwebtoken");
require("dotenv").config();
const { formatErrorResponse } = require("../utils/responseFormatter");

const authenticateToken = (req, res, next) => {
  // Get the token from the authorization header
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) {
    // If there's no token, return a 401 Unauthorized response
    return res.status(401).json(formatErrorResponse("Access token is missing"));
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      // If token verification fails, return a 403 Forbidden response
      return res
        .status(403)
        .json(formatErrorResponse("Invalid or expired token"));
    }

    // If token is valid, attach the user information to the request object
    req.user = user;
    next(); // Pass control to the next middleware/handler
  });
};

module.exports = authenticateToken;
