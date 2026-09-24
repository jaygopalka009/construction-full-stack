const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/construction_erp';

const defaultAdmin = {
  id: "1",
  name: "Super Admin (Owner)",
  email: "admin@gmail.com",
  password: "admin",
  role: "admin",
  avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80"
};

// In-memory db state (backed by MongoDB collections)
let db = {
  admins: [defaultAdmin],
  users: [],
  engineers: [],
  clients: [],
  equipment: [],
  projects: [],
  dprs: [],
  reports: [],
  tasks: [],
  expenses: [],
  payments: [],
  workers: [],
  materials: [],
  notifications: [],
  isMongoConnected: false
};

// Auto-increment project ID counter: 1, 2, 3, 4...
db.getNextProjectId = function() {
  let maxId = 0;
  (db.projects || []).forEach(p => {
    const num = parseInt(p.id, 10);
    if (!isNaN(num) && num > maxId) {
      maxId = num;
    }
  });
  return String(maxId + 1);
};

// Auto-increment expense ID counter: 1, 2, 3, 4...
db.getNextExpenseId = function() {
  let maxId = 0;
  (db.expenses || []).forEach(e => {
    const num = parseInt(String(e.id || '').replace(/\D/g, ''), 10);
    if (!isNaN(num) && num > maxId) {
      maxId = num;
    }
  });
  return String(maxId + 1);
};

// Auto-increment payment ID counter: 1, 2, 3, 4...
db.getNextPaymentId = function() {
  let maxId = 0;
  (db.payments || []).forEach(p => {
    const num = parseInt(String(p.id || '').replace(/\D/g, ''), 10);
    if (!isNaN(num) && num > maxId) {
      maxId = num;
    }
  });
  return String(maxId + 1);
};

// Helper to push notification to collection
db.addNotification = function(notif) {
  if (!Array.isArray(db.notifications)) db.notifications = [];
  const newNotif = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    title: notif.title || 'Notification',
    message: notif.message || '',
    type: notif.type || 'info', // 'task', 'payment', 'dpr', 'material', 'project'
    link: notif.link || '',
    targetRole: notif.targetRole || 'all', // 'admin', 'site_engineer', 'all'
    targetEmail: notif.targetEmail || '',
    read: false,
    createdAt: new Date().toISOString()
  };
  db.notifications.unshift(newNotif);
  if (typeof db.save === 'function') db.save();
  return newNotif;
};

// Mongoose Schemas & Models
const schemaOptions = { strict: false, id: false, versionKey: false, timestamps: true };

const createModel = (name, col) => {
  return mongoose.models[name] || mongoose.model(name, new mongoose.Schema({ id: { type: String, index: true } }, schemaOptions), col);
};

const models = {
  admins: createModel('Admin', 'admins'),
  users: createModel('User', 'users'),
  engineers: createModel('Engineer', 'engineers'),
  clients: createModel('Client', 'clients'),
  equipment: createModel('Equipment', 'equipment'),
  projects: createModel('Project', 'projects'),
  dprs: createModel('DPR', 'dprs'),
  reports: createModel('Report', 'reports'),
  tasks: createModel('Task', 'tasks'),
  expenses: createModel('Expense', 'expenses'),
  payments: createModel('Payment', 'payments'),
  workers: createModel('Worker', 'workers'),
  materials: createModel('Material', 'materials'),
  notifications: createModel('Notification', 'notifications')
};

let isSyncing = false;

// Sync single collection to MongoDB
async function syncCollectionToMongo(key, Model) {
  if (mongoose.connection.readyState !== 1) return;
  const items = db[key];
  if (!Array.isArray(items)) return;

  try {
    if (items.length === 0) {
      await Model.deleteMany({});
      return;
    }

    const ops = [];
    const currentIds = [];

    for (const item of items) {
      const id = String(item.id || (item._id ? String(item._id) : ''));
      if (!id) continue;

      currentIds.push(id);
      const cleanDoc = { ...item };
      cleanDoc.id = id;
      delete cleanDoc._id;

      ops.push({
        updateOne: {
          filter: { id: id },
          update: { $set: cleanDoc },
          upsert: true
        }
      });
    }

    if (ops.length > 0) {
      await Model.bulkWrite(ops);
    }

    if (currentIds.length > 0) {
      await Model.deleteMany({ id: { $nin: currentIds, $exists: true } });
    }
  } catch (err) {
    console.error(`[MongoDB] Error syncing collection '${key}':`, err.message);
  }
}

