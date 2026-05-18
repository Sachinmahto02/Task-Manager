const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Reflection = require('../models/Reflection');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

router.use(protect);

// @route GET /api/analytics/overview
router.get('/overview', async (req, res) => {
  try {
    const userId = req.user._id;

    // Today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // This week
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());

    // This month
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    // Today's tasks
    const todayTasks = await Task.find({ user: userId, date: { $gte: today, $lt: tomorrow } });
    const todayCompleted = todayTasks.filter(t => t.status === 'completed').length;
    const todayPercentage = todayTasks.length > 0 ? Math.round((todayCompleted / todayTasks.length) * 100) : 0;

    // Weekly tasks
    const weekTasks = await Task.find({ user: userId, date: { $gte: weekStart, $lt: tomorrow } });
    const weekCompleted = weekTasks.filter(t => t.status === 'completed').length;
    const weekPercentage = weekTasks.length > 0 ? Math.round((weekCompleted / weekTasks.length) * 100) : 0;

    // Monthly tasks
    const monthTasks = await Task.find({ user: userId, date: { $gte: monthStart, $lt: tomorrow } });
    const monthCompleted = monthTasks.filter(t => t.status === 'completed').length;
    const monthPercentage = monthTasks.length > 0 ? Math.round((monthCompleted / monthTasks.length) * 100) : 0;

    // Category breakdown
    const categories = ['Study', 'Health', 'Work', 'Personal'];
    const categoryStats = {};
    for (const cat of categories) {
      const catTasks = monthTasks.filter(t => t.category === cat);
      const catCompleted = catTasks.filter(t => t.status === 'completed').length;
      categoryStats[cat] = {
        total: catTasks.length,
        completed: catCompleted,
        percentage: catTasks.length > 0 ? Math.round((catCompleted / catTasks.length) * 100) : 0
      };
    }

    // Last 7 days productivity
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(today);
      day.setDate(today.getDate() - i);
      const dayEnd = new Date(day);
      dayEnd.setHours(23, 59, 59, 999);

      const dayTasks = weekTasks.filter(t => {
        const taskDate = new Date(t.date);
        return taskDate >= day && taskDate <= dayEnd;
      });
      const dayCompleted = dayTasks.filter(t => t.status === 'completed').length;

      last7Days.push({
        date: day.toISOString().split('T')[0],
        day: day.toLocaleDateString('en', { weekday: 'short' }),
        total: dayTasks.length,
        completed: dayCompleted,
        percentage: dayTasks.length > 0 ? Math.round((dayCompleted / dayTasks.length) * 100) : 0
      });
    }

    // Mood data from reflections
    const recentReflections = await Reflection.find({
      user: userId,
      date: { $gte: weekStart, $lt: tomorrow }
    }).sort({ date: 1 });

    const moodData = recentReflections.map(r => ({
      date: r.date.toISOString().split('T')[0],
      mood: r.mood,
      score: r.moodScore
    }));

    // User streak
    const user = await User.findById(userId);

    res.json({
      success: true,
      data: {
        today: { total: todayTasks.length, completed: todayCompleted, percentage: todayPercentage },
        week: { total: weekTasks.length, completed: weekCompleted, percentage: weekPercentage },
        month: { total: monthTasks.length, completed: monthCompleted, percentage: monthPercentage },
        categoryStats,
        last7Days,
        moodData,
        streak: user.streak
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ success: false, message: 'Error fetching analytics.' });
  }
});

module.exports = router;
