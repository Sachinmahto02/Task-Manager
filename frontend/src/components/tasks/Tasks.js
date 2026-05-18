import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import './Tasks.css';

const CATEGORIES = ['All', 'Study', 'Health', 'Work', 'Personal'];
const CATEGORY_META = {
  Study:    { icon: '📚', color: '#a78bfa', bg: 'rgba(139,92,246,0.12)' },
  Health:   { icon: '💪', color: '#34d399', bg: 'rgba(16,185,129,0.12)' },
  Work:     { icon: '💼', color: '#22d3ee', bg: 'rgba(6,182,212,0.12)'  },
  Personal: { icon: '⭐', color: '#fbbf24', bg: 'rgba(245,158,11,0.12)' },
};
const PRIORITY_META = {
  High:   { color: '#ef4444', bg: 'rgba(239,68,68,0.12)'   },
  Medium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)'  },
  Low:    { color: '#10b981', bg: 'rgba(16,185,129,0.12)'  },
};

/* ── Star Rating Component ── */
const StarRating = ({ taskId, currentRating = 0, onRate }) => {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="star-rating" title="Rate this task">
      {[1,2,3,4,5].map(star => (
        <button
          key={star}
          className={`star-btn ${star <= (hovered || currentRating) ? 'star-filled' : 'star-empty'}`}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onRate(taskId, star === currentRating ? 0 : star)}
          title={`${star} star${star>1?'s':''}`}
        >
          {star <= (hovered || currentRating) ? '★' : '☆'}
        </button>
      ))}
    </div>
  );
};

