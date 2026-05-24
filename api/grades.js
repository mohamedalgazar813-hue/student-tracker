// api/grades.js → GET  /api/grades  (fetch all grades)
//              → POST /api/grades  (add new grade)
'use strict';

const connectDB  = require('../lib/db');
const setCors    = require('../lib/cors');
const verifyAuth = require('../lib/auth');
const Grade      = require('../models/Grade');

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { user, error, status } = verifyAuth(req);
  if (error) return res.status(status).json({ error });

  try {
    await connectDB();

    /* ── GET /api/grades ── */
    if (req.method === 'GET') {
      const grades = await Grade.find({ userId: user.id }).sort({ createdAt: 1 });
      return res.json(grades);
    }

    /* ── POST /api/grades ── */
    if (req.method === 'POST') {
      const { subject, name, score, maxScore, isComp, date } = req.body || {};

      if (!subject || !name || score == null || maxScore == null)
        return res.status(400).json({ error: 'كل الحقول مطلوبة' });

      const grade = await Grade.create({
        userId:   user.id,
        subject,
        name,
        score:    Number(score),
        maxScore: Number(maxScore),
        isComp:   Boolean(isComp),
        date:     date ? new Date(date) : new Date(),
      });

      return res.status(201).json(grade);
    }

    res.status(405).json({ error: 'Method not allowed' });

  } catch (err) {
    console.error('/api/grades:', err.message);
    res.status(500).json({ error: 'خطأ في السيرفر' });
  }
};
