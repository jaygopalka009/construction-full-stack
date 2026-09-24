const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Ensure db.payments is an array
function getPaymentsList() {
  if (!Array.isArray(db.payments)) {
    db.payments = [];
  }
  return db.payments;
}

// GET /api/payments - Fetch all payments from MongoDB 'payments' collection
router.get('/', (req, res) => {
  const { engineerEmail, projectId, paymentMode } = req.query;
  let items = getPaymentsList();

  if (engineerEmail) {
    const norm = engineerEmail.trim().toLowerCase();
    items = items.filter(p => (p.engineerEmail || '').trim().toLowerCase() === norm);
  }

  if (projectId) {
    items = items.filter(p => String(p.projectId) === String(projectId));
  }

  if (paymentMode) {
    items = items.filter(p => (p.paymentMode || '').toLowerCase() === paymentMode.toLowerCase());
  }

  res.json({
    success: true,
    count: items.length,
    payments: items.sort((a, b) => new Date(b.paidAt || b.createdAt || 0) - new Date(a.paidAt || a.createdAt || 0))
  });
});

// GET /api/payments/stats - Payment summary analytics
router.get('/stats', (req, res) => {
  const items = getPaymentsList();
  const totalAmount = items.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const cashAmount = items.filter(p => (p.paymentMode || '').toLowerCase().includes('cash')).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const chequeAmount = items.filter(p => (p.paymentMode || '').toLowerCase().includes('cheque')).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const upiAmount = items.filter(p => {
    const m = (p.paymentMode || '').toLowerCase();
    return m.includes('upi') || m.includes('bank') || m.includes('online');
  }).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  res.json({
    success: true,
    totalTransactions: items.length,
    totalAmount,
    cashAmount,
    chequeAmount,
    upiAmount
  });
});

// GET /api/payments/:id - Get specific payment document
router.get('/:id', (req, res) => {
  const items = getPaymentsList();
  const item = items.find(p => String(p.id) === String(req.params.id));
  if (!item) {
    return res.status(404).json({ success: false, message: 'Payment record not found' });
  }
  res.json({ success: true, payment: item });
});

// POST /api/payments - Directly record a payment into MongoDB 'payments' collection
router.post('/', (req, res) => {
  const {
    expenseId,
    taskId,
    projectId,
    projectName,
    engineerName,
    engineerEmail,
    amount,
    paymentMode,
    paymentNote,
    category,
    title,
    paidBy
  } = req.body;

  if (!amount || Number(amount) <= 0) {
    return res.status(400).json({ success: false, message: 'Valid payment amount is required' });
  }

  const items = getPaymentsList();
  const nextId = db.getNextPaymentId ? db.getNextPaymentId() : String(Date.now());
  const paymentDoc = {
    id: nextId,
    paymentNumber: `PAY-${Date.now().toString().slice(-6)}`,
    expenseId: expenseId || '',
    taskId: taskId || '',
    projectId: projectId || '',
    projectName: projectName || 'General Site',
    engineerName: engineerName || 'Site Engineer',
    engineerEmail: (engineerEmail || '').trim().toLowerCase(),
    amount: Number(amount),
    paymentMode: paymentMode || 'Cash',
    paymentNote: paymentNote ? paymentNote.trim() : '',
    category: category || 'Task Operational Cost',
    title: title || 'Payment Disbursement',
    paidAt: new Date().toISOString(),
    status: 'Completed',
    paidBy: paidBy || 'Super Admin',
    createdAt: new Date().toISOString()
  };

  items.unshift(paymentDoc);
  if (typeof db.save === 'function') db.save();

  res.status(201).json({
    success: true,
    message: `Payment of ₹${Number(amount).toLocaleString('en-IN')} recorded in MongoDB payments collection!`,
    payment: paymentDoc
  });
});

// DELETE /api/payments/:id - Delete a payment
router.delete('/:id', (req, res) => {
  const items = getPaymentsList();
  const idx = items.findIndex(p => String(p.id) === String(req.params.id));
  if (idx === -1) {
    return res.status(404).json({ success: false, message: 'Payment record not found' });
  }
  const removed = items.splice(idx, 1)[0];
  if (typeof db.save === 'function') db.save();

  res.json({
    success: true,
    message: 'Payment record deleted successfully',
    payment: removed
  });
});

module.exports = router;
