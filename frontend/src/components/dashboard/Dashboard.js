import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import TaskModal from '../tasks/TaskModal';
import './Dashboard.css';

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Good Morning',   emoji: '🌅' };
  if (h < 17) return { text: 'Good Afternoon',  emoji: '☀️' };
  if (h < 21) return { text: 'Good Evening',    emoji: '🌆' };
  return        { text: 'Good Night',    emoji: '🌙' };
};

const catColors = {
  Study:    { bg:'rgba(139,92,246,0.15)',  border:'rgba(139,92,246,0.3)',  text:'#a78bfa', icon:'📚' },
  Health:   { bg:'rgba(16,185,129,0.15)', border:'rgba(16,185,129,0.3)', text:'#34d399', icon:'💪' },
  Work:     { bg:'rgba(6,182,212,0.15)',  border:'rgba(6,182,212,0.3)',  text:'#22d3ee', icon:'💼' },
  Personal: { bg:'rgba(245,158,11,0.15)', border:'rgba(245,158,11,0.3)', text:'#fbbf24', icon:'⭐' },
};

/* Heading animation — slides in once, stays visible forever */
const headingVariants = {
  hidden: { opacity: 0, y: -18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.4, 0, 0.2, 1] }
  }
};

/* Card stagger container */
const cardContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } }
};
const cardItem = {
  hidden:   { opacity: 0, y: 22 },
  visible:  { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1] } }
};

