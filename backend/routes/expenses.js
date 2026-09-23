const express = require('express');
const router = express.Router();
const db = require('../database/db');

// GET all site expenses
router.get('/', (req, res) => {
  const { engineerEmail, projectId } = req.query;
  let items = db.expenses || [];

  if (engineerEmail) {
    const emailNorm = engineerEmail.trim().toLowerCase();
    items = items.filter(e => (e.engineerEmail || '').trim().toLowerCase() === emailNorm);
  }

  if (projectId) {
    items = items.filter(e => String(e.projectId) === String(projectId));
  }

  res.json({
    success: true,
    expenses: items.sort((a, b) => new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0))
  });
});

// GET wallet balance & stats for an engineer
router.get('/wallet/:engineerEmail', (req, res) => {
  const emailNorm = (req.params.engineerEmail || '').trim().toLowerCase();
  const allExp = db.expenses || [];
  const engineerExp = allExp.filter(e => (e.engineerEmail || '').trim().toLowerCase() === emailNorm);

  const totalAdminPaid = engineerExp
    .filter(e => e.status === 'Paid')
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const pendingClaims = engineerExp
    .filter(e => e.status === 'Pending')
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  res.json({
    success: true,
    walletBalance: totalAdminPaid,
    totalAdminPaid,
    pendingClaims,
    expensesCount: engineerExp.length
  });
});

// POST new expense claim by Site Engineer
router.post('/', (req, res) => {
  try {
    const {
      projectId,
      projectName,
      engineerName,
      engineerEmail,
      title,
      category,
      amount,
      date,
      description,
      receiptPhoto
    } = req.body;

    if (!title || !amount) {
      return res.status(400).json({ success: false, message: 'Expense title and amount are required.' });
    }

    const nextId = db.getNextExpenseId ? db.getNextExpenseId() : String(Date.now());
    const newExpense = {
      id: nextId,
      projectId: projectId || '',
      projectName: projectName || 'General Site',
      engineerName: engineerName || 'Site Engineer',
      engineerEmail: (engineerEmail || '').trim().toLowerCase(),
      title: title.trim(),
      category: category || 'General Site Expense',
      amount: Number(amount) || 0,
      date: date || new Date().toISOString().split('T')[0],
      description: description ? description.trim() : '',
      receiptPhoto: receiptPhoto || '',
      status: 'Pending', // Pending until Admin pays
      createdAt: new Date().toISOString()
    };

    if (!Array.isArray(db.expenses)) {
      db.expenses = [];
    }
    db.expenses.unshift(newExpense);
    db.save();

    res.status(201).json({
      success: true,
      message: `Site expense of ₹${newExpense.amount.toLocaleString('en-IN')} submitted for Admin payment!`,
      expense: newExpense
    });
  } catch (err) {
    console.error('Error creating expense:', err);
    res.status(500).json({ success: false, message: 'Server error creating expense' });
  }
});

// POST Admin pays / releases funds for an expense
router.post('/:id/pay', (req, res) => {
  const { id } = req.params;
  const { paymentMode, paymentNote } = req.body;
  const expense = (db.expenses || []).find(e => String(e.id) === String(id));

  if (!expense) {
    return res.status(404).json({ success: false, message: 'Expense not found.' });
  }

  expense.status = 'Paid';
  expense.paidAt = new Date().toISOString();
  expense.paymentMode = paymentMode || 'Cash';
  expense.paymentNote = paymentNote ? paymentNote.trim() : '';

  db.save();

  res.json({
    success: true,
    message: `Payment of ₹${Number(expense.amount).toLocaleString('en-IN')} successfully released to ${expense.engineerName}'s Site Wallet!`,
    expense
  });
});

// POST Admin transfers direct advance petty cash to Site Engineer's wallet
router.post('/wallet/advance', (req, res) => {
  const { engineerEmail, engineerName, amount, paymentMode, notes } = req.body;
  if (!engineerEmail || !amount || Number(amount) <= 0) {
    return res.status(400).json({ success: false, message: 'Valid engineer email and amount are required.' });
  }

  const nextId = db.getNextExpenseId ? db.getNextExpenseId() : String(Date.now());
  const advanceEntry = {
    id: nextId,
    isAdvance: true,
    projectId: '',
    projectName: 'Petty Cash Advance',
    engineerName: engineerName || 'Site Engineer',
    engineerEmail: (engineerEmail || '').trim().toLowerCase(),
    title: 'Site Petty Cash Advance from Admin',
    category: 'Admin Wallet Transfer',
    amount: Number(amount),
    date: new Date().toISOString().split('T')[0],
    description: notes ? notes.trim() : 'Direct funds transfer from Super Admin to Site Wallet',
    receiptPhoto: '',
    status: 'Paid',
    paidAt: new Date().toISOString(),
    paymentMode: paymentMode || 'UPI / Bank Transfer',
    paymentNote: notes || 'Admin wallet advance',
    createdAt: new Date().toISOString()
  };

  if (!Array.isArray(db.expenses)) {
    db.expenses = [];
  }
  db.expenses.unshift(advanceEntry);
  db.save();

  res.json({
    success: true,
    message: `₹${Number(amount).toLocaleString('en-IN')} advance credited directly to ${advanceEntry.engineerName}'s wallet!`,
    advance: advanceEntry
  });
});

// POST Admin resets entire database clean
router.post('/wipe-db', async (req, res) => {
  try {
    const result = await db.wipeAllData();
    res.json(result);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
