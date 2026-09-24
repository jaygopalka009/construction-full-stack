const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Ensure db.workers is a flat array of worker documents
function getWorkersList() {
  if (!Array.isArray(db.workers)) {
    if (db.workers && Array.isArray(db.workers.list)) {
      db.workers = db.workers.list;
    } else {
      db.workers = [];
    }
  }
  return db.workers;
}

function calculateStats(list) {
  return {
    total: list.length,
    present: list.filter(item => item.status === 'Present').length,
    absent: list.filter(item => item.status === 'Absent').length
  };
}

// GET /api/workers - Fetch all site workers from MongoDB workers collection
router.get('/', (req, res) => {
  const list = getWorkersList();
  const { projectId, status } = req.query;
  let filtered = list;

  if (projectId) {
    filtered = filtered.filter(item => String(item.projectId) === String(projectId));
  }
  if (status) {
    filtered = filtered.filter(item => item.status && item.status.toLowerCase() === status.toLowerCase());
  }

  res.json({
    success: true,
    workers: filtered,
    stats: calculateStats(list)
  });
});

// POST /api/workers - Add new worker (stored in MongoDB 'workers' collection)
router.post('/', (req, res) => {
  const { name, trade, phone, dailyWage, status, projectId } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Worker name is required' });
  }

  const list = getWorkersList();
  const newWorker = {
    id: `w_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    name: name.trim(),
    trade: trade || 'Helper / General Labor',
    phone: phone || '',
    dailyWage: Number(dailyWage) || 500,
    status: status || 'Present',
    projectId: projectId || '',
    createdAt: new Date().toISOString()
  };

  list.push(newWorker);
  if (typeof db.save === 'function') db.save();

  res.status(201).json({
    success: true,
    message: 'Worker added successfully to MongoDB workers collection',
    worker: newWorker,
    workers: list,
    stats: calculateStats(list)
  });
});

// PATCH /api/workers/:id - Update worker or attendance
router.patch('/:id', (req, res) => {
  const list = getWorkersList();
  const worker = list.find(item => item.id === req.params.id);
  if (!worker) {
    return res.status(404).json({ success: false, message: 'Worker not found' });
  }

  const { name, trade, phone, dailyWage, status, projectId } = req.body;
  if (name !== undefined) worker.name = name;
  if (trade !== undefined) worker.trade = trade;
  if (phone !== undefined) worker.phone = phone;
  if (dailyWage !== undefined) worker.dailyWage = Number(dailyWage) || worker.dailyWage;
  if (status !== undefined) worker.status = status;
  if (projectId !== undefined) worker.projectId = projectId;

  if (typeof db.save === 'function') db.save();

  res.json({
    success: true,
    message: 'Worker updated successfully in MongoDB workers collection',
    worker,
    workers: list,
    stats: calculateStats(list)
  });
});

// DELETE /api/workers/:id - Delete worker
router.delete('/:id', (req, res) => {
  const list = getWorkersList();
  const idx = list.findIndex(item => item.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ success: false, message: 'Worker not found' });
  }

  const removed = list.splice(idx, 1)[0];
  if (typeof db.save === 'function') db.save();

  res.json({
    success: true,
    message: 'Worker deleted successfully from MongoDB workers collection',
    worker: removed,
    workers: list,
    stats: calculateStats(list)
  });
});

// DELETE /api/workers - Clear all workers
router.delete('/', (req, res) => {
  db.workers = [];
  if (typeof db.save === 'function') db.save();
  res.json({
    success: true,
    message: 'All workers deleted successfully from MongoDB workers collection',
    workers: [],
    stats: { total: 0, present: 0, absent: 0 }
  });
});

module.exports = router;
