const express = require('express');
const router = express.Router();
const Reflection = require('../models/Reflection');
const { protect } = require('../middleware/auth');

router.use(protect);

const moodScoreMap = { amazing: 5, good: 4, neutral: 3, bad: 2, terrible: 1 };

// @route GET /api/reflections
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const reflections = await Reflection.find({ user: req.user._id })
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    const total = await Reflection.countDocuments({ user: req.user._id });
    res.json({ success: true, reflections, total });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching reflections.' });
  }
});

// @route GET /api/reflections/today
router.get('/today', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const reflection = await Reflection.findOne({
      user: req.user._id,
      date: { $gte: today, $lt: tomorrow }
    });

    res.json({ success: true, reflection });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching today\'s reflection.' });
  }
});

// @route POST /api/reflections
router.post('/', async (req, res) => {
  try {
    const { wentWell, notWell, gratitude, mood, date } = req.body;

    // Check if reflection exists for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let reflection = await Reflection.findOne({
      user: req.user._id,
      date: { $gte: today, $lt: tomorrow }
    });

    if (reflection) {
      reflection.wentWell = wentWell || reflection.wentWell;
      reflection.notWell = notWell || reflection.notWell;
      reflection.gratitude = gratitude || reflection.gratitude;
      reflection.mood = mood || reflection.mood;
      reflection.moodScore = moodScoreMap[mood] || reflection.moodScore;
      await reflection.save();
      return res.json({ success: true, message: 'Reflection updated!', reflection });
    }

    reflection = await Reflection.create({
      user: req.user._id,
      wentWell: wentWell || '',
      notWell: notWell || '',
      gratitude: gratitude || '',
      mood: mood || 'neutral',
      moodScore: moodScoreMap[mood] || 3,
      date: date ? new Date(date) : new Date()
    });

    res.status(201).json({ success: true, message: 'Reflection saved!', reflection });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error saving reflection.' });
  }
});

// @route DELETE /api/reflections/:id
router.delete('/:id', async (req, res) => {
  try {
    const reflection = await Reflection.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!reflection) {
      return res.status(404).json({ success: false, message: 'Reflection not found.' });
    }
    res.json({ success: true, message: 'Reflection deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting reflection.' });
  }
});

module.exports = router;
