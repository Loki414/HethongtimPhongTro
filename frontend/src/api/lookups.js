import { api } from './client';

export async function listCategories() {
  const res = await api.get('/categories', { params: { page: 1, pageSize: 100 } });
  return res.data.items;
}

export async function listLocations() {
  const res = await api.get('/locations', { params: { page: 1, pageSize: 100 } });
  return res.data.items;
}

export async function listAmenities() {
  const res = await api.get('/amenities', { params: { page: 1, pageSize: 100 } });
  return res.data.items;
}

