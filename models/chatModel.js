const pool = require('./config/db');
const io = require('socket.io')(server);  // Make sure 'server' is defined correctly

io.on('connection', (socket) => {
  socket.on('chatMessage', async (messageData) => {
    console.log('Message received:', messageData);

    // Emit the message to other users
    io.emit('chatMessage', messageData);

    // Save message to the database
    try {
      const timestamp = new Date();

      // Insert the message into the messages table
      const result = await pool.query(
        'INSERT INTO messages (sender_id, receiver_id, text, timestamp, last_message_id, last_message_date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
        [
          messageData.senderId,       // Sender ID
          messageData.receiverId,     // Receiver ID
          messageData.text,           // Message text
          timestamp,                  // Timestamp
          messageData.lastMessageId,  // Last message ID (if applicable)
          messageData.lastMessageDate // Last message date (if applicable)
        ]
      );

      const messageId = result.rows[0].id;  // Get the ID of the newly inserted message
      console.log('Message inserted with ID:', messageId);
    } catch (error) {
      console.error('Error inserting message:', error);
    }
  });
});
