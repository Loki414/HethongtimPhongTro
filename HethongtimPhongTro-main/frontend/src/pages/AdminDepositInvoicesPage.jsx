import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { listBookings } from '../api/bookings';
import {
  issueDepositInvoice,
  listDepositInvoices,
  resendDepositNotification,
  updateDepositInvoiceStatus,
} from '../api/depositInvoices';

function formatMoney(v) {
  return new Intl.NumberFormat('vi-VN').format(Number(v));
}

function statusLabel(s) {
  if (s === 'pending') return 'Chờ thanh toán';
  if (s === 'paid') return 'Đã thanh toán';
  if (s === 'cancelled') return 'Đã hủy';
  return s || '';
}

/** Dấu nhận biết giao diện quản trị (không xuất hiện trên hóa đơn phía người dùng). */
const ADMIN_MARK = {
  display: 'inline-block',
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: '0.12em',
  color: 'rgba(255, 193, 120, 0.98)',
  border: '1px solid rgba(255, 193, 120, 0.45)',
  borderRadius: 6,
  padding: '3px 10px',
  textTransform: 'uppercase',
  background: 'rgba(255, 160, 60, 0.12)',
};

export default function AdminDepositInvoicesPage() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [missingBookings, setMissingBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [actionId, setActionId] = useState(null);
  const pageSize = 15;

  async function loadInvoices() {
    const res = await listDepositInvoices({ page, pageSize });
    setItems(res.items || []);
    setMeta(res.meta || null);
    return res.items || [];
  }

  async function loadMissing() {
    const [invRes, bookRes] = await Promise.all([
      listDepositInvoices({ page: 1, pageSize: 200 }),
      listBookings({ page: 1, pageSize: 100, status: 'confirmed' }),
    ]);
    const withInv = new Set((invRes.items || []).map((i) => i.bookingId));
    const missing = (bookRes.items || []).filter((b) => !withInv.has(b.id));
    setMissingBookings(missing);
  }

  function formatAxiosError(e) {
    const msg = e?.response?.data?.message;
    const details = e?.response?.data?.details;
    if (Array.isArray(details) && details.length) {
      const parts = details.map((d) => d?.message || JSON.stringify(d)).filter(Boolean);
      if (parts.length) return `${msg || 'Lỗi'}: ${parts.join('; ')}`;
    }
    return msg || e?.message || 'Không tải được dữ liệu';
  }

  async function load() {
    setError('');
    setLoading(true);
    try {
      await loadInvoices();
      await loadMissing();
    } catch (e) {
      setError(formatAxiosError(e));
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

  async function onIssue(bookingId, resendOnly) {
    setActionId(bookingId);
    setError('');
    try {
      await issueDepositInvoice(bookingId, { resendNotification: resendOnly });
      await load();
      window.dispatchEvent(new Event('dack-notifications-updated'));
    } catch (e) {
      setError(formatAxiosError(e) || 'Thao tác thất bại');
    } finally {
      setActionId(null);
    }
  }

  async function onResendInvoice(depositInvoiceId) {
    setActionId(depositInvoiceId);
    setError('');
    try {
      await resendDepositNotification(depositInvoiceId);
      window.dispatchEvent(new Event('dack-notifications-updated'));
    } catch (e) {
      setError(formatAxiosError(e) || 'Gửi lại thất bại');
    } finally {
      setActionId(null);
    }
  }

  async function onSetStatus(depositInvoiceId, status, confirmMsg) {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setActionId(depositInvoiceId);
    setError('');
    try {
      await updateDepositInvoiceStatus(depositInvoiceId, status);
      await load();
      window.dispatchEvent(new Event('dack-notifications-updated'));
    } catch (e) {
      setError(formatAxiosError(e) || 'Cập nhật thất bại');
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className="grid" style={{ gap: 14 }}>
      <div className="card">
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <h2 style={{ margin: 0 }}>Quản lý hóa đơn đặt cọc</h2>
          <span style={ADMIN_MARK} title="Chỉ hiển thị ở kênh quản trị">
            Admin
          </span>
        </div>
        <p style={{ margin: '8px 0 0', color: 'rgba(232,238,252,0.75)' }}>
          Khi duyệt cho thuê, hệ thống <strong>tự tạo</strong> hóa đơn cọc (½ giá thuê 1 tháng) và <strong>gửi thông báo</strong> cho người đặt.
          Sau khi kiểm tra chuyển khoản, dùng <strong>Xác nhận đã thanh toán</strong> — người dùng nhận thông báo và Dashboard cập nhật doanh thu (paid).
        </p>
        {error ? <div className="error" style={{ marginTop: 12 }}>{error}</div> : null}
        <div style={{ marginTop: 12 }}>
          <Link className="btn btnGhost" to="/admin/bookings">
            ← Duyệt đặt phòng
          </Link>
        </div>
      </div>

      {missingBookings.length > 0 ? (
        <div className="card">
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <h3 style={{ margin: 0 }}>Booking đã duyệt chưa có hóa đơn cọc</h3>
            <span style={ADMIN_MARK}>Admin</span>
          </div>
          <p style={{ color: 'rgba(232,238,252,0.7)', fontSize: 14 }}>Tạo và gửi thông báo cho người đặt (giá phòng phải &gt; 0).</p>
          <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
            {missingBookings.map((b) => (
              <div
                key={b.id}
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'space-between',
                  gap: 10,
                  alignItems: 'center',
                  padding: 12,
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 12,
                  position: 'relative',
                }}
              >
                <span style={{ ...ADMIN_MARK, position: 'absolute', top: 8, right: 8 }}>Admin</span>
                <div style={{ paddingRight: 72 }}>
                  <div style={{ fontWeight: 700 }}>{b.room?.title || 'Phòng'}</div>
                  <div style={{ fontSize: 13, color: 'rgba(232,238,252,0.7)', marginTop: 4 }}>
                    {b.user?.fullName} · {b.user?.email}
                    {b.user?.phone ? ` · ${b.user.phone}` : ''}
                  </div>
                  <div style={{ fontSize: 13, marginTop: 4 }}>
                    {b.startDate} → {b.endDate}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn"
                  disabled={actionId === b.id}
                  onClick={() => onIssue(b.id, false)}
                >
                  Tạo & gửi hóa đơn cọc
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="card">
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <h3 style={{ margin: 0 }}>Danh sách hóa đơn</h3>
          <span style={ADMIN_MARK}>Admin</span>
        </div>
        {loading ? (
          <div style={{ color: 'rgba(232,238,252,0.7)' }}>Đang tải...</div>
        ) : !items.length ? (
          <div style={{ color: 'rgba(232,238,252,0.7)' }}>Chưa có hóa đơn nào.</div>
        ) : (
          <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
            {items.map((inv) => (
              <div
                key={inv.id}
                style={{
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 14,
                  padding: 14,
                  display: 'grid',
                  gap: 10,
                  position: 'relative',
                }}
              >
                <span style={{ ...ADMIN_MARK, position: 'absolute', top: 12, right: 14 }}>Admin</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12, paddingRight: 88 }}>
                  <div>
                    <div style={{ fontWeight: 800 }}>{inv.invoiceCode}</div>
                    <div style={{ marginTop: 6 }}>{inv.room?.title}</div>
                    <div style={{ fontSize: 14, color: 'rgba(232,238,252,0.75)', marginTop: 6 }}>
                      {inv.user?.fullName} — {inv.user?.email}
                      {inv.user?.phone ? ` — ${inv.user.phone}` : ''}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 18, fontWeight: 800 }}>{formatMoney(inv.amount)} đ</div>
                    <div style={{ fontSize: 13, color: 'rgba(232,238,252,0.65)' }}>{statusLabel(inv.status)}</div>
                  </div>
                </div>
                <div className="roomMeta">
                  <span className="pill">Booking: {inv.booking?.startDate} → {inv.booking?.endDate}</span>
                  <span className="pill">Giá tháng (lúc lập HĐ): {formatMoney(inv.pricePerMonthSnapshot)} đ</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
                  {inv.status === 'pending' ? (
                    <button
                      type="button"
                      className="btn"
                      disabled={actionId === inv.id}
                      onClick={() =>
                        onSetStatus(
                          inv.id,
                          'paid',
                          'Xác nhận người dùng đã thanh toán đủ tiền cọc theo hóa đơn này?'
                        )
                      }
                    >
                      Xác nhận đã thanh toán
                    </button>
                  ) : null}
                  {inv.status === 'paid' ? (
                    <button
                      type="button"
                      className="btn btnGhost"
                      disabled={actionId === inv.id}
                      onClick={() =>
                        onSetStatus(
                          inv.id,
                          'pending',
                          'Hoàn hóa đơn về trạng thái “chờ thanh toán”? (Dùng khi nhầm hoặc cần kiểm tra lại.)'
                        )
                      }
                    >
                      Hoàn về chờ thanh toán
                    </button>
                  ) : null}
                  {(inv.status === 'pending' || inv.status === 'paid') ? (
                    <button
                      type="button"
                      className="btn btnGhost"
                      style={{ borderColor: 'rgba(255,107,107,0.45)' }}
                      disabled={actionId === inv.id}
                      onClick={() =>
                        onSetStatus(
                          inv.id,
                          'cancelled',
                          'Hủy hóa đơn cọc này? Người dùng vẫn có thể xem lịch sử với trạng thái đã hủy.'
                        )
                      }
                    >
                      Hủy hóa đơn
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="btn btnGhost"
                    disabled={actionId === inv.id}
                    onClick={() => onResendInvoice(inv.id)}
                  >
                    Gửi lại thông báo HĐ
                  </button>
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