async function syncAllToMongo() {
  if (isSyncing || mongoose.connection.readyState !== 1) return;
  isSyncing = true;
  try {
    // Keep reports array in sync with dprs array
    if (Array.isArray(db.dprs) && Array.isArray(db.reports)) {
      if (db.reports.length === 0 && db.dprs.length > 0) db.reports = [...db.dprs];
      if (db.dprs.length === 0 && db.reports.length > 0) db.dprs = [...db.reports];
    }
    // Keep tasks collection in sync with projects' tasks
    if (Array.isArray(db.projects)) {
      const allTasks = db.projects.flatMap(p => (p.tasks || []).map(t => ({
        ...t,
        projectId: p.id,
        projectName: p.name
      })));
      db.tasks = allTasks;
    }

    const arrayKeys = ['admins', 'users', 'engineers', 'clients', 'equipment', 'projects', 'dprs', 'reports', 'tasks', 'expenses', 'payments', 'materials', 'workers', 'notifications'];
    for (const key of arrayKeys) {
      if (models[key] && Array.isArray(db[key])) {
        await syncCollectionToMongo(key, models[key]);
      }
    }
  } catch (e) {
    console.error('[MongoDB] Sync error:', e.message);
  } finally {
    isSyncing = false;
  }
}

// Connect directly to MongoDB
async function initMongo() {
  try {
    console.log(`[MongoDB] Connecting strictly to MongoDB (${MONGODB_URI}) ...`);
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    db.isMongoConnected = true;
    console.log(`[MongoDB] ✅ Connected to MongoDB (${MONGODB_URI})`);

    // Ensure admins collection has default admin
    const adminCount = await models.admins.countDocuments();
    if (adminCount === 0) {
      console.log('[MongoDB] Seeding default admin into admins collection...');
      await models.admins.create(defaultAdmin);
    }

    // Load data from MongoDB collections into memory
    const arrayKeys = ['admins', 'users', 'engineers', 'clients', 'equipment', 'projects', 'dprs', 'reports', 'tasks', 'expenses', 'payments', 'materials', 'workers', 'notifications'];
    for (const key of arrayKeys) {
      const Model = models[key];
      if (!Model) continue;

      const mongoDocs = await Model.find({}).lean();
      db[key] = (mongoDocs || []).map(d => {
        const clean = { ...d };
        clean.id = String(d.id || d._id);
        delete clean._id;
        return clean;
      });
      console.log(`[MongoDB] Loaded ${db[key].length} ${key} from collection '${key}'`);
    }

    // Sync reports with dprs if one collection has items
    if (db.reports.length === 0 && db.dprs.length > 0) {
      db.reports = [...db.dprs];
      await syncCollectionToMongo('reports', models.reports);
    } else if (db.dprs.length === 0 && db.reports.length > 0) {
      db.dprs = [...db.reports];
      await syncCollectionToMongo('dprs', models.dprs);
    }

    // Sync tasks collection from project tasks if tasks collection was empty
    if (db.tasks.length === 0 && Array.isArray(db.projects)) {
      const allTasks = db.projects.flatMap(p => (p.tasks || []).map(t => ({
        ...t,
        projectId: p.id,
        projectName: p.name
      })));
      if (allTasks.length > 0) {
        db.tasks = allTasks;
        await syncCollectionToMongo('tasks', models.tasks);
      }
    }

    // Clean up any legacy worker_stats object document from workers collection
    try {
      const legacyWorkerDoc = await models.workers.findOne({ type: 'worker_stats' }).lean();
      if (legacyWorkerDoc && legacyWorkerDoc.data && Array.isArray(legacyWorkerDoc.data.list)) {
        console.log(`[MongoDB] Migrating ${legacyWorkerDoc.data.list.length} workers from legacy wrapper to individual worker documents...`);
        for (const w of legacyWorkerDoc.data.list) {
          if (w && w.name && !db.workers.some(existing => existing.id === w.id)) {
            db.workers.push(w);
          }
        }
      }
      await models.workers.deleteMany({ type: 'worker_stats' });
      db.workers = db.workers.filter(w => !w.type && w.name);
      await syncCollectionToMongo('workers', models.workers);
    } catch (migErr) {
      console.warn('[MongoDB] Worker migration notice:', migErr.message);
    }

    // Sync site engineers into dedicated engineers collection if empty
    if ((!db.engineers || db.engineers.length === 0) && Array.isArray(db.users)) {
      const siteEngs = db.users.filter(u => u.role === 'site_engineer');
      if (siteEngs.length > 0) {
        console.log(`[MongoDB] Syncing ${siteEngs.length} existing site engineers into dedicated 'engineers' collection...`);
        db.engineers = siteEngs.map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          phone: u.phone || '',
          role: 'site_engineer',
          assignedProjectId: u.projectId || '',
          avatar: u.avatar || '',
          createdAt: u.createdAt || new Date().toISOString()
        }));
        await syncCollectionToMongo('engineers', models.engineers);
      }
    }

    // Clean up any legacy task-injected pseudo expenses so wallet is 100% clean
    if (Array.isArray(db.expenses)) {
      db.expenses = db.expenses.filter(e => !String(e.id || '').startsWith('task_exp_') && e.category !== 'Task Operational Cost');
      if (mongoose.connection && mongoose.connection.readyState === 1 && models.expenses) {
        try {
          await models.expenses.deleteMany({ id: { $regex: '^task_exp_' } });
          await models.expenses.deleteMany({ category: 'Task Operational Cost' });
        } catch (e) {}
      }
    }
    if (Array.isArray(db.payments)) {
      db.payments = db.payments.filter(p => !String(p.expenseId || '').startsWith('task_exp_') && p.category !== 'Task Operational Cost');
      if (mongoose.connection && mongoose.connection.readyState === 1 && models.payments) {
        try {
          await models.payments.deleteMany({ expenseId: { $regex: '^task_exp_' } });
          await models.payments.deleteMany({ category: 'Task Operational Cost' });
        } catch (e) {}
      }
    }

    // Sync paid expenses into dedicated payments collection if empty
    if ((!db.payments || db.payments.length === 0) && Array.isArray(db.expenses)) {
      const paidExpenses = db.expenses.filter(e => e.status === 'Paid');
      if (paidExpenses.length > 0) {
        console.log(`[MongoDB] Populating ${paidExpenses.length} past payments into dedicated 'payments' collection...`);
        db.payments = paidExpenses.map(e => ({
          id: `pay_${e.id}`,
          paymentNumber: `PAY-${String(e.id).padStart(5, '0')}`,
          expenseId: e.id,
          taskId: e.taskId || '',
          projectId: e.projectId || '',
          projectName: e.projectName || '',
          engineerName: e.engineerName || 'Site Engineer',
          engineerEmail: e.engineerEmail || '',
          amount: Number(e.amount) || 0,
          paymentMode: e.paymentMode || 'Cash',
          paymentNote: e.paymentNote || (e.isAdvance ? 'Advance Petty Cash' : 'Expense Payment Release'),
          category: e.category || (e.isAdvance ? 'Admin Wallet Transfer' : 'Task Operational Cost'),
          title: e.title || 'Payment Disbursement',
          paidAt: e.paidAt || new Date().toISOString(),
          status: 'Completed',
          paidBy: 'Super Admin',
          createdAt: e.createdAt || new Date().toISOString()
        }));
        await syncCollectionToMongo('payments', models.payments);
      }
    }

    // Ensure default admin exists in memory
    if (!db.admins || db.admins.length === 0) {
      db.admins = [defaultAdmin];
    }

    // Re-index project IDs to clean sequential counter (1, 2, 3...) if any have old non-numeric ID
    if (Array.isArray(db.projects)) {
      let needsReindex = db.projects.some(p => isNaN(parseInt(p.id, 10)));
      if (needsReindex) {
        console.log('[MongoDB] Re-indexing project IDs to clean sequential numbers (1, 2, 3...)...');
        db.projects.forEach((p, idx) => {
          p.id = String(idx + 1);
        });
      }
    }

    // Seed master clients if empty
    if (!db.clients || db.clients.length === 0) {
      console.log('[MongoDB] Seeding master clients collection...');
      db.clients = [
        {
          id: "CLI-001",
          name: "Shreeji Developers",
          phone: "+91 98250 11223",
          email: "contact@shreejidevelopers.com",
          company: "Shreeji Group Gujarat",
          address: "SG Highway, Ahmedabad, Gujarat",
          createdAt: new Date().toISOString()
        },
        {
          id: "CLI-002",
          name: "Avadh Realty & Infrastructure",
          phone: "+91 98980 44556",
          email: "info@avadhrealty.in",
          company: "Avadh Group",
          address: "VIP Road, Vesu, Surat, Gujarat",
          createdAt: new Date().toISOString()
        },
        {
          id: "CLI-003",
          name: "Riddhi Siddhi Group",
          phone: "+91 97240 77889",
          email: "projects@riddhisiddhi.com",
          company: "Riddhi Siddhi Infra",
          address: "Gotri Road, Vadodara, Gujarat",
          createdAt: new Date().toISOString()
        }
      ];
      await syncCollectionToMongo('clients', models.clients);
    }

    // Seed master equipment if empty
    if (!db.equipment || db.equipment.length === 0) {
      console.log('[MongoDB] Seeding master equipment collection...');
      db.equipment = [
        {
          id: "EQ-001",
          name: "JCB 3DX Backhoe Loader",
          code: "JCB-01",
          type: "Excavator",
          dailyRate: 6500,
          unit: "Day",
          status: "Available",
          fuelType: "Diesel",
          operatorName: "Mukesh Solanki",
          createdAt: new Date().toISOString()
        },
        {
          id: "EQ-002",
          name: "Concrete Mixer 10/7 (Reversible)",
          code: "MIX-02",
          type: "Concrete Mixer",
          dailyRate: 2500,
          unit: "Day",
          status: "Available",
          fuelType: "Diesel",
          operatorName: "Sanjay Parmar",
          createdAt: new Date().toISOString()
        },
        {
          id: "EQ-003",
          name: "Tower Crane 50m Arm",
          code: "CRN-03",
          type: "Tower Crane",
          dailyRate: 15000,
          unit: "Day",
          status: "Available",
          fuelType: "Electric",
          operatorName: "Kishore Dave",
          createdAt: new Date().toISOString()
        },
        {
          id: "EQ-004",
          name: "Tata Tipper Dump Truck (10-Wheeler)",
          code: "DMP-04",
          type: "Dumper",
          dailyRate: 5000,
          unit: "Day",
          status: "Available",
          fuelType: "Diesel",
          operatorName: "Prakash Vaghela",
          createdAt: new Date().toISOString()
        },
        {
          id: "EQ-005",
          name: "Soil Compactor / Road Roller (10 Ton)",
          code: "ROL-05",
          type: "Compactor",
          dailyRate: 4500,
          unit: "Day",
          status: "Available",
          fuelType: "Diesel",
          operatorName: "Arjun Barot",
          createdAt: new Date().toISOString()
        }
      ];
      await syncCollectionToMongo('equipment', models.equipment);
    }

    // Seed master workers if empty
    if (!db.workers || db.workers.length === 0) {
      console.log('[MongoDB] Seeding master workers collection...');
      db.workers = [
        {
          id: "WRK-001",
          name: "Ramesh Sharma",
          trade: "Head Mason",
          dailyWage: 950,
          phone: "+91 98251 22334",
          status: "Present",
          createdAt: new Date().toISOString()
        },
        {
          id: "WRK-002",
          name: "Kalu Patel",
          trade: "Bar Bender / Steel Fixer",
          dailyWage: 850,
          phone: "+91 98982 33445",
          status: "Present",
          createdAt: new Date().toISOString()
        },
        {
          id: "WRK-003",
          name: "Dilip Thakor",
          trade: "Shuttering Carpenter",
          dailyWage: 800,
          phone: "+91 97243 44556",
          status: "Present",
          createdAt: new Date().toISOString()
        },
        {
          id: "WRK-004",
          name: "Dinesh Solanki",
          trade: "Concrete Helper",
          dailyWage: 550,
          phone: "+91 96014 55667",
          status: "Present",
          createdAt: new Date().toISOString()
        },
        {
          id: "WRK-005",
          name: "Manish Rathod",
          trade: "General Labor Helper",
          dailyWage: 500,
          phone: "+91 99095 66778",
          status: "Present",
          createdAt: new Date().toISOString()
        }
      ];
      await syncCollectionToMongo('workers', models.workers);
    }

    // Seed master materials if empty
    if (!db.materials || db.materials.length === 0) {
      console.log('[MongoDB] Seeding master materials inventory collection...');
      db.materials = [
        {
          id: "MAT-001",
          name: "Ultratech Cement (PPC)",
          category: "Cement",
          stock: 450,
          unit: "Bags",
          pricePerUnit: 380,
          status: "In Stock",
          createdAt: new Date().toISOString()
        },
        {
          id: "MAT-002",
          name: "Tata Tiscon Fe550D TMT Rebar (12mm)",
          category: "Steel",
          stock: 18,
          unit: "Tons",
          pricePerUnit: 62000,
          status: "In Stock",
          createdAt: new Date().toISOString()
        },
        {
          id: "MAT-003",
          name: "Narmada River Sand",
          category: "Sand",
          stock: 25,
          unit: "Brass",
          pricePerUnit: 4200,
          status: "In Stock",
          createdAt: new Date().toISOString()
        },
        {
          id: "MAT-004",
          name: "Black Trap Metal Aggregate (20mm)",
          category: "Aggregate",
          stock: 30,
          unit: "Brass",
          pricePerUnit: 2800,
          status: "In Stock",
          createdAt: new Date().toISOString()
        },
        {
          id: "MAT-005",
          name: "First Class Red Clay Kiln Bricks",
          category: "Bricks",
          stock: 12000,
          unit: "Units",
          pricePerUnit: 8.5,
          status: "In Stock",
          createdAt: new Date().toISOString()
        }
      ];
      await syncCollectionToMongo('materials', models.materials);
    }

    // Drop any old unused collections in MongoDB
    try {
      if (mongoose.connection && mongoose.connection.db) {
        const collections = await mongoose.connection.db.listCollections().toArray();
        const collNames = collections.map(c => c.name);
        const deprecatedCollections = [
          'labors',
          'materialrequests',
          'sampletests',
          'vendors',
          'recentactivities',
          'invoices',
          'changeorders',
          'employees'
        ];
        for (const dropTarget of deprecatedCollections) {
          if (collNames.includes(dropTarget)) {
            await mongoose.connection.db.dropCollection(dropTarget);
            console.log(`[MongoDB] Removed deprecated collection: '${dropTarget}'`);
          }
        }
      }
    } catch (cleanErr) {}

    console.log('[MongoDB] 🚀 All active collections (admins, users, engineers, clients, equipment, projects, dprs, reports, tasks, expenses, payments, workers, materials) initialized cleanly!');
  } catch (err) {
    db.isMongoConnected = false;
    console.error(`[MongoDB] ❌ Connection notice: ${err.message}`);
  }
}

