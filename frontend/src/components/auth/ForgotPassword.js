import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-toastify';
import './Auth.css';

const ForgotPassword = () => {
  const [email, setEmail]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage]   = useState('');
  const [devInfo, setDevInfo]   = useState(null);  // only in dev when email not configured
  const [error, setError]       = useState('');

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await axios.post('/api/auth/forgot-password', { email });
      setMessage(res.data.message);
      setSubmitted(true);

      // Dev mode: email not configured, link returned directly
      if (res.data.devMode && res.data.resetUrl) {
        setDevInfo({ url: res.data.resetUrl, token: res.data.resetToken });
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Something went wrong. Please try again.';
      toast.error(msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-orbs">
        <div className="orb orb-1" /><div className="orb orb-2" /><div className="orb orb-3" />
      </div>

      <motion.div
        className="auth-container"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
      >
        <Link to="/login" className="back-link">← Back to Sign In</Link>

        <div className="auth-header">
          <motion.div className="auth-logo animate-float"
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}>🔑</motion.div>
          <h1 className="auth-title">Forgot Password</h1>
          <p className="auth-subtitle">
            {submitted ? 'Check your email inbox' : "Enter your email — we'll send you a reset link"}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {!submitted ? (
            /* ── Request form ── */
            <motion.div key="form"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {error && (
                <div className="auth-error" style={{ marginBottom: 16 }}>
                  <span>⚠️</span> {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="auth-form" noValidate>
                <div className="input-group">
                  <label className="input-label">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(''); }}
                    placeholder="you@example.com"
                    className={`input-field ${error ? 'input-error' : ''}`}
                    autoFocus autoComplete="email"
                  />
                </div>

                <motion.button type="submit"
                  className="btn btn-primary btn-lg w-full auth-submit"
                  disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  {loading
                    ? <><div className="spinner" style={{ width: 18, height: 18 }} /> Sending…</>
                    : <>Send Reset Link →</>}
                </motion.button>
              </form>

              <div className="auth-footer" style={{ marginTop: 16 }}>
                <p>Remember your password? <Link to="/login">Sign in →</Link></p>
              </div>
            </motion.div>

          ) : (
            /* ── Success state ── */
            <motion.div key="success"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}>

              <div className="auth-success">
                <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>
                  {devInfo ? '🛠️' : '📧'}
                </span>
                <div>
                  <strong style={{ display: 'block', marginBottom: 4 }}>
                    {devInfo ? 'Dev mode — email not sent' : 'Email sent!'}
                  </strong>
                  <span style={{ fontSize: '0.87rem', lineHeight: 1.6 }}>{message}</span>
                </div>
              </div>

              {/* Dev mode box — shows when email not configured */}
              {devInfo && (
                <motion.div
                  className="dev-info-box"
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <p className="dev-info-label">
                    🔧 Configure <code>EMAIL_USER</code> &amp; <code>EMAIL_PASS</code> in <code>backend/.env</code> to send real emails.
                  </p>
                  <p className="dev-info-label" style={{ marginTop: 6 }}>Reset link (valid 30 min):</p>
                  <p className="dev-info-url">{devInfo.url}</p>
                  <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                    <button className="btn btn-ghost btn-sm"
                      onClick={() => { navigator.clipboard.writeText(devInfo.url); toast.success('Copied!'); }}>
                      📋 Copy Link
                    </button>
                    <Link
                      to={`/reset-password?token=${devInfo.token}&email=${encodeURIComponent(email)}`}
                      className="btn btn-primary btn-sm">
                      Reset Password Now →
                    </Link>
                  </div>
                </motion.div>
              )}

              {!devInfo && (
                <div style={{ marginTop: 16 }}>
                  <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 12 }}>
                    ✅ The link expires in <strong>30 minutes</strong>.<br/>
                    ✅ Didn't receive it? Check your spam folder.<br/>
                    ✅ Wrong email? <button className="forgot-link" onClick={() => setSubmitted(false)}>Try again</button>
                  </p>
                </div>
              )}

              <div className="auth-footer">
                <p><Link to="/login">← Back to Sign In</Link></p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Visual panel */}
      <div className="auth-visual">
        <motion.div className="visual-content"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          <div className="visual-quote">
            <div className="quote-mark">"</div>
            <p>Forgot your password? No problem. We'll have you back in your journal in minutes.</p>
          </div>
          <div className="visual-features">
            {[
              'Secure token-based reset',
              'Link expires in 30 minutes',
              'Your data is always safe',
              'Instant access restored'
            ].map((f, i) => (
              <motion.div key={f} className="visual-feature"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + i * 0.1 }}>
                <span className="feature-dot" /><span>{f}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ForgotPassword;
