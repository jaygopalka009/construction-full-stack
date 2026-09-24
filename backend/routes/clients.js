const express = require('express');
const router = express.Router();
const db = require('../database/db');

function getClientsList() {
  if (!Array.isArray(db.clients)) db.clients = [];
  return db.clients;
}

// GET /api/clients - Get all clients
router.get('/', (req, res) => {
  const clients = getClientsList();
  res.json({
    success: true,
    clients: clients,
    total: clients.length
  });
});

// GET /api/clients/:id - Get client by ID
router.get('/:id', (req, res) => {
  const clients = getClientsList();
  const client = clients.find(c => String(c.id) === String(req.params.id));
  if (!client) {
    return res.status(404).json({ success: false, message: 'Client not found' });
  }
  res.json({ success: true, client });
});

// POST /api/clients - Create new client
router.post('/', (req, res) => {
  const { name, phone, email, company, address } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Client name is required' });
  }

  const clients = getClientsList();
  const newId = `CLI-${String(clients.length + 1).padStart(3, '0')}`;
  const newClient = {
    id: newId,
    name: name.trim(),
    phone: phone || '',
    email: email || `${name.trim().toLowerCase().replace(/[^a-z0-9]/g, '')}@client.com`,
    company: company || name.trim(),
    address: address || 'Ahmedabad, Gujarat',
    createdAt: new Date().toISOString()
  };

  clients.push(newClient);
  if (typeof db.save === 'function') db.save();

  res.status(201).json({
    success: true,
    message: 'Client profile registered successfully',
    client: newClient
  });
});

// PUT /api/clients/:id - Update client
router.put('/:id', (req, res) => {
  const clients = getClientsList();
  const client = clients.find(c => String(c.id) === String(req.params.id));
  if (!client) {
    return res.status(404).json({ success: false, message: 'Client not found' });
  }

  const { name, phone, email, company, address } = req.body;
  if (name) client.name = name.trim();
  if (phone !== undefined) client.phone = phone;
  if (email !== undefined) client.email = email;
  if (company !== undefined) client.company = company;
  if (address !== undefined) client.address = address;

  if (typeof db.save === 'function') db.save();
  res.json({ success: true, message: 'Client updated successfully', client });
});

// DELETE /api/clients/:id - Remove client
router.delete('/:id', (req, res) => {
  const clients = getClientsList();
  const idx = clients.findIndex(c => String(c.id) === String(req.params.id));
  if (idx === -1) {
    return res.status(404).json({ success: false, message: 'Client not found' });
  }

  const removed = clients.splice(idx, 1)[0];
  if (typeof db.save === 'function') db.save();
  res.json({ success: true, message: 'Client removed successfully', client: removed });
});

module.exports = router;
