const express = require('express');
const router = express.Router();
const db = require('../database/db');

// GET /api/materials - Get all inventory items
router.get('/', (req, res) => {
  res.json({ success: true, materials: db.materials });
});

// PATCH /api/materials/:id/stock - Update stock quantity
router.patch('/:id/stock', (req, res) => {
  const item = db.materials.find(m => m.id === req.params.id);
  if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

  const { delta } = req.body;
  item.stock = Math.max(0, item.stock + Number(delta));
  item.lastUpdated = new Date().toISOString().split('T')[0];
  if (typeof db.save === 'function') db.save();

  res.json({ success: true, message: 'Stock updated', material: item });
});

// POST /api/materials/deduct - Deduct materials used in tasks or DPR with stock validation
router.post('/deduct', (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'No items to deduct' });
  }

  // Pre-validate that all items have sufficient stock
  for (const it of items) {
    const qty = Number(it.quantity) || 0;
    if (qty <= 0) continue;
    const mat = db.materials.find(m => 
      (it.materialId && m.id === it.materialId) ||
      (it.name && m.name.toLowerCase().includes(it.name.toLowerCase()))
    );
    if (mat && qty > mat.stock) {
      return res.status(400).json({ 
        success: false, 
        message: `Insufficient stock for ${mat.name}! Available: ${mat.stock} ${mat.unit}, Requested: ${qty} ${mat.unit}` 
      });
    }
  }

  // Deduct
  const deducted = [];
  items.forEach(it => {
    const qty = Number(it.quantity) || 0;
    if (qty <= 0) return;
    const mat = db.materials.find(m => 
      (it.materialId && m.id === it.materialId) ||
      (it.name && m.name.toLowerCase().includes(it.name.toLowerCase()))
    );
    if (mat) {
      mat.stock = Math.max(0, mat.stock - qty);
      mat.lastUpdated = new Date().toISOString().split('T')[0];
      deducted.push({ name: mat.name, deducted: qty, remaining: mat.stock, unit: mat.unit });
    }
  });

  if (typeof db.save === 'function') db.save();
  res.json({ success: true, message: 'Materials stock deducted successfully', deducted, materials: db.materials });
});

// POST /api/materials - Add new material item or inward stock
router.post('/', (req, res) => {
  const { name, stock, unit, unitCost, minThreshold, category } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Material name is required' });

  // Check if exists
  const existing = db.materials.find(m => m.name.toLowerCase() === name.trim().toLowerCase());
  if (existing) {
    existing.stock += Number(stock) || 0;
    existing.lastUpdated = new Date().toISOString().split('T')[0];
    if (typeof db.save === 'function') db.save();
    return res.json({ success: true, message: 'Existing material stock updated', material: existing });
  }

  const newMat = {
    id: `mat_${Date.now()}`,
    name: name.trim(),
    stock: Number(stock) || 0,
    unit: unit || 'Bags',
    unitCost: Number(unitCost) || 500,
    minThreshold: Number(minThreshold) || 50,
    category: category || 'General',
    lastUpdated: new Date().toISOString().split('T')[0]
  };

  db.materials.push(newMat);
  if (typeof db.save === 'function') db.save();
  res.status(201).json({ success: true, message: 'Material created successfully', material: newMat });
});

// GET /api/materials/requests - Get all material requests
router.get('/requests', (req, res) => {
  res.json({ success: true, requests: db.materialRequests });
});

// POST /api/materials/requests - Create material request (Site Engineer)
router.post('/requests', (req, res) => {
  const { projectId, projectName, requestedBy, materialName, quantity, unit, reason, estimatedCost } = req.body;
  const newReq = {
    id: `req_${Date.now()}`,
    projectId: projectId || (db.projects[0] ? db.projects[0].id : ""),
    projectName: projectName || (db.projects[0] ? db.projects[0].name : "General Project"),
    requestedBy: requestedBy || "Site Engineer",
    materialName,
    quantity: Number(quantity),
    unit,
    reason,
    status: "pending",
    date: new Date().toISOString().split('T')[0],
    estimatedCost: Number(estimatedCost) || 50000
  };

  db.materialRequests.unshift(newReq);
  res.status(201).json({ success: true, message: 'Material request submitted to Admin', request: newReq });
});

// PATCH /api/materials/requests/:id/status - Approve/Reject material request (Admin)
router.patch('/requests/:id/status', (req, res) => {
  const reqItem = db.materialRequests.find(r => r.id === req.params.id);
  if (!reqItem) return res.status(404).json({ success: false, message: 'Request not found' });

  const { status } = req.body; // 'approved' or 'rejected'
  reqItem.status = status;

  // If approved, optionally add stock or record expense
  if (status === 'approved') {
    const mat = db.materials.find(m => m.name.toLowerCase().includes(reqItem.materialName.toLowerCase()));
    if (mat) {
      mat.stock += reqItem.quantity;
      mat.lastUpdated = new Date().toISOString().split('T')[0];
    }
  }

  res.json({ success: true, message: `Request ${status} successfully`, request: reqItem });
});

module.exports = router;
