const pool = require('./config/db');
const io = require('socket.io')(server);

io.on('connection', (socket) => {
  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);
    console.log(`User joined room: ${roomId}`);
  });

  socket.on('chatMessage', async (messageData) => {
    console.log('Message received:', messageData);

    try {
      const timestamp = new Date();
      
      // Fetch the last message in the room (if any)
      const lastMessageResult = await pool.query(
        'SELECT id, created_at FROM messages WHERE room_id = $1 ORDER BY created_at DESC LIMIT 1',
        [messageData.roomId]
      );
      
      let lastMessage = null;
      if (lastMessageResult.rows.length > 0) {
        lastMessage = lastMessageResult.rows[0];
      }

      // Insert the new message into the messages table
      const result = await pool.query(
        `INSERT INTO messages (room_id, sender_id, receiver_id, text, created_at, last_message_id, last_message_date) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [
          messageData.roomId,        // Room ID
          messageData.senderId,      // Sender ID
          messageData.receiverId,    // Receiver ID
          messageData.text,          // Message text
          timestamp,                 // Current timestamp
          lastMessage ? lastMessage.id : null, // Last message ID (if applicable)
          lastMessage ? lastMessage.created_at : null // Last message date (if applicable)
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
});
