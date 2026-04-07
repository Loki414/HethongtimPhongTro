import { api } from './client';

export async function createReview({ roomId, rating, comment }) {
  const res = await api.post('/reviews', { roomId, rating, comment });
  return res.data.data;
}

