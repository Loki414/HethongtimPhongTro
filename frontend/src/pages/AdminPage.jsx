import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { listRooms } from '../api/rooms';

function RowActions({ onDelete }) {
  return (
    <button className="btn btnGhost" style={{ borderColor: 'rgba(255,107,107,0.5)' }} onClick={onDelete} type="button">
      Xóa
    </button>
  );
}

export default function AdminPage() {
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [rooms, setRooms] = useState([]);

  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [newLocation, setNewLocation] = useState({ name: '', address: '' });
  const [newAmenity, setNewAmenity] = useState({ name: '' });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function refresh() {
    const [c, l, a] = await Promise.all([
      api.get('/categories', { params: { page: 1, pageSize: 100 } }),
      api.get('/locations', { params: { page: 1, pageSize: 100 } }),
      api.get('/amenities', { params: { page: 1, pageSize: 100 } }),
    ]);
    setCategories(c.data.items);
    setLocations(l.data.items);
    setAmenities(a.data.items);

    const roomRes = await listRooms({ page: 1, pageSize: 30 });
    setRooms(roomRes.items);
  }

  useEffect(() => {
    refresh().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onCreateCategory(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/categories', {
        name: newCategory.name,
        description: newCategory.description || undefined,
      });
      setNewCategory({ name: '', description: '' });
      await refresh();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Tạo category thất bại');
    } finally {
      setLoading(false);
    }
  }

  async function onDeleteCategory(id) {
    setLoading(true);
    setError('');
    try {
      await api.delete(`/categories/${id}`);
      await refresh();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Xóa category thất bại');
    } finally {
      setLoading(false);
    }
  }

  async function onCreateLocation(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/locations', { name: newLocation.name, address: newLocation.address || undefined });
      setNewLocation({ name: '', address: '' });
      await refresh();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Tạo location thất bại');
    } finally {
      setLoading(false);
    }
  }

  async function onDeleteLocation(id) {
    setLoading(true);
    setError('');
    try {
      await api.delete(`/locations/${id}`);
      await refresh();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Xóa location thất bại');
    } finally {
      setLoading(false);
    }
  }

  async function onCreateAmenity(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/amenities', { name: newAmenity.name });
      setNewAmenity({ name: '' });
      await refresh();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Tạo amenity thất bại');
    } finally {
      setLoading(false);
    }
  }

  async function onDeleteAmenity(id) {
    setLoading(true);
    setError('');
    try {
      await api.delete(`/amenities/${id}`);
      await refresh();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Xóa amenity thất bại');
    } finally {
      setLoading(false);
    }
  }

  async function onDeleteRoom(roomId) {
    setLoading(true);
    setError('');
    try {
      await api.delete(`/rooms/${roomId}`);
      await refresh();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Xóa phòng thất bại');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid" style={{ gap: 14 }}>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Trang quản trị (Admin)</h2>
        {error ? <div className="error">{error}</div> : null}
        <div style={{ color: 'rgba(232,238,252,0.7)' }}>Tối giản: quản lý Category/Location/Amenity + danh sách phòng (xóa).</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 12 }}>
          <Link className="btn" to="/admin/dashboard">
            Dashboard số liệu
          </Link>
          <Link className="btn" to="/admin/bookings">
            Duyệt đặt phòng (lịch thuê)
          </Link>
          <Link className="btn btnGhost" to="/admin/deposits">
            Hóa đơn đặt cọc
          </Link>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Quản lý Category</h3>
        <form className="form" style={{ marginBottom: 14 }} onSubmit={onCreateCategory}>
          <label>
            Name
            <input value={newCategory.name} onChange={(e) => setNewCategory((s) => ({ ...s, name: e.target.value }))} />
          </label>
          <label>
            Description
            <input value={newCategory.description} onChange={(e) => setNewCategory((s) => ({ ...s, description: e.target.value }))} />
          </label>
          <button className="btn" type="submit" disabled={loading}>
            Tạo category
          </button>
        </form>
        <div style={{ display: 'grid', gap: 10 }}>
          {categories.map((c) => (
            <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700 }}>{c.name}</div>
                {c.description ? <div style={{ color: 'rgba(232,238,252,0.7)' }}>{c.description}</div> : null}
              </div>
              <RowActions onDelete={() => onDeleteCategory(c.id)} />
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Quản lý Location</h3>
        <form className="form" style={{ marginBottom: 14 }} onSubmit={onCreateLocation}>
          <label>
            Name
            <input value={newLocation.name} onChange={(e) => setNewLocation((s) => ({ ...s, name: e.target.value }))} />
          </label>
          <label>
            Address
            <input value={newLocation.address} onChange={(e) => setNewLocation((s) => ({ ...s, address: e.target.value }))} />
          </label>
          <button className="btn" type="submit" disabled={loading}>
            Tạo location
          </button>
        </form>
        <div style={{ display: 'grid', gap: 10 }}>
          {locations.map((l) => (
            <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700 }}>{l.name}</div>
                {l.address ? <div style={{ color: 'rgba(232,238,252,0.7)' }}>{l.address}</div> : null}
              </div>
              <RowActions onDelete={() => onDeleteLocation(l.id)} />
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Quản lý Amenity</h3>
        <form className="form" style={{ marginBottom: 14 }} onSubmit={onCreateAmenity}>
          <label>
            Name
            <input value={newAmenity.name} onChange={(e) => setNewAmenity({ name: e.target.value })} />
          </label>
          <button className="btn" type="submit" disabled={loading}>
            Tạo amenity
          </button>
        </form>
        <div style={{ display: 'grid', gap: 10 }}>
          {amenities.map((a) => (
            <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
              <div style={{ fontWeight: 700 }}>{a.name}</div>
              <RowActions onDelete={() => onDeleteAmenity(a.id)} />
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Danh sách phòng (xóa)</h3>
        <div style={{ display: 'grid', gap: 10 }}>
          {rooms.map((r) => (
            <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700 }}>{r.title}</div>
                <div style={{ color: 'rgba(232,238,252,0.7)' }}>
                  {r.category?.name} - {r.location?.name}
                </div>
              </div>
              <RowActions onDelete={() => onDeleteRoom(r.id)} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

