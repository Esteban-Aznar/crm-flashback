import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import LeadsPage from './pages/LeadsPage';
import GruposPage from './pages/GruposPage';
import PerfilesPage from './pages/PerfilesPage';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0a0a',
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          border: '2px solid #222',
          borderTop: '2px solid #c9a84c',
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.rol !== 'administrador') return <Navigate to="/dashboard" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/dashboard" replace /> : children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          input:focus {
            border-color: #c9a84c !important;
            box-shadow: 0 0 0 3px rgba(201,168,76,0.1) !important;
          }
          button[type="submit"]:hover:not(:disabled) {
            opacity: 0.9;
            transform: translateY(-1px);
          }
        `}</style>
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/ventas/leads" element={<PrivateRoute><LeadsPage /></PrivateRoute>} />
          <Route path="/ventas/grupos" element={<PrivateRoute><GruposPage /></PrivateRoute>} />
          <Route path="/perfiles" element={<AdminRoute><PerfilesPage /></AdminRoute>} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
