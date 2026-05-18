import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import './TaskHistory.css';

const CAT_ICON  = { Study:'📚', Health:'💪', Work:'💼', Personal:'⭐' };
const MOOD_EMOJI = { great:'🤩', good:'😊', okay:'😐', bad:'😔', terrible:'😩' };

const headingVariants = {
  hidden:  { opacity: 0, y: -28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.4,0,0.2,1] } }
};

const statVariants = {
  hidden:  { opacity: 0, y: 20, scale: 0.95 },
  visible: (i) => ({ opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, delay: i * 0.08, ease: [0.4,0,0.2,1] } })
};

const TaskHistory = () => {
  const { API } = useAuth();
  const [history,      setHistory]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [expandedDate, setExpandedDate] = useState(null);
  const [search,       setSearch]       = useState('');
  const [editFbId,     setEditFbId]     = useState(null);
  const [editFbText,   setEditFbText]   = useState('');
  const headerRef = useRef(null);
  const [headerFixed, setHeaderFixed]   = useState(false);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const [tasksRes, fbRes] = await Promise.all([
        API.get('/tasks/history'),
        API.get('/feedback').catch(() => ({ data: { feedbacks: [] } }))
      ]);
      const map = {};
      (tasksRes.data.history || []).forEach(g => { map[g.date] = { ...g, feedbacks: [] }; });
      (fbRes.data.feedbacks || []).forEach(fb => {
        const key = new Date(fb.createdAt).toISOString().split('T')[0];
        if (!map[key]) map[key] = { date:key, total:0, completed:0, tasks:[], feedbacks:[] };
        map[key].feedbacks.push(fb);
      });
      const merged = Object.values(map).sort((a,b) => b.date.localeCompare(a.date));
      setHistory(merged);
    } catch (e) { console.error('History fetch error', e); }
    finally { setLoading(false); }
  }, [API]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  // After mount, header stays fixed — animated once then static
  useEffect(() => {
    const timer = setTimeout(() => setHeaderFixed(true), 700);
    return () => clearTimeout(timer);
  }, []);

  const deleteDate = async (date, e) => {
    e.stopPropagation();
    if (!window.confirm(`Delete all tasks for ${date}?`)) return;
    try {
      await API.delete(`/tasks/history/${date}`);
      setHistory(prev =>
        prev.map(g => g.date === date ? { ...g, tasks:[], total:0, completed:0 } : g)
            .filter(g => g.tasks.length > 0 || (g.feedbacks && g.feedbacks.length > 0))
      );
      toast.success('Tasks deleted');
    } catch {}
  };

  const deleteAll = async () => {
    if (!window.confirm('Delete all task history? Feedback notes will be kept.')) return;
    try {
      await API.delete('/tasks/history/all');
      setHistory(prev =>
        prev.map(g => ({ ...g, tasks:[], total:0, completed:0 }))
            .filter(g => g.feedbacks && g.feedbacks.length > 0)
      );
      toast.success('All history cleared');
    } catch {}
  };

  const deleteFeedback = async (fbId, date, e) => {
    e.stopPropagation();
    try {
      await API.delete(`/feedback/${fbId}`);
      setHistory(prev =>
        prev.map(g =>
          g.date === date
            ? { ...g, feedbacks: g.feedbacks.filter(f => f._id !== fbId) }
            : g
        ).filter(g => g.tasks.length > 0 || g.feedbacks.length > 0)
      );
    } catch {}
  };

  const startEditFb = (fb, e) => {
    e.stopPropagation();
    setEditFbId(fb._id);
    setEditFbText(fb.content);
  };

  const saveEditFb = async (fbId, date) => {
    if (!editFbText.trim()) { setEditFbId(null); return; }
    try {
      const res = await API.put(`/feedback/${fbId}`, { content: editFbText.trim() });
      setHistory(prev =>
        prev.map(g =>
          g.date === date
            ? { ...g, feedbacks: g.feedbacks.map(f => f._id === fbId ? res.data.feedback : f) }
            : g
        )
      );
    } catch {}
    setEditFbId(null);
  };

  // Computed stats
  const totalDays  = history.length;
  const totalTasks = history.reduce((s,g) => s + (g.total || 0), 0);
  const completed  = history.reduce((s,g) => s + (g.completed || 0), 0);
  const avgPerDay  = totalDays > 0 ? (totalTasks / totalDays).toFixed(1) : '0';

  // Filtered groups
  const filtered = history.filter(g => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      g.date.includes(q) ||
      (g.tasks || []).some(t => t.title.toLowerCase().includes(q)) ||
      (g.feedbacks || []).some(f => f.content.toLowerCase().includes(q))
    );
  });

  const stats = [
    { icon:'🗓', value: totalDays,  label:'TOTAL DAYS'   },
    { icon:'✅', value: totalTasks, label:'TOTAL TASKS'  },
    { icon:'🎯', value: completed,  label:'COMPLETED'    },
    { icon:'⚡', value: avgPerDay,  label:'AVG / DAY'    },
  ];

  return (
    <div className="th-page">
      {/* Page Header — animates in once, then stays pinned */}
      <motion.div
        ref={headerRef}
        className={`th-header ${headerFixed ? 'th-header--fixed' : ''}`}
        variants={headingVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="th-header-left">
          <div className="th-header-icon">🗂</div>
          <div>
            <h1 className="th-title">Task History</h1>
            <p className="th-subtitle">A complete record of all your tasks, grouped by day</p>
          </div>
        </div>
        {history.length > 0 && (
          <motion.button
            className="th-clear-btn"
            onClick={deleteAll}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
          >
            🗑 Clear All
          </motion.button>
        )}
      </motion.div>

      {/* Spacer so content doesn't hide under fixed header */}
      <div className="th-header-spacer" />

      {/* Stats row */}
      {!loading && (
        <div className="th-stats-row">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              className="th-stat-card"
              custom={i}
              variants={statVariants}
              initial="hidden"
              animate="visible"
            >
              <span className="th-stat-icon">{s.icon}</span>
              <span className="th-stat-value">{s.value}</span>
              <span className="th-stat-label">{s.label}</span>
            </motion.div>
          ))}
        </div>
      )}

      {/* Search */}
      {!loading && history.length > 0 && (
        <motion.div
          className="th-search-wrap"
          initial={{ opacity:0, y:12 }}
          animate={{ opacity:1, y:0 }}
          transition={{ delay:0.4, duration:0.4 }}
        >
          <span className="th-search-icon">🔍</span>
          <input
            type="text"
            className="th-search"
            placeholder="Search tasks..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </motion.div>
      )}

      {/* Content */}
      {loading ? (
        <div className="th-loading">
          <div className="spinner" style={{ width:32, height:32 }} />
          <span>Loading history…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="th-empty">
          <div className="th-empty-icon">📭</div>
          <p>{search ? 'No results found' : 'No task history yet'}</p>
          {search && <button className="th-clear-search" onClick={() => setSearch('')}>Clear search</button>}
        </div>
      ) : (
        <div className="th-groups">
          {filtered.map((group, gi) => {
            const isToday = group.date === new Date().toISOString().split('T')[0];
            const pct = group.total > 0 ? Math.round((group.completed / group.total) * 100) : 0;

            return (
              <motion.div
                key={group.date}
                className="th-group"
                initial={{ opacity:0, y:16 }}
                animate={{ opacity:1, y:0 }}
                transition={{ delay: gi * 0.05, duration:0.35 }}
              >
                {/* Date Header Row */}
                <div
                  className={`th-date-header ${expandedDate===group.date?'open':''}`}
                  onClick={() => setExpandedDate(expandedDate===group.date ? null : group.date)}
                >
                  <div className="th-date-dot" style={{ background: isToday ? '#7c6ef0' : 'rgba(255,255,255,0.2)' }} />
                  <div className="th-date-main">
                    <div className="th-date-row">
                      <span className="th-date-name">
                        {isToday ? 'Today' : new Date(group.date+'T12:00:00').toLocaleDateString('en',{ weekday:'long' })}
                        {isToday && <span className="th-today-badge">TODAY</span>}
                      </span>
                      <span className="th-date-full">
                        {new Date(group.date+'T12:00:00').toLocaleDateString('en',{ weekday: isToday?'long':'short', month:'long', day:'numeric', year:'numeric' })}
                      </span>
                    </div>
                    {group.total > 0 && (
                      <div className="th-progress-wrap">
                        <div className="th-progress-bar">
                          <motion.div
                            className="th-progress-fill"
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.8, delay: gi * 0.05 + 0.2 }}
                          />
                        </div>
                        <span className="th-progress-pct">{pct}%</span>
                      </div>
                    )}
                  </div>
                  <div className="th-date-meta">
                    {group.total > 0 && (
                      <span className="th-date-done">
                        <strong>{group.completed}</strong> done · {group.total} total
                      </span>
                    )}
                    {(group.feedbacks||[]).length > 0 && (
                      <span className="th-date-fb">💬 {group.feedbacks.length}</span>
                    )}
                    {group.tasks.length > 0 && (
                      <button
                        className="th-del-day"
                        onClick={e => deleteDate(group.date, e)}
                        title="Delete tasks for this day"
                      >🗑</button>
                    )}
                    <span className={`th-chevron ${expandedDate===group.date?'open':''}`}>▾</span>
                  </div>
                </div>

                {/* Expanded tasks & feedback */}
                <AnimatePresence>
                  {expandedDate === group.date && (
                    <motion.div
                      className="th-task-list"
                      initial={{ opacity:0, height:0 }}
                      animate={{ opacity:1, height:'auto' }}
                      exit={{ opacity:0, height:0 }}
                      transition={{ duration:0.3 }}
                    >
                      {/* Tasks */}
                      {group.tasks.length > 0 && (
                        <>
                          <div className="th-section-label">📋 Tasks</div>
                          {group.tasks.map(task => (
                            <div key={task._id} className={`th-task-item ${task.status==='completed'?'done':''}`}>
                              <div className="th-task-check">
                                {task.status==='completed' ? '✓' : '○'}
                              </div>
                              <div className="th-task-body">
                                <span className="th-task-title">{task.title}</span>
                                <div className="th-task-meta">
                                  <span className="th-tag th-tag-cat">{CAT_ICON[task.category]} {task.category}</span>
                                  <span className={`th-tag th-tag-priority th-priority-${task.priority?.toLowerCase()}`}>• {task.priority}</span>
                                  {task.rating > 0 && <span className="th-stars">{'★'.repeat(task.rating)}</span>}
                                </div>
                              </div>
                              <div className={`th-status-badge ${task.status==='completed'?'th-done':'th-pending'}`}>
                                {task.status==='completed'?'DONE':'PENDING'}
                              </div>
                            </div>
                          ))}
                        </>
                      )}

                      {/* Feedback */}
                      {(group.feedbacks||[]).length > 0 && (
                        <>
                          <div className="th-section-label" style={{ marginTop: group.tasks.length > 0 ? 12 : 0 }}>💬 Feedback Notes</div>
                          {group.feedbacks.map(fb => (
                            <div key={fb._id} className="th-fb-item">
                              <div className="th-fb-header">
                                <span className="th-fb-emoji">{MOOD_EMOJI[fb.mood] || '😊'}</span>
                                <span className="th-fb-time">
                                  {new Date(fb.createdAt).toLocaleTimeString('en',{hour:'2-digit',minute:'2-digit'})}
                                </span>
                                <div className="th-fb-actions">
                                  <button className="th-fb-btn" onClick={e => startEditFb(fb, e)} title="Edit">✏</button>
                                  <button className="th-fb-btn th-fb-del" onClick={e => deleteFeedback(fb._id, group.date, e)} title="Delete">✕</button>
                                </div>
                              </div>
                              {editFbId === fb._id ? (
                                <textarea
                                  className="th-fb-edit"
                                  value={editFbText}
                                  autoFocus
                                  onChange={e => setEditFbText(e.target.value)}
                                  onBlur={() => saveEditFb(fb._id, group.date)}
                                  onKeyDown={e => {
                                    if (e.key==='Enter' && e.ctrlKey) saveEditFb(fb._id, group.date);
                                    if (e.key==='Escape') setEditFbId(null);
                                  }}
                                  rows={2}
                                />
                              ) : (
                                <p className="th-fb-content">{fb.content}</p>
                              )}
                            </div>
                          ))}
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TaskHistory;
