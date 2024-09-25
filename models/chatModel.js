const pool = require('./config/db');
const io = require('socket.io')(server);

// Object to track connected users
const connectedUsers = {};

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // When a user connects, we expect to receive their user ID
  socket.on('registerUser', (userId) => {
    if (!userId) {
      console.error('User ID is required.');
      return socket.disconnect();
    }
    
    connectedUsers[userId] = socket.id; // Store the user ID with the socket ID
    console.log(`User registered: ${userId} with socket ID: ${socket.id}`);
  });

  socket.on('joinRoom', (roomId, userId) => {
    if (!userId || !connectedUsers[userId]) {
      console.error(`User ${userId} is not connected to a socket. Please connect before joining a room.`);
      return socket.emit('joinRoomError', {
        success: false,
        message: `User ${userId} is not connected. Please connect before joining a room.`
      });
    }

    socket.join(roomId);
    console.log(`User ${userId} joined room: ${roomId}`);
    socket.emit('joinRoomSuccess', {
      success: true,
      message: `You have joined room: ${roomId}`
    });
  });

  socket.on('chatMessage', async (messageData) => {
    console.log('Message received:', messageData);

    // Validate messageData structure
    if (!messageData.roomId || !messageData.senderId || !messageData.receiverId || !messageData.text) {
      return socket.emit('messageError', {
        success: false,
        message: 'Invalid message data. Room ID, sender ID, receiver ID, and message text are required.'
      });
    }

    try {
      const timestamp = new Date();

      // Fetch the last message in the room (if any)
      const lastMessageResult = await pool.query(
        'SELECT id, created_at FROM messages WHERE room_id = $1 ORDER BY created_at DESC LIMIT 1',
        [messageData.roomId]
      );

      let lastMessage = lastMessageResult.rows.length > 0 ? lastMessageResult.rows[0] : null;

      // Insert the new message into the messages table
      const result = await pool.query(
        `INSERT INTO messages (room_id, sender_id, receiver_id, text, created_at, last_message_id, last_message_date) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [
          messageData.roomId,
          messageData.senderId,
          messageData.receiverId,
          messageData.text,
          timestamp,
          lastMessage ? lastMessage.id : null,
          lastMessage ? lastMessage.created_at : null
        ]
      );

      const insertedMessage = result.rows[0];
      console.log('Message inserted:', insertedMessage);

      // Emit the new message to all clients in the room
      io.to(messageData.roomId).emit('chatMessage', insertedMessage);

      // Send confirmation to the sender
      socket.emit('messageSaved', {
        success: true,
        message: 'Message sent successfully',
        data: insertedMessage
      });

    } catch (error) {
      console.error('Error inserting message:', error);
      socket.emit('messageError', {
        success: false,
        message: 'Failed to send message',
        data: error.message
      });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    for (const userId in connectedUsers) {
      if (connectedUsers[userId] === socket.id) {
        console.log(`User ${userId} disconnected.`);
        delete connectedUsers[userId];
        break; // Exit the loop after finding the user
      }
    }
  });
});
