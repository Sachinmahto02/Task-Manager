const mongoose = require('mongoose');

const reflectionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  wentWell: {
    type: String,
    trim: true,
    maxlength: [1000, 'Cannot exceed 1000 characters'],
    default: ''
  },
  notWell: {
    type: String,
    trim: true,
    maxlength: [1000, 'Cannot exceed 1000 characters'],
    default: ''
  },
  gratitude: {
    type: String,
    trim: true,
    maxlength: [500, 'Cannot exceed 500 characters'],
    default: ''
  },
  mood: {
    type: String,
    enum: ['amazing', 'good', 'neutral', 'bad', 'terrible'],
    default: 'neutral'
  },
  moodScore: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  date: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

reflectionSchema.index({ user: 1, date: -1 });

module.exports = mongoose.model('Reflection', reflectionSchema);
