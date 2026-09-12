const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const materialRoutes = require('./routes/materials');
const reportRoutes = require('./routes/reports');
const invoiceRoutes = require('./routes/invoices');
const changeOrderRoutes = require('./routes/changeOrders');
const workerRoutes = require('./routes/workers');

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
app.use('/api/invoices', invoiceRoutes);
app.use('/api/change-orders', changeOrderRoutes);
app.use('/api/workers', workerRoutes);

const db = require('./database/db');

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'Construction ERP REST API',
    database: db.isMongoConnected ? 'MongoDB Connected' : 'Local Fallback (data.json)',
    mongoConnected: db.isMongoConnected,
    projectsCount: db.projects ? db.projects.length : 0,
    timestamp: new Date().toISOString()
  });
});

// Root route
app.get('/', (req, res) => {
  res.send('Construction ERP REST API Server is Running!');
});

app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`🚀 Construction ERP Backend running on port ${PORT}`);
  console.log(`🌐 Health endpoint: http://localhost:${PORT}/api/health`);
  console.log(`=================================================`);
});
