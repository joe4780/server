const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;


const userController = require('./controllers/userController');
const notificationController = require('./controllers/notificationController');


app.use(cors()); 
app.use(express.json());


const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};


app.get('/users', asyncHandler(userController.getUsers));
app.post('/register', asyncHandler(userController.register));
app.post('/login', asyncHandler(userController.login));


app.post('/notifications', asyncHandler(notificationController.sendNotification));
app.get('/notifications', asyncHandler(notificationController.getNotifications));
app.get('/users/:userId/notifications', asyncHandler(notificationController.getUserNotifications));
app.put('/notifications/:notificationId/read', asyncHandler(notificationController.markNotificationAsRead));

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
