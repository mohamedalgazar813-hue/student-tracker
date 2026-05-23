// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name:         { type: String,  required: true, trim: true },
  email:        { type: String,  required: true, unique: true, lowercase: true, trim: true },
  password:     { type: String,  required: true },

  /* ── Profile fields (each user's own data) ── */
  phone:        { type: String,  default: '' },
  grade:        { type: String,  default: 'الصف الثاني الثانوي' },
  semester:     { type: String,  default: 'الفصل الدراسي الأول' },
  studyYear:    { type: String,  default: '2024–2025' },
  birthYear:    { type: String,  default: '' },

}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
