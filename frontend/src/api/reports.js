import { api } from './client';

export async function listReports(params = { page: 1, pageSize: 50, roomId: undefined }) {
  const res = await api.get('/reports', { params });
  return res.data; // { message, items, meta }
}

export async function createReport({ roomId, reason }) {
  const res = await api.post('/reports', { roomId, reason });
  return res.data.data;
}

export async function updateReportStatus(reportId, { status }) {
  const res = await api.put(`/reports/${reportId}`, { status });
  return res.data.data;
}

