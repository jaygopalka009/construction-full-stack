const express = require('express');
const router = express.Router();
const db = require('../database/db');

function getEquipmentList() {
  if (!Array.isArray(db.equipment)) db.equipment = [];
  return db.equipment;
}

// GET /api/equipment - Get all heavy machinery & equipment
router.get('/', (req, res) => {
  const { status, type } = req.query;
  let list = getEquipmentList();

  if (status) {
    list = list.filter(e => e.status && e.status.toLowerCase() === status.toLowerCase());
  }
  if (type) {
    list = list.filter(e => e.type && e.type.toLowerCase().includes(type.toLowerCase()));
  }

  res.json({
    success: true,
    equipment: list,
    total: list.length
  });
});

// GET /api/equipment/:id - Get machinery details by ID
router.get('/:id', (req, res) => {
  const list = getEquipmentList();
  const item = list.find(e => String(e.id) === String(req.params.id) || e.code === req.params.id);
  if (!item) {
    return res.status(404).json({ success: false, message: 'Equipment not found' });
  }
  res.json({ success: true, equipment: item });
});

// POST /api/equipment - Register new machinery
router.post('/', (req, res) => {
  const { name, code, type, dailyRate, unit, status, fuelType, operatorName } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Equipment name is required' });
  }

  const list = getEquipmentList();
  const newId = `EQ-${String(list.length + 1).padStart(3, '0')}`;
  const newEquipment = {
    id: newId,
    name: name.trim(),
    code: code || `EQ-${Date.now().toString().slice(-4)}`,
    type: type || 'Heavy Machinery',
    dailyRate: Number(dailyRate) || 5000,
    unit: unit || 'Day',
    status: status || 'Available', // Available, On Site, Maintenance
    fuelType: fuelType || 'Diesel',
    operatorName: operatorName || '',
    createdAt: new Date().toISOString()
  };

  list.push(newEquipment);
  if (typeof db.save === 'function') db.save();

  res.status(201).json({
    success: true,
    message: 'Equipment registered successfully',
    equipment: newEquipment
  });
});

// PUT /api/equipment/:id - Update equipment
router.put('/:id', (req, res) => {
  const list = getEquipmentList();
  const item = list.find(e => String(e.id) === String(req.params.id));
  if (!item) {
    return res.status(404).json({ success: false, message: 'Equipment not found' });
  }

  const { name, code, type, dailyRate, unit, status, fuelType, operatorName, currentProjectId } = req.body;
  if (name) item.name = name.trim();
  if (code) item.code = code;
  if (type) item.type = type;
  if (dailyRate !== undefined) item.dailyRate = Number(dailyRate);
  if (unit) item.unit = unit;
  if (status) item.status = status;
  if (fuelType) item.fuelType = fuelType;
  if (operatorName !== undefined) item.operatorName = operatorName;
  if (currentProjectId !== undefined) item.currentProjectId = currentProjectId;

  if (typeof db.save === 'function') db.save();
  res.json({ success: true, message: 'Equipment updated successfully', equipment: item });
});

// DELETE /api/equipment/:id - Remove equipment
router.delete('/:id', (req, res) => {
  const list = getEquipmentList();
  const idx = list.findIndex(e => String(e.id) === String(req.params.id));
  if (idx === -1) {
    return res.status(404).json({ success: false, message: 'Equipment not found' });
  }

  const removed = list.splice(idx, 1)[0];
  if (typeof db.save === 'function') db.save();
  res.json({ success: true, message: 'Equipment removed successfully', equipment: removed });
});

module.exports = router;
