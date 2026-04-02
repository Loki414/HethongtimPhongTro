import { api } from './client';

export async function createBooking({ roomId, startDate, endDate, note }) {
  const res = await api.post('/bookings', { roomId, startDate, endDate, note });
  return res.data.data;
}

export async function listBookings(params = { page: 1, pageSize: 50, roomId: undefined }) {
  const res = await api.get('/bookings', { params });
  return res.data; // { message, items, meta }
}

