const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const materialRoutes = require('./routes/materials');
const reportRoutes = require('./routes/reports');
const workerRoutes = require('./routes/workers');
const expenseRoutes = require('./routes/expenses');
const paymentRoutes = require('./routes/payments');
const engineerRoutes = require('./routes/engineers');
const notificationRoutes = require('./routes/notifications');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Log requests
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/engineers', engineerRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/clients', require('./routes/clients'));
app.use('/api/equipment', require('./routes/equipment'));
app.use('/api/machinery', require('./routes/machinery'));
const db = require('./database/db');

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'Construction ERP REST API',
    uptimeSeconds: Math.floor(process.uptime()),
    database: db.isMongoConnected ? 'MongoDB Connected' : 'Local Fallback (in-memory)',
    mongoConnected: !!db.isMongoConnected,
    projectsCount: db.projects ? db.projects.length : 0,
    clientsCount: db.clients ? db.clients.length : 0,
    equipmentCount: db.equipment ? db.equipment.length : 0,
    materialsCount: db.materials ? db.materials.length : 0,
    dprsCount: db.dprs ? db.dprs.length : 0,
    reportsCount: db.reports ? db.reports.length : 0,
    tasksCount: db.tasks ? db.tasks.length : 0,
    expensesCount: db.expenses ? db.expenses.length : 0,
    paymentsCount: db.payments ? db.payments.length : 0,
    engineersCount: db.engineers ? db.engineers.length : 0,
    workersCount: db.workers ? db.workers.length : 0,
    notificationsCount: db.notifications ? db.notifications.length : 0,
    timestamp: new Date().toISOString()
  });
});

// Dedicated Tasks REST endpoint
app.get('/api/tasks', (req, res) => {
  const { projectId } = req.query;
  let allTasks = Array.isArray(db.tasks) && db.tasks.length > 0
    ? db.tasks
    : (Array.isArray(db.projects) ? db.projects.flatMap(p => (p.tasks || []).map(t => ({ ...t, projectId: p.id, projectName: p.name }))) : []);

  if (projectId) {
    allTasks = allTasks.filter(t => t.projectId === projectId);
  }
  res.json({ success: true, tasks: allTasks, total: allTasks.length });
});

// Root route
app.get('/', (req, res) => {
  res.send('Construction ERP REST API Server is Running!');
});

app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(` Construction ERP Backend running on port ${PORT}`);
  console.log(` Health endpoint: http://localhost:${PORT}/api/health`);
  console.log(`=================================================`);
});
