const express = require("express");
const Sentry = require("@sentry/node");
const { sequelize } = require('./models/pannerModel');
const i18next = require("i18next");
const i18nextMiddleware = require("i18next-http-middleware");
const Backend = require("i18next-fs-backend");
const notificationRoutes = require('./routes/notificationRoutes');
const path = require('path');
const http = require('http'); // Import http module
const { Server } = require('socket.io'); // Import Socket.IO
const pool = require('./config/db'); // Database connection pool
const createChatRoutes = require('./routes/chatRoutes'); // Import the enhanced chat routes

// Initialize Sentry
Sentry.init({
  dsn: "https://5074dd1d7898588b0a66fcebdd9d3221@o4507893403418624.ingest.de.sentry.io/4507893417312336",
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV || "development",
});

const app = express();
const server = http.createServer(app); // Create HTTP server for both Express and Socket.IO
const io = new Server(server); // Initialize Socket.IO on top of the server

// Initialize i18next
i18next
  .use(Backend)
  .use(i18nextMiddleware.LanguageDetector)
  .init({
    fallbackLng: "en",
    preload: ["en", "ar"],
    backend: {
      loadPath: "./locales/{{lng}}/translation.json",
    },
  });

// Middleware for i18next
app.use(i18nextMiddleware.handle(i18next));

// Middleware to parse JSON bodies
app.use(express.json());

// Set up Socket.IO connection
io.on('connection', (socket) => {
  console.log('A user connected');

  // Listen for structured chat message with message and userId
  socket.on('chatMessage', (data) => {
    const { message, userId } = data;
    console.log(`User ${userId} sent message: ${message}`);
    
    // Broadcast the structured message to all connected clients
    io.emit('chatMessage', { message, userId });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

// Your routes and other middleware
app.use("/api", require("./routes/userRoutes"));
app.use('/api/panners', require("./routes/pannerRoutes"));
app.use('/api/department', require("./routes/departmentRoutes"));
app.use('/api/advertisement', require("./routes/advertisementRoutes"));
app.use('/api/location', require("./routes/locationRoutes"));
app.use('/supplies', require("./routes/supplyRoutes"));
app.use('/trainings', require("./routes/trainingRoutes"));
app.use('/stores', require("./routes/storeRoutes"));
app.use('/stores', require("./routes/storeRoutes"));
app.use('/promotions', require("./routes/promotionRoutes"));
app.use('/api/notifications', notificationRoutes);


app.use('/chat', createChatRoutes(pool, io)); // Inject pool and io into chat routes

// Middleware to serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

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

// Start the server
const PORT = process.env.PORT || 3990;
server.listen(PORT, () => { // Use the server variable instead of app.listen
  console.log(`Server is running on port ${PORT}`);
});
