// lib/cors.js — CORS headers helper for serverless functions
'use strict';

module.exports = function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin',      '*');
  res.setHeader('Access-Control-Allow-Methods',     'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers',     'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
};
