// api/register.js → POST /api/register
'use strict';

const connectDB = require('../lib/db');
const setCors   = require('../lib/cors');
const User      = require('../models/User');
const bcrypt    = require('bcryptjs');

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  try {
    await connectDB();

    const { name, email, password } = req.body || {};

    if (!name || !email || !password)
      return res.status(400).json({ error: 'كل الحقول مطلوبة' });
    if (password.length < 6)
      return res.status(400).json({ error: 'الباسورد لازم يكون 6 أحرف على الأقل' });

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists)
      return res.status(409).json({ error: 'الإيميل ده موجود بالفعل' });

    const hashed = await bcrypt.hash(password, 10);
    await User.create({
      name:     name.trim(),
      email:    email.toLowerCase(),
      password: hashed,
    });

    res.status(201).json({ message: 'تم إنشاء الحساب بنجاح' });

  } catch (err) {
    console.error('POST /api/register:', err.message);
    res.status(500).json({ error: 'خطأ في السيرفر' });
  }
};
