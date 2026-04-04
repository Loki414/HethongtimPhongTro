import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getRoom } from '../api/rooms';
import { createReview } from '../api/reviews';
import { createFavorite, deleteFavorite, listFavorites } from '../api/favorites';
import { createBooking } from '../api/bookings';
import { createReport } from '../api/reports';
import { useAuth } from '../state/auth.jsx';

function toYmdLocal(d) {
  const x = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(x.getTime())) return '';
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
}

/** Trùng backend: lặp `months` lần cộng 1 tháng (clamp). */
function expectedEndAfterMonthsFromYmd(ymd, months) {
  if (!ymd || !Number.isFinite(months) || months < 1) return null;
  const [y, mo, d] = ymd.split('-').map(Number);
  if (!y || !mo || !d) return null;
  let cur = new Date(y, mo - 1, d);
  if (Number.isNaN(cur.getTime())) return null;
  for (let i = 0; i < months; i++) {
    const lastInTargetMonth = new Date(cur.getFullYear(), cur.getMonth() + 2, 0).getDate();
    const day = cur.getDate();
    const useDay = Math.min(day, lastInTargetMonth);
    cur = new Date(cur.getFullYear(), cur.getMonth() + 1, useDay);
  }
  return cur;
}

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

  const [bookingForm, setBookingForm] = useState({ startDate: '', months: 1, note: '' });
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

  const bookingEndPreview = useMemo(() => {
    const end = expectedEndAfterMonthsFromYmd(bookingForm.startDate, Number(bookingForm.months) || 1);
    return end ? toYmdLocal(end) : '';
  }, [bookingForm.startDate, bookingForm.months]);

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
    const { startDate, months: monthsRaw } = bookingForm;
    const months = Math.min(36, Math.max(1, Math.floor(Number(monthsRaw) || 1)));
    if (!startDate) {
      setError('Chọn ngày bắt đầu thuê.');
      return;
    }
    const endDt = expectedEndAfterMonthsFromYmd(startDate, months);
    if (!endDt) {
      setError('Ngày bắt đầu hoặc số tháng không hợp lệ.');
      return;
    }
    const endDate = toYmdLocal(endDt);
    setSavingBooking(true);
    setError('');
    try {
      await createBooking({
        roomId,
        startDate,
        months,
        endDate,
        note: bookingForm.note || undefined,
      });
      navigate('/bookings');
    } catch (e) {
      const d = e?.response?.data?.details;
      const first = Array.isArray(d) ? d[0]?.message : null;
      setError(first || e?.response?.data?.message || e.message || 'Booking failed');
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
            <div style={{ color: 'rgba(232,238,252,0.75)', fontSize: 14, marginBottom: 10 }}>
              Chọn <strong>ngày bắt đầu</strong> và <strong>số tháng thuê</strong> (1–36). Mỗi tháng tính theo lịch, cùng số ngày tháng sau; tháng ngắn sẽ tự lấy ngày cuối tháng (VD 31/1 → 28/2).
            </div>
            <label>
              Ngày bắt đầu thuê
              <input
                type="date"
                value={bookingForm.startDate}
                onChange={(e) => setBookingForm((s) => ({ ...s, startDate: e.target.value }))}
              />
            </label>
            <label>
              Số tháng thuê
              <input
                type="number"
                min={1}
                max={36}
                step={1}
                value={bookingForm.months}
                onChange={(e) => setBookingForm((s) => ({ ...s, months: Number(e.target.value) }))}
              />
            </label>
            {bookingEndPreview ? (
              <div style={{ color: 'rgba(232,238,252,0.7)', fontSize: 14 }}>
                Ngày kết thúc kỳ (dự kiến): <strong>{bookingEndPreview}</strong>
              </div>
            ) : null}
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

