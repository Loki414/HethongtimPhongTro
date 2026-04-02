import { api } from './client';

export async function listRooms(params) {
  const res = await api.get('/rooms', { params });
  return res.data;
}

export async function getRoom(roomId) {
  const res = await api.get(`/rooms/${roomId}`);
  return res.data.data;
}

export async function createRoom(payload) {
  const res = await api.post('/rooms', payload);
  return res.data.data;
}

export async function updateRoom(roomId, payload) {
  const res = await api.put(`/rooms/${roomId}`, payload);
  return res.data.data;
}

export async function deleteRoom(roomId) {
  const res = await api.delete(`/rooms/${roomId}`);
  return res.data;
}

export async function uploadRoomImages(roomId, files) {
  const form = new FormData();
  for (const f of files) form.append('images', f);
  const res = await api.post(`/rooms/${roomId}/images`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data;
}

