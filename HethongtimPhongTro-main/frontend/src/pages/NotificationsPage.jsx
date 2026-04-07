import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { listNotifications, markAllNotificationsRead, markNotificationRead } from '../api/notifications';

export default function NotificationsPage() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 15;

  function notifyBadgeRefresh() {
    window.dispatchEvent(new Event('dack-notifications-updated'));
  }

  async function load() {
    setError('');
    setLoading(true);
    try {
      const res = await listNotifications({ page, pageSize });
      setItems(res.items || []);
      setMeta(res.meta || null);
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Không tải được thông báo');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  async function onMarkAllRead() {
    setError('');
    try {
      await markAllNotificationsRead();
      notifyBadgeRefresh();
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Thao tác thất bại');
    }
  }

  async function onOpenItem(n) {
    if (!n.readAt) {
      try {
        await markNotificationRead(n.id);
        setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x)));
        setMeta((m) => (m ? { ...m, unreadCount: Math.max(0, (m.unreadCount || 0) - 1) } : m));
        notifyBadgeRefresh();
      } catch {
        /* still navigate */
      }
    }
  }

  const totalPages = meta?.pageCount || 1;

  const pageNumbers = useMemo(() => {
    if (!meta) return [];
    const windowSize = 5;
    const current = meta.page || 1;
    const half = Math.floor(windowSize / 2);
    const pages = meta.pageCount || 1;
    let start = Math.max(1, current - half);
    let end = Math.min(pages, start + windowSize - 1);
    start = Math.max(1, end - windowSize + 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [meta]);

  return (
    <div className="grid" style={{ gap: 14 }}>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Thông báo</h2>
        {meta?.unreadCount > 0 ? (
          <p style={{ margin: '8px 0 0', color: 'rgba(232,238,252,0.75)' }}>
            Bạn có {meta.unreadCount} thông báo chưa đọc.
          </p>
        ) : (
          <p style={{ margin: '8px 0 0', color: 'rgba(232,238,252,0.65)' }}>Không có thông báo chưa đọc.</p>
        )}
        {meta?.unreadCount > 0 ? (
          <button type="button" className="btn btnGhost" style={{ marginTop: 12 }} onClick={onMarkAllRead}>
            Đánh dấu tất cả đã đọc
          </button>
        ) : null}
        {error ? <div className="error" style={{ marginTop: 12 }}>{error}</div> : null}
      </div>

      <div className="card">
        {loading ? (
          <div style={{ color: 'rgba(232,238,252,0.7)' }}>Đang tải...</div>
        ) : !items.length ? (
          <div style={{ color: 'rgba(232,238,252,0.7)' }}>Chưa có thông báo nào.</div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {items.map((n) => {
              const roomId = n.payload?.roomId;
              const depositInvoiceId = n.payload?.depositInvoiceId;
              const inner = (
                <>
                  <div style={{ fontWeight: n.readAt ? 600 : 800 }}>{n.title}</div>
                  {n.body ? (
                    <div style={{ marginTop: 6, color: 'rgba(232,238,252,0.85)', fontSize: 14 }}>{n.body}</div>
                  ) : null}
                  <div style={{ marginTop: 8, fontSize: 12, color: 'rgba(232,238,252,0.5)' }}>
                    {new Date(n.createdAt).toLocaleString('vi-VN')}
                    {!n.readAt ? <span style={{ marginLeft: 8 }}>· Chưa đọc</span> : null}
                  </div>
                </>
              );
              return (
                <div
                  key={n.id}
                  style={{
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 14,
                    padding: 14,
                    background: n.readAt ? 'transparent' : 'rgba(110,168,254,0.06)',
                  }}
                >
                  {(n.type === 'deposit_invoice' || n.type === 'deposit_paid') && depositInvoiceId ? (
                    <Link
                      to={`/deposits/${depositInvoiceId}`}
                      onClick={() => onOpenItem(n)}
                      style={{ color: 'inherit', textDecoration: 'none', display: 'block' }}
                    >
                      {inner}
                      <span className="btn btnGhost" style={{ marginTop: 10, display: 'inline-flex' }}>
                        Xem hóa đơn cọc
                      </span>
                    </Link>
                  ) : roomId ? (
                    <Link
                      to={`/rooms/${roomId}`}
                      onClick={() => onOpenItem(n)}
                      style={{ color: 'inherit', textDecoration: 'none', display: 'block' }}
                    >
                      {inner}
                      <span className="btn btnGhost" style={{ marginTop: 10, display: 'inline-flex' }}>
                        Xem phòng
                      </span>
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onOpenItem(n)}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        margin: 0,
                        textAlign: 'left',
                        color: 'inherit',
                        cursor: 'pointer',
                        width: '100%',
                      }}
                    >
                      {inner}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {meta && totalPages > 1 ? (
          <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <button className="btn btnGhost" disabled={page <= 1 || loading} onClick={() => setPage(page - 1)}>
              Trang trước
            </button>
            {pageNumbers.map((p) => (
              <button
                key={p}
                className="btn"
                type="button"
                disabled={loading}
                onClick={() => setPage(p)}
                style={{
                  padding: '8px 12px',
                  borderColor: p === page ? 'rgba(110,168,254,0.9)' : 'rgba(255,255,255,0.12)',
                  background: p === page ? 'rgba(110,168,254,0.12)' : 'transparent',
                }}
              >
                {p}
              </button>
            ))}
            <button className="btn btnGhost" disabled={page >= totalPages || loading} onClick={() => setPage(page + 1)}>
              Trang sau
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
