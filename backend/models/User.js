const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema({
  /* ── Core ─────────────────────────────────────────── */
  name: {
    type: String, required: [true, 'Name is required'], trim: true,
    minlength: [2, 'Name must be at least 2 chars'], maxlength: [50, 'Name cannot exceed 50 chars']
  },
  email: {
    type: String, required: [true, 'Email is required'],
    unique: true, lowercase: true, trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  password:  { type: String, minlength: [6, 'Password must be at least 6 chars'], select: false },

  /* ── Google OAuth ─────────────────────────────────── */
  googleId:     { type: String, sparse: true, unique: true },
  authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
  avatar:       { type: String, default: '' },

  /* ── Extended profile ─────────────────────────────── */
  dateOfBirth: { type: Date,   default: null },
  phone:       { type: String, default: '', trim: true, maxlength: 20 },
  bio:         { type: String, default: '', trim: true, maxlength: 300 },
  location:    { type: String, default: '', trim: true, maxlength: 100 },
  gender: {
    type: String,
    enum: ['male', 'female', 'non-binary', 'prefer-not-to-say', ''],
    default: ''
  },
  website:     { type: String, default: '', trim: true, maxlength: 200 },
  occupation:  { type: String, default: '', trim: true, maxlength: 100 },

  /* ── App state ────────────────────────────────────── */
  streak:         { type: Number, default: 0 },
  lastActiveDate: { type: Date,   default: Date.now },

  /* ── Password reset ───────────────────────────────── */
  resetPasswordToken:  { type: String },
  resetPasswordExpiry: { type: Date   },

  createdAt: { type: Date, default: Date.now }
});

/* Hash password before save */
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (candidate) {
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.updateStreak = async function () {
  const today      = new Date(); today.setHours(0,0,0,0);
  const lastActive = new Date(this.lastActiveDate); lastActive.setHours(0,0,0,0);
  const diffDays   = Math.floor((today - lastActive) / 86400000);
  if      (diffDays === 1) this.streak += 1;
  else if (diffDays  >  1) this.streak  = 1;
  this.lastActiveDate = new Date();
  await this.save();
};

module.exports = mongoose.model('User', userSchema);
