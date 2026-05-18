import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, PointElement,
  LineElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import './Analytics.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler);

const MOOD_EMOJI = { amazing: '🤩', good: '😊', neutral: '😐', bad: '😔', terrible: '😩' };
const CAT_COLOR  = { Study: '#a78bfa', Health: '#34d399', Work: '#22d3ee', Personal: '#fbbf24' };
const CAT_ICON   = { Study: '📚', Health: '💪', Work: '💼', Personal: '⭐' };

const MOOD_OPTIONS = [
  { value:'great',    emoji:'🤩', label:'Great'    },
  { value:'good',     emoji:'😊', label:'Good'     },
  { value:'okay',     emoji:'😐', label:'Okay'     },
  { value:'bad',      emoji:'😔', label:'Bad'      },
  { value:'terrible', emoji:'😩', label:'Terrible' },
];

const Analytics = () => {
  const { API } = useAuth();
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);

  /* Feedback state */
  const [fbText,   setFbText]   = useState('');
  const [fbMood,   setFbMood]   = useState('good');
  const [fbSaving, setFbSaving] = useState(false);
  const [fbSaved,  setFbSaved]  = useState(false);
  const fbRef = useRef(null);

  const saveFeedback = async () => {
    if (!fbText.trim()) { fbRef.current?.focus(); return; }
    setFbSaving(true);
    try {
      await API.post('/feedback', { content: fbText.trim(), mood: fbMood });
      setFbText('');
      setFbSaved(true);
      setTimeout(() => setFbSaved(false), 3500);
      import('react-toastify').then(({ toast }) => toast.success('Feedback saved to History! ✓'));
    } catch { import('react-toastify').then(({ toast }) => toast.error('Failed to save.')); }
    finally { setFbSaving(false); }
  };

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await API.get('/analytics/overview');
      setData(res.data.data);
    } catch { toast.error('Failed to load analytics'); }
    finally { setLoading(false); }
  }, [API]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  if (loading) {
    return (
      <div style={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:'50vh' }}>
        <div className="spinner" style={{ width:40, height:40 }} />
      </div>
    );
  }

  if (!data) return null;

  const totalAllTime = data.month.total;  // use what backend provides
  const hasAnyTasks  = data.month.total > 0 || data.week.total > 0 || data.today.total > 0;

  // ── Bar chart: last 7 days entries per day ─────────────────────────────────
  const barData = {
    labels: data.last7Days.map(d => d.day),
    datasets: [
      {
        label: 'Completed',
        data: data.last7Days.map(d => d.completed),
        backgroundColor: 'rgba(16,185,129,0.7)',
        borderColor: '#10b981',
        borderWidth: 1.5,
        borderRadius: 6,
      },
      {
        label: 'Pending',
        data: data.last7Days.map(d => d.total - d.completed),
        backgroundColor: 'rgba(139,92,246,0.35)',
        borderColor: 'rgba(139,92,246,0.7)',
        borderWidth: 1.5,
        borderRadius: 6,
      }
    ]
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: { color: 'rgba(241,240,255,0.5)', font: { size: 11 }, usePointStyle: true, padding: 16 }
      },
      tooltip: {
        backgroundColor: 'rgba(13,10,30,0.95)',
        borderColor: 'rgba(139,92,246,0.3)',
        borderWidth: 1,
        titleColor: '#f1f0ff',
        bodyColor: 'rgba(241,240,255,0.7)',
        padding: 12,
        cornerRadius: 10,
      }
    },
    scales: {
      x: {
        stacked: false,
        grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false },
        ticks: { color: 'rgba(241,240,255,0.45)', font: { size: 11 } },
        border: { display: false }
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false },
        ticks: { color: 'rgba(241,240,255,0.45)', font: { size: 11 }, stepSize: 1, precision: 0 },
        border: { display: false }
      }
    }
  };

  // ── Line chart: rolling completion count ───────────────────────────────────
  const lineData = {
    labels: data.last7Days.map(d => d.day),
    datasets: [{
      label: 'Tasks Completed',
      data: data.last7Days.map(d => d.completed),
      borderColor: '#a78bfa',
      backgroundColor: 'rgba(139,92,246,0.08)',
      borderWidth: 2.5,
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#a78bfa',
      pointBorderColor: '#0d0a1e',
      pointBorderWidth: 2,
      pointRadius: 5,
    }]
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(13,10,30,0.95)',
        borderColor: 'rgba(139,92,246,0.3)',
        borderWidth: 1,
        titleColor: '#f1f0ff',
        bodyColor: 'rgba(241,240,255,0.7)',
        padding: 12, cornerRadius: 10,
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false },
        ticks: { color: 'rgba(241,240,255,0.45)', font: { size: 11 } },
        border: { display: false }
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false },
        ticks: { color: 'rgba(241,240,255,0.45)', font: { size: 11 }, stepSize: 1, precision: 0 },
        border: { display: false }
      }
    }
  };

  const cats = data.categoryStats;

  return (
    <div className="analytics-page">
      <motion.div className="page-header" variants={{ hidden:{ opacity:0, y:-18 }, visible:{ opacity:1, y:0, transition:{ duration:0.55, ease:[0.4,0,0.2,1] } } }} initial="hidden" animate="visible">
        <div>
          <h1 className="page-title">📊 Analytics</h1>
          <p className="page-subtitle" style={{ color:'var(--text-secondary)', fontSize:'0.9rem' }}>
            Real numbers from your actual activity
          </p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={fetchAnalytics}>↻ Refresh</button>
      </motion.div>

      {/* ── True summary numbers ───────────────────────────── */}
      <motion.div className="real-summary" initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.1 }}>
        <div className="real-stat-row">
          {/* Today */}
          <div className="real-stat">
            <div className="real-stat-label">Today</div>
            <div className="real-stat-nums">
              <span className="real-big green">{data.today.completed}</span>
              <span className="real-slash">/</span>
              <span className="real-total">{data.today.total}</span>
              <span className="real-unit">tasks done</span>
            </div>
            {data.today.total > 0 && (
              <div className="real-bar-wrap">
                <motion.div
                  className="real-bar-fill green"
                  initial={{ width: 0 }}
                  animate={{ width: `${data.today.percentage}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
            )}
            {data.today.total === 0 && <div className="real-zero-msg">No tasks logged today</div>}
          </div>

          <div className="real-divider" />

          {/* This week */}
          <div className="real-stat">
            <div className="real-stat-label">This Week</div>
            <div className="real-stat-nums">
              <span className="real-big purple">{data.week.completed}</span>
              <span className="real-slash">/</span>
              <span className="real-total">{data.week.total}</span>
              <span className="real-unit">tasks done</span>
            </div>
            {data.week.total > 0 && (
              <div className="real-bar-wrap">
                <motion.div
                  className="real-bar-fill purple"
                  initial={{ width: 0 }}
                  animate={{ width: `${data.week.percentage}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
                />
              </div>
            )}
            {data.week.total === 0 && <div className="real-zero-msg">No tasks this week yet</div>}
          </div>

          <div className="real-divider" />

          {/* This month */}
          <div className="real-stat">
            <div className="real-stat-label">This Month</div>
            <div className="real-stat-nums">
              <span className="real-big cyan">{data.month.completed}</span>
              <span className="real-slash">/</span>
              <span className="real-total">{data.month.total}</span>
              <span className="real-unit">tasks done</span>
            </div>
            {data.month.total > 0 && (
              <div className="real-bar-wrap">
                <motion.div
                  className="real-bar-fill cyan"
                  initial={{ width: 0 }}
                  animate={{ width: `${data.month.percentage}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                />
              </div>
            )}
            {data.month.total === 0 && <div className="real-zero-msg">No tasks this month yet</div>}
          </div>

          <div className="real-divider" />

          {/* Streak */}
          <div className="real-stat">
            <div className="real-stat-label">Streak</div>
            <div className="real-stat-nums">
              <span className="real-big amber">{data.streak}</span>
              <span className="real-unit" style={{ marginLeft:6 }}>
                {data.streak === 1 ? 'day' : 'days'} 🔥
              </span>
            </div>
            <div className="real-zero-msg" style={{ marginTop:6 }}>
              {data.streak === 0 ? 'Start today!' : data.streak >= 7 ? 'On fire! Keep going 💪' : 'Keep it up!'}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Charts ────────────────────────────────────────── */}
      {!hasAnyTasks ? (
        <motion.div className="no-data-note" initial={{ opacity:0 }} animate={{ opacity:1 }}>
          <span style={{ fontSize:'2rem' }}>📈</span>
          <p>Add and complete some tasks to see your charts here.</p>
        </motion.div>
      ) : (
        <>
          <div className="charts-row">
            <motion.div className="chart-card card" initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}>
              <h3 className="chart-title">Tasks per Day — Last 7 Days</h3>
              <p className="chart-sub">Completed vs pending per day (actual counts)</p>
              <div className="chart-wrap" style={{ height:220 }}>
                <Bar data={barData} options={barOptions} />
              </div>
            </motion.div>

            <motion.div className="chart-card card" initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}>
              <h3 className="chart-title">Completion Trend — Last 7 Days</h3>
              <p className="chart-sub">How many tasks you finished each day</p>
              <div className="chart-wrap" style={{ height:220 }}>
                <Line data={lineData} options={lineOptions} />
              </div>
            </motion.div>
          </div>

          {/* Category Breakdown */}
          <motion.div className="chart-card card" initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.4 }}>
            <h3 className="chart-title">Category Breakdown — This Month</h3>
            <p className="chart-sub">Real task counts per category (only shows categories you've used)</p>
            <div className="cat-breakdown">
              {Object.entries(cats).filter(([, v]) => v.total > 0).length === 0 ? (
                <div className="real-zero-msg" style={{ padding:'1rem 0' }}>No categorized tasks this month yet.</div>
              ) : (
                Object.entries(cats).filter(([, v]) => v.total > 0).map(([cat, catData]) => (
                  <div key={cat} className="cat-row">
                    <div className="cat-row-header">
                      <span style={{ fontWeight:600 }}>{CAT_ICON[cat]} {cat}</span>
                      <div className="cat-counts">
                        <span className="cat-count-done">{catData.completed} done</span>
                        <span className="cat-count-sep">·</span>
                        <span className="cat-count-pending">{catData.total - catData.completed} pending</span>
                        <span className="cat-count-sep">·</span>
                        <span className="cat-count-total">{catData.total} total</span>
                      </div>
                    </div>
                    <div className="progress-bar">
                      <motion.div
                        className="progress-fill"
                        style={{ background: CAT_COLOR[cat] }}
                        initial={{ width: 0 }}
                        animate={{ width: catData.total > 0 ? `${catData.percentage}%` : '0%' }}
                        transition={{ duration: 0.9, ease: 'easeOut', delay: 0.5 }}
                      />
                    </div>
                    <div className="cat-pct" style={{ color: CAT_COLOR[cat] }}>
                      {catData.percentage}% completed
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}

      {/* ── Mood timeline ─────────────────────────────────── */}
      {data.moodData && data.moodData.length > 0 && (
        <motion.div className="chart-card card" initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.5 }}>
          <h3 className="chart-title">Mood This Week</h3>
          <p className="chart-sub">Based on your journal entries (only days you've written)</p>
          <div className="mood-timeline">
            {data.moodData.map((m, i) => (
              <div key={i} className="mood-point">
                <span className="mood-point-emoji">{MOOD_EMOJI[m.mood] || '😐'}</span>
                <span className="mood-point-label">{m.mood}</span>
                <span className="mood-point-date">
                  {new Date(m.date + 'T12:00:00').toLocaleDateString('en', { weekday:'short', month:'short', day:'numeric' })}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
      {(!data.moodData || data.moodData.length === 0) && (
        <motion.div className="chart-card card" style={{ opacity:0.6 }} initial={{ opacity:0 }} animate={{ opacity:0.6 }} transition={{ delay:0.5 }}>
          <h3 className="chart-title">Mood This Week</h3>
          <p className="chart-sub" style={{ padding:'1rem 0' }}>Write journal entries with mood tags to see this section.</p>
        </motion.div>
      )}

      {/* ── Feedback Card ────────────────────────────────── */}
      <motion.div
        className="feedback-card chart-card card"
        initial={{ opacity:0, y:20 }}
        animate={{ opacity:1, y:0 }}
        transition={{ delay:0.6 }}
      >
        <div className="feedback-header">
          <div>
            <h3 className="chart-title">💬 My Feedback &amp; Notes</h3>
            <p className="chart-sub">Write thoughts, reflections, or daily feedback — saved to your history</p>
          </div>
        </div>

        {/* Input area */}
        <div className="feedback-input-area">
          <div className="feedback-mood-row">
            <span className="feedback-mood-label">How are you feeling?</span>
            {MOOD_OPTIONS.map(m => (
              <button
                key={m.value}
                className={"feedback-mood-btn" + (fbMood === m.value ? ' active' : '')}
                onClick={() => setFbMood(m.value)}
                title={m.label}
              >
                {m.emoji}
              </button>
            ))}
          </div>
          <textarea
            ref={fbRef}
            className="feedback-textarea input-field"
            placeholder="Write your thoughts, feedback, or daily reflection here…"
            value={fbText}
            onChange={e => setFbText(e.target.value)}
            onKeyDown={e => { if (e.key==='Enter' && e.ctrlKey) saveFeedback(); }}
            rows={3}
            style={{ resize:'vertical' }}
          />
          <div className="feedback-input-footer">
            <span className="feedback-hint">
              Press <kbd>Ctrl+Enter</kbd> to save · View in sidebar <strong>🗓 Task History</strong>
            </span>
            <button
              className="btn btn-primary btn-sm"
              onClick={saveFeedback}
              disabled={fbSaving || !fbText.trim()}
            >
              {fbSaving ? '…' : '✓ Save Feedback'}
            </button>
          </div>
          {fbSaved && (
            <div className="feedback-saved-toast">
              ✅ Saved! Open <strong>🗓 Task History</strong> in the sidebar to view it.
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Analytics;