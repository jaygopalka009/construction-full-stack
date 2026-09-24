const express = require('express');
const router = express.Router();
const db = require('../database/db');

// GET all site expenses (genuine claims & wallet transactions)
router.get('/', (req, res) => {
  const { engineerEmail, projectId } = req.query;
  
  if (!Array.isArray(db.expenses)) {
    db.expenses = [];
  }

  // Purge any legacy task-injected pseudo expenses so wallet only reflects genuine claims
  db.expenses = db.expenses.filter(e => !String(e.id || '').startsWith('task_exp_') && e.category !== 'Task Operational Cost');

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
  // Task approval constraint: payment can only be released if the task is approved by Admin
  if (expense.taskId) {
    let matchedTask = null;
    (db.projects || []).forEach(p => {
      (p.tasks || []).forEach(t => {
        if (t.id === expense.taskId) matchedTask = t;
      });
    });

    if (matchedTask && matchedTask.status !== 'Completed' && matchedTask.adminRemark !== 'Approved by Admin') {
      return res.status(400).json({
        success: false,
        message: 'Task must be Approved by Admin before releasing payment.'
      });
    }
  }

  expense.status = 'Paid';
  expense.paidAt = new Date().toISOString();
  expense.paymentMode = paymentMode || 'Cash';
  expense.paymentNote = paymentNote ? paymentNote.trim() : '';

  // If this expense is tied to a task, update the task payment status as well
  if (expense.taskId) {
    (db.projects || []).forEach(p => {
      (p.tasks || []).forEach(t => {
        if (t.id === expense.taskId) {
          t.paymentStatus = 'Paid';
          t.paidAt = expense.paidAt;
          t.paymentMode = expense.paymentMode;
        }
      });
    });
  }

  // Record transaction in dedicated MongoDB 'payments' collection
  if (!Array.isArray(db.payments)) db.payments = [];
  const paymentId = db.getNextPaymentId ? db.getNextPaymentId() : String(Date.now());
  const paymentDoc = {
    id: paymentId,
    paymentNumber: `PAY-${Date.now().toString().slice(-6)}`,
    expenseId: expense.id,
    taskId: expense.taskId || '',
    projectId: expense.projectId || '',
    projectName: expense.projectName || '',
    engineerName: expense.engineerName || 'Site Engineer',
    engineerEmail: expense.engineerEmail || '',
    amount: Number(expense.amount),
    paymentMode: expense.paymentMode || 'Cash',
    paymentNote: expense.paymentNote || '',
    category: expense.category || 'Task Operational Cost',
    title: expense.title || 'Task Payment Release',
    paidAt: expense.paidAt,
    status: 'Completed',
    paidBy: 'Super Admin',
    createdAt: new Date().toISOString()
  };
  db.payments.unshift(paymentDoc);

  // Notify Site Engineer of payment release
  if (typeof db.addNotification === 'function') {
    db.addNotification({
      title: 'Payment Released to Site Wallet',
      message: `Admin released ₹${Number(expense.amount).toLocaleString('en-IN')} (${expense.paymentMode}) for "${expense.title}".`,
      type: 'payment',
      targetRole: 'site_engineer',
      targetEmail: expense.engineerEmail,
      link: '/site/expenses'
    });
  }

  db.save();

  res.json({
    success: true,
    message: `Payment of ₹${Number(expense.amount).toLocaleString('en-IN')} successfully released to ${expense.engineerName}'s Site Wallet!`,
    expense,
    payment: paymentDoc
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

  // Record advance in dedicated MongoDB 'payments' collection
  if (!Array.isArray(db.payments)) db.payments = [];
  const paymentId = db.getNextPaymentId ? db.getNextPaymentId() : String(Date.now());
  const advancePaymentDoc = {
    id: paymentId,
    paymentNumber: `ADV-${Date.now().toString().slice(-6)}`,
    expenseId: advanceEntry.id,
    taskId: '',
    projectId: advanceEntry.projectId || '',
    projectName: 'Petty Cash Advance',
    engineerName: advanceEntry.engineerName || 'Site Engineer',
    engineerEmail: advanceEntry.engineerEmail || '',
    amount: Number(amount),
    paymentMode: advanceEntry.paymentMode || 'UPI / Bank Transfer',
    paymentNote: notes || 'Admin wallet advance',
    category: 'Admin Wallet Transfer',
    title: advanceEntry.title || 'Site Petty Cash Advance',
    paidAt: advanceEntry.paidAt,
    status: 'Completed',
    paidBy: 'Super Admin',
    createdAt: new Date().toISOString()
  };
  db.payments.unshift(advancePaymentDoc);

  // Notify Site Engineer of advance cash
  if (typeof db.addNotification === 'function') {
    db.addNotification({
      title: 'Advance Petty Cash Received',
      message: `Admin credited ₹${Number(amount).toLocaleString('en-IN')} advance petty cash directly into your Site Wallet.`,
      type: 'payment',
      targetRole: 'site_engineer',
      targetEmail: advanceEntry.engineerEmail,
      link: '/site/expenses'
    });
  }

  db.save();

  res.json({
    success: true,
    message: `₹${Number(amount).toLocaleString('en-IN')} advance credited directly to ${advanceEntry.engineerName}'s wallet!`,
    advance: advanceEntry,
    payment: advancePaymentDoc
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
