'use strict';

const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/joobs';
  mongoose.set('strictQuery', true);

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
    });
    console.log(`\x1b[32m✓ MongoDB bağlandı:\x1b[0m ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (err) {
    console.error('\x1b[31m✗ MongoDB bağlantı hatası:\x1b[0m', err.message);
    console.error('  → MongoDB çalışıyor mu? (brew services start mongodb-community)');
    process.exit(1);
  }
}

module.exports = connectDB;
