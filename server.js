// server.js — Student Tracker Backend (Render-Ready)
const express  = require('express');
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const path     = require('path');

const User  = require('./models/User');
const Grade = require('./models/Grade');

const app = express();

const PORT      = process.env.PORT      || 3000;
const SECRET    = process.env.JWT_SECRET  || 'student_tracker_secret_2024';
const MONGO_URI = process.env.MONGO_URI   || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/studentTracker';

/* ════════════════════════════════════════
   CORS
════════════════════════════════════════ */
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGIN === '*') {
    res.header('Access-Control-Allow-Origin', '*');
  } else {
    const allowed = ALLOWED_ORIGIN.split(',').map(o => o.trim());
    if (origin && allowed.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin);
    }
  }
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(express.json());

/* ════════════════════════════════════════
   SERVE STATIC FRONTEND
════════════════════════════════════════ */
app.use(express.static(path.join(__dirname)));

/* ════════════════════════════════════════
   MONGODB ATLAS
════════════════════════════════════════ */
mongoose.set('strictQuery', false);

mongoose.connect(MONGO_URI, {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
})
  .then(() => console.log('MongoDB Atlas connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });

mongoose.connection.on('disconnected', () => {
  console.error('MongoDB disconnected — attempting reconnect...');
});

mongoose.connection.on('reconnected', () => {
  console.log('MongoDB reconnected');
});

/* ════════════════════════════════════════
   AUTH MIDDLEWARE
════════════════════════════════════════ */
function auth(req, res, next) {
  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer '))
    return res.status(401).json({ error: 'مش مسجل دخول' });
  try {
    req.user = jwt.verify(header.split(' ')[1], SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'الجلسة انتهت، سجّل دخول من جديد' });
  }
}

/* ════════════════════════════════════════
   HEALTH CHECK — Render ping endpoint
════════════════════════════════════════ */
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Student Tracker API is running' });
});

app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const states  = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  res.json({
    status:   dbState === 1 ? 'ok' : 'degraded',
    database: states[dbState] || 'unknown',
    uptime:   process.uptime(),
  });
});

/* ════════════════════════════════════════
   GET /me
════════════════════════════════════════ */
app.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ error: 'المستخدم مش موجود' });
    res.json(user);
  } catch (err) {
    console.error('GET /me error:', err.message);
    res.status(500).json({ error: 'خطأ في السيرفر' });
  }
});

/* ════════════════════════════════════════
   PUT /me
════════════════════════════════════════ */
app.put('/me', auth, async (req, res) => {
  try {
    const { name, phone, grade, semester, studyYear, birthYear } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'المستخدم مش موجود' });

    if (name      !== undefined) user.name      = name.trim();
    if (phone     !== undefined) user.phone     = phone;
    if (grade     !== undefined) user.grade     = grade;
    if (semester  !== undefined) user.semester  = semester;
    if (studyYear !== undefined) user.studyYear = studyYear;
    if (birthYear !== undefined) user.birthYear = birthYear;

    await user.save();
    res.json(user);
  } catch (err) {
    console.error('PUT /me error:', err.message);
    res.status(500).json({ error: 'خطأ في السيرفر' });
  }
});

/* ════════════════════════════════════════
   POST /register
════════════════════════════════════════ */
app.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ error: 'كل الحقول مطلوبة' });
    if (password.length < 6)
      return res.status(400).json({ error: 'الباسورد لازم يكون 6 أحرف على الأقل' });

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists)
      return res.status(409).json({ error: 'الإيميل ده موجود بالفعل' });

    const hashed = await bcrypt.hash(password, 10);
    await User.create({ name: name.trim(), email: email.toLowerCase(), password: hashed });

    res.status(201).json({ message: 'تم إنشاء الحساب بنجاح' });

  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ error: 'خطأ في السيرفر' });
  }
});

/* ════════════════════════════════════════
   POST /login
════════════════════════════════════════ */
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

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
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'خطأ في السيرفر' });
  }
});

/* ════════════════════════════════════════
   GET /grades
════════════════════════════════════════ */
app.get('/grades', auth, async (req, res) => {
  try {
    const grades = await Grade.find({ userId: req.user.id }).sort({ createdAt: 1 });
    res.json(grades);
  } catch (err) {
    console.error('GET /grades error:', err.message);
    res.status(500).json({ error: 'خطأ في السيرفر' });
  }
});

/* ════════════════════════════════════════
   POST /grades
════════════════════════════════════════ */
app.post('/grades', auth, async (req, res) => {
  try {
    const { subject, name, score, maxScore, isComp, date } = req.body;

    if (!subject || !name || score == null || maxScore == null)
      return res.status(400).json({ error: 'كل الحقول مطلوبة' });

    const grade = await Grade.create({
      userId:   req.user.id,
      subject,
      name,
      score:    Number(score),
      maxScore: Number(maxScore),
      isComp:   Boolean(isComp),
      date:     date ? new Date(date) : new Date(),
    });

    res.status(201).json(grade);
  } catch (err) {
    console.error('POST /grades error:', err.message);
    res.status(500).json({ error: 'خطأ في السيرفر' });
  }
});

/* ════════════════════════════════════════
   PUT /grades/:id
════════════════════════════════════════ */
app.put('/grades/:id', auth, async (req, res) => {
  try {
    const grade = await Grade.findOne({ _id: req.params.id, userId: req.user.id });
    if (!grade) return res.status(404).json({ error: 'الدرجة مش موجودة' });

    const { name, score, maxScore } = req.body;
    if (name     !== undefined) grade.name     = name;
    if (score    !== undefined) grade.score    = Number(score);
    if (maxScore !== undefined) grade.maxScore = Number(maxScore);
    await grade.save();

    res.json(grade);
  } catch (err) {
    console.error('PUT /grades/:id error:', err.message);
    res.status(500).json({ error: 'خطأ في السيرفر' });
  }
});

/* ════════════════════════════════════════
   DELETE /grades/:id
════════════════════════════════════════ */
app.delete('/grades/:id', auth, async (req, res) => {
  try {
    const grade = await Grade.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!grade) return res.status(404).json({ error: 'الدرجة مش موجودة' });
    res.json({ message: 'تم الحذف بنجاح' });
  } catch (err) {
    console.error('DELETE /grades/:id error:', err.message);
    res.status(500).json({ error: 'خطأ في السيرفر' });
  }
});

/* ════════════════════════════════════════
   GLOBAL ERROR HANDLER
════════════════════════════════════════ */
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'خطأ داخلي في السيرفر' });
});

/* ════════════════════════════════════════
   START
════════════════════════════════════════ */
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
