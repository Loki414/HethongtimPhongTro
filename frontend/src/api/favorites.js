import { api } from './client';

export async function listFavorites(params = { page: 1, pageSize: 50 }) {
  const res = await api.get('/favorites', { params });
  return res.data; // { message, items, meta }
}

export async function createFavorite(roomId) {
  const res = await api.post('/favorites', { roomId });
  return res.data.data;
}

export async function deleteFavorite(favoriteId) {
  const res = await api.delete(`/favorites/${favoriteId}`);
  return res.data;
}

