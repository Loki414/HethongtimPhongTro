import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { login, register } from '../api/auth';
import { useAuth } from '../state/auth.jsx';

export default function AuthPage() {
  const navigate = useNavigate();
  const loc = useLocation();
  const from = loc.state?.from || '/';
  const { setAuth } = useAuth();

  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'user',
  });

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data =
        mode === 'login'
          ? await login({ email: form.email, password: form.password })
          : await register({
              fullName: form.fullName,
              email: form.email,
              password: form.password,
              role: form.role,
            });

      setAuth({ token: data.token, user: data.user });
      navigate(from, { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Đăng nhập / Đăng ký</h2>
      {error ? <div className="error">{error}</div> : null}

      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
        <button className="btn btnGhost" onClick={() => setMode('login')} disabled={loading}>
          Đăng nhập
        </button>
        <button className="btn btnGhost" onClick={() => setMode('register')} disabled={loading}>
          Đăng ký
        </button>
      </div>

      <form className="form" onSubmit={onSubmit}>
        {mode === 'register' ? (
          <label>
            Họ tên
            <input value={form.fullName} onChange={(e) => setForm((s) => ({ ...s, fullName: e.target.value }))} />
          </label>
        ) : null}

        <label>
          Email
          <input value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} />
        </label>

        <label>
          Mật khẩu
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
          />
        </label>

        {mode === 'register' ? (
          <label>
            Vai trò
            <select value={form.role} onChange={(e) => setForm((s) => ({ ...s, role: e.target.value }))}>
              <option value="user">user</option>
              <option value="admin">admin (seed/demo)</option>
            </select>
          </label>
        ) : null}

        <button className="btn" type="submit" disabled={loading}>
          {loading ? 'Đang xử lý...' : mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}
        </button>
      </form>
    </div>
  );
}

