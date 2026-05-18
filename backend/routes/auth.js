const express          = require('express');
const router           = express.Router();
const crypto           = require('crypto');
const jwt              = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { body, validationResult } = require('express-validator');

const User                                  = require('../models/User');
const { protect }                           = require('../middleware/auth');
const { sendEmail, passwordResetTemplate, welcomeTemplate } = require('../utils/sendEmail');

// ── Helpers ───────────────────────────────────────────────────────────────────

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });

const userPayload = (user) => ({
  id:           user._id,
  name:         user.name,
  email:        user.email,
  avatar:       user.avatar,
  authProvider: user.authProvider,
  streak:       user.streak,
  createdAt:    user.createdAt,
  /* extended profile */
  dateOfBirth:  user.dateOfBirth  || null,
  phone:        user.phone        || '',
  bio:          user.bio          || '',
  location:     user.location     || '',
  gender:       user.gender       || '',
  website:      user.website      || '',
  occupation:   user.occupation   || '',
});

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ─────────────────────────────────────────────────────────────────────────────
// @route POST /api/auth/register
// ─────────────────────────────────────────────────────────────────────────────
router.post('/register', [
  body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ success: false, message: errors.array()[0].msg });

    const { name, password } = req.body;
    const email = (req.body.email || '').toLowerCase().trim();

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ success: false, message: 'Email already registered. Please login.' });

    const user  = await User.create({ name, email, password, authProvider: 'local' });
    const token = generateToken(user._id);

    // Send welcome email (non-blocking — don't fail registration if email fails)
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      sendEmail({
        to:      email,
        subject: '✦ Welcome to ZenFlow Journal!',
        html:    welcomeTemplate(name, `${process.env.CLIENT_URL}/login`)
      }).catch(err => console.warn('Welcome email failed:', err.message));
    }

    res.status(201).json({ success: true, message: 'Account created!', token, user: userPayload(user) });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// @route POST /api/auth/login
// ─────────────────────────────────────────────────────────────────────────────
router.post('/login', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ success: false, message: errors.array()[0].msg });

    const email    = (req.body.email || '').toLowerCase().trim();
    const password = req.body.password;

    const user = await User.findOne({ email }).select('+password');
    if (!user)
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });

    // Google-only user — no password set
    if (user.authProvider === 'google' && !user.password) {
      return res.status(401).json({
        success: false,
        message: 'This account uses Google Sign-In. Please use "Sign in with Google".'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch)
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });

    await user.updateStreak();
    const token = generateToken(user._id);

    res.json({ success: true, message: 'Login successful!', token, user: userPayload(user) });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// @route POST /api/auth/google
