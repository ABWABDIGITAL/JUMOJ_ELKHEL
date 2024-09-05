const express = require("express");
const Sentry = require("@sentry/node");
const { sequelize } = require('./models/pannerModel');
const i18next = require("i18next");
const i18nextMiddleware = require("i18next-http-middleware");
const Backend = require("i18next-fs-backend");
const path = require('path');

// Initialize Sentry
Sentry.init({
  dsn: "https://5074dd1d7898588b0a66fcebdd9d3221@o4507893403418624.ingest.de.sentry.io/4507893417312336", // Replace with your actual Sentry DSN
  tracesSampleRate: 1.0, // Adjust this value as needed for performance monitoring
  environment: process.env.NODE_ENV || "development",
});

const app = express();

// Initialize i18next
i18next
  .use(Backend)
  .use(i18nextMiddleware.LanguageDetector)
  .init({
    fallbackLng: "en", // Fallback language
    preload: ["en", "ar"], // Preload English and Arabic
    backend: {
      loadPath: "./locales/{{lng}}/translation.json", // Path to your translation files
    },
  });

// Middleware for i18next
app.use(i18nextMiddleware.handle(i18next));

// Middleware to parse JSON bodies
app.use(express.json());

// Your routes and other middleware
app.use("/api", require("./routes/userRoutes"));
app.use('/api/panners', require("./routes/pannerRoutes"));
app.use('/api/department', require("./routes/departmentRoutes"));
app.use('/api/advertisement', require("./routes/advertisementRoutes"));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Example route to test Sentry error capture
app.get("/debug-sentry", function mainHandler(req, res) {
  throw new Error("My first Sentry error!");
});


// Custom error handler for any other errors
app.use((err, req, res, next) => {
  // Capture the exception with Sentry
  Sentry.captureException(err);

  // Send a response to the client
  res.status(500).json({
    success: false,
    message: req.t("error_message"), // Localized error message
  });
});

const PORT = process.env.PORT || 3030;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
