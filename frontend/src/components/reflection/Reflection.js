import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import './Reflection.css';

const MOODS = [
  { key: 'amazing', emoji: '🤩', label: 'Amazing', color: '#a78bfa' },
  { key: 'good', emoji: '😊', label: 'Good', color: '#34d399' },
  { key: 'neutral', emoji: '😐', label: 'Neutral', color: '#94a3b8' },
  { key: 'bad', emoji: '😔', label: 'Bad', color: '#f59e0b' },
  { key: 'terrible', emoji: '😩', label: 'Terrible', color: '#f87171' },
];

const Reflection = () => {
  const { API } = useAuth();
  const [form, setForm] = useState({ wentWell: '', notWell: '', gratitude: '', mood: 'neutral' });
  const [pastReflections, setPastReflections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [todayReflection, setTodayReflection] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [todayRes, allRes] = await Promise.all([
        API.get('/reflections/today'),
        API.get('/reflections?limit=10')
      ]);
      if (todayRes.data.reflection) {
        const r = todayRes.data.reflection;
        setTodayReflection(r);
        setForm({ wentWell: r.wentWell || '', notWell: r.notWell || '', gratitude: r.gratitude || '', mood: r.mood || 'neutral' });
      }
      setPastReflections(allRes.data.reflections || []);
    } catch { toast.error('Failed to load reflections'); }
    finally { setLoading(false); }
  }, [API]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async () => {
    if (!form.wentWell && !form.notWell && !form.gratitude) {
      toast.warning('Please fill in at least one field');
      return;
    }
    setSaving(true);
    try {
      await API.post('/reflections', form);
      toast.success(todayReflection ? 'Reflection updated! 🧠' : 'Reflection saved! ✨');
      fetchData();
    } catch { toast.error('Failed to save reflection'); }
    finally { setSaving(false); }
  };

  const deleteReflection = async (id) => {
    try {
      await API.delete(`/reflections/${id}`);
      setPastReflections(prev => prev.filter(r => r._id !== id));
      toast.success('Deleted');
    } catch { toast.error('Failed to delete'); }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <div className="spinner" style={{ width: 40, height: 40 }} />
      </div>
    );
  }

  return (
    <div className="reflection-page">
      <motion.div
        className="page-header"
        initial={{ opacity:0, y:-18 }}
        animate={{ opacity:1, y:0 }}
        transition={{ duration:0.55, ease:[0.4,0,0.2,1] }}
      >
        <div>
          <h1 className="page-title">🧠 Daily Reflection</h1>
          <p className="page-subtitle">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        {todayReflection && (
          <span className="saved-badge">✓ Today's saved</span>
        )}
      </motion.div>

      <div className="reflection-grid">
        {/* Form */}
        <motion.div
          className="reflection-form card"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          {/* Mood selector */}
          <div className="mood-section">
            <h3 className="section-label">How are you feeling today?</h3>
            <div className="mood-grid">
              {MOODS.map(m => (
                <motion.button
                  key={m.key}
                  className={`mood-btn ${form.mood === m.key ? 'selected' : ''}`}
                  style={form.mood === m.key ? { borderColor: m.color, background: `${m.color}18` } : {}}
                  onClick={() => setForm(f => ({ ...f, mood: m.key }))}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="mood-emoji">{m.emoji}</span>
                  <span className="mood-label" style={form.mood === m.key ? { color: m.color } : {}}>{m.label}</span>
                </motion.button>
              ))}
            </div>
          </div>

          <div className="divider" />

          {/* Went Well */}
          <div className="input-group">
            <label className="input-label">
              <span style={{ color: '#34d399' }}>✅</span> What went well today?
            </label>
            <textarea
              value={form.wentWell}
              onChange={e => setForm(f => ({ ...f, wentWell: e.target.value }))}
              placeholder="Celebrate your wins, big or small..."
              className="input-field reflection-textarea"
            />
          </div>

          {/* Not Well */}
          <div className="input-group">
            <label className="input-label">
              <span style={{ color: '#f87171' }}>🔄</span> What could be improved?
            </label>
            <textarea
              value={form.notWell}
              onChange={e => setForm(f => ({ ...f, notWell: e.target.value }))}
              placeholder="Be honest, growth comes from awareness..."
              className="input-field reflection-textarea"
            />
          </div>

          {/* Gratitude */}
          <div className="input-group">
            <label className="input-label">
              <span style={{ color: '#fbbf24' }}>🙏</span> I'm grateful for...
            </label>
            <textarea
              value={form.gratitude}
              onChange={e => setForm(f => ({ ...f, gratitude: e.target.value }))}
              placeholder="Three things you're grateful for today..."
              className="input-field reflection-textarea"
            />
          </div>

          <motion.button
            className="btn btn-primary w-full"
            style={{ marginTop: 8, padding: '14px' }}
            onClick={handleSave}
            disabled={saving}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {saving ? (
              <><div className="spinner" style={{ width: 16, height: 16 }} /> Saving...</>
            ) : (
              todayReflection ? '🔄 Update Reflection' : '✨ Save Reflection'
            )}
          </motion.button>
        </motion.div>

        {/* Past Reflections */}
        <motion.div
          className="past-reflections"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="section-label" style={{ marginBottom: 16 }}>📖 Past Reflections</h3>

          {pastReflections.length === 0 ? (
            <div className="card" style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
              <p>No past reflections yet.</p>
              <p style={{ fontSize: '0.85rem', marginTop: 8 }}>Start journaling daily!</p>
            </div>
          ) : (
            pastReflections.map((r, i) => {
              const mood = MOODS.find(m => m.key === r.mood) || MOODS[2];
              const isToday = new Date(r.date).toDateString() === new Date().toDateString();
              return (
                <motion.div
                  key={r._id}
                  className="past-card card"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.08 }}
                >
                  <div className="past-card-header">
                    <div className="past-date">
                      <span className="mood-emoji-sm">{mood.emoji}</span>
                      <span>
                        {isToday ? 'Today' : new Date(r.date).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span
                        className="mood-chip"
                        style={{ color: mood.color, background: `${mood.color}18`, border: `1px solid ${mood.color}30` }}
                      >
                        {mood.label}
                      </span>
                      {!isToday && (
                        <button
                          className="action-btn delete"
                          onClick={() => deleteReflection(r._id)}
                          title="Delete"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>

                  {r.wentWell && (
                    <div className="past-entry">
                      <span className="entry-label" style={{ color: '#34d399' }}>✅ Went Well</span>
                      <p>{r.wentWell}</p>
                    </div>
                  )}
                  {r.notWell && (
                    <div className="past-entry">
                      <span className="entry-label" style={{ color: '#f87171' }}>🔄 Improve</span>
                      <p>{r.notWell}</p>
                    </div>
                  )}
                  {r.gratitude && (
                    <div className="past-entry">
                      <span className="entry-label" style={{ color: '#fbbf24' }}>🙏 Grateful</span>
                      <p>{r.gratitude}</p>
                    </div>
                  )}
                </motion.div>
              );
            })
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Reflection;
