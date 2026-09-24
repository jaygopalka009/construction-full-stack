const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/construction_erp';

async function cleanAllData() {
  console.log('Connecting to MongoDB at:', MONGODB_URI);
  await mongoose.connect(MONGODB_URI);

  const db = mongoose.connection.db;

  // 1. Delete all operational and site data
  const collectionsToClear = [
    'projects',
    'tasks',
    'dprs',
    'reports',
    'expenses',
    'payments',
    'materials',
    'notifications',
    'workers'
  ];

  for (const colName of collectionsToClear) {
    try {
      const col = db.collection(colName);
      const res = await col.deleteMany({});
      console.log(`Cleared '${colName}': deleted ${res.deletedCount} documents`);
    } catch (err) {
      console.log(`Notice on '${colName}':`, err.message);
    }
  }

  // Drop deprecated collections if any exist
  const deprecated = ['clients', 'equipment', 'labors', 'materialrequests', 'sampletests', 'vendors', 'recentactivities', 'invoices', 'changeorders', 'employees'];
  for (const dep of deprecated) {
    try {
      await db.dropCollection(dep);
      console.log(`Dropped deprecated collection: ${dep}`);
    } catch (e) {}
  }

  // 2. Ensure default admin exists
  const adminsCol = db.collection('admins');
  await adminsCol.deleteMany({ email: { $ne: 'admin@gmail.com' } });
  const adminDoc = await adminsCol.findOne({ email: 'admin@gmail.com' });
  if (!adminDoc) {
    await adminsCol.insertOne({
      id: "1",
      name: "Super Admin (Owner)",
      email: "admin@gmail.com",
      password: "admin",
      role: "admin",
      avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80"
    });
    console.log('Created default admin: admin@gmail.com / admin');
  } else {
    console.log('Preserved default admin: admin@gmail.com');
  }

  // 3. Reset site engineer raj's project assignment so they are clean and ready
  const usersCol = db.collection('users');
  await usersCol.updateMany({ email: 'raj@gmail.com' }, { $set: { projectId: '' } });
  const engineersCol = db.collection('engineers');
  await engineersCol.updateMany({ email: 'raj@gmail.com' }, { $set: { assignedProjectId: '' } });
  console.log('Reset site engineer raj@gmail.com to unassigned state');

  console.log('==============================================');
  console.log('ALL DATA CLEANED SUCCESSFULLY!');
  console.log('Database is now completely fresh and clean.');
  console.log('Admin login: admin@gmail.com / admin');
  console.log('Site Engineer login: raj@gmail.com / 123456');
  console.log('==============================================');

  await mongoose.disconnect();
  process.exit(0);
}

cleanAllData().catch(err => {
  console.error('Error cleaning data:', err);
  process.exit(1);
});
