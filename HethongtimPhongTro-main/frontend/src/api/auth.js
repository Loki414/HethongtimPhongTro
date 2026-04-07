import { api } from './client';

export async function login({ email, password }) {
  const res = await api.post('/auth/login', { email, password });
  return res.data.data;
}

export async function register({ fullName, email, password, role }) {
  const res = await api.post('/auth/register', { fullName, email, password, role });
  return res.data.data;
}

