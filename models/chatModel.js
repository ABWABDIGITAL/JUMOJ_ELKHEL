const pool = require('./config/db');

io.on('connection', (socket) => {
  socket.on('chatMessage', async (messageData) => {
    console.log('Message received:', messageData);
    io.emit('chatMessage', messageData);

    // Save message to the database
    await pool.query('INSERT INTO messages (sender, text) VALUES ($1, $2)', [messageData.sender, messageData.text]);
  });
});
