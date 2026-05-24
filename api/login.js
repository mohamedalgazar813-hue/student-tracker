// api/login.js → POST /api/login
'use strict';

const connectDB = require('../lib/db');
const setCors   = require('../lib/cors');
const User      = require('../models/User');
const bcrypt    = require('bcryptjs');
const jwt       = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'student_tracker_secret_2024';

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  try {
    await connectDB();

    const { email, password } = req.body || {};

    if (!email || !password)
      return res.status(400).json({ error: 'أدخل الإيميل والباسورد' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user)
      return res.status(401).json({ error: 'الإيميل أو الباسورد غلط' });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(401).json({ error: 'الإيميل أو الباسورد غلط' });

    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email },
      SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, name: user.name, email: user.email });

  } catch (err) {
    console.error('POST /api/login:', err.message);
    res.status(500).json({ error: 'خطأ في السيرفر' });
  }
};
