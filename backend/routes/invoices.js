const express = require('express');
const router = express.Router();
const db = require('../database/db');

// GET /api/invoices - Get all invoices or filter by project
router.get('/', (req, res) => {
  const { projectId } = req.query;
  if (projectId) {
    const list = db.invoices.filter(i => i.projectId === projectId);
    return res.json({ success: true, invoices: list });
  }
  res.json({ success: true, invoices: db.invoices });
});

// POST /api/invoices/:id/pay - Pay an invoice (Client)
router.post('/:id/pay', (req, res) => {
  const invoice = db.invoices.find(i => i.id === req.params.id);
  if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

  invoice.status = 'paid';
  invoice.paidAmount = invoice.totalAmount;
  invoice.paidDate = new Date().toISOString().split('T')[0];

  // Update spent/received in project financials
  const proj = db.projects.find(p => p.id === invoice.projectId);
  if (proj) {
    proj.spent += invoice.amount;
  }

  res.json({ success: true, message: `Payment of ₹${invoice.totalAmount.toLocaleString('en-IN')} received successfully!`, invoice });
});

// POST /api/invoices - Create new invoice (Admin)
router.post('/', (req, res) => {
  const { projectId, projectName, clientName, stage, amount, dueDate, description } = req.body;
  const baseAmt = Number(amount);
  const gst = Math.round(baseAmt * 0.18);
  const total = baseAmt + gst;

  const newInv = {
    id: `INV-2026-00${db.invoices.length + 1}`,
    projectId: projectId || (db.projects[0] ? db.projects[0].id : ""),
    projectName: projectName || (db.projects[0] ? db.projects[0].name : "General Project"),
    clientName: clientName || (db.projects[0] ? db.projects[0].clientName : "Client"),
    stage,
    amount: baseAmt,
    gst,
    totalAmount: total,
    paidAmount: 0,
    dueDate,
    issueDate: new Date().toISOString().split('T')[0],
    status: "unpaid",
    description
  };

  db.invoices.unshift(newInv);
  res.status(201).json({ success: true, message: 'Invoice generated and sent to Client', invoice: newInv });
});

module.exports = router;
