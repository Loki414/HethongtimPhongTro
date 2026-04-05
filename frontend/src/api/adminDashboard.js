import { api } from './client';

export async function getAdminDashboard() {
  const res = await api.get('/admin/dashboard');
  return res.data.data;
}
