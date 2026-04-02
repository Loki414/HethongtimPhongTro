import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getRoom } from '../api/rooms';
import { createReview } from '../api/reviews';
import { createFavorite, deleteFavorite, listFavorites } from '../api/favorites';
import { createBooking } from '../api/bookings';
import { createReport } from '../api/reports';
import { useAuth } from '../state/auth.jsx';

export default function RoomDetailPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [favorites, setFavorites] = useState([]);
  const [favoriteForRoom, setFavoriteForRoom] = useState(null);
  const [savingFav, setSavingFav] = useState(false);

  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [savingReview, setSavingReview] = useState(false);

  const [bookingForm, setBookingForm] = useState({ startDate: '', endDate: '', note: '' });
  const [savingBooking, setSavingBooking] = useState(false);

  const [reportReason, setReportReason] = useState('');
  const [savingReport, setSavingReport] = useState(false);

  async function loadRoom() {
    setError('');
    const res = await getRoom(roomId);
    setRoom(res);
  }

  async function loadFavoritesIfAuth() {
    if (!token) return;
    const { items } = await listFavorites({ page: 1, pageSize: 50 });
    setFavorites(items || []);
    const found = (items || []).find((f) => f.roomId === roomId);
    setFavoriteForRoom(found || null);
  }

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await loadRoom();
        await loadFavoritesIfAuth();
      } catch (e) {
        setError(e?.response?.data?.message || e.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, token]);

  const images = useMemo(() => {
    const arr = room?.images || [];
    return [...arr].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [room]);

  function getAmenityGroupLabel(name) {
    const n = String(name || '').toLowerCase();
    if (n.includes('wifi')) return 'Kết nối';
    if (n.includes('parking') || n.includes('bãi xe')) return 'Chỗ để xe';
    if (n.includes('điều hòa') || n.includes('ac') || n.includes('air')) return 'Làm mát';
    if (n.includes('thang máy') || n.includes('elevator')) return 'Di chuyển';
    if (n.includes('pet') || n.includes('thú cưng')) return 'Thú cưng';
    return 'Khác';
  }

  const amenityGroups = useMemo(() => {
    const groups = new Map();
    for (const a of room?.amenities || []) {
      const label = getAmenityGroupLabel(a.name);
      if (!groups.has(label)) groups.set(label, []);
      groups.get(label).push(a);
    }
    return Array.from(groups.entries()).map(([label, items]) => ({ label, items }));
  }, [room]);

  async function onToggleFavorite() {
    if (!token) {
      navigate('/auth', { replace: true });
      return;
    }
    setSavingFav(true);
    try {
      if (favoriteForRoom) {
        await deleteFavorite(favoriteForRoom.id);
      } else {
        await createFavorite(roomId);
      }
      await loadFavoritesIfAuth();
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Favorite failed');
    } finally {
      setSavingFav(false);
    }
  }

  async function onSubmitReview(e) {
    e.preventDefault();
    if (!token) {
      navigate('/auth', { replace: true });
      return;
    }
    setSavingReview(true);
    setError('');
    try {
      await createReview({ roomId, rating: reviewForm.rating, comment: reviewForm.comment });
      await loadRoom();
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Review failed');
    } finally {
      setSavingReview(false);
    }
  }

  async function onSubmitBooking(e) {
    e.preventDefault();
    if (!token) return navigate('/auth', { replace: true });
    setSavingBooking(true);
    setError('');
    try {
      await createBooking({
        roomId,
        startDate: bookingForm.startDate,
        endDate: bookingForm.endDate,
        note: bookingForm.note || undefined,
      });
      navigate('/bookings');
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Booking failed');
    } finally {
      setSavingBooking(false);
    }
  }

  async function onSubmitReport(e) {
    e.preventDefault();
    if (!token) return navigate('/auth', { replace: true });
    setSavingReport(true);
    setError('');
    try {
      await createReport({ roomId, reason: reportReason });
      navigate('/reports');
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Report failed');
    } finally {
      setSavingReport(false);
    }
  }

  if (loading) return <div className="card">Đang tải...</div>;
  if (error) return <div className="card error">{error}</div>;
  if (!room) return <div className="card">Không tìm thấy phòng.</div>;

  const cover = images[0]?.url || null;

  return (
    <div className="grid" style={{ gap: 14 }}>
      <div className="card">
        <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 420px', minWidth: 320 }}>
            {cover ? (
              <img className="roomThumb" style={{ aspectRatio: '16/9' }} src={cover} alt={room.title} />
            ) : (
              <div className="roomThumb" />
            )}

            {images.length > 1 ? (
              <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
                {images.slice(0, 5).map((img) => (
                  <img
                    key={img.id}
                    src={img.url}
                    alt="thumb"
                    style={{
                      width: 90,
                      height: 56,
                      objectFit: 'cover',
                      borderRadius: 12,
                      border: '1px solid rgba(255,255,255,0.12)',
                    }}
                  />
                ))}
              </div>
            ) : null}
          </div>

          <div style={{ flex: '1 1 320px' }}>
            <div style={{ fontWeight: 800, fontSize: 20 }}>{room.title}</div>
            <div className="roomMeta" style={{ marginTop: 8 }}>
              <span className="pill">{room.category?.name}</span>
              <span className="pill">{room.location?.name}</span>
              <span className="pill">{Number(room.pricePerMonth).toLocaleString('vi-VN')} VND/tháng</span>
              {room.areaSqm ? <span className="pill">{room.areaSqm} m²</span> : null}
            </div>
            <div style={{ marginTop: 12, color: 'rgba(232,238,252,0.8)' }}>{room.description}</div>
            {room.address ? <div style={{ marginTop: 10, color: 'rgba(232,238,252,0.7)' }}>Địa chỉ: {room.address}</div> : null}

            <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
              <button className="btn" onClick={onToggleFavorite} disabled={savingFav}>
                {favoriteForRoom ? 'Đã lưu' : 'Lưu phòng'}
              </button>
            </div>

            {user ? (
              <div style={{ marginTop: 12, color: 'rgba(232,238,252,0.7)' }}>
                Đang đăng nhập: {user.fullName || user.email}
              </div>
            ) : (
              <div style={{ marginTop: 12, color: 'rgba(232,238,252,0.7)' }}>Bạn chưa đăng nhập.</div>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ fontWeight: 800, marginBottom: 8 }}>Tiện ích</div>
        {!amenityGroups.length ? (
          <div style={{ color: 'rgba(232,238,252,0.7)' }}>Chưa có tiện ích.</div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {amenityGroups.map((g) => (
              <div key={g.label}>
                <div style={{ color: 'rgba(232,238,252,0.7)', marginBottom: 8 }}>{g.label}</div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {g.items.map((a) => (
                    <span key={a.id} className="pill">
                      {a.name}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <div style={{ fontWeight: 800, marginBottom: 8 }}>Đánh giá</div>

        {token ? (
          <form onSubmit={onSubmitReview} className="form" style={{ marginBottom: 14 }}>
            <label>
              Sao
              <select value={reviewForm.rating} onChange={(e) => setReviewForm((s) => ({ ...s, rating: Number(e.target.value) }))}>
                {[1, 2, 3, 4, 5].map((x) => (
                  <option key={x} value={x}>
                    {x}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Nội dung
              <textarea value={reviewForm.comment} onChange={(e) => setReviewForm((s) => ({ ...s, comment: e.target.value }))} />
            </label>
            <button className="btn" type="submit" disabled={savingReview}>
              {savingReview ? 'Đang gửi...' : 'Gửi đánh giá'}
            </button>
          </form>
        ) : (
          <div style={{ color: 'rgba(232,238,252,0.7)', marginBottom: 14 }}>Đăng nhập để đánh giá.</div>
        )}

        {(room.reviews || []).length ? (
          <div style={{ display: 'grid', gap: 12 }}>
            {room.reviews.map((r) => (
              <div key={r.id} style={{ border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14, padding: 12 }}>
                <div style={{ fontWeight: 700 }}>
                  {'★'.repeat(r.rating)}
                  {'☆'.repeat(5 - r.rating)}
                </div>
                {r.comment ? <div style={{ marginTop: 6, color: 'rgba(232,238,252,0.8)' }}>{r.comment}</div> : null}
                <div style={{ marginTop: 6, color: 'rgba(232,238,252,0.6)', fontSize: 12 }}>{new Date(r.createdAt).toLocaleString()}</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color: 'rgba(232,238,252,0.7)' }}>Chưa có đánh giá.</div>
        )}
      </div>

      <div className="card">
        <div style={{ fontWeight: 800, marginBottom: 8 }}>Booking lịch thuê</div>
        {token ? (
          <form onSubmit={onSubmitBooking} className="form">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <label>
                Ngày bắt đầu
                <input type="date" value={bookingForm.startDate} onChange={(e) => setBookingForm((s) => ({ ...s, startDate: e.target.value }))} />
              </label>
              <label>
                Ngày kết thúc
                <input type="date" value={bookingForm.endDate} onChange={(e) => setBookingForm((s) => ({ ...s, endDate: e.target.value }))} />
              </label>
            </div>
            <label>
              Ghi chú (tùy chọn)
              <textarea value={bookingForm.note} onChange={(e) => setBookingForm((s) => ({ ...s, note: e.target.value }))} />
            </label>
            <button className="btn" type="submit" disabled={savingBooking}>
              {savingBooking ? 'Đang đặt...' : 'Đặt lịch'}
            </button>
          </form>
        ) : (
          <div style={{ color: 'rgba(232,238,252,0.7)' }}>Đăng nhập để đặt lịch thuê.</div>
        )}
      </div>

      <div className="card">
        <div style={{ fontWeight: 800, marginBottom: 8 }}>Báo cáo phòng</div>
        {token ? (
          <form onSubmit={onSubmitReport} className="form">
            <label>
              Lý do báo cáo
              <textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="VD: Nội dung không đúng mô tả..."
              />
            </label>
            <button className="btn" type="submit" disabled={savingReport || !reportReason.trim()}>
              {savingReport ? 'Đang gửi...' : 'Gửi báo cáo'}
            </button>
          </form>
        ) : (
          <div style={{ color: 'rgba(232,238,252,0.7)' }}>Đăng nhập để gửi báo cáo.</div>
        )}
      </div>
    </div>
  );
}

