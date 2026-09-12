const express = require('express');
const router = express.Router();
const db = require('../database/db');

// GET /api/change-orders - Get all change order requests
router.get('/', (req, res) => {
  res.json({ success: true, changeOrders: db.changeOrders });
});

// POST /api/change-orders - Client submits a new change request
router.post('/', (req, res) => {
  const { projectId, projectName, requestedBy, title, description, estimatedAdditionalCost, timeExtensionDays } = req.body;

  const newCO = {
    id: `co_${Date.now()}`,
    projectId: projectId || (db.projects[0] ? db.projects[0].id : ""),
    projectName: projectName || (db.projects[0] ? db.projects[0].name : "General Project"),
    requestedBy: requestedBy || (db.projects[0] ? db.projects[0].clientName : "Client"),
    title,
    description,
    estimatedAdditionalCost: Number(estimatedAdditionalCost) || 50000,
    timeExtensionDays: Number(timeExtensionDays) || 0,
    status: "pending",
    requestedDate: new Date().toISOString().split('T')[0]
  };

  db.changeOrders.unshift(newCO);
  res.status(201).json({ success: true, message: 'Change Order request submitted to Admin', changeOrder: newCO });
});

// PATCH /api/change-orders/:id/status - Admin approves or rejects
router.patch('/:id/status', (req, res) => {
  const co = db.changeOrders.find(c => c.id === req.params.id);
  if (!co) return res.status(404).json({ success: false, message: 'Change order not found' });

  const { status } = req.body; // 'approved' or 'rejected'
  co.status = status;

  if (status === 'approved') {
    const proj = db.projects.find(p => p.id === co.projectId);
    if (proj) {
      proj.budget += co.estimatedAdditionalCost;
    }
  }

  res.json({ success: true, message: `Change Order request ${status}`, changeOrder: co });
});

module.exports = router;
