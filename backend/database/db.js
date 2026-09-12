const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/construction_erp';

const defaultAdmin = {
  id: "u_admin",
  name: "Super Admin (Owner)",
  email: "admin@gmail.com",
  password: "admin",
  role: "admin",
  avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80"
};

// In-memory db state (backed purely by MongoDB)
let db = {
  users: [defaultAdmin],
  projects: [],
  employees: [],
  workers: {
    total: 0,
    present: 0,
    absent: 0,
    assignedProject: "",
    list: []
  },
  materials: [],
  expenses: [],
  recentActivities: [],
  materialRequests: [],
  dprs: [],
  invoices: [],
  changeOrders: [],
  isMongoConnected: false
};

// Mongoose Schemas & Models
const schemaOptions = { strict: false, id: false, versionKey: false, timestamps: true };

const createModel = (name, col) => {
  return mongoose.models[name] || mongoose.model(name, new mongoose.Schema({ id: { type: String, index: true } }, schemaOptions), col);
};

const models = {
  projects: createModel('Project', 'projects'),
  users: createModel('User', 'users'),
  materials: createModel('Material', 'materials'),
  expenses: createModel('Expense', 'expenses'),
  materialRequests: createModel('MaterialRequest', 'materialrequests'),
  dprs: createModel('DPR', 'dprs'),
  invoices: createModel('Invoice', 'invoices'),
  changeOrders: createModel('ChangeOrder', 'changeorders'),
  employees: createModel('Employee', 'employees'),
  recentActivities: createModel('RecentActivity', 'recentactivities'),
  workers: createModel('Worker', 'workers')
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
      const id = item.id || (item._id ? String(item._id) : null);
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

    // Delete documents from MongoDB that were deleted in memory
    if (currentIds.length > 0) {
      await Model.deleteMany({ id: { $nin: currentIds, $exists: true } });
    }
  } catch (err) {
    console.error(`[MongoDB] Error syncing collection '${key}':`, err.message);
  }
}

async function syncWorkersToMongo() {
  if (mongoose.connection.readyState !== 1) return;
  try {
    await models.workers.updateOne(
      { type: 'worker_stats' },
      { $set: { type: 'worker_stats', data: db.workers } },
      { upsert: true }
    );
  } catch (err) {
    console.error('[MongoDB] Error syncing workers:', err.message);
  }
}

async function syncAllToMongo() {
  if (isSyncing || mongoose.connection.readyState !== 1) return;
  isSyncing = true;
  try {
    const arrayKeys = [
      'projects',
      'users',
      'materials',
      'expenses',
      'materialRequests',
      'dprs',
      'invoices',
      'changeOrders',
      'employees',
      'recentActivities'
    ];

    for (const key of arrayKeys) {
      if (models[key]) {
        await syncCollectionToMongo(key, models[key]);
      }
    }
    await syncWorkersToMongo();
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
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });
    db.isMongoConnected = true;
    console.log(`[MongoDB] ✅ Connected to MongoDB (${MONGODB_URI})`);

    // Ensure users collection has admin@gmail.com
    const userCount = await models.users.countDocuments();
    if (userCount === 0) {
      console.log('[MongoDB] Seeding default admin user into MongoDB...');
      await models.users.create(defaultAdmin);
    }

    // Load everything directly from MongoDB into memory
    const arrayKeys = [
      'projects',
      'users',
      'materials',
      'expenses',
      'materialRequests',
      'dprs',
      'invoices',
      'changeOrders',
      'employees',
      'recentActivities'
    ];

    for (const key of arrayKeys) {
      const Model = models[key];
      if (!Model) continue;

      const mongoDocs = await Model.find({}).lean();
      db[key] = (mongoDocs || []).map(d => {
        const clean = { ...d };
        clean.id = d.id || String(d._id);
        delete clean._id;
        return clean;
      });
      console.log(`[MongoDB] Loaded ${db[key].length} ${key} from MongoDB`);
    }

    // Load workers
    const workerDoc = await models.workers.findOne({ type: 'worker_stats' }).lean();
    if (workerDoc && workerDoc.data) {
      db.workers = workerDoc.data;
    }

    console.log('[MongoDB] 🚀 All data loaded directly from MongoDB! No local storage used.');
  } catch (err) {
    db.isMongoConnected = false;
    console.error(`[MongoDB] ❌ Fatal error connecting to MongoDB: ${err.message}`);
  }
}

initMongo();

// Direct MongoDB Save function (NO local file write!)
db.save = function() {
  if (db.isMongoConnected && mongoose.connection.readyState === 1) {
    syncAllToMongo().catch(e => console.error('[MongoDB] Save error:', e.message));
  }
};

// Reset function (Clears MongoDB directly)
db.resetAll = function() {
  db.projects = [];
  db.materials = [];
  db.expenses = [];
  db.materialRequests = [];
  db.dprs = [];
  db.invoices = [];
  db.changeOrders = [];

  if (db.isMongoConnected && mongoose.connection.readyState === 1) {
    Promise.all([
      models.projects.deleteMany({}),
      models.materials.deleteMany({}),
      models.expenses.deleteMany({}),
      models.materialRequests.deleteMany({}),
      models.dprs.deleteMany({}),
      models.invoices.deleteMany({}),
      models.changeOrders.deleteMany({})
    ]).catch(e => console.error('[MongoDB] Reset error in Mongo:', e));
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
