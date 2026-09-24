const mongoose = require('mongoose');

async function clean() {
  await mongoose.connect('mongodb://127.0.0.1:27017/construction_erp');
  const collections = await mongoose.connection.db.collections();
  for (const c of collections) {
    if (c.collectionName === 'admins') {
      await c.deleteMany({ email: { $ne: 'admin@gmail.com' } });
      console.log('admins: default admin preserved');
    } else {
      await c.drop().catch(() => c.deleteMany({}));
      console.log('dropped:', c.collectionName);
    }
  }
  console.log('DATABASE_CLEAN_SUCCESS');
  process.exit(0);
}

clean();
