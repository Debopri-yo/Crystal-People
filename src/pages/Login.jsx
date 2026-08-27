import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { findUser } from '../lib/users.js';
import { saveSession } from '../lib/session.js';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();
    const user = findUser(username, password);
    if (!user) {
      setError('Username or password is incorrect.');
      return;
    }
    setError('');
    saveSession(user);
    onLogin(user);
    navigate(user.role === 'manager' ? '/manager' : '/employee');
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-title">Crystal People</div>
        <div className="login-sub">Monthly performance check-ins</div>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. manager or arjun1"
              autoFocus
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          {error && <div className="error-text">{error}</div>}
          <button type="submit" className="btn-primary">Sign in</button>
        </form>

        <div className="hint-text">
          Demo credentials — manager: <strong>manager / manager123</strong>.
          Employees: first-name+number, e.g. <strong>arjun1 / employee123</strong>,
          <strong> priya2 / employee123</strong>, etc.
        </div>
      </div>
    </div>
  );
}
