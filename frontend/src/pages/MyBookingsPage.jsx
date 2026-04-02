import React, { useEffect, useMemo, useState } from 'react';

import { listBookings } from '../api/bookings';
import { Link } from 'react-router-dom';

export default function MyBookingsPage() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [page, setPage] = useState(1);
  const pageSize = 6;

  async function load() {
    setError('');
    setLoading(true);
    try {
      const res = await listBookings({ page, pageSize });
      setItems(res.items || []);
      setMeta(res.meta || null);
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Load bookings failed');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

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
        <h2 style={{ marginTop: 0 }}>Lịch đặt</h2>
        <div style={{ color: 'rgba(232,238,252,0.7)', marginTop: 6 }}>
          {meta ? `${meta.total} booking (trang ${meta.page}/${meta.pageCount})` : 'Đang tải...'}
        </div>
        {error ? <div className="error" style={{ marginTop: 10 }}>{error}</div> : null}
      </div>

      <div className="card">
        {loading ? (
          <div style={{ color: 'rgba(232,238,252,0.7)' }}>Đang tải...</div>
        ) : !items.length ? (
          <div style={{ color: 'rgba(232,238,252,0.7)' }}>Bạn chưa có booking nào.</div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {items.map((b) => (
              <div
                key={b.id}
                style={{
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 14,
                  padding: 12,
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ minWidth: 240 }}>
                  <div style={{ fontWeight: 800 }}>{b.room?.title || 'Phòng'}</div>
                  <div className="roomMeta" style={{ marginTop: 8 }}>
                    <span className="pill">Từ: {b.startDate}</span>
                    <span className="pill">Đến: {b.endDate}</span>
                    <span className="pill">Trạng thái: {b.status}</span>
                  </div>
                  {b.note ? <div style={{ marginTop: 8, color: 'rgba(232,238,252,0.8)' }}>Ghi chú: {b.note}</div> : null}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <Link className="btn" to={`/rooms/${b.roomId || b.room?.id}`}>
                    Xem phòng
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {meta ? (
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

