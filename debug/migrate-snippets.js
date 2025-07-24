// migrate-snippets.js
const mongoose = require('mongoose');
const path = require('path');

// Use the same model as the app
const Snippet = require(path.join(__dirname, 'src', 'models', 'Snippet')).default || require(path.join(__dirname, 'src', 'models', 'Snippet'));

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('Please set MONGODB_URI in your environment.');
  process.exit(1);
}

async function migrate() {
  await mongoose.connect(MONGODB_URI);
  const result = await Snippet.updateMany(
    { userId: { $exists: false } },
    { $set: { userId: 'MIGRATE_ME' } }
  );
  console.log(`Updated ${result.modifiedCount || result.nModified} snippets.`);
  await mongoose.disconnect();
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
}); 