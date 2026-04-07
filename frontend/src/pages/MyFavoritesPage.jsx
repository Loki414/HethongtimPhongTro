import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { listFavorites, deleteFavorite } from '../api/favorites';

function pickCover(room) {
  const images = room?.images || [];
  if (!images.length) return null;
  const sorted = [...images].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  return sorted[0]?.url || null;
}

export default function MyFavoritesPage() {
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
      const res = await listFavorites({ page, pageSize });
      setItems(res.items || []);
      setMeta(res.meta || null);
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Load favorites failed');
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

  async function onDeleteFavorite(favoriteId) {
    setError('');
    try {
      await deleteFavorite(favoriteId);
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Delete favorite failed');
    }
  }

  return (
    <div className="grid" style={{ gap: 14 }}>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Yêu thích</h2>
        <div style={{ color: 'rgba(232,238,252,0.7)', marginTop: 6 }}>
          {meta ? `${meta.total} mục (trang ${meta.page}/${meta.pageCount})` : 'Đang tải...'}
        </div>
        {error ? <div className="error" style={{ marginTop: 10 }}>{error}</div> : null}
      </div>

      {loading ? (
        <div className="card" style={{ color: 'rgba(232,238,252,0.7)' }}>
          Đang tải...
        </div>
      ) : null}

      <div className="card">
        {!items.length && !loading ? (
          <div style={{ color: 'rgba(232,238,252,0.7)' }}>Chưa có phòng nào bạn lưu.</div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {items.map((fav) => {
              const room = fav.room;
              const cover = pickCover(room);
              return (
                <div key={fav.id} className="roomItem" style={{ gridTemplateColumns: '180px 1fr auto', alignItems: 'center' }}>
                  <div>
                    {cover ? (
                      <img className="roomThumb" style={{ width: 180, height: 120, aspectRatio: 'auto' }} src={cover} alt={room?.title || fav.roomId} />
                    ) : (
                      <div style={{ width: 180, height: 120, background: 'rgba(255,255,255,0.08)', borderRadius: 14 }} />
                    )}
                  </div>

                  <div>
                    <div className="roomTitle">{room?.title || fav.roomId}</div>
                    <div className="roomMeta" style={{ marginTop: 6 }}>
                      <span className="pill">{room?.category?.name || '—'}</span>
                      <span className="pill">{room?.location?.name || '—'}</span>
                      <span className="pill">{room?.pricePerMonth ? Number(room.pricePerMonth).toLocaleString('vi-VN') : 0} VND</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end' }}>
                    <Link className="btn" to={`/rooms/${fav.roomId}`}>
                      Xem
                    </Link>
                    <button className="btn btnGhost" type="button" onClick={() => onDeleteFavorite(fav.id)} disabled={loading}>
                      Bỏ lưu
                    </button>
                  </div>
                </div>
              );
            })}
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

