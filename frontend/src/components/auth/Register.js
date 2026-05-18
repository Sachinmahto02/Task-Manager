import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { GoogleCredentialButton } from './GoogleButton';
import { toast } from 'react-toastify';
import './Auth.css';

const Register = () => {
  const [form, setForm]         = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors]     = useState({});
  const [showPw, setShowPw]     = useState(false);
  const { register, authLoading } = useAuth();
  const navigate = useNavigate();

  const pwStrength = (p) => {
    let s = 0;
    if (p.length >= 8)           s++;
    if (/[A-Z]/.test(p))         s++;
    if (/[0-9]/.test(p))         s++;
    if (/[^A-Za-z0-9]/.test(p))  s++;
    return s;
  };
  const strength = pwStrength(form.password);
  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['', '#ef4444', '#f59e0b', '#5b8dee', '#10b981'];

  const validate = () => {
    const e = {};
    if (!form.name || form.name.length < 2)           e.name    = 'Name must be at least 2 characters';
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email required';
    if (!form.password || form.password.length < 6)   e.password = 'Password must be at least 6 characters';
    if (form.password !== form.confirm)               e.confirm  = 'Passwords do not match';
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    const result = await register(form.name, form.email, form.password);
    if (result.success) {
      toast.success('Account created! Welcome to ZenFlow 🎉');
      navigate('/dashboard');
    } else {
      setErrors({ general: result.message });
    }
  };

  const handleChange = (ev) => {
    setForm(f => ({ ...f, [ev.target.name]: ev.target.value }));
    if (errors[ev.target.name]) setErrors(er => ({ ...er, [ev.target.name]: '' }));
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
        transition={{ duration: 0.6 }}
      >
        <div className="auth-header">
          <motion.div className="auth-logo animate-float"
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}>✦</motion.div>
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Start your productivity journey today</p>
        </div>

        {errors.general && (
          <motion.div className="auth-error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <span>⚠️</span> {errors.general}
          </motion.div>
        )}

        {/* Google sign-up */}
        <GoogleCredentialButton label="Sign up with Google" />

        {/* Divider */}
        <div className="auth-divider">
          <span className="auth-divider-line" />
          <span className="auth-divider-text">or create account with email</span>
          <span className="auth-divider-line" />
        </div>

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="input-group">
            <label className="input-label">Full Name</label>
            <input type="text" name="name" value={form.name} onChange={handleChange}
              placeholder="Your name"
              className={`input-field ${errors.name ? 'input-error' : ''}`} autoComplete="name" />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </div>

          <div className="input-group">
            <label className="input-label">Email Address</label>
            <input type="email" name="email" value={form.email} onChange={handleChange}
              placeholder="you@example.com"
              className={`input-field ${errors.email ? 'input-error' : ''}`} autoComplete="email" />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>

          <div className="input-group">
            <label className="input-label">Password</label>
            <div className="input-pw-wrap">
              <input type={showPw ? 'text' : 'password'} name="password" value={form.password}
                onChange={handleChange} placeholder="Min. 6 characters"
                className={`input-field ${errors.password ? 'input-error' : ''}`} autoComplete="new-password" />
              <button type="button" className="pw-toggle" onClick={() => setShowPw(!showPw)} tabIndex={-1}>
                {showPw ? '🙈' : '👁️'}
              </button>
            </div>
            {form.password && (
              <div className="pw-strength">
                <div className="pw-strength-bars">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="pw-strength-bar"
                      style={{ background: i <= strength ? strengthColors[strength] : 'rgba(255,255,255,0.1)' }} />
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
            <label className="input-label">Confirm Password</label>
            <input type="password" name="confirm" value={form.confirm} onChange={handleChange}
              placeholder="Repeat your password"
              className={`input-field ${errors.confirm ? 'input-error' : ''}`} autoComplete="new-password" />
            {errors.confirm && <span className="field-error">{errors.confirm}</span>}
          </div>

          <motion.button type="submit"
            className="btn btn-primary btn-lg w-full auth-submit"
            disabled={authLoading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            {authLoading
              ? <><div className="spinner" style={{ width: 18, height: 18 }} /> Creating Account…</>
              : <>Create Account →</>}
          </motion.button>
        </form>

        <div className="auth-footer">
          <p>Already have an account? <Link to="/login">Sign in →</Link></p>
        </div>
      </motion.div>

      <div className="auth-visual">
        <div className="visual-content">
          <motion.div className="visual-quote" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
            <div className="quote-mark">"</div>
            <p>The secret of getting ahead is getting started. Track every step of your journey.</p>
          </motion.div>
          <div className="visual-stats-grid">
            {[
              { num: '21',  label: 'Days to build a habit', icon: '📅' },
              { num: '3×',  label: 'More productive',       icon: '⚡' },
              { num: '∞',   label: 'Growth potential',      icon: '🚀' }
            ].map((s, i) => (
              <motion.div key={s.label} className="mini-stat card"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + i * 0.15 }}>
                <span style={{ fontSize: '1.5rem' }}>{s.icon}</span>
                <span className="mini-stat-num text-gradient">{s.num}</span>
                <span className="mini-stat-label">{s.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
