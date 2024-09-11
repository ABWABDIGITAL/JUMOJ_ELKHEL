const express = require("express");
const router = express.Router();
const {
  formatSuccessResponse,
  formatErrorResponse,
} = require("../utils/responseFormatter");
// REST API to post a chat message (For Postman testing)
const createChatRoutes = (pool, io) => {
  // REST API to post a chat message (For Postman testing)
  router.post("/", async (req, res) => {
    const { sender, text } = req.body;

    if (!sender || !text) {
      return res
        .status(400)
        .json(formatErrorResponse("Sender and text are required"));
    }

    try {
      // Save the message to the database
      await pool.query("INSERT INTO messages (sender, text) VALUES ($1, $2)", [
        sender,
        text,
      ]);

      // Emit the message to connected clients via Socket.IO
      const messageData = { sender, text };
      io.emit("chatMessage", messageData);

      res
        .status(200)
        .json(formatSuccessResponse(messageData, "Message sent successfully"));
    } catch (error) {
      console.error("Error in POST /chat:", error);
      res
        .status(500)
        .json(formatErrorResponse("Failed to send message", error.message));
    }
  });

  // REST API to get all chat messages
  router.get("/messages", async (req, res) => {
    try {
      const result = await pool.query(
        "SELECT * FROM messages ORDER BY created_at ASC"
      );
      res
        .status(200)
        .json(
          formatSuccessResponse(result.rows, "Messages retrieved successfully")
        );
    } catch (error) {
      console.error("Error in GET /chat/messages:", error);
      res
        .status(500)
        .json(
          formatErrorResponse("Failed to retrieve messages", error.message)
        );
    }
  });
  // Route to create a chat room
  router.post("/rooms", async (req, res) => {
    const { roomName } = req.body;
    if (!roomName) {
      return res
        .status(400)
        .json({ success: false, message: "Room name is required" });
    }

    try {
      const result = await pool.query(
        "INSERT INTO chat_rooms (name) VALUES ($1) RETURNING *",
        [roomName]
      );
      const newRoom = result.rows[0];
      res
        .status(201)
        .json({ success: true, message: "Room created", room: newRoom });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to create room",
        error: error.message,
      });
    }
  });

  return router;
};

module.exports = createChatRoutes;
