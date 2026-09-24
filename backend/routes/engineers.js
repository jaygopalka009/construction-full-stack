const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Ensure db.engineers is an array
function getEngineersList() {
  if (!Array.isArray(db.engineers)) {
    db.engineers = [];
  }
  return db.engineers;
}

// GET /api/engineers - Fetch all site engineers from MongoDB 'engineers' collection
router.get('/', (req, res) => {
  const list = getEngineersList();
  res.json({
    success: true,
    count: list.length,
    engineers: list
  });
});

// GET /api/engineers/:id - Fetch single site engineer
router.get('/:id', (req, res) => {
  const list = getEngineersList();
  const engineer = list.find(e => String(e.id) === String(req.params.id) || (e.email || '').toLowerCase() === String(req.params.id).toLowerCase());
  if (!engineer) {
    return res.status(404).json({ success: false, message: 'Site Engineer not found' });
  }
  res.json({ success: true, engineer });
});

// POST /api/engineers - Add site engineer directly into MongoDB 'engineers' collection
router.post('/', (req, res) => {
  const { name, email, phone, assignedProjectId, password } = req.body;

  if (!name || !email) {
    return res.status(400).json({ success: false, message: 'Name and email are required for Site Engineer' });
  }

  const list = getEngineersList();
  const emailNorm = email.trim().toLowerCase();
  if (list.some(e => (e.email || '').trim().toLowerCase() === emailNorm)) {
    return res.status(400).json({ success: false, message: 'A Site Engineer with this email already exists' });
  }

  const newEngineer = {
    id: `eng_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    name: name.trim(),
    email: emailNorm,
    phone: phone ? String(phone).replace(/\D/g, '') : '',
    role: 'site_engineer',
    assignedProjectId: assignedProjectId || (db.projects && db.projects[0] ? db.projects[0].id : ''),
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString()
  };

  list.push(newEngineer);

  // Also ensure user exists in db.users for login capability
  if (Array.isArray(db.users)) {
    const existingUser = db.users.find(u => u.email.toLowerCase() === emailNorm);
    if (!existingUser) {
      db.users.push({
        id: newEngineer.id,
        name: newEngineer.name,
        email: newEngineer.email,
        phone: newEngineer.phone,
        password: password || '123456',
        role: 'site_engineer',
        projectId: newEngineer.assignedProjectId,
        avatar: newEngineer.avatar,
        createdAt: newEngineer.createdAt
      });
    }
  }

  if (typeof db.save === 'function') db.save();

  res.status(201).json({
    success: true,
    message: 'Site Engineer added successfully to MongoDB engineers collection!',
    engineer: newEngineer,
    engineers: list
  });
});

// PATCH /api/engineers/:id - Update engineer
router.patch('/:id', (req, res) => {
  const list = getEngineersList();
  const engineer = list.find(e => String(e.id) === String(req.params.id) || (e.email || '').toLowerCase() === String(req.params.id).toLowerCase());
  if (!engineer) {
    return res.status(404).json({ success: false, message: 'Site Engineer not found' });
  }

  const { name, phone, assignedProjectId } = req.body;
  if (name !== undefined) engineer.name = name.trim();
  if (phone !== undefined) engineer.phone = String(phone).replace(/\D/g, '');
  if (assignedProjectId !== undefined) engineer.assignedProjectId = assignedProjectId;

  // Mirror update in db.users
  if (Array.isArray(db.users)) {
    const user = db.users.find(u => u.email.toLowerCase() === engineer.email.toLowerCase());
    if (user) {
      if (name !== undefined) user.name = engineer.name;
      if (phone !== undefined) user.phone = engineer.phone;
      if (assignedProjectId !== undefined) user.projectId = engineer.assignedProjectId;
    }
  }

  if (typeof db.save === 'function') db.save();

  res.json({
    success: true,
    message: 'Site Engineer updated successfully',
    engineer,
    engineers: list
  });
});

// DELETE /api/engineers/:id - Delete engineer
router.delete('/:id', (req, res) => {
  const list = getEngineersList();
  const idx = list.findIndex(e => String(e.id) === String(req.params.id));
  if (idx === -1) {
    return res.status(404).json({ success: false, message: 'Site Engineer not found' });
  }

  const removed = list.splice(idx, 1)[0];
  if (Array.isArray(db.users)) {
    const uIdx = db.users.findIndex(u => u.email.toLowerCase() === (removed.email || '').toLowerCase());
    if (uIdx !== -1) db.users.splice(uIdx, 1);
  }

  if (typeof db.save === 'function') db.save();

  res.json({
    success: true,
    message: 'Site Engineer removed successfully from MongoDB engineers collection',
    engineer: removed,
    engineers: list
  });
});

module.exports = router;
