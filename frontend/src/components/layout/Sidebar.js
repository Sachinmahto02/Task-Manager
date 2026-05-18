import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';

const navItems = [
  { to:'/dashboard',    icon:'⚡', label:'Dashboard'    },
  { to:'/tasks',        icon:'✅', label:'Tasks'         },
  { to:'/reflection',   icon:'🧠', label:'Reflection'   },
  { to:'/analytics',    icon:'📊', label:'Analytics'    },
  { to:'/task-history', icon:'🗓', label:'History'      },
];

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
};

const Sidebar = ({ onWidthChange }) => {
  const { user, logout, updateProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [collapsed,      setCollapsed]     = useState(false);
  const [mobileOpen,     setMobileOpen]    = useState(false);
  const [showUserMenu,   setShowUserMenu]  = useState(false);
  const [removingPhoto,  setRemovingPhoto] = useState(false);
  const menuRef = useRef(null);

  // Close mobile sidebar on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const handleLogout = async () => {
    setShowUserMenu(false);
    setMobileOpen(false);
    await logout();
    navigate('/login');
  };

  const handleEditProfile = () => {
    setShowUserMenu(false);
    setMobileOpen(false);
    navigate('/profile');
  };

  const handleRemovePhoto = async () => {
    if (!user?.avatar) return;
    setRemovingPhoto(true);
    try {
      const result = await updateProfile({ avatar: '' });
      if (result.success) toast.success('Profile picture removed');
      else toast.error('Failed to remove photo');
    } catch {
      toast.error('Failed to remove photo');
    }
    setRemovingPhoto(false);
    setShowUserMenu(false);
  };

  useEffect(() => {
    const h = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowUserMenu(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  // Notify parent of width (desktop only)
  const desktopWidth = collapsed ? 72 : 260;
  useEffect(() => {
    if (!isMobile && onWidthChange) onWidthChange(desktopWidth);
    if (isMobile && onWidthChange) onWidthChange(0);
  }, [isMobile, desktopWidth, onWidthChange]);

  return (
    <>
      {/* ── Hamburger button (mobile only) ── */}
      {isMobile && (
        <button
          className="mobile-menu-btn"
          onClick={() => setMobileOpen(o => !o)}
          aria-label="Open menu"
        >
          {mobileOpen ? '✕' : '☰'}
        </button>
      )}

      {/* ── Backdrop (mobile only) ── */}
      {isMobile && (
        <div
          className={`sidebar-backdrop ${mobileOpen ? 'open' : ''}`}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Sidebar drawer ── */}
      <motion.aside
        className={`sidebar ${isMobile && mobileOpen ? 'mobile-open' : ''}`}
        animate={isMobile ? {} : { width: collapsed ? 72 : 260 }}
        style={isMobile ? { width: 280 } : undefined}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="logo-icon animate-float"><span>✦</span></div>
          <AnimatePresence>
            {(!collapsed || isMobile) && (
              <motion.span className="logo-text"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}>
                ZenFlow
              </motion.span>
            )}
          </AnimatePresence>
          {!isMobile && (
            <button className="sidebar-collapse-btn" onClick={() => setCollapsed(!collapsed)}>
              <span style={{ transform: collapsed ? 'rotate(180deg)' : 'none', display: 'inline-block', transition: '0.3s' }}>‹</span>
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
              title={collapsed && !isMobile ? item.label : undefined}
            >
              <span className="sidebar-item-icon">{item.icon}</span>
              <AnimatePresence>
                {(!collapsed || isMobile) && (
                  <motion.span className="sidebar-item-label"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}>
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div className="sidebar-footer" ref={menuRef}>
          <div className="sidebar-user" onClick={() => setShowUserMenu(!showUserMenu)}>
            <div className="user-avatar">
              {user?.avatar
                ? <img src={user.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                : initials}
            </div>
            <AnimatePresence>
              {(!collapsed || isMobile) && (
                <motion.div className="user-info" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <span className="user-name">{user?.name}</span>
                  <span className="user-streak">🔥 {user?.streak || 0} day streak</span>
                </motion.div>
              )}
            </AnimatePresence>
            {(!collapsed || isMobile) && (
              <span className="user-menu-arrow" style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-muted)', transform: showUserMenu ? 'rotate(180deg)' : 'none', transition: '0.25s' }}>▼</span>
            )}
          </div>

          <AnimatePresence>
            {showUserMenu && (
              <motion.div className="user-dropdown"
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ duration: 0.18 }}
              >
                <div className="dropdown-user-header">
                  <div className="dropdown-avatar">
                    {user?.avatar
                      ? <img src={user.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                      : initials}
                  </div>
                  <div>
                    <div className="dropdown-name">{user?.name}</div>
                    <div className="dropdown-email">{user?.email}</div>
                  </div>
                </div>

                <div className="dropdown-divider" />

                <button className="dropdown-item" onClick={handleEditProfile}>
                  <span>✏️</span><span>Edit Profile</span>
                </button>

                <button className="dropdown-item" onClick={() => { setShowUserMenu(false); navigate('/profile?tab=password'); }}>
                  <span>🔒</span><span>Change Password</span>
                </button>

                {user?.avatar && (
                  <button
                    className="dropdown-item dropdown-remove-photo"
                    onClick={handleRemovePhoto}
                    disabled={removingPhoto}
                  >
                    <span>{removingPhoto ? '⏳' : '🗑️'}</span>
                    <span>{removingPhoto ? 'Removing…' : 'Remove Photo'}</span>
                  </button>
                )}

                <div className="dropdown-divider" />

                <button className="dropdown-item dropdown-logout" onClick={handleLogout}>
                  <span>🚪</span><span>Logout</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.aside>

      {/* ── Mobile Bottom Navigation Bar ── */}
      {isMobile && (
        <nav className="mobile-bottom-nav">
          <div className="mobile-bottom-nav-inner">
            {navItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
              >
                <span className="mobile-nav-icon">{item.icon}</span>
                <span className="mobile-nav-label">{item.label}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </>
  );
};

export default Sidebar;