const Tasks = () => {
  const { API }   = useAuth();
  const inputRef  = useRef(null);

  const [tasks,        setTasks]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [filterCat,    setFilterCat]    = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchQuery,  setSearchQuery]  = useState('');

  const [newTitle,    setNewTitle]    = useState('');
  const [newCategory, setNewCategory] = useState('Personal');
  const [newPriority, setNewPriority] = useState('Medium');
  const [newDate,     setNewDate]     = useState(new Date().toISOString().split('T')[0]);
  const [adding,      setAdding]      = useState(false);

  const [editId,    setEditId]    = useState(null);
  const [editTitle, setEditTitle] = useState('');

  const fetchTasks = useCallback(async () => {
    try {
      const params = {};
      if (filterCat    !== 'All') params.category = filterCat;
      if (filterStatus !== 'All') params.status   = filterStatus;
      const res = await API.get('/tasks', { params });
      setTasks(res.data.tasks);
    } catch { toast.error('Failed to load tasks'); }
    finally   { setLoading(false); }
  }, [API, filterCat, filterStatus]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const handleAddTask = async () => {
    const title = newTitle.trim();
    if (!title) { inputRef.current?.focus(); return; }
    setAdding(true);
    try {
      const res = await API.post('/tasks', { title, category: newCategory, priority: newPriority, date: newDate });
      setTasks(prev => [res.data.task, ...prev]);
      setNewTitle('');
      inputRef.current?.focus();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to add task'); }
    finally { setAdding(false); }
  };

  const toggleTask = async (id) => {
    try {
      const res = await API.patch(`/tasks/${id}/toggle`);
      setTasks(prev => prev.map(t => t._id === id ? res.data.task : t));
    } catch { toast.error('Failed to update task'); }
  };

  const deleteTask = async (id) => {
    try {
      await API.delete(`/tasks/${id}`);
      setTasks(prev => prev.filter(t => t._id !== id));
    } catch { toast.error('Failed to delete task'); }
  };

  const rateTask = async (id, rating) => {
    try {
      const res = await API.patch(`/tasks/${id}/rate`, { rating });
      setTasks(prev => prev.map(t => t._id === id ? res.data.task : t));
    } catch { toast.error('Failed to rate task'); }
  };

  const startEdit = (task) => { setEditId(task._id); setEditTitle(task.title); };
  const saveEdit  = async (id) => {
    const title = editTitle.trim();
    if (!title) { setEditId(null); return; }
    try {
      const res = await API.put(`/tasks/${id}`, { title });
      setTasks(prev => prev.map(t => t._id === id ? res.data.task : t));
    } catch { toast.error('Failed to update'); }
    setEditId(null);
  };

  const filtered = tasks.filter(t => {
    if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });
  const pending   = filtered.filter(t => t.status !== 'completed');
  const completed = filtered.filter(t => t.status === 'completed');
  const shown = filterStatus === 'completed' ? completed
              : filterStatus === 'pending'   ? pending
              : [...pending, ...completed];

  return (
    <div className="tasks-page">
      {/* ── Heading: animates in once, stays visible ── */}
      <motion.div
        className="page-header"
        initial={{ opacity: 0, y: -18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
      >
        <div>
          <h1 className="page-title">✅ Task Manager</h1>
          <p className="page-subtitle">
            <span className="stat-chip">{pending.length} pending</span>
            <span className="stat-chip done">{completed.length} done</span>
          </p>
        </div>
      </motion.div>

      {/* ── Add task bar ── */}
      <motion.div
        className="add-task-bar card"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
      >
        <div className="add-task-row">
          <span className="add-icon">+</span>
          <input
            ref={inputRef} type="text" className="add-task-input"
            placeholder="Type a task and press Enter…"
            value={newTitle} onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddTask()}
            disabled={adding} autoFocus
          />
          <select className="add-task-select" value={newCategory} onChange={e => setNewCategory(e.target.value)}>
            {['Study','Health','Work','Personal'].map(c => (
              <option key={c} value={c}>{CATEGORY_META[c].icon} {c}</option>
            ))}
          </select>
          <select className="add-task-select" value={newPriority} onChange={e => setNewPriority(e.target.value)}>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
          <input type="date" className="add-task-select add-date" value={newDate}
            onChange={e => setNewDate(e.target.value)} style={{ colorScheme:'dark' }} />
          <button className="btn-add-task" onClick={handleAddTask} disabled={adding || !newTitle.trim()}>
            {adding ? '…' : 'Add'}
          </button>
        </div>
        <p className="add-hint">Press <kbd>Enter ↵</kbd> after each task to keep adding more</p>
      </motion.div>

      {/* ── Filters ── */}
      <motion.div className="tasks-filters card" initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.15 }}>
        <input type="text" placeholder="🔍  Search tasks…" value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)} className="input-field search-input" />
        <div className="filter-tabs">
          {CATEGORIES.map(c => (
            <button key={c} className={`filter-tab ${filterCat===c?'active':''}`} onClick={() => setFilterCat(c)}>{c}</button>
          ))}
        </div>
        <div className="filter-tabs">
          {[['All','All'],['pending','⏳ Pending'],['completed','✅ Done']].map(([v,l]) => (
            <button key={v} className={`filter-tab ${filterStatus===v?'active':''}`} onClick={() => setFilterStatus(v)}>{l}</button>
          ))}
        </div>
      </motion.div>

      {/* ── Task Rows ── */}
      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:60 }}>
          <div className="spinner" style={{ width:40, height:40 }} />
        </div>
      ) : shown.length === 0 ? (
        <motion.div className="empty-tasks card" initial={{ opacity:0 }} animate={{ opacity:1 }}>
          <span style={{ fontSize:'2.5rem' }}>🎯</span>
          <h3>No tasks yet</h3>
          <p>Type a task above and press Enter to get started!</p>
        </motion.div>
      ) : (
        <motion.div className="tasks-list" initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.2 }}>
          <AnimatePresence>
            {shown.map((task, i) => {
              const cat  = CATEGORY_META[task.category] || CATEGORY_META.Personal;
              const pri  = PRIORITY_META[task.priority] || PRIORITY_META.Medium;
              const done = task.status === 'completed';
              return (
                <motion.div
                  key={task._id}
                  className={`task-row ${done ? 'task-row-done' : ''}`}
                  initial={{ opacity:0, x:-12 }}
                  animate={{ opacity:1, x:0 }}
                  exit={{ opacity:0, height:0, marginBottom:0 }}
                  transition={{ delay: i * 0.02 }}
                  layout
                >
                  {/* Tick/Circle button */}
                  <button className={`tick-btn ${done?'tick-done':'tick-pending'}`}
                    onClick={() => toggleTask(task._id)}
                    title={done ? 'Mark as pending' : 'Mark as complete'}>
                    <span className="tick-icon">{done ? '✓' : ''}</span>
                  </button>

                  {/* Task content */}
                  <div className="task-row-body">
                    {editId === task._id ? (
                      <input className="edit-inline-input" value={editTitle} autoFocus
                        onChange={e => setEditTitle(e.target.value)}
                        onBlur={() => saveEdit(task._id)}
                        onKeyDown={e => { if(e.key==='Enter') saveEdit(task._id); if(e.key==='Escape') setEditId(null); }}
                      />
                    ) : (
                      <span className={`task-row-title ${done?'task-row-title-done':''}`}
                        onDoubleClick={() => !done && startEdit(task)}>
                        {task.title}
                      </span>
                    )}
                    <div className="task-row-meta">
                      <span className="tag-chip" style={{ color:cat.color, background:cat.bg }}>
                        {cat.icon} {task.category}
                      </span>
                      <span className="tag-chip" style={{ color:pri.color, background:pri.bg }}>
                        {task.priority}
                      </span>
                      <span className="task-row-date">
                        {new Date(task.date).toLocaleDateString('en', { month:'short', day:'numeric' })}
                      </span>
                    </div>

                    {/* ── 5-Star Rating ── */}
                    <StarRating
                      taskId={task._id}
                      currentRating={task.rating || 0}
                      onRate={rateTask}
                    />
                  </div>

                  {/* Actions */}
                  <div className="task-row-actions">
                    {!done && (
                      <button className="row-action-btn edit-btn" onClick={() => startEdit(task)} title="Edit">✏</button>
                    )}
                    <button className="row-action-btn delete-btn" onClick={() => deleteTask(task._id)} title="Delete">✕</button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
};

export default Tasks;
