import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../state/auth.jsx';
import { listAmenities, listCategories, listLocations } from '../api/lookups';
import { createRoom, uploadRoomImages } from '../api/rooms';

export default function PostRoomPage() {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [amenities, setAmenities] = useState([]);

  const [form, setForm] = useState({
    title: '',
    description: '',
    pricePerMonth: '',
    areaSqm: '',
    address: '',
    categoryId: '',
    locationId: '',
    amenityIds: [],
  });

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const [c, l, a] = await Promise.all([listCategories(), listLocations(), listAmenities()]);
      setCategories(c);
      setLocations(l);
      setAmenities(a);
    })().catch(() => {});
  }, []);

  function toggleAmenity(id) {
    setForm((s) => {
      const exists = s.amenityIds.includes(id);
      return { ...s, amenityIds: exists ? s.amenityIds.filter((x) => x !== id) : [...s.amenityIds, id] };
    });
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!token) return navigate('/auth');
    setLoading(true);
    setError('');
    try {
      const payload = {
        title: form.title,
        description: form.description || undefined,
        pricePerMonth: Number(form.pricePerMonth),
        areaSqm: form.areaSqm ? Number(form.areaSqm) : undefined,
        address: form.address || undefined,
        categoryId: form.categoryId,
        locationId: form.locationId,
        amenityIds: form.amenityIds,
      };

      const created = await createRoom(payload);
      if (files.length) {
        await uploadRoomImages(created.id, files);
      }
      navigate(`/rooms/${created.id}`);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Post room failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Đăng bài phòng trọ</h2>
      {error ? <div className="error" style={{ marginBottom: 12 }}>{error}</div> : null}
      <form className="form" onSubmit={onSubmit}>
        <label>
          Tiêu đề
          <input value={form.title} onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))} />
        </label>
        <label>
          Mô tả
          <textarea value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} />
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <label>
            Giá (VND/tháng)
            <input value={form.pricePerMonth} onChange={(e) => setForm((s) => ({ ...s, pricePerMonth: e.target.value }))} />
          </label>
          <label>
            Diện tích (m²)
            <input value={form.areaSqm} onChange={(e) => setForm((s) => ({ ...s, areaSqm: e.target.value }))} />
          </label>
        </div>
        <label>
          Địa chỉ
          <input value={form.address} onChange={(e) => setForm((s) => ({ ...s, address: e.target.value }))} />
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <label>
            Danh mục
            <select value={form.categoryId} onChange={(e) => setForm((s) => ({ ...s, categoryId: e.target.value }))}>
              <option value="">Chọn...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Khu vực
            <select value={form.locationId} onChange={(e) => setForm((s) => ({ ...s, locationId: e.target.value }))}>
              <option value="">Chọn...</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="card" style={{ padding: 12 }}>
          <div style={{ fontWeight: 800, marginBottom: 8 }}>Tiện ích</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {amenities.map((a) => {
              const checked = form.amenityIds.includes(a.id);
              return (
                <button
                  key={a.id}
                  type="button"
                  className="btn"
                  onClick={() => toggleAmenity(a.id)}
                  style={{
                    padding: '8px 12px',
                    borderColor: checked ? 'rgba(110,168,254,0.9)' : 'rgba(255,255,255,0.12)',
                    background: checked ? 'rgba(110,168,254,0.12)' : 'transparent',
                  }}
                >
                  {a.name}
                </button>
              );
            })}
          </div>
        </div>

        <label>
          Upload ảnh phòng (nhiều ảnh)
          <input type="file" multiple accept="image/*" onChange={(e) => setFiles(Array.from(e.target.files || []))} />
        </label>

        <button className="btn" type="submit" disabled={loading}>
          {loading ? 'Đang đăng...' : 'Đăng phòng'}
        </button>
      </form>
    </div>
  );
}

