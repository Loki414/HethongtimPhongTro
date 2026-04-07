import { api } from './client';

export async function getMe() {
  const res = await api.get('/users/me');
  return res.data.data;
}

export async function patchMe(body) {
  const res = await api.patch('/users/me', body);
  return res.data.data;
}
