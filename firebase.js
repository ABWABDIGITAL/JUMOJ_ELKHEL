const admin = require('firebase-admin');
const serviceAccount = require('./path-to-your-service-account-key.json');

// Initialize Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://your-project-id.firebaseio.com', // Replace with your database URL
});

const db = admin.firestore(); // Use Firestore or `admin.database()` for Realtime Database
module.exports = db;
