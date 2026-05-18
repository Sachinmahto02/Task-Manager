const express = require('express');
const router  = express.Router();
const { body, validationResult } = require('express-validator');
const Task    = require('../models/Task');
const { protect } = require('../middleware/auth');

router.use(protect);

/* ─── GET /api/tasks ─── */
router.get('/', async (req, res) => {
  try {
    const { date, category, status, page = 1, limit = 50 } = req.query;
    const query = { user: req.user._id };
    if (date) {
      const s = new Date(date); s.setHours(0,0,0,0);
      const e = new Date(date); e.setHours(23,59,59,999);
      query.date = { $gte: s, $lte: e };
    }
    if (category) query.category = category;
    if (status)   query.status   = status;
    const tasks = await Task.find(query).sort({ createdAt: -1 }).limit(limit*1).skip((page-1)*limit);
    const total = await Task.countDocuments(query);
    res.json({ success: true, tasks, total, page: parseInt(page) });
  } catch { res.status(500).json({ success:false, message:'Error fetching tasks.' }); }
});

/* ─── GET /api/tasks/today ─── */
router.get('/today', async (req, res) => {
  try {
    const today    = new Date(); today.setHours(0,0,0,0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate()+1);
    const tasks = await Task.find({ user: req.user._id, date: { $gte: today, $lt: tomorrow } }).sort({ createdAt: -1 });
    const completed  = tasks.filter(t => t.status==='completed').length;
    const percentage = tasks.length > 0 ? Math.round((completed/tasks.length)*100) : 0;
    res.json({ success:true, tasks, stats:{ total:tasks.length, completed, percentage } });
  } catch { res.status(500).json({ success:false, message:"Error fetching today's tasks." }); }
});

/* ─── GET /api/tasks/history  — tasks grouped by date ─── */
router.get('/history', async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user._id }).sort({ date: -1 });

    // Group by YYYY-MM-DD
    const grouped = {};
    tasks.forEach(t => {
      const key = new Date(t.date).toISOString().split('T')[0];
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(t);
    });

    // Convert to array sorted newest first
    const history = Object.entries(grouped)
      .sort(([a],[b]) => b.localeCompare(a))
      .map(([date, tasks]) => ({
        date,
        total:     tasks.length,
        completed: tasks.filter(t=>t.status==='completed').length,
        tasks
      }));

    res.json({ success:true, history });
  } catch { res.status(500).json({ success:false, message:'Error fetching history.' }); }
});

/* ─── DELETE /api/tasks/history/all ─── */
router.delete('/history/all', async (req, res) => {
  try {
    const result = await Task.deleteMany({ user: req.user._id });
    res.json({ success:true, message:`Deleted all ${result.deletedCount} tasks from history.` });
  } catch { res.status(500).json({ success:false, message:'Error clearing history.' }); }
});

/* ─── DELETE /api/tasks/history/:date  — delete tasks for one date ─── */
router.delete('/history/:date', async (req, res) => {
  try {
    const d = req.params.date;
    const start = new Date(d); start.setHours(0,0,0,0);
    const end   = new Date(d); end.setHours(23,59,59,999);
    const result = await Task.deleteMany({ user: req.user._id, date: { $gte: start, $lte: end } });
    res.json({ success:true, message:`Deleted ${result.deletedCount} tasks for ${d}.` });
  } catch { res.status(500).json({ success:false, message:'Error deleting history for date.' }); }
});

/* ─── POST /api/tasks ─── */
router.post('/', [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max:200 }),
  body('category').isIn(['Study','Health','Work','Personal']).withMessage('Invalid category')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success:false, message:errors.array()[0].msg });
    const { title, description, category, priority, date } = req.body;
    const task = await Task.create({ user:req.user._id, title, description, category, priority:priority||'Medium', date:date?new Date(date):new Date() });
    res.status(201).json({ success:true, message:'Task created!', task });
  } catch { res.status(500).json({ success:false, message:'Error creating task.' }); }
});

/* ─── PUT /api/tasks/:id ─── */
router.put('/:id', async (req, res) => {
  try {
    const task = await Task.findOne({ _id:req.params.id, user:req.user._id });
    if (!task) return res.status(404).json({ success:false, message:'Task not found.' });
    const { title, description, category, priority, status, date } = req.body;
    if (title       !== undefined) task.title       = title;
    if (description !== undefined) task.description = description;
    if (category    !== undefined) task.category    = category;
    if (priority    !== undefined) task.priority    = priority;
    if (date        !== undefined) task.date        = new Date(date);
    if (status      !== undefined) { task.status = status; task.completedAt = status==='completed'?new Date():null; }
    await task.save();
    res.json({ success:true, task });
  } catch { res.status(500).json({ success:false, message:'Error updating task.' }); }
});

/* ─── PATCH /api/tasks/:id/toggle ─── */
router.patch('/:id/toggle', async (req, res) => {
  try {
    const task = await Task.findOne({ _id:req.params.id, user:req.user._id });
    if (!task) return res.status(404).json({ success:false, message:'Task not found.' });
    task.status      = task.status==='completed'?'pending':'completed';
    task.completedAt = task.status==='completed'?new Date():null;
    await task.save();
    res.json({ success:true, task });
  } catch { res.status(500).json({ success:false, message:'Error toggling task.' }); }
});

/* ─── PATCH /api/tasks/:id/rate  — set star rating ─── */
router.patch('/:id/rate', async (req, res) => {
  try {
    const { rating } = req.body;
    if (rating === undefined || rating < 0 || rating > 5)
      return res.status(400).json({ success:false, message:'Rating must be 0-5.' });
    const task = await Task.findOneAndUpdate(
      { _id:req.params.id, user:req.user._id },
      { rating },
      { new:true }
    );
    if (!task) return res.status(404).json({ success:false, message:'Task not found.' });
    res.json({ success:true, task });
  } catch { res.status(500).json({ success:false, message:'Error rating task.' }); }
});

/* ─── DELETE /api/tasks/:id ─── */
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id:req.params.id, user:req.user._id });
    if (!task) return res.status(404).json({ success:false, message:'Task not found.' });
    res.json({ success:true, message:'Task deleted.' });
  } catch { res.status(500).json({ success:false, message:'Error deleting task.' }); }
});

module.exports = router;
