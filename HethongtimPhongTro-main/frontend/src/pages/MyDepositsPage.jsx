import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { getDepositInvoice, listDepositInvoices } from '../api/depositInvoices';

function formatMoney(v) {
  return new Intl.NumberFormat('vi-VN').format(Number(v));
}

function statusLabel(s) {
  if (s === 'pending') return 'Chờ thanh toán';
  if (s === 'paid') return 'Đã thanh toán';
  if (s === 'cancelled') return 'Đã hủy';
  return s || '';
}

function DepositDetail({ id }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setError('');
      setLoading(true);
      try {
        const d = await getDepositInvoice(id);
        if (!cancelled) setData(d);
      } catch (e) {
        if (!cancelled) setError(e?.response?.data?.message || e.message || 'Không tải được hóa đơn');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) return <div className="card">Đang tải...</div>;
  if (error) return <div className="card error">{error}</div>;
  if (!data) return null;

  return (
    <div className="grid" style={{ gap: 14 }}>
      <div className="card noPrint">
        <Link className="btn btnGhost" to="/deposits">
          ← Danh sách hóa đơn cọc
        </Link>
        <button type="button" className="btn" style={{ marginLeft: 10 }} onClick={() => window.print()}>
          In / Lưu PDF
        </button>
      </div>

      <div
        className="card"
        id="deposit-invoice-print"
        style={{
          maxWidth: 640,
          margin: '0 auto',
          border: '2px solid rgba(255,255,255,0.2)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 22, fontWeight: 800 }}>HÓA ĐƠN ĐẶT CỌC</div>
          <div style={{ marginTop: 6, color: 'rgba(232,238,252,0.7)' }}>DACK — Tìm phòng trọ</div>
        </div>
        <div style={{ display: 'grid', gap: 10, fontSize: 15 }}>
          <div>
            <strong>Mã hóa đơn:</strong> {data.invoiceCode}
          </div>
          <div>
            <strong>Phòng:</strong> {data.room?.title || '—'}
          </div>
          <div>
            <strong>Địa chỉ:</strong> {data.room?.address || '—'}
          </div>
          <div>
            <strong>Giá thuê (tham chiếu 1 tháng):</strong> {formatMoney(data.pricePerMonthSnapshot)} đ
          </div>
          <div>
            <strong>Tiền đặt cọc (½ tháng):</strong>{' '}
            <span style={{ fontSize: 20, fontWeight: 800, color: 'rgba(110,168,254,0.95)' }}>
              {formatMoney(data.amount)} đ
            </span>
          </div>
          <div>
            <strong>Thời hạn thuê (booking):</strong> {data.booking?.startDate} → {data.booking?.endDate}
          </div>
          <div>
            <strong>Trạng thái:</strong> {statusLabel(data.status)}
          </div>
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.12)' }}>
            <strong>Ghi chú thanh toán:</strong>
            <p style={{ margin: '8px 0 0', color: 'rgba(232,238,252,0.8)', lineHeight: 1.5 }}>
              Vui lòng chuyển khoản đúng số tiền và nội dung ghi rõ mã hóa đơn{' '}
              <strong>{data.invoiceCode}</strong>. Sau khi admin xác nhận, trạng thái sẽ cập nhật thành “Đã thanh toán”
              (cập nhật thủ công từ quản trị).
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          .noPrint { display: none !important; }
          .app .topbar, .app header { display: none !important; }
          body { background: #fff !important; color: #111 !important; }
          #deposit-invoice-print { border-color: #333 !important; color: #111 !important; }
        }
      `}</style>
    </div>
  );
}

function DepositList() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  async function load() {
    setError('');
    setLoading(true);
    try {
      const res = await listDepositInvoices({ page, pageSize });
      setItems(res.items || []);
      setMeta(res.meta || null);
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Không tải được danh sách');
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
        <h2 style={{ marginTop: 0 }}>Hóa đơn đặt cọc</h2>
        <p style={{ margin: '8px 0 0', color: 'rgba(232,238,252,0.75)' }}>
          Sau khi admin duyệt cho thuê, hệ thống tạo hóa đơn với số tiền cọc bằng <strong>½ giá thuê một tháng</strong> tại
          thời điểm xác nhận.
        </p>
        {error ? <div className="error" style={{ marginTop: 12 }}>{error}</div> : null}
      </div>

      <div className="card">
        {loading ? (
          <div style={{ color: 'rgba(232,238,252,0.7)' }}>Đang tải...</div>
        ) : !items.length ? (
          <div style={{ color: 'rgba(232,238,252,0.7)' }}>Bạn chưa có hóa đơn đặt cọc nào.</div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {items.map((inv) => (
              <div
                key={inv.id}
                style={{
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 14,
                  padding: 14,
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'space-between',
                  gap: 12,
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 800 }}>{inv.invoiceCode}</div>
                  <div style={{ marginTop: 6, color: 'rgba(232,238,252,0.8)' }}>{inv.room?.title}</div>
                  <div className="roomMeta" style={{ marginTop: 8 }}>
                    <span className="pill">Cọc: {formatMoney(inv.amount)} đ</span>
                    <span className="pill">{statusLabel(inv.status)}</span>
                  </div>
                </div>
                <Link className="btn" to={`/deposits/${inv.id}`}>
                  Xem & in hóa đơn
                </Link>
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

export default function MyDepositsPage() {
  const { depositInvoiceId } = useParams();
  if (depositInvoiceId) return <DepositDetail id={depositInvoiceId} />;
  return <DepositList />;
}
