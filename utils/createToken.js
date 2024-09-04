const jwt = require("jsonwebtoken");

require("dotenv").config();
// Function to generate an access token

// Function to generate an access token for users
const generateAccessToken = (user) => {
  if (!user || !user.id) {
    throw new Error('User or user._id is not defined');
  }

  const payload = {
    userId: user.id.toString(),  // Convert _id to string
    username: user.username,
    role: "user",
  };
  //console.log("Access Token Payload:", payload); // Debugging line
  return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "15d",
  });
};

const generateRefreshToken = (user) => {
  if (!user || !user.id) {
    throw new Error('User or user._id is not defined');
  }

  const payload = {
    userId: user.id.toString(),
    username: user.username,
    role: "user",
  };
 // console.log("Refresh Token Payload:", payload); // Debugging line
  return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "15d",
  });
};

const generateResetToken = (user) => {
  if (!user || !user.id) {
    throw new Error('User or user._id is not defined');
  }

  const resetToken = jwt.sign({ userId: user.id.toString() }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
  user.resetPasswordToken = resetToken;
  user.resetPasswordExpires = Date.now() + 3600000; // 1 hour from now
  return user.save().then(() => resetToken); // Return the token after saving
};

const createToken = (userId) => {
  if (!userId) {
    throw new Error('userId is not defined');
  }

  return jwt.sign({ userID: userId }, process.env.JWT_SECRET_KEY, {
    expiresIn: "24h",
  });
};



module.exports = {
  generateAccessToken,
  generateRefreshToken,
 
  createToken,
  generateResetToken,
};
