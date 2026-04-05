import React, { useCallback, useEffect, useState } from 'react';
import { Routes, Route, Navigate, Link, NavLink, useLocation } from 'react-router-dom';
import HomePage from './pages/HomePage.jsx';
import RoomDetailPage from './pages/RoomDetailPage.jsx';
import AuthPage from './pages/AuthPage.jsx';
import PostRoomPage from './pages/PostRoomPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import AdminBookingsPage from './pages/AdminBookingsPage.jsx';
import MyFavoritesPage from './pages/MyFavoritesPage.jsx';
import MyBookingsPage from './pages/MyBookingsPage.jsx';
import MyReportsPage from './pages/MyReportsPage.jsx';
import AdminReportsPage from './pages/AdminReportsPage.jsx';
import NotificationsPage from './pages/NotificationsPage.jsx';
import MyDepositsPage from './pages/MyDepositsPage.jsx';
import AdminDepositInvoicesPage from './pages/AdminDepositInvoicesPage.jsx';
import AdminDashboardPage from './pages/AdminDashboardPage.jsx';
import HelpPage from './pages/HelpPage.jsx';
import { getUnreadNotificationCount } from './api/notifications';
import UserAccountMenu from './components/UserAccountMenu.jsx';
import { useAuth } from './state/auth.jsx';

function RequireAuth({ children, role }) {
  const { token, user } = useAuth();
  const loc = useLocation();
  if (!token) return <Navigate to="/auth" state={{ from: loc.pathname }} replace />;
  if (role && user?.role !== role) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { token, user } = useAuth();
  return (
    <div className="app">
      <header className="topbar">
        <div className="topbarInner">
          <div className="brand">
            <Link to="/">DACK</Link>
          </div>
          <nav className="nav" aria-label="Điều hướng chính">
            <NavLink className="navLink" end to="/">
              Trang chủ
            </NavLink>
            <NavLink className="navLink" to="/help">
              Trợ giúp
            </NavLink>
            {token ? (
              <>
                <span className="navDivider" aria-hidden />
                <NavLink className="navLink" to="/favorites">
                  Yêu thích
                </NavLink>
                <NavLink className="navLink" to="/bookings">
                  Đặt phòng
                </NavLink>
                <NavLink className="navLink" to="/deposits">
                  Cọc của tôi
                </NavLink>
                {user?.role !== 'admin' ? (
                  <NavLink className="navLink" to="/reports">
                    Báo cáo
                  </NavLink>
                ) : null}
              </>
            ) : null}
            {user?.role === 'admin' ? (
              <>
                <span className="navDivider" aria-hidden />
                <NavLink
                  className={({ isActive }) => `navLink navLinkIcon${isActive ? ' active' : ''}`}
                  to="/admin/dashboard"
                  aria-label="Dashboard tổng quan"
                  title="Dashboard"
                  end
                >
                  <DashboardNavIcon />
                </NavLink>
                <NavLink className="navLink" to="/post">
                  Đăng tin
                </NavLink>
                <NavLink className="navLink" end to="/admin">
                  Danh mục & phòng
                </NavLink>
                <NavLink className="navLink" to="/admin/bookings">
                  Duyệt đặt phòng
                </NavLink>
                <NavLink className="navLink" to="/admin/deposits">
                  Cọc & thanh toán
                </NavLink>
                <NavLink className="navLink" to="/admin/reports">
                  Báo cáo (quản lý)
                </NavLink>
              </>
            ) : null}
          </nav>
          <AuthButtons />
        </div>
      </header>

      <main className="container">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/help" element={<HelpPage />} />
          <Route path="/rooms/:roomId" element={<RoomDetailPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route
            path="/post"
            element={
              <RequireAuth role="admin">
                <PostRoomPage />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <RequireAuth role="admin">
                <AdminDashboardPage />
              </RequireAuth>
            }
          />
          <Route
            path="/admin"
            element={
              <RequireAuth role="admin">
                <AdminPage />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/bookings"
            element={
              <RequireAuth role="admin">
                <AdminBookingsPage />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/deposits"
            element={
              <RequireAuth role="admin">
                <AdminDepositInvoicesPage />
              </RequireAuth>
            }
          />
          <Route
            path="/favorites"
            element={
              <RequireAuth>
                <MyFavoritesPage />
              </RequireAuth>
            }
          />
          <Route
            path="/bookings"
            element={
              <RequireAuth>
                <MyBookingsPage />
              </RequireAuth>
            }
          />
          <Route
            path="/notifications"
            element={
              <RequireAuth>
                <NotificationsPage />
              </RequireAuth>
            }
          />
          <Route
            path="/deposits/:depositInvoiceId"
            element={
              <RequireAuth>
                <MyDepositsPage />
              </RequireAuth>
            }
          />
          <Route
            path="/deposits"
            element={
              <RequireAuth>
                <MyDepositsPage />
              </RequireAuth>
            }
          />
          <Route
            path="/reports"
            element={
              <RequireAuth>
                <MyReportsPage />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <RequireAuth role="admin">
                <AdminReportsPage />
              </RequireAuth>
            }
          />
        </Routes>
      </main>
    </div>
  );
}

function DashboardNavIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function NotificationsNav() {
  const { token } = useAuth();
  const [unread, setUnread] = useState(0);

  const refresh = useCallback(async () => {
    if (!token) return;
    try {
      const n = await getUnreadNotificationCount();
      setUnread(typeof n === 'number' ? n : 0);
    } catch {
      /* ignore */
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      setUnread(0);
      return undefined;
    }
    refresh();
    const interval = setInterval(refresh, 25000);
    const onFocus = () => refresh();
    const onUpdated = () => refresh();
    window.addEventListener('focus', onFocus);
    window.addEventListener('dack-notifications-updated', onUpdated);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('dack-notifications-updated', onUpdated);
    };
  }, [token, refresh]);

  if (!token) return null;

  return (
    <NavLink
      to="/notifications"
      className={({ isActive }) => `notificationBell${isActive ? ' notificationBell--active' : ''}`}
      aria-label={unread > 0 ? `Thông báo, ${unread > 99 ? 'hơn 99' : unread} chưa đọc` : 'Thông báo'}
      title="Thông báo"
      style={{ position: 'relative' }}
    >
      <BellIcon />
      {unread > 0 ? (
        <span
          className="notificationBell__badge"
          aria-hidden
        >
          {unread > 99 ? '99+' : unread}
        </span>
      ) : null}
    </NavLink>
  );
}

function AuthButtons() {
  const { token } = useAuth();
  if (!token) {
    return (
      <div className="authBtns">
        <Link className="btn" to="/auth">
          Đăng nhập
        </Link>
      </div>
    );
  }
  return (
    <div className="authBtns">
      <NotificationsNav />
      <UserAccountMenu />
    </div>
  );
}

