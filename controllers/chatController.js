const ChatModel = require('../models/chatModel');

const ChatController = {
  // Create a chat room
  createRoom: async (req, res) => {
    const { roomName } = req.body;

    try {
      const chatRoom = await ChatModel.createChatRoom(roomName);
      res.status(201).json({ success: true, message: 'Chat room created', data: chatRoom });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error creating chat room', error: error.message });
    }
  },

  // Send a message
  sendMessage: async (req, res) => {
    const { roomId } = req.params;
    const { text, senderId } = req.body;

    try {
      const message = await ChatModel.sendMessage(roomId, { text, senderId });
      res.status(200).json({ success: true, message: 'Message sent', data: message });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error sending message', error: error.message });
    }
  },

  // Get all messages from a room
  getMessages: async (req, res) => {
    const { roomId } = req.params;

    try {
      const messages = await ChatModel.getMessages(roomId);
      res.status(200).json({ success: true, data: messages });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error fetching messages', error: error.message });
    }
  },
};

module.exports = ChatController;
