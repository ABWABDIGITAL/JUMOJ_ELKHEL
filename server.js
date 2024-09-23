const express = require("express");
const Sentry = require("@sentry/node");
const cors = require("cors"); // Import CORS middleware
const { sequelize } = require("./models/pannerModel");
const i18next = require("i18next");
const i18nextMiddleware = require("i18next-http-middleware");
const Backend = require("i18next-fs-backend");
const notificationRoutes = require("./routes/notificationRoutes");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
const pool = require("./config/db");
const createChatRoutes = require("./routes/chatRoutes");

Sentry.init({
  dsn: "https://5074dd1d7898588b0a66fcebdd9d3221@o4507893403418624.ingest.de.sentry.io/4507893417312336",
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV || "development",
});

const app = express();
const server = http.createServer(app);
const io = new Server(server);

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

// Enable CORS for all routes
app.use(cors()); // This will allow all origins. You can configure it further if needed.

// Middleware to parse JSON bodies
app.use(express.json());

// Set up Socket.IO connection
io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("chatMessage", (data) => {
    const { message, userId } = data;
    console.log(`User ${userId} sent message: ${message}`);
    io.emit("chatMessage", { message, userId });
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

// Your routes and other middleware
app.use("/api", require("./routes/userRoutes"));
app.use("/api/panners", require("./routes/pannerRoutes"));
app.use("/api/department", require("./routes/departmentRoutes"));
app.use("/api/advertisement", require("./routes/advertisementRoutes"));
app.use("/api/location", require("./routes/locationRoutes"));
app.use("/supplies", require("./routes/supplyRoutes"));
app.use("/trainings", require("./routes/trainingRoutes"));
app.use("/stores", require("./routes/storeRoutes"));
app.use("/promotions", require("./routes/promotionRoutes"));
app.use("/api/notifications", notificationRoutes);

app.use("/chat", createChatRoutes(pool, io));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, "public")));

app.get("/debug-sentry", function mainHandler(req, res) {
  throw new Error("My first Sentry error!");
});

// Custom error handler for any other errors
app.use((err, req, res, next) => {
  Sentry.captureException(err);
  res.status(500).json({
    success: false,
    message: req.t("error_message"),
  });
});

// Start the server
const PORT = process.env.PORT || 3090;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
