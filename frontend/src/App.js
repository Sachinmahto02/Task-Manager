import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';
import Dashboard from './components/dashboard/Dashboard';
import Tasks from './components/tasks/Tasks';
import Reflection from './components/reflection/Reflection';
import Analytics from './components/analytics/Analytics';
import EditProfile from './components/profile/EditProfile';
import TaskHistory from './components/taskhistory/TaskHistory';
import Sidebar from './components/layout/Sidebar';
import ThreeBackground from './components/layout/ThreeBackground';
import CustomCursor from './components/layout/CustomCursor';
import './components/layout/Sidebar.css';

const AppLayout = ({ children }) => {
  const { user } = useAuth();
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  if (!user) return children;

  return (
    <div className="app-layout">
      <Sidebar onWidthChange={setSidebarWidth} />
      <main
        className="main-content"
        style={{ marginLeft: isMobile ? 0 : sidebarWidth }}
      >
        {children}
      </main>
    </div>
  );
};

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Dashboard />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tasks"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Tasks />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/reflection"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Reflection />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Analytics />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <AppLayout>
              <EditProfile />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/task-history"
        element={
          <ProtectedRoute>
            <AppLayout>
              <TaskHistory />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

function App() {
  // Sidebar width observer
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const sidebar = document.querySelector('.sidebar');
      if (sidebar) {
        const width = sidebar.offsetWidth;
        const main = document.querySelector('.main-content');
        if (main) main.style.marginLeft = `${width}px`;
      }
    });
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) observer.observe(sidebar, { attributes: true, attributeFilter: ['style'] });
    return () => observer.disconnect();
  }, []);

  return (
    <AuthProvider>
      <Router>
        <ThreeBackground />
        <CustomCursor />
        <AnimatedRoutes />
        <ToastContainer
          position="bottom-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnHover
          theme="dark"
          style={{ zIndex: 9999 }}
        />
      </Router>
    </AuthProvider>
  );
}

export default App;
