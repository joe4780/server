const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;

// Import controllers
const userController = require('./controllers/userController');
const notificationController = require('./controllers/notificationController');

// Middleware
app.use(cors()); // Add this line to enable CORS for all routes
app.use(express.json());

// Helper function to wrap route handlers
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// Routes
app.get('/users', asyncHandler(userController.getUsers));
app.post('/notifications', asyncHandler(notificationController.sendNotification));
app.get('/notifications', asyncHandler(notificationController.getNotifications));
app.get('/users/:userId/notifications', asyncHandler(notificationController.getUserNotifications));

// Add these routes for user registration and login
app.post('/register', asyncHandler(userController.register));
app.post('/login', asyncHandler(userController.login));

app.put('/notifications/:notificationId/read', notificationController.markNotificationAsRead);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});