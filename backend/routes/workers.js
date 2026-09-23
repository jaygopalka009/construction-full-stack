const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Ensure db.workers and db.workers.list exist
function getWorkersData() {
  if (!db.workers) {
    db.workers = { total: 0, present: 0, absent: 0, assignedProject: "", list: [] };
  }
  if (!Array.isArray(db.workers.list)) {
    db.workers.list = [];
  }
  return db.workers;
}

function updateCounts() {
  const w = getWorkersData();
  w.total = w.list.length;
  w.present = w.list.filter(item => item.status === 'Present').length;
  w.absent = w.list.filter(item => item.status === 'Absent').length;
}

// GET /api/workers - Fetch all site workers (supports optional ?projectId= and ?status= filters)
router.get('/', (req, res) => {
  const w = getWorkersData();
  updateCounts();
  const { projectId, status } = req.query;
  let workersList = w.list;

  if (projectId) {
    workersList = workersList.filter(item => item.projectId === projectId);
  }
  if (status) {
    workersList = workersList.filter(item => item.status && item.status.toLowerCase() === status.toLowerCase());
  }

  res.json({
    success: true,
    workers: workersList,
    stats: {
      total: w.total,
      present: w.present,
      absent: w.absent
    }
  });
});

// POST /api/workers - Add new worker
router.post('/', (req, res) => {
  const { name, trade, phone, dailyWage, status, projectId } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Worker name is required' });
  }

  const w = getWorkersData();
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

  w.list.push(newWorker);
  updateCounts();
  db.save();

  res.status(201).json({
    success: true,
    message: 'Worker added successfully',
    worker: newWorker,
    workers: w.list
  });
});

// PATCH /api/workers/:id - Update worker or attendance
router.patch('/:id', (req, res) => {
  const w = getWorkersData();
  const worker = w.list.find(item => item.id === req.params.id);
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

  updateCounts();
  db.save();

  res.json({
    success: true,
    message: 'Worker updated successfully',
    worker,
    workers: w.list
  });
});

// DELETE /api/workers/:id - Delete worker
router.delete('/:id', (req, res) => {
  const w = getWorkersData();
  const idx = w.list.findIndex(item => item.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ success: false, message: 'Worker not found' });
  }

  const removed = w.list.splice(idx, 1)[0];
  updateCounts();
  db.save();

  res.json({
    success: true,
    message: 'Worker deleted successfully',
    worker: removed,
    workers: w.list
  });
});

// DELETE /api/workers - Clear all workers
router.delete('/', (req, res) => {
  const w = getWorkersData();
  w.list = [];
  updateCounts();
  db.save();
  res.json({
    success: true,
    message: 'All workers deleted successfully',
    workers: []
  });
});

module.exports = router;
