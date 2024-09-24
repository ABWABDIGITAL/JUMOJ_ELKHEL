const express = require("express");
const router = express.Router();
const {
  formatSuccessResponse,
  formatErrorResponse,
} = require("../utils/responseFormatter");

// Object to track connected users
const connectedUsers = {}; 

const createChatRoutes = (pool, io) => {
  // Socket.IO connection logic
  io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId; // Example of how to get userId during handshake
    connectedUsers[userId] = socket.id;

    socket.on("disconnect", () => {
      delete connectedUsers[userId];
    });
  });

  // Post a chat message
  router.post("/", async (req, res) => {
    const { sender_id, receiver_id, text, room_id } = req.body;

    if (!sender_id || !receiver_id || !text) {
      return res
        .status(400)
        .json(formatErrorResponse("Sender, receiver, and text are required"));
    }

    try {
      // Check if sender and receiver exist
      const senderResult = await pool.query(
        "SELECT id FROM users WHERE id = $1",
        [sender_id]
      );
      const receiverResult = await pool.query(
        "SELECT id FROM users WHERE id = $1",
        [receiver_id]
      );

      if (senderResult.rowCount === 0 || receiverResult.rowCount === 0) {
        return res
          .status(400)
          .json(formatErrorResponse("Sender or receiver does not exist"));
      }

      // Save the message to the database
      const result = await pool.query(
        `INSERT INTO messages (sender_id, receiver_id, text, room_id, created_at)
         VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
        [sender_id, receiver_id, text, room_id]
      );
      const savedMessage = result.rows[0];

      // Emit the message to connected clients via Socket.IO
      io.to(room_id).emit("chatMessage", savedMessage);

      res
        .status(200)
        .json(formatSuccessResponse(savedMessage, "Message sent successfully"));
    } catch (error) {
      console.error("Error in POST /chat:", error);
      res
        .status(500)
        .json(formatErrorResponse("Failed to send message", error.message));
    }
  });

  // Get all chat messages for a room
  router.get("/messages/:room_id", async (req, res) => {
    const { room_id } = req.params;

    try {
      const result = await pool.query(
        `SELECT m.*, 
              u_sender.name as sender_name, 
              u_receiver.name as receiver_name
       FROM messages m
       JOIN users u_sender ON m.sender_id = u_sender.id
       JOIN users u_receiver ON m.receiver_id = u_receiver.id
       WHERE room_id = $1
       ORDER BY m.created_at ASC`,
        [room_id]
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

  // Create a chat room
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

  // Join a chat room
  router.post("/rooms/:room_id/join", async (req, res) => {
    const { room_id } = req.params;
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: "User ID is required to join the room",
      });
    }

    const socketId = connectedUsers[user_id];

    if (!socketId) {
      return res.status(400).json({
        success: false,
        message: `User ${user_id} is not connected to a socket`,
      });
    }

    try {
      const roomCheckResult = await pool.query(
        "SELECT id FROM chat_rooms WHERE id = $1",
        [room_id]
      );

      if (roomCheckResult.rowCount === 0) {
        return res.status(404).json({
          success: false,
          message: `Room ${room_id} does not exist`,
        });
      }

      const socket = io.sockets.sockets.get(socketId);

      if (!socket) {
        return res.status(400).json({
          success: false,
          message: `Socket not found for user ${user_id}`,
        });
      }

      socket.join(room_id);

      io.to(room_id).emit("userJoined", {
        userId: user_id,
        message: `User ${user_id} has joined the room`,
      });

      return res.status(200).json({
        success: true,
        message: `User ${user_id} joined room ${room_id}`,
      });
    } catch (error) {
      console.error("Error in POST /rooms/:room_id/join:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to join room",
        error: error.message,
      });
    }
  });

  // Leave a chat room
  router.post("/rooms/:room_id/leave", (req, res) => {
    const { room_id } = req.params;
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: "User ID is required to leave the room",
      });
    }

    try {
      const socketId = connectedUsers[user_id];
      if (socketId) {
        io.sockets.sockets.get(socketId).leave(room_id);
      }

      res.status(200).json({
        success: true,
        message: `User ${user_id} left room ${room_id}`,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to leave room",
        error: error.message,
      });
    }
  });

  // Mark a message as read
  router.post("/messages/:message_id/read", async (req, res) => {
    const { message_id } = req.params;

    try {
      const result = await pool.query(
        "UPDATE messages SET is_read = TRUE WHERE id = $1 RETURNING *",
        [message_id]
      );

      if (result.rowCount === 0) {
        return res.status(404).json(formatErrorResponse("Message not found"));
      }

      const updatedMessage = result.rows[0];
      res
        .status(200)
        .json(formatSuccessResponse(updatedMessage, "Message marked as read"));
    } catch (error) {
      console.error("Error in POST /messages/:message_id/read:", error);
      res
        .status(500)
        .json(
          formatErrorResponse("An error occurred, and it has been reported.")
        );
    }
  });

  // Retrieve unread messages for a user
  router.get("/messages/unread/:user_id", async (req, res) => {
    const { user_id } = req.params;

    try {
      const result = await pool.query(
        `SELECT m.*, u_sender.name AS sender_name
         FROM messages m
         JOIN users u_sender ON m.sender_id = u_sender.id
         WHERE m.receiver_id = $1 AND m.is_read = FALSE
         ORDER BY m.created_at ASC`,
        [user_id]
      );

      res.status(200).json(formatSuccessResponse(result.rows, "Unread messages retrieved successfully"));
    } catch (error) {
      console.error("Error in GET /messages/unread:", error);
      res.status(500).json(formatErrorResponse("An error occurred, and it has been reported."));
    }
  });

  return router;
};

module.exports = createChatRoutes;
