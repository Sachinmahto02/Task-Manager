import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { GoogleCredentialButton } from './GoogleButton';
import { toast } from 'react-toastify';
import './Auth.css';

/* ── Dynamic content for right panel ── */
const PANEL_CONTENT = [
  {
    type: 'quote',
    icon: '💭',
    label: 'Daily Wisdom',
    value: '"The secret of getting ahead is getting started."',
    sub: '— Mark Twain',
  },
  {
    type: 'fact',
    icon: '🧠',
    label: 'Productivity Fact',
    value: 'People who write down goals are 42% more likely to achieve them.',
    sub: 'Dominican University Study',
  },
  {
    type: 'quote',
    icon: '🌅',
    label: 'Morning Thought',
    value: '"Small daily improvements lead to stunning long-term results."',
    sub: '— Robin Sharma',
  },
  {
    type: 'game',
    icon: '🎯',
    label: 'Focus Game',
    value: 'GAME',
    sub: 'Test your focus',
  },
  {
    type: 'quote',
    icon: '🔥',
    label: 'Motivation',
    value: '"Don\'t watch the clock; do what it does. Keep going."',
    sub: '— Sam Levenson',
  },
  {
    type: 'fact',
    icon: '📊',
    label: 'Did You Know?',
    value: 'It takes an average of 66 days to form a new habit — not 21.',
    sub: 'UCL Research, 2010',
  },
  {
    type: 'quote',
    icon: '✨',
    label: 'Reflection',
    value: '"You don\'t have to be great to start, but you have to start to be great."',
    sub: '— Zig Ziglar',
  },
  {
    type: 'challenge',
    icon: '🏆',
    label: 'Daily Challenge',
    value: 'CHALLENGE',
    sub: 'Can you do it today?',
  },
];

const CHALLENGES = [
  'Complete 3 tasks before noon ☀️',
  'Take a 5-min mindful break 🧘',
  'Write one thing you\'re grateful for 📝',
  'Drink 8 glasses of water today 💧',
  'Do 10 mins of movement 🏃',
  'Read for 15 minutes 📚',
  'Reach out to a friend or colleague 🤝',
  'Close all tabs you don\'t need right now 🗂️',
];

/* Simple sequence memory mini-game */
const SequenceGame = () => {
  const [seq, setSeq]         = useState([]);
  const [userSeq, setUserSeq] = useState([]);
  const [phase, setPhase]     = useState('idle'); // idle | showing | input | won | lost
  const [active, setActive]   = useState(null);
  const [score, setScore]     = useState(0);
  const colors = ['#a78bfa','#34d399','#f59e0b','#f87171'];
  const labels = ['◆','●','■','▲'];

  const startGame = () => {
    const newSeq = [Math.floor(Math.random() * 4)];
    setSeq(newSeq); setUserSeq([]); setPhase('showing'); playSeq(newSeq);
  };

  const playSeq = (s) => {
    let i = 0;
    const interval = setInterval(() => {
      setActive(s[i]);
      setTimeout(() => setActive(null), 400);
      i++;
      if (i >= s.length) { clearInterval(interval); setTimeout(() => setPhase('input'), 600); }
    }, 700);
  };

  const handleTap = (idx) => {
    if (phase !== 'input') return;
    const next = [...userSeq, idx];
    setUserSeq(next);
    setActive(idx); setTimeout(() => setActive(null), 200);
    if (next[next.length - 1] !== seq[next.length - 1]) {
      setPhase('lost'); return;
    }
    if (next.length === seq.length) {
      const newScore = score + 1;
      setScore(newScore); setPhase('showing');
      const newSeq = [...seq, Math.floor(Math.random() * 4)];
      setSeq(newSeq); setUserSeq([]);
      setTimeout(() => playSeq(newSeq), 600);
    }
  };

  return (
    <div className="mini-game">
      <div className="mg-title">🎮 Memory Sequence</div>
      {phase === 'idle' && (
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: 12 }}>Watch the sequence, repeat it!</p>
          <button className="mg-start-btn" onClick={startGame}>Start Game</button>
        </div>
      )}
      {(phase === 'showing' || phase === 'input') && (
        <>
          <div style={{ textAlign: 'center', marginBottom: 10, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {phase === 'showing' ? '👁️ Watch carefully…' : '👆 Your turn!'} &nbsp; Score: <strong style={{ color: '#a78bfa' }}>{score}</strong>
          </div>
          <div className="mg-grid">
            {colors.map((c, i) => (
              <button key={i} className="mg-btn" onClick={() => handleTap(i)}
                style={{ background: active === i ? c : `${c}22`, border: `2px solid ${c}55`, color: c, boxShadow: active === i ? `0 0 20px ${c}` : 'none', transform: active === i ? 'scale(1.12)' : 'scale(1)' }}>
                {labels[i]}
              </button>
            ))}
          </div>
        </>
      )}
      {phase === 'won' && <div style={{ textAlign:'center', color: '#34d399' }}>🎉 Perfect! Score: {score}</div>}
      {phase === 'lost' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#f87171', marginBottom: 8 }}>❌ Game over! Score: {score}</div>
          <button className="mg-start-btn" onClick={() => { setScore(0); setPhase('idle'); setSeq([]); setUserSeq([]); }}>Try Again</button>
        </div>
      )}
    </div>
  );
};

