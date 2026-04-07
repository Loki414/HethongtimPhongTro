import React, { useEffect, useMemo, useState } from 'react';
import { listReports, updateReportStatus } from '../api/reports';
import { Link } from 'react-router-dom';

export default function AdminReportsPage() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [page, setPage] = useState(1);
  const pageSize = 6;

  const [updatingId, setUpdatingId] = useState(null);
  const [statusById, setStatusById] = useState({});

  async function load() {
    setError('');
    setLoading(true);
    try {
      const res = await listReports({ page, pageSize });
      setItems(res.items || []);
      setMeta(res.meta || null);
      setStatusById((prev) => {
        const next = { ...prev };
        for (const r of res.items || []) next[r.id] = r.status;
        return next;
      });
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Load reports failed');
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

  async function onUpdateStatus(reportId) {
    const nextStatus = statusById[reportId];
    if (!nextStatus) return;
    setUpdatingId(reportId);
    setError('');
    try {
      await updateReportStatus(reportId, { status: nextStatus });
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Update report failed');
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="grid" style={{ gap: 14 }}>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Quản lý báo cáo (Admin)</h2>
        <div style={{ color: 'rgba(232,238,252,0.7)', marginTop: 6 }}>
          {meta ? `${meta.total} report (trang ${meta.page}/${meta.pageCount})` : 'Đang tải...'}
        </div>
        {error ? <div className="error" style={{ marginTop: 10 }}>{error}</div> : null}
      </div>

      <div className="card">
        {loading ? (
          <div style={{ color: 'rgba(232,238,252,0.7)' }}>Đang tải...</div>
        ) : !items.length ? (
          <div style={{ color: 'rgba(232,238,252,0.7)' }}>Không có report.</div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {items.map((r) => (
              <div
                key={r.id}
                style={{
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 14,
                  padding: 12,
                  display: 'grid',
                  gap: 10,
                }}
              >
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 800 }}>
                    Report: {r.id}
                  </div>
                  <span className="pill">Status: {r.status}</span>
                </div>
                <div style={{ color: 'rgba(232,238,252,0.85)' }}>
                  <div><b>Phòng:</b> {r.roomId}</div>
                  <div><b>Người báo cáo:</b> {r.reporterId}</div>
                </div>
                <div style={{ color: 'rgba(232,238,252,0.8)' }}>{r.reason}</div>

                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                  <label style={{ minWidth: 220 }}>
                    Cập nhật status
                    <select
                      value={statusById[r.id] ?? r.status}
                      onChange={(e) => setStatusById((s) => ({ ...s, [r.id]: e.target.value }))}
                    >
                      <option value="open">open</option>
                      <option value="resolved">resolved</option>
                    </select>
                  </label>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Link className="btn" to={`/rooms/${r.roomId}`}>Xem phòng</Link>
                    <button
                      className="btn"
                      type="button"
                      onClick={() => onUpdateStatus(r.id)}
                      disabled={updatingId === r.id}
                    >
                      {updatingId === r.id ? 'Đang cập nhật...' : 'Lưu'}
                    </button>
                  </div>
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

