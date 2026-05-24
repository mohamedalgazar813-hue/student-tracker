// lib/db.js — Cached MongoDB connection for Vercel serverless
'use strict';

const mongoose = require('mongoose');

// Re-use connection across warm lambda invocations
let cached = global._mongoCache;
if (!cached) cached = global._mongoCache = { conn: null, promise: null };

module.exports = async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGO_URI environment variable is not set');

    mongoose.set('strictQuery', false);

    cached.promise = mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS:          45000,
      maxPoolSize:              5,
      bufferCommands:           false,
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }

  return cached.conn;
};
