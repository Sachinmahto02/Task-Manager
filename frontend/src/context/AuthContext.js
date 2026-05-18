import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API = axios.create({ baseURL: '/api' });

// Attach JWT to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('zjToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-logout on 401 — but NOT for delete-account or change-password
// (those endpoints return 400/401 for wrong password, not expired session)
API.interceptors.response.use(
  (res) => res,
  (error) => {
    const url = error.config?.url || '';
    const skipAutoLogout = url.includes('delete-account') || url.includes('change-password');
    if (error.response?.status === 401 && !skipAutoLogout) {
      localStorage.removeItem('zjToken');
      localStorage.removeItem('zjUser');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const AuthProvider = ({ children }) => {
  const [user, setUser]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [authLoading, setAuthLoading] = useState(false);

  // Hydrate session on mount
  const initAuth = useCallback(async () => {
    const token     = localStorage.getItem('zjToken');
    const savedUser = localStorage.getItem('zjUser');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      try {
        const res = await API.get('/auth/me');
        setUser(res.data.user);
        localStorage.setItem('zjUser', JSON.stringify(res.data.user));
      } catch {
        localStorage.removeItem('zjToken');
        localStorage.removeItem('zjUser');
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => { initAuth(); }, [initAuth]);

  // Shared token save helper
  const saveSession = (token, userData) => {
    localStorage.setItem('zjToken', token);
    localStorage.setItem('zjUser', JSON.stringify(userData));
    setUser(userData);
  };

  // ── Email/password register ───────────────────────────────────
  const register = async (name, email, password) => {
    setAuthLoading(true);
    try {
      const res = await API.post('/auth/register', { name, email, password });
      saveSession(res.data.token, res.data.user);
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Registration failed.' };
    } finally { setAuthLoading(false); }
  };

  // ── Email/password login ──────────────────────────────────────
  const login = async (email, password) => {
    setAuthLoading(true);
    try {
      const res = await API.post('/auth/login', { email, password });
      saveSession(res.data.token, res.data.user);
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Invalid email or password.' };
    } finally { setAuthLoading(false); }
  };

  // ── Google login ──────────────────────────────────────────────
  // credential = the ID token string from @react-oauth/google's onSuccess
  const googleLogin = async (credential) => {
    setAuthLoading(true);
    try {
      const res = await API.post('/auth/google', { credential });
      saveSession(res.data.token, res.data.user);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Google sign-in failed. Please try again.'
      };
    } finally { setAuthLoading(false); }
  };


  // ── Update profile ────────────────────────────────────────────
  const updateProfile = async (profileData) => {
    setAuthLoading(true);
    try {
      const res = await API.put('/auth/profile', profileData);
      const updatedUser = res.data.user;
      setUser(updatedUser);
      localStorage.setItem('zjUser', JSON.stringify(updatedUser));
      return { success: true, user: updatedUser };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Failed to update profile.' };
    } finally { setAuthLoading(false); }
  };

  // ── Change password ───────────────────────────────────────────
  const changePassword = async (currentPassword, newPassword) => {
    setAuthLoading(true);
    try {
      const res = await API.put('/auth/change-password', { currentPassword, newPassword });
      return { success: true, message: res.data.message };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Failed to change password.' };
    } finally { setAuthLoading(false); }
  };

  // ── Logout ────────────────────────────────────────────────────
  const logout = async () => {
    try { await API.post('/auth/logout'); } catch {}
    localStorage.removeItem('zjToken');
    localStorage.removeItem('zjUser');
    setUser(null);
  };

  // ── Delete account ────────────────────────────────────────────
  const deleteAccount = async (password) => {
    setAuthLoading(true);
    try {
      const res = await API.post('/auth/delete-account', { password });
      // Clear session after successful deletion
      localStorage.removeItem('zjToken');
      localStorage.removeItem('zjUser');
      setUser(null);
      return { success: true, message: res.data.message };
    } catch (err) {
      const status = err.response?.status;
      const msg    = err.response?.data?.message;
      if (status === 404) return { success: false, message: 'Backend route missing — please fully stop and restart your backend server, then try again.' };
      return { success: false, message: msg || 'Failed to delete account.' };
    } finally { setAuthLoading(false); }
  };

  return (
    <AuthContext.Provider value={{
      user, loading, authLoading,
      login, register, googleLogin, logout,
      updateProfile, changePassword, deleteAccount,
      API
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export { API };
