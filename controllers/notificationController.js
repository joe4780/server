const db = require('../db');
const admin = require('firebase-admin');

exports.getUserNotifications = async (req, res) => {
  const userId = req.params.userId;
  const query = 'SELECT * FROM notifications WHERE user_id = ?';

  try {
    const [results] = await db.query(query, [userId]);
    res.json(results);
  } catch (error) {
    console.error('Error fetching user notifications:', error);
    res.status(500).json({ error: 'Failed to fetch user notifications' });
  }
};

exports.markNotificationAsRead = async (req, res) => {
  const notificationId = req.params.notificationId;
  const query = 'UPDATE notifications SET is_read = 1 WHERE id = ?';

  try {
    await db.query(query, [notificationId]);
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
};

exports.getNotifications = async (req, res) => {
  const query = 'SELECT * FROM notifications';

  try {
    const [results] = await db.query(query);
    res.json(results);
  } catch (error) {
    console.error('Error fetching all notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

exports.sendNotification = async (req, res) => {
  const { message, userIds, expiry_date } = req.body;

  if (!message || !userIds || !userIds.length) {
    return res.status(400).json({ error: 'Invalid data' });
  }

  const expiryDate = expiry_date && expiry_date.trim() !== '' ? expiry_date : null;
  const now = new Date();

  try {
    // Insert notifications into the database
    const query = 'INSERT INTO notifications (user_id, message, expiry_date, is_read, sent_at) VALUES ?';
    const values = userIds.map(userId => [userId, message, expiryDate, 0, now]);

    await db.query(query, [values]);

    // Fetch FCM tokens for the targeted users and send notifications
    const failedNotifications = [];
    for (const userId of userIds) {
      const fcmToken = await getUserFcmToken(userId);

      if (fcmToken) {
        try {
          await admin.messaging().send({
            token: fcmToken,
            notification: {
              title: 'New Notification',
              body: message,
            },
            data: {
              click_action: 'FLUTTER_NOTIFICATION_CLICK',
              message: message,
            },
          });
          console.log(`Successfully sent FCM notification to user ${userId}`);
        } catch (error) {
          console.error(`Error sending FCM notification to user ${userId}:`, error);
          if (error.code === 'messaging/registration-token-not-registered') {
            await removeInvalidFcmToken(userId); // Remove invalid FCM token
          }
          failedNotifications.push({ userId, error: error.message });
        }
      } else {
        failedNotifications.push({ userId, error: 'FCM token not found' });
      }
    }

    if (failedNotifications.length > 0) {
      res.status(207).json({
        success: true,
        message: 'Notifications sent with some failures',
        failedNotifications,
      });
    } else {
      res.status(201).json({ success: true, message: 'All notifications sent successfully' });
    }
  } catch (error) {
    console.error('Error inserting notifications:', error);
    res.status(500).json({ error: 'Failed to insert notifications' });
  }
};

async function getUserFcmToken(userId) {
  const query = 'SELECT fcm_token FROM users WHERE id = ?';
  try {
    const [rows] = await db.query(query, [userId]);
    if (rows.length > 0) {
      return rows[0].fcm_token;
    }
    return null;
  } catch (error) {
    console.error('Error fetching FCM token:', error);
    return null;
  }
}

async function removeInvalidFcmToken(userId) {
  const query = 'UPDATE users SET fcm_token = NULL WHERE id = ?';
  try {
    await db.query(query, [userId]);
    console.log(`Removed invalid FCM token for user ${userId}`);
  } catch (error) {
    console.error('Error removing FCM token:', error);
  }
}
