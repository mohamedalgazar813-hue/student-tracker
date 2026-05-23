// models/Grade.js
const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema({
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject:  { type: String, required: true },   // subject id, e.g. 'arabic'
  name:     { type: String, required: true },   // exam name
  score:    { type: Number, required: true },
  maxScore: { type: Number, required: true },   // matches "total" in frontend
  isComp:   { type: Boolean, default: false },  // true = comprehensive exam
  date:     { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Grade', gradeSchema);