const ChallengeCard = () => {
  const challenge = CHALLENGES[Math.floor(Math.random() * CHALLENGES.length)];
  const [done, setDone] = useState(false);
  return (
    <div className="challenge-card">
      <p style={{ color: 'var(--text-primary)', fontSize: '0.92rem', lineHeight: 1.5, marginBottom: 14 }}>{challenge}</p>
      <button className={`challenge-btn ${done ? 'done' : ''}`} onClick={() => setDone(!done)}>
        {done ? '✅ Accepted!' : '🎯 Accept Challenge'}
      </button>
    </div>
  );
};

const Login = () => {
  const [form, setForm]         = useState({ email: '', password: '' });
  const [errors, setErrors]     = useState({});
  const [showPw, setShowPw]     = useState(false);
  const { login, authLoading }  = useAuth();
  const navigate = useNavigate();

  const [panelIdx, setPanelIdx] = useState(() => Math.floor(Math.random() * PANEL_CONTENT.length));
  const [panelVisible, setPanelVisible] = useState(true);

  // Rotate panel content every 8 seconds
  useEffect(() => {
    const t = setInterval(() => {
      setPanelVisible(false);
      setTimeout(() => {
        setPanelIdx(i => (i + 1) % PANEL_CONTENT.length);
        setPanelVisible(true);
      }, 400);
    }, 8000);
    return () => clearInterval(t);
  }, []);

  const panel = PANEL_CONTENT[panelIdx];

  const validate = () => {
    const e = {};
    if (!form.email)                           e.email    = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email    = 'Invalid email format';
    if (!form.password)                        e.password = 'Password is required';
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    const result = await login(form.email, form.password);
    if (result.success) { toast.success('Welcome back! 🎉'); navigate('/dashboard'); }
    else setErrors({ general: result.message });
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

      <motion.div className="auth-container"
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}>

        <div className="auth-header">
          <motion.div className="auth-logo animate-float"
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}>✦</motion.div>
          <motion.h1 className="auth-title" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            Welcome 
          </motion.h1>
          <motion.p className="auth-subtitle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
            Sign in to your ZenFlow journal
          </motion.p>
        </div>

        {errors.general && (
          <motion.div className="auth-error" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
            <span>⚠️</span> {errors.general}
          </motion.div>
        )}

        <div><GoogleCredentialButton label="Continue with Google" /></div>

        <div className="auth-divider">
          <span className="auth-divider-line" />
          <span className="auth-divider-text">or sign in with email</span>
          <span className="auth-divider-line" />
        </div>

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
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
              <input type={showPw ? 'text' : 'password'} name="password"
                value={form.password} onChange={handleChange}
                placeholder="Enter your password"
                className={`input-field ${errors.password ? 'input-error' : ''}`} autoComplete="current-password" />
              <button type="button" className="pw-toggle" onClick={() => setShowPw(!showPw)} tabIndex={-1}>
                {showPw ? '🙈' : '👁️'}
              </button>
            </div>
            {errors.password && <span className="field-error">{errors.password}</span>}
          </div>
          <div className="forgot-row">
            <Link to="/forgot-password" className="forgot-link">Forgot password?</Link>
          </div>
          <motion.button type="submit" className="btn btn-primary btn-lg w-full auth-submit"
            disabled={authLoading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            {authLoading ? <><div className="spinner" style={{ width: 18, height: 18 }} /> Signing In…</> : <>Sign In →</>}
          </motion.button>
        </form>

        <div className="auth-footer">
          <p>Don't have an account? <Link to="/register">Create one free →</Link></p>
        </div>
      </motion.div>

      {/* Dynamic Right Visual Panel */}
      <div className="auth-visual">
        <div className="visual-content">
          <AnimatePresence mode="wait">
            {panelVisible && (
              <motion.div key={panelIdx} className="visual-dynamic-card card"
                initial={{ opacity: 0, y: 20, rotateX: -10 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                exit={{ opacity: 0, y: -20, rotateX: 10 }}
                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}>

                <div className="vd-label">
                  <span className="vd-icon">{panel.icon}</span>
                  <span>{panel.label}</span>
                </div>

                {panel.type === 'quote' && (
                  <>
                    <p className="vd-quote">{panel.value}</p>
                    <p className="vd-sub">{panel.sub}</p>
                  </>
                )}
                {panel.type === 'fact' && (
                  <>
                    <p className="vd-fact">{panel.value}</p>
                    <p className="vd-sub">{panel.sub}</p>
                  </>
                )}
                {panel.type === 'game' && <SequenceGame />}
                {panel.type === 'challenge' && <ChallengeCard />}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Dot indicators */}
          <div className="vd-dots">
            {PANEL_CONTENT.map((_, i) => (
              <button key={i} className={`vd-dot ${i === panelIdx ? 'active' : ''}`}
                onClick={() => { setPanelVisible(false); setTimeout(() => { setPanelIdx(i); setPanelVisible(true); }, 300); }} />
            ))}
          </div>

          <motion.div className="visual-features" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
            {['Track daily tasks & goals', 'Reflect and grow mindfully', 'Visualize your progress', 'Build lasting streaks'].map((f, i) => (
              <motion.div key={f} className="visual-feature"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + i * 0.1 }}>
                <span className="feature-dot" /><span>{f}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Login;
