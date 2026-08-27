import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login.jsx';
import ManagerDashboard from './pages/ManagerDashboard.jsx';
import EmployeeDashboard from './pages/EmployeeDashboard.jsx';
import { getSession, clearSession } from './lib/session.js';

function Protected({ role, children }) {
  const user = getSession();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'manager' ? '/manager' : '/employee'} replace />;
  }
  return children;
}

export default function App() {
  const [user, setUser] = useState(getSession());

  useEffect(() => {
    setUser(getSession());
  }, []);

  function handleLogout() {
    clearSession();
    setUser(null);
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to={user.role === 'manager' ? '/manager' : '/employee'} replace /> : <Login onLogin={setUser} />}
      />
      <Route
        path="/manager"
        element={
          <Protected role="manager">
            <ManagerDashboard user={user} onLogout={handleLogout} />
          </Protected>
        }
      />
      <Route
        path="/employee"
        element={
          <Protected role="employee">
            <EmployeeDashboard user={user} onLogout={handleLogout} />
          </Protected>
        }
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