const Dashboard = () => {
  const { user, API } = useAuth();
  const [tasks,     setTasks]     = useState([]);
  const [stats,     setStats]     = useState({ total:0, completed:0, percentage:0 });
  const [analytics, setAnalytics] = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  const greeting = getGreeting();

  const fetchDashboard = useCallback(async () => {
    try {
      const [tasksRes, analyticsRes] = await Promise.all([
        API.get('/tasks/today'),
        API.get('/analytics/overview')
      ]);
      setTasks(tasksRes.data.tasks);
      setStats(tasksRes.data.stats);
      setAnalytics(analyticsRes.data.data);
    } catch { toast.error('Failed to load dashboard data'); }
    finally   { setLoading(false); }
  }, [API]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const toggleTask = async (id) => {
    try {
      const res = await API.patch(`/tasks/${id}/toggle`);
      const updated = tasks.map(t => t._id === id ? res.data.task : t);
      setTasks(updated);
      const comp = updated.filter(t => t.status === 'completed').length;
      setStats({ total: updated.length, completed: comp, percentage: updated.length > 0 ? Math.round((comp/updated.length)*100) : 0 });
    } catch { toast.error('Failed to update task'); }
  };

  const deleteTask = async (id) => {
    try {
      await API.delete(`/tasks/${id}`);
      const updated = tasks.filter(t => t._id !== id);
      setTasks(updated);
      const comp = updated.filter(t => t.status === 'completed').length;
      setStats({ total: updated.length, completed: comp, percentage: updated.length > 0 ? Math.round((comp/updated.length)*100) : 0 });
    } catch { toast.error('Failed to delete task'); }
  };

  if (loading) return (
    <div className="dashboard-loading">
      <div className="spinner" style={{ width:40, height:40 }} />
      <p>Loading your dashboard…</p>
    </div>
  );

  return (
    <div className="dashboard">

      {/* ── Page heading — animates in once, stays visible ── */}
      <motion.div
        className="dashboard-header"
        variants={headingVariants}
        initial="hidden"
        animate="visible"
      >
        <div>
          <h1 className="dashboard-greeting">
            {greeting.emoji} {greeting.text},{' '}
            <span className="text-gradient">{user?.name?.split(' ')[0]}</span>
          </h1>
          <p className="dashboard-date">
            {new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/tasks')}>
          <span>+</span> Add Task
        </button>
      </motion.div>

      {/* ── Stats cards ── */}
      <motion.div
        className="stats-grid"
        variants={cardContainer}
        initial="hidden"
        animate="visible"
      >
        {[
          { label:"Today's Tasks",  value: stats.total,                              icon:'📋', color:'purple' },
          { label:'Completed',      value: stats.completed,                          icon:'✅', color:'green'  },
          { label:'Productivity',   value: `${stats.percentage}%`,                   icon:'⚡', color:'cyan'   },
          { label:'Streak',         value: `${user?.streak || analytics?.streak || 0}d`, icon:'🔥', color:'amber'  },
        ].map(s => (
          <motion.div key={s.label} variants={cardItem} className={`stat-card card stat-${s.color}`}>
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Progress bar ── */}
      <motion.div
        className="productivity-bar-card card"
        variants={cardItem}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.35 }}
      >
        <div className="flex justify-between items-center" style={{ marginBottom:12 }}>
          <span style={{ fontWeight:600, fontFamily:'var(--font-display)' }}>Today's Progress</span>
          <span style={{ color:'var(--text-secondary)', fontSize:'0.9rem' }}>{stats.completed}/{stats.total} tasks</span>
        </div>
        <div className="progress-bar">
          <motion.div
            className="progress-fill progress-purple"
            initial={{ width:0 }}
            animate={{ width:`${stats.percentage}%` }}
            transition={{ duration:1, ease:'easeOut', delay:0.55 }}
          />
        </div>
        {stats.percentage === 100 && stats.total > 0 && (
          <motion.p className="all-done-msg" initial={{ opacity:0 }} animate={{ opacity:1 }}>
            🎉 All tasks completed! Amazing work!
          </motion.p>
        )}
      </motion.div>

      {/* ── Main grid ── */}
      <div className="dashboard-grid">
        {/* Tasks card */}
        <motion.div
          className="tasks-section card"
          variants={cardItem}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.42 }}
        >
          <div className="section-header">
            <h2>Today's Tasks</h2>
            <span className="task-count">{tasks.length}</span>
          </div>

          {tasks.length === 0 ? (
            <div className="empty-state">
              <span style={{ fontSize:'3rem' }}>📝</span>
              <p>No tasks yet — add your first one!</p>
              <button className="btn btn-primary btn-sm" onClick={() => navigate('/tasks')}>+ Add Task</button>
            </div>
          ) : (
            <motion.div className="task-list" variants={cardContainer} initial="hidden" animate="visible">
              {tasks.map(task => {
                const cat = catColors[task.category] || catColors.Personal;
                return (
                  <motion.div
                    key={task._id} variants={cardItem} layout
                    className={`task-item ${task.status === 'completed' ? 'completed' : ''}`}
                  >
                    <button className={`task-check ${task.status==='completed'?'checked':''}`} onClick={() => toggleTask(task._id)}>
                      {task.status === 'completed' && <span>✓</span>}
                    </button>
                    <div className="task-body">
                      <span className="task-title">{task.title}</span>
                      <div className="task-meta">
                        <span className="task-category" style={{ background:cat.bg, border:`1px solid ${cat.border}`, color:cat.text }}>
                          {cat.icon} {task.category}
                        </span>
                        <span className={`badge badge-${task.priority?.toLowerCase()}`}>{task.priority}</span>
                      </div>
                    </div>
                    <button className="task-delete" onClick={() => deleteTask(task._id)} title="Delete">✕</button>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </motion.div>

        {/* Category breakdown card */}
        <motion.div
          className="category-section card"
          variants={cardItem}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.5 }}
        >
          <div className="section-header"><h2>This Month</h2></div>
          {analytics?.categoryStats && Object.entries(analytics.categoryStats).map(([cat, data]) => {
            const c = catColors[cat];
            return (
              <div key={cat} className="category-row">
                <div className="category-info">
                  <span>{c.icon}</span>
                  <span className="category-name">{cat}</span>
                  <span className="category-count">{data.completed}/{data.total}</span>
                </div>
                <div className="progress-bar" style={{ marginTop:6 }}>
                  <motion.div
                    className="progress-fill"
                    style={{ background: c.text }}
                    initial={{ width:0 }}
                    animate={{ width:`${data.percentage}%` }}
                    transition={{ duration:0.8, ease:'easeOut', delay:0.65 }}
                  />
                </div>
                <span className="category-pct" style={{ color:c.text }}>{data.percentage}%</span>
              </div>
            );
          })}
        </motion.div>
      </div>

      {showModal && <TaskModal onClose={() => setShowModal(false)} onSuccess={() => { setShowModal(false); fetchDashboard(); }} />}
    </div>
  );
};

export default Dashboard;
