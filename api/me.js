// api/me.js → GET /api/me  (fetch profile)
//           → PUT /api/me  (update profile)
'use strict';

const connectDB  = require('../lib/db');
const setCors    = require('../lib/cors');
const verifyAuth = require('../lib/auth');
const User       = require('../models/User');

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { user, error, status } = verifyAuth(req);
  if (error) return res.status(status).json({ error });

  try {
    await connectDB();

    /* ── GET /api/me ── */
    if (req.method === 'GET') {
      const found = await User.findById(user.id).select('-password');
      if (!found) return res.status(404).json({ error: 'المستخدم مش موجود' });
      return res.json(found);
    }

    /* ── PUT /api/me ── */
    if (req.method === 'PUT') {
      const { name, phone, grade, semester, studyYear, birthYear } = req.body || {};
      const found = await User.findById(user.id);
      if (!found) return res.status(404).json({ error: 'المستخدم مش موجود' });

      if (name      !== undefined) found.name      = name.trim();
      if (phone     !== undefined) found.phone     = phone;
      if (grade     !== undefined) found.grade     = grade;
      if (semester  !== undefined) found.semester  = semester;
      if (studyYear !== undefined) found.studyYear = studyYear;
      if (birthYear !== undefined) found.birthYear = birthYear;

      await found.save();
      return res.json(found);
    }

    res.status(405).json({ error: 'Method not allowed' });

  } catch (err) {
    console.error('/api/me:', err.message);
    res.status(500).json({ error: 'خطأ في السيرفر' });
  }
};
