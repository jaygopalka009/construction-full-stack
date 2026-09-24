const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Ensure db.notifications is an array
function getNotificationsList() {
  if (!Array.isArray(db.notifications)) {
    db.notifications = [];
  }
  return db.notifications;
}

// GET /api/notifications - Fetch notifications with optional filters (role, email, unreadOnly)
router.get('/', (req, res) => {
  const { role, email, unreadOnly } = req.query;
  let items = getNotificationsList();

  if (role) {
    const roleLower = role.toLowerCase();
    items = items.filter(n => {
      const target = (n.targetRole || 'all').toLowerCase();
      return target === 'all' || target === roleLower;
    });
  }

  if (email) {
    const emailNorm = email.trim().toLowerCase();
    items = items.filter(n => {
      if (!n.targetEmail) return true; // generic for that role
      return n.targetEmail.toLowerCase() === emailNorm;
    });
  }

  if (unreadOnly === 'true' || unreadOnly === true) {
    items = items.filter(n => !n.read);
  }

  const unreadCount = items.filter(n => !n.read).length;

  res.json({
    success: true,
    count: items.length,
    unreadCount,
    notifications: items.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
  });
});

// POST /api/notifications - Create new notification in MongoDB 'notifications' collection
router.post('/', (req, res) => {
  const { title, message, type, link, targetRole, targetEmail } = req.body;
  if (!title || !message) {
    return res.status(400).json({ success: false, message: 'Title and message are required' });
  }

  const notif = db.addNotification({
    title,
    message,
    type: type || 'info',
    link: link || '',
    targetRole: targetRole || 'all',
    targetEmail: targetEmail || ''
  });

  res.status(201).json({
    success: true,
    message: 'Notification created successfully',
    notification: notif
  });
});

// PATCH /api/notifications/:id/read - Mark single notification as read
router.patch('/:id/read', (req, res) => {
  const list = getNotificationsList();
  const notif = list.find(n => String(n.id) === String(req.params.id));
  if (!notif) {
    return res.status(404).json({ success: false, message: 'Notification not found' });
  }

  notif.read = true;
  if (typeof db.save === 'function') db.save();

  res.json({
    success: true,
    message: 'Notification marked as read',
    notification: notif
  });
});

// PATCH /api/notifications/mark-all-read - Mark all matching notifications as read
router.patch('/mark-all-read', (req, res) => {
  const { role, email } = req.body;
  const list = getNotificationsList();

  list.forEach(n => {
    let match = true;
    if (role) {
      const target = (n.targetRole || 'all').toLowerCase();
      if (target !== 'all' && target !== role.toLowerCase()) match = false;
    }
    if (email && n.targetEmail) {
      if (n.targetEmail.toLowerCase() !== email.toLowerCase()) match = false;
    }
    if (match) {
      n.read = true;
    }
  });

  if (typeof db.save === 'function') db.save();

  res.json({
    success: true,
    message: 'All notifications marked as read',
    unreadCount: list.filter(n => !n.read).length
  });
});

// DELETE /api/notifications/:id - Delete notification
router.delete('/:id', (req, res) => {
  const list = getNotificationsList();
  const idx = list.findIndex(n => String(n.id) === String(req.params.id));
  if (idx === -1) {
    return res.status(404).json({ success: false, message: 'Notification not found' });
  }

  const removed = list.splice(idx, 1)[0];
  if (typeof db.save === 'function') db.save();

  res.json({
    success: true,
    message: 'Notification deleted successfully',
    notification: removed
  });
});

module.exports = router;
