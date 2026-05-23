const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject:    { type: String, required: true },   // subject id e.g. 'arabic'
  name:       { type: String, required: true },   // exam name
  score:      { type: Number, required: true },
  total:      { type: Number, required: true },
  isComp:     { type: Boolean, default: false },  // true = comprehensive exam
}, { timestamps: true });

module.exports = mongoose.model('Exam', examSchema);
