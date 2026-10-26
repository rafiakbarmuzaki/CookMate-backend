const mongoose = require('mongoose');

// Cache koneksi di global supaya dipakai ulang antar invocation serverless.
const cached = global._mongoose || (global._mongoose = { conn: null, promise: null });

async function connectDB() {
  if (cached.conn) return cached.conn;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI belum diatur di environment');
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, { bufferCommands: false }).catch((error) => {
      cached.promise = null;
      throw error;
    });
  }

  cached.conn = await cached.promise;
  console.log(`MongoDB Atlas terhubung: ${cached.conn.connection.host}`);
  return cached.conn;
}

module.exports = connectDB;
