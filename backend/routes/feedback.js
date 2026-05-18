const express  = require('express');
const router   = express.Router();
const { body, validationResult } = require('express-validator');
const Feedback = require('../models/Feedback');
const { protect } = require('../middleware/auth');

router.use(protect);

/* GET /api/feedback */
router.get('/', async (req, res) => {
  try {
    const items = await Feedback.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, feedbacks: items });
  } catch { res.status(500).json({ success:false, message:'Error fetching feedback.' }); }
});

/* POST /api/feedback */
router.post('/', [
  body('content').trim().notEmpty().withMessage('Feedback content required').isLength({ max:1000 }),
  body('mood').optional().isIn(['great','good','okay','bad','terrible'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success:false, message:errors.array()[0].msg });
    const { content, mood, tags } = req.body;
    const fb = await Feedback.create({ user:req.user._id, content, mood:mood||'good', tags:tags||[] });
    res.status(201).json({ success:true, feedback: fb });
  } catch { res.status(500).json({ success:false, message:'Error saving feedback.' }); }
});

/* PUT /api/feedback/:id — edit content */
router.put('/:id', [
  body('content').trim().notEmpty().withMessage('Content required').isLength({ max:1000 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success:false, message:errors.array()[0].msg });
    const fb = await Feedback.findOneAndUpdate(
      { _id:req.params.id, user:req.user._id },
      { content: req.body.content },
      { new:true }
    );
    if (!fb) return res.status(404).json({ success:false, message:'Not found.' });
    res.json({ success:true, feedback: fb });
  } catch { res.status(500).json({ success:false, message:'Error editing feedback.' }); }
});

/* DELETE /api/feedback/:id */
router.delete('/:id', async (req, res) => {
  try {
    const fb = await Feedback.findOneAndDelete({ _id:req.params.id, user:req.user._id });
    if (!fb) return res.status(404).json({ success:false, message:'Feedback not found.' });
    res.json({ success:true, message:'Feedback deleted.' });
  } catch { res.status(500).json({ success:false, message:'Error deleting feedback.' }); }
});

/* DELETE /api/feedback/all — clear all */
router.delete('/all/clear', async (req, res) => {
  try {
    const r = await Feedback.deleteMany({ user:req.user._id });
    res.json({ success:true, message:`Cleared ${r.deletedCount} entries.` });
  } catch { res.status(500).json({ success:false, message:'Error clearing feedback.' }); }
});

module.exports = router;
