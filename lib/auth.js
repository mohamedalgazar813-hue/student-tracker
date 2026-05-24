// lib/auth.js — JWT verification helper for serverless functions
'use strict';

const jwt    = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'student_tracker_secret_2024';

/**
 * Verifies the Bearer token in req.headers.authorization.
 * Returns { user } on success or { error, status } on failure.
 */
module.exports = function verifyAuth(req) {
  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer '))
    return { error: 'مش مسجل دخول', status: 401 };
  try {
    const user = jwt.verify(header.split(' ')[1], SECRET);
    return { user };
  } catch {
    return { error: 'الجلسة انتهت، سجّل دخول من جديد', status: 401 };
  }
};
