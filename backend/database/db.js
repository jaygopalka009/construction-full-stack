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
  equipment: [],
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
  recentActivities: createModel('RecentActivity', 'recentactivities'),
  workers: createModel('Worker', 'workers'),
  equipment: createModel('Equipment', 'equipment')
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
      'recentActivities',
      'equipment'
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

const defaultEquipment = [
  {
    id: "eq_1",
    name: "JCB 3DX Super Backhoe Loader",
    type: "Excavator / Loader",
    registrationNo: "GJ-01-EQ-4021",
    status: "Operating",
    operatorName: "Ramesh Solanki",
    operatorPhone: "+91 98251 12345",
    fuelLevel: "78%",
    runningHours: 1420,
    nextServiceHours: 1500,
    hourlyRate: 1200,
    notes: "Assigned to earth excavation and foundation trenching."
  },
  {
    id: "eq_2",
    name: "Potain MCi 85 A Tower Crane",
    type: "Tower Crane",
    registrationNo: "MH-04-TC-1102",
    status: "Operating",
    operatorName: "Vikram Chauhan",
    operatorPhone: "+91 98790 54321",
    fuelLevel: "Electric",
    runningHours: 860,
    nextServiceHours: 1000,
    hourlyRate: 2500,
    notes: "Lifting RCC shuttering panels and reinforcement rebar."
  },
  {
    id: "eq_3",
    name: "Schwing Stetter Transit Mixer (6 m³)",
    type: "Concrete Mixer",
    registrationNo: "GJ-05-TM-8945",
    status: "Idle",
    operatorName: "Mahesh Parmar",
    operatorPhone: "+91 97234 98765",
    fuelLevel: "60%",
    runningHours: 2150,
    nextServiceHours: 2300,
    hourlyRate: 1800,
    notes: "Parked at site yard, ready for next slab casting batch."
  },
  {
    id: "eq_4",
    name: "Hamm 311 Compactor Roller",
    type: "Soil Roller",
    registrationNo: "GJ-01-SC-3312",
    status: "Operating",
    operatorName: "Dilip Patel",
    operatorPhone: "+91 99099 33221",
    fuelLevel: "85%",
    runningHours: 940,
    nextServiceHours: 1000,
    hourlyRate: 1400,
    notes: "Compacting granular sub-base layer."
  },
  {
    id: "eq_5",
    name: "Tata Prima 2830.K Tipper Dumper",
    type: "Dumper Truck",
    registrationNo: "GJ-06-TD-5014",
    status: "Maintenance",
    operatorName: "Kailash Yadav",
    operatorPhone: "+91 98981 77665",
    fuelLevel: "40%",
    runningHours: 3200,
    nextServiceHours: 3200,
    hourlyRate: 1600,
    notes: "Hydraulic hoist cylinder seal replacement under maintenance."
  }
];

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
      'recentActivities',
      'equipment'
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

    // Clean up any old unused collections in MongoDB if they exist
    try {
      if (mongoose.connection && mongoose.connection.db) {
        const collections = await mongoose.connection.db.listCollections().toArray();
        const collNames = collections.map(c => c.name);
        for (const dropTarget of ['invoices', 'changeorders', 'employees']) {
          if (collNames.includes(dropTarget)) {
            await mongoose.connection.db.dropCollection(dropTarget);
            console.log(`[MongoDB] Removed unused collection: '${dropTarget}'`);
          }
        }
      }
    } catch (cleanErr) {}

    // Seed equipment if empty
    if (!db.equipment || db.equipment.length === 0) {
      console.log('[MongoDB] Seeding initial construction equipment into MongoDB...');
      db.equipment = [...defaultEquipment];
      for (const eq of defaultEquipment) {
        await models.equipment.updateOne({ id: eq.id }, { $set: eq }, { upsert: true });
      }
      console.log(`[MongoDB] Seeded ${defaultEquipment.length} heavy machinery items`);
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
    // If mongo is not reachable, still supply default equipment in memory
    if (!db.equipment || db.equipment.length === 0) {
      db.equipment = [...defaultEquipment];
    }
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
  db.equipment = [];

  if (db.isMongoConnected && mongoose.connection.readyState === 1) {
    Promise.all([
      models.projects.deleteMany({}),
      models.materials.deleteMany({}),
      models.expenses.deleteMany({}),
      models.materialRequests.deleteMany({}),
      models.dprs.deleteMany({}),
      models.equipment.deleteMany({})
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
