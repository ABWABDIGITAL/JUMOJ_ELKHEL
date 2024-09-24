const pool = require('./config/db');
const io = require('socket.io')(server);

io.on('connection', (socket) => {
  socket.on('chatMessage', async (messageData) => {
    console.log('Message received:', messageData);

    // Emit the message to all clients in the room
    io.emit('chatMessage', messageData);

    // Save message to the database
    try {
      const timestamp = new Date();

      // Insert the message into the messages table
      const result = await pool.query(
        `INSERT INTO messages (room_id, sender_id, receiver_id, text, created_at, last_message_id, last_message_date) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [
          messageData.roomId,        // Room ID
          messageData.senderId,      // Sender ID
          messageData.receiverId,    // Receiver ID
          messageData.text,          // Message text
          timestamp,                 // Created at timestamp
          messageData.lastMessageId, // Last message ID (if applicable)
          messageData.lastMessageDate // Last message date (if applicable)
        ]
      );

      const insertedMessage = result.rows[0];
      console.log('Message inserted:', insertedMessage);

      // Send the inserted message back to the client
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
