const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const serviceAccount = require('./config/path/to/serviceAccountKey.json');
const app = express();
const port = process.env.PORT || 3000;

const userController = require('./controllers/userController');
const notificationController = require('./controllers/notificationController');

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Middleware
app.use(cors());
app.use(express.json());

// Async handler wrapper
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// User routes
app.get('/users', asyncHandler(userController.getUsers));
app.post('/register', asyncHandler(userController.register));
app.post('/login', asyncHandler(userController.login));

// Notification routes
app.post('/notifications', asyncHandler(notificationController.sendNotification));
app.get('/notifications', asyncHandler(notificationController.getNotifications));
app.get('/users/:userId/notifications', asyncHandler(notificationController.getUserNotifications));
app.put('/notifications/:notificationId/read', asyncHandler(notificationController.markNotificationAsRead));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start the server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${port}`);
});