// api/health.js → GET /api/health
'use strict';

const connectDB = require('../lib/db');
const setCors   = require('../lib/cors');
const mongoose  = require('mongoose');

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    await connectDB();
  } catch {}

  const states  = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  const dbState = mongoose.connection.readyState;

  res.status(dbState === 1 ? 200 : 503).json({
    status:   dbState === 1 ? 'ok' : 'degraded',
    database: states[dbState] || 'unknown',
    uptime:   Math.floor(process.uptime()),
    platform: 'vercel-serverless',
  });
};
