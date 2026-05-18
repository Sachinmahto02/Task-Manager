import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import './EditProfile.css';

const headingVariants = {
  hidden:  { opacity: 0, y: -18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.4,0,0.2,1] } }
};
const tabVariants = {
  hidden:  { opacity: 0, x: 16 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.35, ease: [0.4,0,0.2,1] } },
  exit:    { opacity: 0, x: -16, transition: { duration: 0.2 } }
};
const GENDERS = [
  { value:'',                  label:'Select gender' },
  { value:'male',              label:'Male' },
  { value:'female',            label:'Female' },
  { value:'non-binary',        label:'Non-binary' },
  { value:'prefer-not-to-say', label:'Prefer not to say' },
];

const EditProfile = () => {
  const { user, updateProfile, changePassword, deleteAccount, authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('personal');

  // Delete account dialog state
  const [showDeleteDialog, setShowDeleteDialog]       = useState(false);
  const [deleteStep, setDeleteStep]                   = useState('confirm'); // 'confirm' | 'password'
  const [deletePassword, setDeletePassword]           = useState('');
  const [deletePasswordError, setDeletePasswordError] = useState('');
  const [showDeletePw, setShowDeletePw]               = useState(false);
  const [deleting, setDeleting]                       = useState(false);

  const openDeleteDialog = () => {
    setDeleteStep('confirm');
    setDeletePassword('');
    setDeletePasswordError('');
    setShowDeletePw(false);
    setShowDeleteDialog(true);
  };

  const closeDeleteDialog = () => {
    if (deleting) return;
    setShowDeleteDialog(false);
  };

  const handleDeleteProceed = () => {
    setDeleteStep('password');
  };

  const handleDeleteConfirm = async () => {
    if (!deletePassword.trim()) {
      setDeletePasswordError('Please enter your password.');
      return;
    }
    setDeletePasswordError('');
    setDeleting(true);

    let result;
    try {
      result = await deleteAccount(deletePassword);
    } catch {
      result = { success: false, message: 'An unexpected error occurred. Please try again.' };
    }

    setDeleting(false);

    if (result.success) {
      // Account deleted — AuthContext cleared the session, ProtectedRoute will redirect
      toast.success('Account permanently deleted. Goodbye! 👋');
    } else {
      // Wrong password or other error — stay on dialog, show error, clear password field
      setDeletePassword('');
      setDeletePasswordError(result.message || 'Incorrect password. Please try again.');
    }
  };

  const [form, setForm] = useState({ name:'', dateOfBirth:'', phone:'', bio:'', location:'', gender:'', occupation:'', website:'' });
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [avatarPreview,   setAvatarPreview]   = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef(null);

  const [pwForm, setPwForm] = useState({ currentPassword:'', newPassword:'', confirmPassword:'' });
  const [pwErrors, setPwErrors] = useState({});
  const [showPw, setShowPw] = useState({ current:false, new:false, confirm:false });
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    if (!user) return;
    setAvatarPreview(user.avatar || '');
    setForm({
      name:        user.name        || '',
      dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
      phone:       user.phone       || '',
      bio:         user.bio         || '',
      location:    user.location    || '',
      gender:      user.gender      || '',
      occupation:  user.occupation  || '',
      website:     user.website     || '',
    });
  }, [user]);

  const initials = user?.name?.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2) || 'U';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (formErrors[name]) setFormErrors(er => ({ ...er, [name]:'' }));
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert('Image must be under 2 MB.'); return; }
    if (!file.type.startsWith('image/')) { alert('Please select an image file.'); return; }
    setAvatarUploading(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target.result;
      setAvatarPreview(base64);
      try {
        const result = await updateProfile({ avatar: base64 });
        if (result.success) {
          const { toast } = await import('react-toastify');
          toast.success('Profile picture updated! ✓');
        }
      } catch { }
      setAvatarUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const validatePersonal = () => {
    const e = {};
    if (!form.name || form.name.length < 2) e.name = 'Name must be at least 2 characters';
    if (form.bio.length > 300) e.bio = 'Bio cannot exceed 300 characters';
    if (form.website && !/^https?:\/\/.+/.test(form.website)) e.website = 'Must start with http:// or https://';
    return e;
  };

  const handleSavePersonal = async (e) => {
    e.preventDefault();
    const errs = validatePersonal();
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setFormErrors({});
    setSaving(true);
    const result = await updateProfile(form);
    setSaving(false);
    if (result.success) toast.success('Profile updated! ✓');
    else toast.error(result.message);
  };

  const handlePwChange = (e) => {
    const { name, value } = e.target;
    setPwForm(f => ({ ...f, [name]: value }));
    if (pwErrors[name]) setPwErrors(er => ({ ...er, [name]:'' }));
  };

  const pwStrength = (p) => {
    let s=0;
    if(p.length>=8)s++;if(/[A-Z]/.test(p))s++;if(/[0-9]/.test(p))s++;if(/[^A-Za-z0-9]/.test(p))s++;
    return s;
  };
  const strength = pwStrength(pwForm.newPassword);
  const strengthLabels = ['','Weak','Fair','Good','Strong'];
  const strengthColors = ['','#ef4444','#f59e0b','#5b8dee','#10b981'];

  const validatePw = () => {
    const e = {};
    if (!pwForm.currentPassword) e.currentPassword = 'Current password is required';
    if (!pwForm.newPassword || pwForm.newPassword.length < 6) e.newPassword = 'Min. 6 characters';
    if (pwForm.newPassword !== pwForm.confirmPassword) e.confirmPassword = 'Passwords do not match';
    if (pwForm.currentPassword && pwForm.currentPassword === pwForm.newPassword) e.newPassword = 'New password must differ from current';
    return e;
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    const errs = validatePw();
    if (Object.keys(errs).length) { setPwErrors(errs); return; }
    setPwErrors({});
    setSavingPw(true);
    const result = await changePassword(pwForm.currentPassword, pwForm.newPassword);
    setSavingPw(false);
    if (result.success) {
      toast.success('Password changed! 🔒');
      setPwForm({ currentPassword:'', newPassword:'', confirmPassword:'' });
    } else {
      setPwErrors({ currentPassword: result.message });
      toast.error(result.message);
    }
  };

  const isGoogle = user?.authProvider === 'google';

  return (
    <div className="profile-page">
      <motion.div className="profile-heading-row" variants={headingVariants} initial="hidden" animate="visible">
        <div>
          <h1 className="profile-page-title">👤 Edit Profile</h1>
          <p className="profile-page-sub">Manage your personal information and account settings</p>
        </div>
      </motion.div>

      <div className="profile-layout">
        {/* Avatar sidebar */}
        <motion.div className="avatar-card card" initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.1, duration:0.45 }}>
          <div className="avatar-upload-wrap">
            <div className="avatar-circle">
              {avatarPreview
                ? <img src={avatarPreview} alt="avatar" className="avatar-img" />
                : <span className="avatar-initials">{initials}</span>
              }
              {avatarUploading && (
                <div className="avatar-upload-overlay">
                  <div className="spinner" style={{ width:22, height:22 }} />
                </div>
              )}
            </div>
            <button
              type="button"
              className="avatar-upload-btn"
              onClick={() => fileInputRef.current?.click()}
              title="Change profile picture"
              disabled={avatarUploading}
            >
              📷 {avatarUploading ? 'Uploading…' : 'Change Photo'}
            </button>
            {avatarPreview && (
              <button
                type="button"
                className="avatar-remove-btn"
                onClick={async () => {
                  setAvatarUploading(true);
                  const result = await updateProfile({ avatar: '' });
                  if (result.success) {
                    setAvatarPreview('');
                    const { toast } = await import('react-toastify');
                    toast.success('Profile picture removed');
                  }
                  setAvatarUploading(false);
                }}
                disabled={avatarUploading}
                title="Remove profile picture"
              >
                🗑️ Remove Photo
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display:'none' }}
              onChange={handleAvatarChange}
            />
            <p className="avatar-upload-hint">JPG, PNG or GIF · Max 2 MB</p>
          </div>
          <div className="avatar-user-name">{user?.name}</div>
          <div className="avatar-user-email">{user?.email}</div>
          {isGoogle && (
            <div className="avatar-provider-badge">
              <svg width="14" height="14" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Google Account
            </div>
          )}
          <div className="avatar-stats">
            <div className="avatar-stat"><span className="avatar-stat-val">{user?.streak||0}</span><span className="avatar-stat-label">Streak 🔥</span></div>
            <div className="avatar-stat-divider"/>
            <div className="avatar-stat"><span className="avatar-stat-val">{user?.createdAt?new Date(user.createdAt).toLocaleDateString('en',{month:'short',year:'numeric'}):'—'}</span><span className="avatar-stat-label">Joined</span></div>
          </div>
          <div className="profile-tabs">
            {[['personal','👤 Personal'],['password','🔒 Password']].map(([id,label])=>(
              <button key={id} className={`profile-tab ${activeTab===id?'active':''}`} onClick={()=>setActiveTab(id)}>{label}</button>
            ))}
            {!isGoogle && (
              <button
                type="button"
                className="profile-tab profile-tab-danger"
                onClick={openDeleteDialog}
              >
                🗑️ Delete Account
              </button>
            )}
          </div>
        </motion.div>

        {/* Form area */}
        <motion.div className="profile-form-card card" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.15, duration:0.45 }}>
          <AnimatePresence mode="wait">
            {activeTab==='personal' && (
              <motion.form key="personal" variants={tabVariants} initial="hidden" animate="visible" exit="exit" onSubmit={handleSavePersonal} className="profile-form" noValidate>
                <div className="form-section-title">Personal Information</div>
                <div className="form-row-2">
                  <div className="input-group">
                    <label className="input-label">Full Name *</label>
                    <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="Your full name" className={`input-field ${formErrors.name?'input-error':''}`}/>
                    {formErrors.name && <span className="field-error">{formErrors.name}</span>}
                  </div>
                  <div className="input-group">
                    <label className="input-label">Date of Birth</label>
                    <input type="date" name="dateOfBirth" value={form.dateOfBirth} onChange={handleChange} max={new Date().toISOString().split('T')[0]} className="input-field" style={{colorScheme:'dark'}}/>
                  </div>
                </div>
                <div className="form-row-2">
                  <div className="input-group">
                    <label className="input-label">Phone Number</label>
                    <input type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="+91 99999 00000" className={`input-field ${formErrors.phone?'input-error':''}`}/>
                    {formErrors.phone && <span className="field-error">{formErrors.phone}</span>}
                  </div>
                  <div className="input-group">
                    <label className="input-label">Gender</label>
                    <select name="gender" value={form.gender} onChange={handleChange} className="input-field">
                      {GENDERS.map(g=><option key={g.value} value={g.value}>{g.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-row-2">
                  <div className="input-group">
                    <label className="input-label">Occupation</label>
                    <input type="text" name="occupation" value={form.occupation} onChange={handleChange} placeholder="e.g. Student, Engineer…" className="input-field"/>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Location</label>
                    <input type="text" name="location" value={form.location} onChange={handleChange} placeholder="City, Country" className="input-field"/>
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">Website / Portfolio</label>
                  <input type="url" name="website" value={form.website} onChange={handleChange} placeholder="https://yoursite.com" className={`input-field ${formErrors.website?'input-error':''}`}/>
                  {formErrors.website && <span className="field-error">{formErrors.website}</span>}
                </div>
                <div className="input-group">
                  <label className="input-label">Bio <span className="bio-count">{form.bio.length}/300</span></label>
                  <textarea name="bio" value={form.bio} onChange={handleChange} placeholder="Tell us about yourself…" rows={3} className={`input-field ${formErrors.bio?'input-error':''}`} style={{resize:'vertical',minHeight:80}}/>
                  {formErrors.bio && <span className="field-error">{formErrors.bio}</span>}
                </div>
                <div className="input-group">
                  <label className="input-label">Email Address</label>
                  <input type="email" value={user?.email||''} disabled className="input-field input-disabled"/>
                  <span className="field-hint">Email cannot be changed here.</span>
                </div>
                <div className="form-footer">
                  <motion.button type="submit" className="btn btn-primary btn-lg" disabled={saving||authLoading} whileHover={{scale:1.02}} whileTap={{scale:0.98}}>
                    {saving?<><div className="spinner" style={{width:18,height:18}}/> Saving…</>:<>✓ Save Changes</>}
                  </motion.button>
                </div>
              </motion.form>
            )}
            {activeTab==='password' && (
              <motion.form key="password" variants={tabVariants} initial="hidden" animate="visible" exit="exit" onSubmit={handleSavePassword} className="profile-form" noValidate>
                <div className="form-section-title">Change Password</div>
                {isGoogle && (
                  <div className="google-pw-notice"><span>ℹ️</span><span>This is a Google account. Manage your password through Google account settings.</span></div>
                )}
                {[
                  {name:'currentPassword',label:'Current Password',show:'current',placeholder:'Enter current password',ac:'current-password'},
                  {name:'newPassword',label:'New Password',show:'new',placeholder:'Min. 6 characters',ac:'new-password'},
                  {name:'confirmPassword',label:'Confirm New Password',show:'confirm',placeholder:'Repeat new password',ac:'new-password'},
                ].map(field=>(
                  <div className="input-group" key={field.name}>
                    <label className="input-label">{field.label}</label>
                    <div className="input-pw-wrap">
                      <input type={showPw[field.show]?'text':'password'} name={field.name} value={pwForm[field.name]} onChange={handlePwChange}
                        placeholder={field.placeholder} disabled={isGoogle} autoComplete={field.ac}
                        className={`input-field ${pwErrors[field.name]?'input-error':''}`}/>
                      <button type="button" className="pw-toggle" onClick={()=>setShowPw(p=>({...p,[field.show]:!p[field.show]}))}>
                        {showPw[field.show]?'🙈':'👁️'}
                      </button>
                    </div>
                    {field.name==='newPassword' && pwForm.newPassword && !isGoogle && (
                      <div className="pw-strength">
                        <div className="pw-strength-bars">{[1,2,3,4].map(i=><div key={i} className="pw-strength-bar" style={{background:i<=strength?strengthColors[strength]:'rgba(255,255,255,0.1)'}}/>)}</div>
                        <span style={{color:strengthColors[strength],fontSize:'0.75rem'}}>{strengthLabels[strength]}</span>
                      </div>
                    )}
                    {pwErrors[field.name] && <span className="field-error">{pwErrors[field.name]}</span>}
                  </div>
                ))}
                <div className="pw-tips">
                  <p className="pw-tips-title">Tips for a strong password:</p>
                  <ul>{['At least 8 characters','Mix of uppercase & lowercase','Include numbers or symbols','Avoid your name or email'].map(t=><li key={t}>{t}</li>)}</ul>
                </div>
                <div className="form-footer">
                  <motion.button type="submit" className="btn btn-primary btn-lg" disabled={savingPw||authLoading||isGoogle} whileHover={{scale:isGoogle?1:1.02}} whileTap={{scale:isGoogle?1:0.98}}>
                    {savingPw?<><div className="spinner" style={{width:18,height:18}}/> Updating…</>:<>🔒 Update Password</>}
                  </motion.button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* ── Delete Account Dialog ── */}
      <AnimatePresence>
        {showDeleteDialog && (
          <motion.div
            className="delete-dialog-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeDeleteDialog}
          >
            <motion.div
              className="delete-dialog"
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="delete-dialog-icon">⚠️</div>
              <h2 className="delete-dialog-title">Delete Account</h2>

              {deleteStep === 'confirm' ? (
                <>
                  <p className="delete-dialog-desc">
                    This action is <strong>permanent and irreversible</strong>. All your tasks, reflections, analytics data, and account information will be deleted forever.
                  </p>
                  <ul className="delete-dialog-list">
                    <li>✗ All tasks &amp; task history</li>
                    <li>✗ All reflections</li>
                    <li>✗ Your profile &amp; settings</li>
                    <li>✗ Analytics &amp; streaks</li>
                  </ul>
                  <div className="delete-dialog-actions">
                    <button className="btn-delete-cancel" onClick={closeDeleteDialog}>Cancel</button>
                    <button className="btn-delete-proceed" onClick={handleDeleteProceed}>
                      Yes, Delete My Account
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="delete-dialog-desc">
                    To confirm, please enter your <strong>current password</strong> to permanently delete your account.
                  </p>
                  <div className="input-group" style={{ width: '100%', textAlign: 'left' }}>
                    <label className="input-label">Your Password</label>
                    <div className="input-pw-wrap">
                      <input
                        type={showDeletePw ? 'text' : 'password'}
                        value={deletePassword}
                        onChange={(e) => { setDeletePassword(e.target.value); setDeletePasswordError(''); }}
                        placeholder="Enter your password"
                        className={`input-field ${deletePasswordError ? 'input-error' : ''}`}
                        autoFocus
                        onKeyDown={(e) => { if (e.key === 'Enter') handleDeleteConfirm(); }}
                      />
                      <button type="button" className="pw-toggle" onClick={() => setShowDeletePw(p => !p)}>
                        {showDeletePw ? '🙈' : '👁️'}
                      </button>
                    </div>
                    {deletePasswordError && <span className="field-error">{deletePasswordError}</span>}
                  </div>
                  <div className="delete-dialog-actions">
                    <button className="btn-delete-cancel" onClick={closeDeleteDialog} disabled={deleting}>Cancel</button>
                    <button className="btn-delete-final" onClick={handleDeleteConfirm} disabled={deleting}>
                      {deleting
                        ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Deleting…</>
                        : '🗑️ Permanently Delete'
                      }
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EditProfile;
