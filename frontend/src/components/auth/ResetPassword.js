import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import './Auth.css';

const ResetPassword = () => {
  const [searchParams]          = useSearchParams();
  const navigate                = useNavigate();
  const { setUser, setToken }   = useAuth();

  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const [form, setForm]         = useState({ password: '', confirm: '' });
  const [errors, setErrors]     = useState({});
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState(false);

  useEffect(() => {
    if (!token || !email) {
      toast.error('Invalid reset link.');
      navigate('/forgot-password');
    }
  }, [token, email, navigate]);

  const pwStrength = (p) => {
    let s = 0;
    if (p.length >= 8)            s++;
    if (/[A-Z]/.test(p))          s++;
    if (/[0-9]/.test(p))          s++;
    if (/[^A-Za-z0-9]/.test(p))   s++;
    return s;
  };
  const strength = pwStrength(form.password);
  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['', '#ef4444', '#f59e0b', '#5b8dee', '#10b981'];

  const validate = () => {
    const e = {};
    if (!form.password || form.password.length < 6) e.password = 'Password must be at least 6 characters';
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match';
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({}); setLoading(true);

    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/reset-password`,
        { token, email, password: form.password }
      );
      if (res.data.success) {
        toast.success('Password reset! Logging you in…');
        localStorage.setItem('token', res.data.token);
        setSuccess(true);
        setTimeout(() => navigate('/dashboard'), 1800);
      }
    } catch (err) {
      setErrors({ general: err.response?.data?.message || 'Reset failed. Try requesting a new link.' });
    } finally { setLoading(false); }
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
        <div>
          <Link to="/login" className="back-link">← Back to Sign In</Link>
        </div>

        <div className="auth-header">
          <motion.div className="auth-logo animate-float" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}>
            🔒
          </motion.div>
          <motion.h1 className="auth-title" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            {success ? 'All Done!' : 'Set New Password'}
          </motion.h1>
          <motion.p className="auth-subtitle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
            {success ? 'Redirecting to your dashboard…' : `Resetting password for ${email}`}
          </motion.p>
        </div>

        {success ? (
          <motion.div className="auth-success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <span style={{ fontSize: '1.4rem' }}>🎉</span>
            <div>
              <strong>Password changed successfully!</strong>
              <p style={{ marginTop: 4, fontSize: '0.85rem' }}>You are being logged in automatically.</p>
            </div>
          </motion.div>
        ) : (
          <>
            {errors.general && (
              <motion.div className="auth-error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <span>⚠️</span> {errors.general}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="auth-form" noValidate>
              <div className="input-group">
                <label className="input-label">New Password</label>
                <div className="input-pw-wrap">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => { setForm(f => ({ ...f, password: e.target.value })); setErrors(er => ({ ...er, password: '' })); }}
                    placeholder="Min. 6 characters"
                    className={`input-field ${errors.password ? 'input-error' : ''}`}
                    autoFocus
                    autoComplete="new-password"
                  />
                  <button type="button" className="pw-toggle" onClick={() => setShowPw(!showPw)} tabIndex={-1}>
                    {showPw ? '🙈' : '👁️'}
                  </button>
                </div>
                {form.password && (
                  <div className="pw-strength">
                    <div className="pw-strength-bars">
                      {[1,2,3,4].map(i => (
                        <div key={i} className="pw-strength-bar"
                          style={{ background: i <= strength ? strengthColors[strength] : 'rgba(255,255,255,0.1)' }}
                        />
                      ))}
                    </div>
                    <span style={{ color: strengthColors[strength], fontSize: '0.75rem' }}>
                      {strengthLabels[strength]}
                    </span>
                  </div>
                )}
                {errors.password && <span className="field-error">{errors.password}</span>}
              </div>

              <div className="input-group">
                <label className="input-label">Confirm New Password</label>
                <input
                  type="password"
                  value={form.confirm}
                  onChange={e => { setForm(f => ({ ...f, confirm: e.target.value })); setErrors(er => ({ ...er, confirm: '' })); }}
                  placeholder="Repeat password"
                  className={`input-field ${errors.confirm ? 'input-error' : ''}`}
                  autoComplete="new-password"
                />
                {errors.confirm && <span className="field-error">{errors.confirm}</span>}
              </div>

              <motion.button
                type="submit"
                className="btn btn-primary btn-lg w-full auth-submit"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? (
                  <><div className="spinner" style={{ width: 18, height: 18 }} /> Saving…</>
                ) : (
                  <>Set New Password ✓</>
                )}
              </motion.button>
            </form>

            <div className="auth-footer">
              <p>Token expired? <Link to="/forgot-password">Request a new link →</Link></p>
            </div>
          </>
        )}
      </motion.div>

      {/* Visual panel */}
      <div className="auth-visual">
        <motion.div className="visual-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          <div className="visual-quote">
            <div className="quote-mark">"</div>
            <p>A strong password is your first line of defence. Choose something memorable yet secure.</p>
          </div>
          <div className="visual-features">
            {['Use at least 8 characters', 'Mix uppercase & lowercase', 'Add numbers or symbols', 'Avoid personal information'].map((f, i) => (
              <motion.div key={f} className="visual-feature"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + i * 0.1 }}
              >
                <span className="feature-dot" /><span>{f}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ResetPassword;
