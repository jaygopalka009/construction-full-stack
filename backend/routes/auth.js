const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../database/db');

const JWT_SECRET = process.env.JWT_SECRET || 'construction_erp_secret_key_2026';

// POST /api/auth/login - Auto-detects role from registered email
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Please enter your email address' });
  }

  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    return res.status(401).json({ success: false, message: 'No account found with this email address' });
  }

  // Create JWT token
  const token = jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role, projectId: user.projectId },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    success: true,
    message: `Welcome back, ${user.name}!`,
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone || '',
      projectId: user.projectId,
      avatar: user.avatar
    }
  });
});

// POST /api/auth/register - All new registrations automatically create Site Engineer accounts
router.post('/register', (req, res) => {
  const { name, email, phone, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Please fill all required fields' });
  }

  // Email duplicate check: same email cannot register again
  const existingUser = db.users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
  if (existingUser) {
    return res.status(400).json({ success: false, message: 'This email address is already registered. Please use another email.' });
  }

  // Phone validation: must be exactly 10 digits (same phone across accounts is allowed)
  const cleanPhone = phone ? String(phone).replace(/\D/g, '') : '';
  if (phone && cleanPhone.length !== 10) {
    return res.status(400).json({ success: false, message: 'Phone number must be exactly 10 digits' });
  }

  // Block trying to hijack admin email
  if (email.toLowerCase() === 'admin@gmail.com' || email.toLowerCase() === 'admin@erp.com') {
    return res.status(400).json({ 
      success: false, 
      message: 'admin@gmail.com is reserved for the Admin account. Please use your own email.' 
    });
  }

  // Always force new registrations as Site Engineer
  const newUser = {
    id: `u_${Date.now()}`,
    name,
    email,
    phone: phone || '',
    password,
    role: 'site_engineer',
    projectId: db.projects[0]?.id || '',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  };

  db.users.push(newUser);
  if (typeof db.save === 'function') db.save();

  const token = jwt.sign(
    { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.status(201).json({
    success: true,
    message: 'Site Engineer account registered successfully!',
    token,
    user: newUser
  });
});

// GET /api/auth/users
router.get('/users', (req, res) => {
  res.json({ success: true, users: db.users });
});

// GET /api/auth/engineers - Get list of all Site Engineers
router.get('/engineers', (req, res) => {
  const engineers = db.users.filter(u => u.role === 'site_engineer');
  res.json({ success: true, engineers });
});

module.exports = router;
