import React, { createContext, useContext, useMemo, useState } from 'react';

const AuthContext = createContext(null); // Context rỗng nếu không bọc AuthProvider

const TOKEN_KEY = 'dack_token'; // Khóa localStorage cho JWT (sau login)
const USER_KEY = 'dack_user'; // Khóa localStorage cho object user (JSON)

export function AuthProvider({ children }) {
  // Khởi tạo từ localStorage để F5 vẫn giữ phiên (nếu đã login trước đó)
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null; // Parse chuỗi JSON → object user
  });

  const value = useMemo(() => {
    return {
      token, // Chuỗi Bearer hoặc null
      user, // Object profile hoặc null
      // AuthPage gọi sau login/register: ghi đệm và state để toàn app + axios dùng token
      setAuth: ({ token: t, user: u }) => {
        localStorage.setItem(TOKEN_KEY, t); // Lưu JWT (có thể undefined nếu response đăng ký không có token)
        localStorage.setItem(USER_KEY, JSON.stringify(u)); // Lưu user dạng JSON
        setToken(t); // Trigger re-render các component dùng useAuth
        setUser(u);
      },
      /** Gộp thông tin user (sau cập nhật profile, avatar, …) */
      patchUser: (partial) => {
        setUser((prev) => {
          if (!prev) return prev;
          const next = { ...prev, ...partial };
          localStorage.setItem(USER_KEY, JSON.stringify(next));
          return next;
        });
      },
      logout: () => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setToken(null);
        setUser(null);
      },
    };
  }, [token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

