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
  clients: [],
  projects: [],
  dprs: [],
  workers: {
    total: 0,
    present: 0,
    absent: 0,
    assignedProject: "",
    list: []
  },
  materials: [],
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

// Mongoose Schemas & Models
const schemaOptions = { strict: false, id: false, versionKey: false, timestamps: true };

const createModel = (name, col) => {
  return mongoose.models[name] || mongoose.model(name, new mongoose.Schema({ id: { type: String, index: true } }, schemaOptions), col);
};

const models = {
  admins: createModel('Admin', 'admins'),
  users: createModel('User', 'users'),
  clients: createModel('Client', 'clients'),
  projects: createModel('Project', 'projects'),
  dprs: createModel('DPR', 'dprs'),
  workers: createModel('Worker', 'workers'),
  materials: createModel('Material', 'materials')
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
    const arrayKeys = ['admins', 'users', 'clients', 'projects', 'dprs', 'materials'];
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
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    db.isMongoConnected = true;
    console.log(`[MongoDB] ✅ Connected to MongoDB (${MONGODB_URI})`);

    // Ensure admins collection has default admin
    const adminCount = await models.admins.countDocuments();
    if (adminCount === 0) {
      console.log('[MongoDB] Seeding default admin into admins collection...');
      await models.admins.create(defaultAdmin);
    }

    // Load data from MongoDB into memory
    const arrayKeys = ['admins', 'users', 'clients', 'projects', 'dprs', 'materials'];
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

    // Drop any old unused collections in MongoDB
    try {
      if (mongoose.connection && mongoose.connection.db) {
        const collections = await mongoose.connection.db.listCollections().toArray();
        const collNames = collections.map(c => c.name);
        const deprecatedCollections = ['equipment', 'expenses', 'recentactivities', 'invoices', 'changeorders', 'employees'];
        for (const dropTarget of deprecatedCollections) {
          if (collNames.includes(dropTarget)) {
            await mongoose.connection.db.dropCollection(dropTarget);
            console.log(`[MongoDB] Removed deprecated collection: '${dropTarget}'`);
          }
        }
      }
    } catch (cleanErr) {}

    // Load workers
    const workerDoc = await models.workers.findOne({ type: 'worker_stats' }).lean();
    if (workerDoc && workerDoc.data) {
      db.workers = workerDoc.data;
    }

    console.log('[MongoDB] 🚀 Collections initialized cleanly!');
  } catch (err) {
    db.isMongoConnected = false;
    console.error(`[MongoDB] ❌ Connection notice: ${err.message}`);
  }
}

initMongo();

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
