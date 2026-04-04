import React from 'react';
import { Routes, Route, Navigate, Link, NavLink, useLocation } from 'react-router-dom';
import HomePage from './pages/HomePage.jsx';
import RoomDetailPage from './pages/RoomDetailPage.jsx';
import AuthPage from './pages/AuthPage.jsx';
import PostRoomPage from './pages/PostRoomPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import MyFavoritesPage from './pages/MyFavoritesPage.jsx';
import MyBookingsPage from './pages/MyBookingsPage.jsx';
import MyReportsPage from './pages/MyReportsPage.jsx';
import AdminReportsPage from './pages/AdminReportsPage.jsx';
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
            {user?.role === 'admin' ? (
              <>
                <NavLink className="navLink" to="/post">
                  Đăng bài
                </NavLink>
                <NavLink className="navLink" end to="/admin">
                  Admin
                </NavLink>
              </>
            ) : null}
            {token ? (
              <>
                <NavLink className="navLink" to="/favorites">
                  Yêu thích
                </NavLink>
                <NavLink className="navLink" to="/bookings">
                  Đặt lịch
                </NavLink>
                {user?.role === 'admin' ? (
                  <NavLink className="navLink" to="/admin/reports">
                    Quản lý báo cáo
                  </NavLink>
                ) : (
                  <NavLink className="navLink" to="/reports">
                    Báo cáo của tôi
                  </NavLink>
                )}
              </>
            ) : null}
          </nav>
          <AuthButtons />
        </div>
      </header>

      <main className="container">
        <Routes>
          <Route path="/" element={<HomePage />} />
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
            path="/admin"
            element={
              <RequireAuth role="admin">
                <AdminPage />
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

function AuthButtons() {
  const { token, user, logout } = useAuth();
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
      <span className="userBadge">{user?.fullName || user?.email}</span>
      <button className="btn btnGhost" onClick={logout}>
        Đăng xuất
      </button>
    </div>
  );
}

