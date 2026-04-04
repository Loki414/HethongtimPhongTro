import { api } from './client';

export async function createBooking({ roomId, startDate, months, endDate, note }) {
  const res = await api.post('/bookings', { roomId, startDate, months, endDate, note });
  return res.data.data;
}

export async function listBookings(params = { page: 1, pageSize: 50, roomId: undefined, status: undefined }) {
  const res = await api.get('/bookings', { params });
  return res.data; // { message, items, meta }
}

export async function updateBooking(bookingId, body) {
  const res = await api.put(`/bookings/${bookingId}`, body);
  return res.data.data;
}