initMongo();

// Method to completely wipe all collections cleanly (preserving default admin)
db.wipeAllData = async function() {
  console.log('[MongoDB] 🧹 Wiping all database collections cleanly...');
  db.users = [];
  db.engineers = [];
  db.projects = [];
  db.dprs = [];
  db.expenses = [];
  db.payments = [];
  db.materials = [];
  db.workers = [];
  db.notifications = [];
  db.admins = [defaultAdmin];

  if (mongoose.connection && mongoose.connection.readyState === 1) {
    try {
      await models.users.deleteMany({});
      await models.engineers.deleteMany({});
      await models.projects.deleteMany({});
      await models.dprs.deleteMany({});
      await models.reports.deleteMany({});
      await models.tasks.deleteMany({});
      await models.expenses.deleteMany({});
      await models.payments.deleteMany({});
      await models.materials.deleteMany({});
      await models.workers.deleteMany({});
      await models.notifications.deleteMany({});
      await models.admins.deleteMany({ email: { $ne: defaultAdmin.email } });
      const exists = await models.admins.findOne({ email: defaultAdmin.email });
      if (!exists) {
        await models.admins.create(defaultAdmin);
      }
      console.log('[MongoDB] ✅ All collections wiped clean! Only default admin preserved.');
    } catch (err) {
      console.error('[MongoDB] Error wiping collections:', err.message);
    }
  }
  return { success: true, message: 'All database collections wiped cleanly! Only default admin active.' };
};

// Direct MongoDB Save function
db.save = function() {
  if (db.isMongoConnected && mongoose.connection.readyState === 1) {
    syncAllToMongo().catch(e => console.error('[MongoDB] Save error:', e.message));
  }
};

// Periodic background sync to MongoDB
setInterval(() => {
  if (db && typeof db.save === 'function') {
    db.save();
  }
}, 4000);

db.models = models;

module.exports = db;
