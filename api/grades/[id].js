// api/grades/[id].js → PUT    /api/grades/:id  (edit grade)
//                    → DELETE /api/grades/:id  (delete grade)
'use strict';

const connectDB  = require('../../lib/db');
const setCors    = require('../../lib/cors');
const verifyAuth = require('../../lib/auth');
const Grade      = require('../../models/Grade');

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { user, error, status } = verifyAuth(req);
  if (error) return res.status(status).json({ error });

  const { id } = req.query;

  try {
    await connectDB();

    /* ── PUT /api/grades/:id ── */
    if (req.method === 'PUT') {
      const grade = await Grade.findOne({ _id: id, userId: user.id });
      if (!grade) return res.status(404).json({ error: 'الدرجة مش موجودة' });

      const { name, score, maxScore } = req.body || {};
      if (name     !== undefined) grade.name     = name;
      if (score    !== undefined) grade.score    = Number(score);
      if (maxScore !== undefined) grade.maxScore = Number(maxScore);
      await grade.save();

      return res.json(grade);
    }

    /* ── DELETE /api/grades/:id ── */
    if (req.method === 'DELETE') {
      const grade = await Grade.findOneAndDelete({ _id: id, userId: user.id });
      if (!grade) return res.status(404).json({ error: 'الدرجة مش موجودة' });
      return res.json({ message: 'تم الحذف بنجاح' });
    }

    res.status(405).json({ error: 'Method not allowed' });

  } catch (err) {
    console.error('/api/grades/[id]:', err.message);
    res.status(500).json({ error: 'خطأ في السيرفر' });
  }
};
