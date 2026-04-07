import { api } from './client';

export async function getUnreadNotificationCount() {
  const res = await api.get('/notifications/unread-count');
  return res.data.data?.count ?? 0;
}

export async function listNotifications(params = {}) {
  const res = await api.get('/notifications', { params });
  return res.data;
}

export async function markNotificationRead(notificationId) {
  const res = await api.patch(`/notifications/${notificationId}/read`);
  return res.data.data;
}

export async function markAllNotificationsRead() {
  const res = await api.post('/notifications/read-all');
  return res.data.data;
}
