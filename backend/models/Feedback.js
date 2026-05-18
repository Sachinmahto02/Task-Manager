const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  content: { type: String, required: true, trim: true, maxlength: 1000 },
  mood: { type: String, enum: ['great','good','okay','bad','terrible'], default: 'good' },
  tags: [{ type: String, maxlength: 30 }],
  createdAt: { type: Date, default: Date.now }
});

feedbackSchema.index({ user: 1, createdAt: -1 });
module.exports = mongoose.model('Feedback', feedbackSchema);
