import { api } from './client'; // Axios đã cấu hình baseURL (ví dụ /api) và interceptor nếu có

export async function login({ email, password }) {
  const res = await api.post('/auth/login', { email, password }); // Gọi backend POST /api/auth/login
  return res.data.data; // Axios: body JSON là { message, data } → lấy data (token + user)
}

export async function register({ fullName, email, password, role }) {
  const res = await api.post('/auth/register', { fullName, email, password, role }); // POST /api/auth/register
  return res.data.data; // Phần data từ server (thường chỉ object user, không có token)
}

/** Bước quên mật khẩu (demo): server trả resetToken trong data nếu email tồn tại. */
export async function forgotPassword({ email }) {
  const res = await api.post('/auth/forgot-password', { email });
  return { message: res.data.message, ...res.data.data };
}

/** Đặt lại mật khẩu sau khi có token từ forgot-password. */
export async function resetPassword({ token, password }) {
  const res = await api.post('/auth/reset-password', { token, password });
  return res.data.data ?? {};
}
