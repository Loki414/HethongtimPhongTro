import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; // Điều hướng sau đăng nhập; đọc state.from (trang bị chặn trước đó)
import { login, register, forgotPassword, resetPassword } from '../api/auth'; // API đăng nhập / đăng ký / quên & reset MK
import { useAuth } from '../state/auth.jsx'; // Context: lưu token + user vào state + localStorage

export default function AuthPage() {
  const navigate = useNavigate(); // Hàm chuyển trang programmatically
  const loc = useLocation(); // Vị trí route hiện tại + state (ví dụ từ ProtectedRoute)
  const from = loc.state?.from || '/'; // Sau khi đăng nhập xong, quay về trang user muốn hoặc home
  const { setAuth } = useAuth(); // Cập nhật phiên đăng nhập toàn app

  const [mode, setMode] = useState('login'); // 'login' | 'register' — chỉ dùng khi flow === 'auth'
  /** Luồng màn hình: auth = đăng nhập/đăng ký; forgot = nhập email lấy token (demo); reset = nhập token + MK mới */
  const [flow, setFlow] = useState('auth');
  const [loading, setLoading] = useState(false); // Chặn double-submit, hiển thị “Đang xử lý…”
  const [error, setError] = useState(''); // Thông báo lỗi từ API hoặc mạng
  const [info, setInfo] = useState(''); // Thông báo thành công (quên MK / reset MK)

  const [form, setForm] = useState({
    fullName: '', // Chỉ dùng khi mode === 'register'
    email: '',
    password: '',
    role: 'user', // Gửi lên backend khi đăng ký (admin/user)
  });

  /** Token reset: điền sẵn sau bước forgot (bản demo trả token trong response). */
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState(''); // Mật khẩu mới ở form reset

  async function onSubmit(e) {
    e.preventDefault(); // Không reload trang khi submit form HTML
    setLoading(true); // Bật trạng thái đang gọi API
    setError(''); // Xóa lỗi cũ trước request mới
    setInfo('');
    try {
      const data =
        mode === 'login'
          ? await login({ email: form.email, password: form.password }) // API trả { token, user }
          : await register({
              // API trả object user; thường không có token — setAuth vẫn gọi chung (token có thể undefined)
              fullName: form.fullName,
              email: form.email,
              password: form.password,
              role: form.role,
            });

      setAuth({ token: data.token, user: data.user }); // Lưu JWT + user vào context và localStorage
      navigate(from, { replace: true }); // Thay history entry để nút Back không quay lại form auth
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Request failed'); // Ưu tiên message từ server
    } finally {
      setLoading(false); // Tắt loading dù thành công hay lỗi
    }
  }

  /** Gửi email → server tạo token reset (demo: token nằm trong JSON). */
  async function onForgotSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setInfo('');
    try {
      const data = await forgotPassword({ email: form.email });
      setInfo(data.message || 'Đã xử lý.');
      if (data.resetToken) {
        setResetToken(data.resetToken); // Điền sẵn bước kế tiếp
        setFlow('reset'); // Chuyển sang form đặt lại mật khẩu
      }
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  }

  /** Gửi token + mật khẩu mới → đổi hash trong DB, xóa token reset. */
  async function onResetSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setInfo('');
    try {
      await resetPassword({ token: resetToken.trim(), password: newPassword });
      setInfo('Đã đặt lại mật khẩu. Bạn có thể đăng nhập.');
      setFlow('auth'); // Quay lại đăng nhập
      setMode('login');
      setNewPassword('');
      setResetToken('');
      setForm((s) => ({ ...s, password: '' })); // Xóa MK cũ trên form login
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
      {info && flow !== 'reset' ? <div className="success" style={{ marginBottom: 12 }}>{info}</div> : null}

      {flow === 'auth' ? (
        <>
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

          {mode === 'login' ? (
            <p style={{ marginTop: 12, marginBottom: 0 }}>
              <button type="button" className="btn btnGhost" onClick={() => setFlow('forgot')} disabled={loading}>
                Quên mật khẩu?
              </button>
            </p>
          ) : null}
        </>
      ) : null}

      {flow === 'forgot' ? (
        <form className="form" onSubmit={onForgotSubmit}>
          <p style={{ marginTop: 0 }}>Nhập email đã đăng ký. Mã reset sẽ hiển thị ở bước tiếp theo (không gửi email).</p>
          <label>
            Email
            <input value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} />
          </label>
          <button className="btn" type="submit" disabled={loading}>
            {loading ? 'Đang xử lý...' : 'Lấy mã đặt lại'}
          </button>
          <button type="button" className="btn btnGhost" style={{ marginLeft: 8 }} onClick={() => setFlow('auth')} disabled={loading}>
            Quay lại
          </button>
        </form>
      ) : null}

      {flow === 'reset' ? (
        <form className="form" onSubmit={onResetSubmit}>
          <p style={{ marginTop: 0 }}>Dán mã reset (đã điền sẵn nếu email tồn tại) và nhập mật khẩu mới.</p>
          {info ? <div className="success" style={{ marginBottom: 12 }}>{info}</div> : null}
          <label>
            Mã reset (token)
            <input value={resetToken} onChange={(e) => setResetToken(e.target.value)} autoComplete="off" />
          </label>
          <label>
            Mật khẩu mới
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
            />
          </label>
          <button className="btn" type="submit" disabled={loading}>
            {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
          </button>
          <button type="button" className="btn btnGhost" style={{ marginLeft: 8 }} onClick={() => setFlow('auth')} disabled={loading}>
            Quay lại đăng nhập
          </button>
        </form>
      ) : null}
    </div>
  );
}
