const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: [true,'Task title is required'], trim: true, maxlength: 200 },
  description: { type: String, trim: true, maxlength: 500, default: '' },
  category: { type: String, required: true, enum: ['Study','Health','Work','Personal'], default: 'Personal' },
  priority: { type: String, enum: ['Low','Medium','High'], default: 'Medium' },
  status: { type: String, enum: ['pending','completed'], default: 'pending' },
  rating: { type: Number, min: 0, max: 5, default: 0 },   // ← star rating
  completedAt: { type: Date, default: null },
  date: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

taskSchema.index({ user: 1, date: -1 });
taskSchema.index({ user: 1, status: 1 });
module.exports = mongoose.model('Task', taskSchema);
