const express = require("express");
const Sentry = require("@sentry/node");
const { nodeProfilingIntegration } = require("@sentry/profiling-node");
require("./instrument");
// Initialize Sentry
Sentry.init({
  dsn: "https://5074dd1d7898588b0a66fcebdd9d3221@o4507893403418624.ingest.de.sentry.io/4507893417312336", // Replace with your actual Sentry DSN
  tracesSampleRate: 1.0, // Adjust this value as needed for performance monitoring
  environment: process.env.NODE_ENV || "development",
});
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());
// Your routes and other middleware
app.use("/api", require("./routes/userRoutes"));

// Custom error handler for any other errors
app.use((err, req, res, next) => {
  // Capture the exception with Sentry
  Sentry.captureException(err);

  // Send a response to the client
  res.status(500).json({
    success: false,
    message: "An error occurred, and it has been reported.",
  });
});

const PORT = process.env.PORT || 3030;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
