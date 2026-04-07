import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { getAdminDashboard } from '../api/adminDashboard';

function formatMoney(v) {
  return new Intl.NumberFormat('vi-VN').format(Number(v) || 0);
}

function StatCard({ title, children, accent }) {
  return (
    <div
      className="card"
      style={{
        margin: 0,
        borderColor: accent ? `rgba(${accent},0.35)` : undefined,
        background: accent ? `rgba(${accent},0.06)` : undefined,
      }}
    >
      <div style={{ fontSize: 13, color: 'rgba(232,238,252,0.65)', fontWeight: 600 }}>{title}</div>
      <div style={{ marginTop: 10 }}>{children}</div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setError('');
      setLoading(true);
      try {
        const d = await getAdminDashboard();
        if (!cancelled) setData(d);
      } catch (e) {
        if (!cancelled) setError(e?.response?.data?.message || e.message || 'Không tải được số liệu');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="grid" style={{ gap: 14 }}>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Dashboard tổng quan</h2>
        <p style={{ margin: '8px 0 0', color: 'rgba(232,238,252,0.75)' }}>
          Số liệu phòng, đặt lịch và doanh thu đặt cọc (theo trạng thái hóa đơn).
        </p>
        {error ? <div className="error" style={{ marginTop: 12 }}>{error}</div> : null}
        <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <Link className="btn btnGhost" to="/admin">
            Cài đặt Admin
          </Link>
          <Link className="btn btnGhost" to="/admin/bookings">
            Duyệt đặt phòng
          </Link>
          <Link className="btn btnGhost" to="/admin/deposits">
            Hóa đơn cọc
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="card">Đang tải số liệu...</div>
      ) : data ? (
        <>
          <h3 style={{ margin: 0, fontSize: 16, color: 'rgba(232,238,252,0.85)' }}>Phòng</h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 12,
            }}
          >
            <StatCard title="Tổng số phòng" accent="122, 180, 255">
              <div style={{ fontSize: 28, fontWeight: 800 }}>{data.rooms.total}</div>
            </StatCard>
            <StatCard title="Đang cho thuê (available)">
              <div style={{ fontSize: 28, fontWeight: 800 }}>{data.rooms.available}</div>
            </StatCard>
            <StatCard title="Đã thuê (rented)">
              <div style={{ fontSize: 28, fontWeight: 800 }}>{data.rooms.rented}</div>
            </StatCard>
          </div>

          <h3 style={{ margin: '8px 0 0', fontSize: 16, color: 'rgba(232,238,252,0.85)' }}>Booking</h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: 12,
            }}
          >
            <StatCard title="Chờ duyệt" accent="255, 193, 120">
              <div style={{ fontSize: 28, fontWeight: 800 }}>{data.bookings.pending}</div>
            </StatCard>
            <StatCard title="Đã xác nhận">
              <div style={{ fontSize: 28, fontWeight: 800 }}>{data.bookings.confirmed}</div>
            </StatCard>
            <StatCard title="Đã hủy / từ chối">
              <div style={{ fontSize: 28, fontWeight: 800 }}>{data.bookings.cancelled}</div>
            </StatCard>
            <StatCard title="Tổng booking">
              <div style={{ fontSize: 28, fontWeight: 800 }}>{data.bookings.total}</div>
            </StatCard>
          </div>

          <h3 style={{ margin: '8px 0 0', fontSize: 16, color: 'rgba(232,238,252,0.85)' }}>
            Doanh thu đặt cọc (theo hóa đơn)
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: 12,
            }}
          >
            <StatCard title="Chờ thanh toán (pending)" accent="255, 107, 107">
              <div style={{ fontSize: 24, fontWeight: 800 }}>{formatMoney(data.depositInvoices.pending.amount)} đ</div>
              <div style={{ marginTop: 8, fontSize: 13, color: 'rgba(232,238,252,0.6)' }}>
                {data.depositInvoices.pending.count} hóa đơn
              </div>
            </StatCard>
            <StatCard title="Đã thanh toán (paid)" accent="100, 200, 150">
              <div style={{ fontSize: 24, fontWeight: 800 }}>{formatMoney(data.depositInvoices.paid.amount)} đ</div>
              <div style={{ marginTop: 8, fontSize: 13, color: 'rgba(232,238,252,0.6)' }}>
                {data.depositInvoices.paid.count} hóa đơn
              </div>
            </StatCard>
            <StatCard title="Đã hủy (cancelled)">
              <div style={{ fontSize: 24, fontWeight: 800 }}>{formatMoney(data.depositInvoices.cancelled.amount)} đ</div>
              <div style={{ marginTop: 8, fontSize: 13, color: 'rgba(232,238,252,0.6)' }}>
                {data.depositInvoices.cancelled.count} hóa đơn
              </div>
            </StatCard>
          </div>
          <p style={{ margin: 0, fontSize: 12, color: 'rgba(232,238,252,0.5)' }}>
            Ghi chú: tổng tiền là tổng trường <code style={{ fontSize: 11 }}>amount</code> của hóa đơn cọc theo từng trạng thái.
            Đánh dấu <strong>paid</strong> hiện cập nhật thủ công / tương lai qua quản trị.
          </p>
        </>
      ) : null}
    </div>
  );
}
