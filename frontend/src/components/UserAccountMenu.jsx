import React, { useEffect, useRef, useState } from 'react';

import { getMe, patchMe } from '../api/users';
import { useAuth } from '../state/auth.jsx';

function apiOrigin() {
  const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';
  return base.replace(/\/api\/?$/, '');
}

function avatarSrc(url) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${apiOrigin()}${url}`;
}

export default function UserAccountMenu() {
  const { user, logout, patchUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ fullName: '', phone: '' });
  const wrapRef = useRef(null);

  useEffect(() => {
    function onDocMouseDown(e) {
      if (!open) return;
      const el = wrapRef.current;
      if (el && !el.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [open]);

  useEffect(() => {
    if (!open || !user) return undefined;
    let cancelled = false;
    (async () => {
      setError('');
      setLoading(true);
      try {
        const me = await getMe();
        if (!cancelled) {
          setForm({
            fullName: me.fullName || '',
            phone: me.phone || '',
          });
        }
      } catch (e) {
        if (!cancelled) {
          setError(e?.response?.data?.message || e.message || 'Không tải được hồ sơ');
          setForm({
            fullName: user.fullName || '',
            phone: user.phone || '',
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, user]);

  async function onSave(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const data = await patchMe({
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
      });
      patchUser({
        fullName: data.fullName,
        phone: data.phone,
        email: data.email,
        avatarUrl: data.avatarUrl,
      });
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  }

  const src = avatarSrc(user?.avatarUrl);
  const label = user?.fullName || user?.email || 'Tài khoản';

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '6px 10px',
          borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.14)',
          background: 'rgba(255,255,255,0.04)',
          color: 'inherit',
          cursor: 'pointer',
          maxWidth: 220,
        }}
      >
        {src ? (
          <img
            src={src}
            alt=""
            width={36}
            height={36}
            style={{ borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
          />
        ) : (
          <span
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'rgba(110,168,254,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              flexShrink: 0,
            }}
            aria-hidden
          >
            👤
          </span>
        )}
        <span
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            textAlign: 'left',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {label}
        </span>
        <span style={{ opacity: 0.6, fontSize: 10 }}>{open ? '▲' : '▼'}</span>
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Hồ sơ người dùng"
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 8px)',
            width: 320,
            maxWidth: 'min(320px, 92vw)',
            padding: 16,
            borderRadius: 14,
            border: '1px solid rgba(255,255,255,0.14)',
            background: 'rgba(22, 28, 42, 0.98)',
            boxShadow: '0 16px 40px rgba(0,0,0,0.45)',
            zIndex: 200,
          }}
        >
          <div style={{ fontWeight: 800, marginBottom: 4 }}>Hồ sơ</div>
          <p style={{ margin: '0 0 12px', fontSize: 12, color: 'rgba(232,238,252,0.65)', lineHeight: 1.4 }}>
            Thông tin này hiển thị cho admin khi bạn đặt phòng (họ tên, email, số điện thoại).
          </p>
          {error ? <div className="error" style={{ marginBottom: 10, fontSize: 13 }}>{error}</div> : null}
          {loading ? (
            <div style={{ color: 'rgba(232,238,252,0.6)', fontSize: 14 }}>Đang tải...</div>
          ) : (
            <form className="form" onSubmit={onSave} style={{ gap: 10 }}>
              <label style={{ margin: 0 }}>
                Họ và tên
                <input
                  value={form.fullName}
                  onChange={(e) => setForm((s) => ({ ...s, fullName: e.target.value }))}
                  required
                  minLength={2}
                />
              </label>
              <label style={{ margin: 0 }}>
                Số điện thoại
                <input
                  value={form.phone}
                  onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))}
                  placeholder="VD: 0901234567"
                  maxLength={20}
                />
              </label>
              <label style={{ margin: 0 }}>
                Email
                <input value={user?.email || ''} disabled style={{ opacity: 0.75 }} />
              </label>
              <button type="submit" className="btn" disabled={saving} style={{ marginTop: 4 }}>
                {saving ? 'Đang lưu...' : 'Lưu hồ sơ'}
              </button>
            </form>
          )}
          <button
            type="button"
            className="btn btnGhost"
            style={{ marginTop: 12, width: '100%' }}
            onClick={() => {
              setOpen(false);
              logout();
            }}
          >
            Đăng xuất
          </button>
        </div>
      ) : null}
    </div>
  );
}
