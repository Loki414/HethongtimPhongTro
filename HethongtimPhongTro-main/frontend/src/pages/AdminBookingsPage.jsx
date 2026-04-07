import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { listBookings, updateBooking } from '../api/bookings';

const STATUS_FILTER = [
  { value: 'pending', label: 'Chờ duyệt' },
  { value: 'confirmed', label: 'Đã duyệt' },
  { value: 'cancelled', label: 'Đã hủy / từ chối' },
  { value: '', label: 'Tất cả' },
];

function statusLabel(s) {
  if (s === 'pending') return 'Chờ duyệt';
  if (s === 'confirmed') return 'Đã duyệt';
  if (s === 'cancelled') return 'Đã hủy';
  return s || '';
}

export default function AdminBookingsPage() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [actionId, setActionId] = useState(null);

  const pageSize = 10;

  async function load() {
    setError('');
    setLoading(true);
    try {
      const params = { page, pageSize };
      if (statusFilter) params.status = statusFilter;
      const res = await listBookings(params);
      setItems(res.items || []);
      setMeta(res.meta || null);
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Không tải được danh sách đặt phòng');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter]);

  async function setStatus(bookingId, status) {
    setActionId(bookingId);
    setError('');
    try {
      await updateBooking(bookingId, { status });
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Cập nhật thất bại');
    } finally {
      setActionId(null);
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
        <h2 style={{ marginTop: 0 }}>Duyệt đặt phòng</h2>
        <p style={{ margin: '8px 0 0', color: 'rgba(232,238,252,0.75)' }}>
          Xem lịch đặt do người dùng gửi, đồng ý cho thuê (xác nhận) hoặc từ chối.
        </p>
        <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <span style={{ color: 'rgba(232,238,252,0.7)' }}>Lọc:</span>
          {STATUS_FILTER.map((f) => (
            <button
              key={f.value || 'all'}
              type="button"
              className="btn"
              disabled={loading}
              onClick={() => {
                setPage(1);
                setStatusFilter(f.value);
              }}
              style={{
                padding: '6px 12px',
                fontSize: 13,
                borderColor: statusFilter === f.value ? 'rgba(110,168,254,0.9)' : 'rgba(255,255,255,0.12)',
                background: statusFilter === f.value ? 'rgba(110,168,254,0.12)' : 'transparent',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
        {meta ? (
          <div style={{ marginTop: 10, color: 'rgba(232,238,252,0.65)', fontSize: 14 }}>
            {meta.total} booking — trang {meta.page}/{meta.pageCount}
          </div>
        ) : null}
        {error ? <div className="error" style={{ marginTop: 12 }}>{error}</div> : null}
        <div style={{ marginTop: 12 }}>
          <Link className="btn btnGhost" to="/admin">
            ← Quay lại quản trị
          </Link>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ color: 'rgba(232,238,252,0.7)' }}>Đang tải...</div>
        ) : !items.length ? (
          <div style={{ color: 'rgba(232,238,252,0.7)' }}>Không có booking nào trong bộ lọc này.</div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {items.map((b) => (
              <div
                key={b.id}
                style={{
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 14,
                  padding: 14,
                  display: 'grid',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ minWidth: 220 }}>
                    <div style={{ fontWeight: 800 }}>{b.room?.title || 'Phòng'}</div>
                    <div className="roomMeta" style={{ marginTop: 8 }}>
                      <span className="pill">Từ: {b.startDate}</span>
                      <span className="pill">Đến: {b.endDate}</span>
                      <span className="pill">{statusLabel(b.status)}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 14, color: 'rgba(232,238,252,0.8)' }}>
                    <div>
                      <strong>Người đặt:</strong> {b.user?.fullName || '—'}
                    </div>
                    <div style={{ marginTop: 4 }}>{b.user?.email || ''}</div>
                    {b.user?.phone ? (
                      <div style={{ marginTop: 4 }}>
                        <strong>SĐT:</strong> {b.user.phone}
                      </div>
                    ) : (
                      <div style={{ marginTop: 4, fontSize: 12, color: 'rgba(232,238,252,0.45)' }}>
                        Chưa có SĐT trong hồ sơ
                      </div>
                    )}
                  </div>
                </div>
                {b.note ? (
                  <div style={{ fontSize: 14, color: 'rgba(232,238,252,0.85)' }}>
                    <strong>Ghi chú:</strong> {b.note}
                  </div>
                ) : null}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
                  <Link className="btn btnGhost" to={`/rooms/${b.roomId || b.room?.id}`}>
                    Xem phòng
                  </Link>
                  {b.status === 'pending' ? (
                    <>
                      <button
                        type="button"
                        className="btn"
                        disabled={actionId === b.id}
                        onClick={() => setStatus(b.id, 'confirmed')}
                      >
                        Đồng ý cho thuê
                      </button>
                      <button
                        type="button"
                        className="btn btnGhost"
                        style={{ borderColor: 'rgba(255,107,107,0.5)' }}
                        disabled={actionId === b.id}
                        onClick={() => setStatus(b.id, 'cancelled')}
                      >
                        Từ chối
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            ))}
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