// Verify Google credential, find-or-create user, return JWT
// ─────────────────────────────────────────────────────────────────────────────
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential)
      return res.status(400).json({ success: false, message: 'Google credential is required.' });

    if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID_HERE.apps.googleusercontent.com') {
      return res.status(503).json({
        success: false,
        message: 'Google OAuth is not configured. Please set GOOGLE_CLIENT_ID in backend/.env'
      });
    }

    // Verify the ID token
    let ticket;
    try {
      ticket = await googleClient.verifyIdToken({
        idToken:  credential,
        audience: process.env.GOOGLE_CLIENT_ID
      });
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid Google credential. Please try again.' });
    }

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // 1. Try find by googleId
    let user = await User.findOne({ googleId });

    // 2. If not found, try by email (user may have registered locally before)
    if (!user) {
      user = await User.findOne({ email });

      if (user) {
        // Existing local user — link Google to their account
        user.googleId     = googleId;
        user.authProvider = 'google'; // or 'both' — we keep 'google' for simplicity
        if (!user.avatar && picture) user.avatar = picture;
        await user.save({ validateBeforeSave: false });
      } else {
        // Brand-new user via Google
        user = await User.create({
          name,
          email,
          googleId,
          avatar:       picture || '',
          authProvider: 'google'
        });

        // Welcome email
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
          sendEmail({
            to:      email,
            subject: '✦ Welcome to ZenFlow Journal!',
            html:    welcomeTemplate(name, `${process.env.CLIENT_URL}/dashboard`)
          }).catch(err => console.warn('Welcome email failed:', err.message));
        }
      }
    }

    await user.updateStreak();
    const token = generateToken(user._id);

    res.json({ success: true, message: 'Google login successful!', token, user: userPayload(user) });
  } catch (err) {
    console.error('Google login error:', err);
    res.status(500).json({ success: false, message: 'Server error during Google login.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// @route GET /api/auth/me
// ─────────────────────────────────────────────────────────────────────────────
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, user: userPayload(user) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// @route POST /api/auth/logout
// ─────────────────────────────────────────────────────────────────────────────
router.post('/logout', protect, (req, res) => {
  res.json({ success: true, message: 'Logged out successfully.' });
});

// ─────────────────────────────────────────────────────────────────────────────
// @route POST /api/auth/forgot-password
// Generate hashed token, store expiry, send email with reset link
// ─────────────────────────────────────────────────────────────────────────────
router.post('/forgot-password', [
  body('email').isEmail().withMessage('Valid email required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ success: false, message: errors.array()[0].msg });

    const email = (req.body.email || '').toLowerCase().trim();
    const user  = await User.findOne({ email });

    // Always send 200 to prevent email enumeration
    if (!user) {
      return res.json({
        success: true,
        message: 'If an account with that email exists, a reset link has been sent.'
      });
    }

    // Google-only accounts cannot use email-based reset
    if (user.authProvider === 'google' && !user.password) {
      return res.json({
        success: true,
        message: 'This account uses Google Sign-In and does not have a password. Please sign in with Google.'
      });
    }

    // Generate plain token + its hash
    const rawToken   = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    const EXPIRY_MINUTES = 30;
    user.resetPasswordToken  = hashedToken;
    user.resetPasswordExpiry = Date.now() + EXPIRY_MINUTES * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`;

    // Send email
    const emailConfigured = process.env.EMAIL_USER &&
                            process.env.EMAIL_PASS &&
                            process.env.EMAIL_USER !== 'your_gmail@gmail.com';

    if (emailConfigured) {
      await sendEmail({
        to:      email,
        subject: '🔑 Reset Your ZenFlow Password',
        html:    passwordResetTemplate(user.name, resetUrl, EXPIRY_MINUTES)
      });

      return res.json({
        success: true,
        message: `Password reset link sent to ${email}. It expires in ${EXPIRY_MINUTES} minutes.`
      });
    } else {
      // Email not configured — return link for local dev
      console.log('\n🔑 RESET LINK (email not configured):', resetUrl, '\n');
      return res.json({
        success: true,
        devMode: true,
        message: 'Email not configured — reset link returned for local development.',
        resetUrl,
        resetToken: rawToken
      });
    }
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ success: false, message: 'Failed to send reset email. Please try again.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// @route POST /api/auth/reset-password
// Verify hashed token + expiry, update password
// ─────────────────────────────────────────────────────────────────────────────
router.post('/reset-password', [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ success: false, message: errors.array()[0].msg });

    const { token, email, password } = req.body;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      email,
      resetPasswordToken:  hashedToken,
      resetPasswordExpiry: { $gt: Date.now() }
    });

    if (!user)
      return res.status(400).json({
        success: false,
        message: 'Reset link is invalid or has expired. Please request a new one.'
      });

    // Update password and clear reset fields
    user.password            = password;
    user.resetPasswordToken  = undefined;
    user.resetPasswordExpiry = undefined;
    await user.save();

    const jwtToken = generateToken(user._id);

    res.json({
      success: true,
      message: 'Password reset successfully! You are now logged in.',
      token:   jwtToken,
      user:    userPayload(user)
    });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ success: false, message: 'Server error during password reset.' });
  }
});


// ─────────────────────────────────────────────────────────────────────────────
// @route PUT /api/auth/profile  — update personal info
// ─────────────────────────────────────────────────────────────────────────────
router.put('/profile', protect, [
  body('name').optional().trim().isLength({ min:2, max:50 }).withMessage('Name must be 2-50 characters'),
  body('phone').optional().trim().isLength({ max:20 }).withMessage('Phone too long'),
  body('bio').optional().trim().isLength({ max:300 }).withMessage('Bio max 300 characters'),
  body('location').optional().trim().isLength({ max:100 }),
  body('occupation').optional().trim().isLength({ max:100 }),
  body('website').optional().trim().isLength({ max:200 }),
  body('gender').optional().isIn(['male','female','non-binary','prefer-not-to-say','']),
  body('dateOfBirth').optional().custom(v => {
    if (!v) return true;
    const d = new Date(v);
    if (isNaN(d)) throw new Error('Invalid date of birth');
    if (d > new Date()) throw new Error('Date of birth cannot be in the future');
    return true;
  }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ success:false, message: errors.array()[0].msg });

    const allowed = ['name','phone','bio','location','gender','website','occupation','dateOfBirth','avatar'];
    const updates = {};
    allowed.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    // Prevent email change through this route (security)
    delete updates.email;
    delete updates.password;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!user) return res.status(404).json({ success:false, message:'User not found.' });

    res.json({ success:true, message:'Profile updated successfully!', user: userPayload(user) });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ success:false, message: err.message || 'Server error during profile update.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// @route PUT /api/auth/change-password  — change password (when logged in)
// ─────────────────────────────────────────────────────────────────────────────
router.put('/change-password', protect, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min:6 }).withMessage('New password must be at least 6 characters'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ success:false, message: errors.array()[0].msg });

    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (!user) return res.status(404).json({ success:false, message:'User not found.' });

    if (user.authProvider === 'google' && !user.password) {
      return res.status(400).json({ success:false, message:'Google accounts cannot change password here. Use Google account settings.' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(401).json({ success:false, message:'Current password is incorrect.' });

    user.password = newPassword;
    await user.save();

    res.json({ success:true, message:'Password changed successfully!' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ success:false, message:'Server error.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// @route POST /api/auth/delete-account  — permanently delete account
// (Using POST instead of DELETE so the password body is reliably received)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/delete-account', protect, [
  body('password').notEmpty().withMessage('Password is required to delete account'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ success: false, message: errors.array()[0].msg });

    const { password } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    // Google-only accounts don't have a local password
    if (user.authProvider === 'google' && !user.password) {
      return res.status(400).json({
        success: false,
        message: 'Google accounts cannot be deleted this way. Please manage your account through Google.'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect password. Please try again.' });
    }

    const userId = user._id;

    // Delete all associated data
    const Task       = require('../models/Task');
    const Reflection = require('../models/Reflection');
    const Feedback   = require('../models/Feedback');

    await Promise.all([
      Task.deleteMany({ user: userId }),
      Reflection.deleteMany({ user: userId }),
      Feedback.deleteMany({ user: userId }),
      User.findByIdAndDelete(userId),
    ]);

    res.json({ success: true, message: 'Account and all associated data deleted permanently.' });
  } catch (err) {
    console.error('Delete account error:', err);
    res.status(500).json({ success: false, message: 'Server error during account deletion.' });
  }
});

module.exports = router;
