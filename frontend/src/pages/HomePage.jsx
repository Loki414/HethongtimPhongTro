import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { listAmenities, listCategories, listLocations } from '../api/lookups';
import { listRooms } from '../api/rooms';
import CompareRoomsPanel from '../components/CompareRoomsPanel.jsx';

const MAX_COMPARE_ROOMS = 3;

function apiErrorMessage(e) {
  return e?.response?.data?.message || e?.message || 'Đã có lỗi xảy ra';
}

function pickCover(room) {
  const images = room.images || [];
  if (!images.length) return null;
  const sorted = [...images].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  return sorted[0]?.url || null;
}

const LOOKUP_STALE_MS = 5 * 60 * 1000;

export default function HomePage() {
  const [page, setPage] = useState(1);
  const pageSize = 9;

  /** Tab nội dung: danh sách tìm kiếm hoặc so sánh phòng (tự chuyển khi đủ 2 phòng). */
  const [homeTab, setHomeTab] = useState('list');
  /** Thứ tự chọn = thứ tự cột so sánh; tối đa 3. */
  const [compareSelection, setCompareSelection] = useState([]);
  const prevCompareLenRef = useRef(0);

  const [filters, setFilters] = useState({
    q: '',
    minPrice: '',
    maxPrice: '',
    locationId: '',
    categoryId: '',
    amenityIds: [],
  });

  const amenityIdsKey = useMemo(() => [...filters.amenityIds].sort().join(','), [filters.amenityIds]);

  function updateFilters(partial) {
    setPage(1);
    setFilters((s) => ({ ...s, ...partial }));
  }

  function toggleAmenity(id) {
    setPage(1);
    setFilters((s) => {
      const exists = s.amenityIds.includes(id);
      return {
        ...s,
        amenityIds: exists ? s.amenityIds.filter((x) => x !== id) : [...s.amenityIds, id],
      };
    });
  }

  const { data: categories = [], error: errCategories } = useQuery({
    queryKey: ['lookups', 'categories'],
    queryFn: listCategories,
    staleTime: LOOKUP_STALE_MS,
  });

  const { data: locations = [], error: errLocations } = useQuery({
    queryKey: ['lookups', 'locations'],
    queryFn: listLocations,
    staleTime: LOOKUP_STALE_MS,
  });

  const { data: amenities = [], error: errAmenities } = useQuery({
    queryKey: ['lookups', 'amenities'],
    queryFn: listAmenities,
    staleTime: LOOKUP_STALE_MS,
  });

  const listParams = useMemo(
    () => ({
      page,
      pageSize,
      q: filters.q || undefined,
      minPrice: filters.minPrice !== '' ? filters.minPrice : undefined,
      maxPrice: filters.maxPrice !== '' ? filters.maxPrice : undefined,
      locationId: filters.locationId || undefined,
      categoryId: filters.categoryId || undefined,
      amenityIds: filters.amenityIds.length ? filters.amenityIds.join(',') : undefined,
    }),
    [
      page,
      pageSize,
      filters.q,
      filters.minPrice,
      filters.maxPrice,
      filters.locationId,
      filters.categoryId,
      amenityIdsKey,
    ]
  );

  const {
    data: roomsPayload,
    isPending: roomsPending,
    isFetching: roomsFetching,
    error: roomsError,
  } = useQuery({
    queryKey: ['rooms', listParams],
    queryFn: ({ signal }) => listRooms(listParams, { signal }),
  });

  const rooms = roomsPayload?.items ?? [];
  const meta = roomsPayload?.meta ?? null;
  const roomsErrText = roomsError ? apiErrorMessage(roomsError) : '';
  const lookupsErr = errCategories || errLocations || errAmenities;

  const loadingRooms = roomsPending || roomsFetching;

  const totalPages = meta?.pageCount || 1;

  useEffect(() => {
    const n = compareSelection.length;
    const prev = prevCompareLenRef.current;
    prevCompareLenRef.current = n;
    if (n >= 2 && prev === 1) setHomeTab('compare');
  }, [compareSelection]);

  useEffect(() => {
    if (compareSelection.length < 2 && homeTab === 'compare') setHomeTab('list');
  }, [compareSelection.length, homeTab]);

  function toggleCompareRoom(room) {
    setCompareSelection((prev) => {
      const exists = prev.some((x) => x.id === room.id);
      if (exists) return prev.filter((x) => x.id !== room.id);
      if (prev.length >= MAX_COMPARE_ROOMS) return prev;
      return [...prev, { id: room.id, title: room.title || 'Phòng' }];
    });
  }

  function removeFromCompare(roomId) {
    setCompareSelection((prev) => prev.filter((x) => x.id !== roomId));
  }

  function clearCompareSelection() {
    setCompareSelection([]);
  }

  function getAmenityGroupLabel(name) {
    const n = String(name || '').toLowerCase();
    if (n.includes('wifi')) return 'Kết nối';
    if (n.includes('parking') || n.includes('bãi xe')) return 'Chỗ để xe';
    if (n.includes('điều hòa') || n.includes('ac') || n.includes('air')) return 'Làm mát';
    if (n.includes('thang máy') || n.includes('elevator')) return 'Di chuyển';
    if (n.includes('pet') || n.includes('thú cưng')) return 'Thú cưng';
    return 'Khác';
  }

  const amenityGroups = useMemo(() => {
    const groups = new Map();
    for (const a of amenities) {
      const label = getAmenityGroupLabel(a.name);
      if (!groups.has(label)) groups.set(label, []);
      groups.get(label).push(a);
    }
    return Array.from(groups.entries()).map(([label, items]) => ({ label, items }));
  }, [amenities]);

  const amenitySummary = useMemo(() => {
    const ids = new Set(filters.amenityIds);
    return amenities.filter((a) => ids.has(a.id)).map((a) => a.name);
  }, [amenities, filters.amenityIds]);

  function getPageNumbers() {
    if (!meta) return [];
    const pages = meta.pageCount || 1;
    const current = meta.page || 1;
    const windowSize = 5;
    const half = Math.floor(windowSize / 2);
    let start = Math.max(1, current - half);
    let end = Math.min(pages, start + windowSize - 1);
    start = Math.max(1, end - windowSize + 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  return (
    <div className="grid" style={{ gap: 14 }}>
      {homeTab === 'list' ? (
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Tìm phòng trọ</h2>
        {lookupsErr ? (
          <div className="error" style={{ marginBottom: 12 }}>
            Không tải được danh mục/khu vực/tiện ích: {apiErrorMessage(lookupsErr)}
          </div>
        ) : null}
        <div className="grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
          <label>
            Từ khóa
            <input
              value={filters.q}
              onChange={(e) => updateFilters({ q: e.target.value })}
              placeholder="VD: Quận 1, studio..."
            />
          </label>
          <label>
            Giá min (VND)
            <input
              value={filters.minPrice}
              onChange={(e) => updateFilters({ minPrice: e.target.value })}
              placeholder="VD: 4000000"
            />
          </label>
          <label>
            Giá max (VND)
            <input
              value={filters.maxPrice}
              onChange={(e) => updateFilters({ maxPrice: e.target.value })}
              placeholder="VD: 8000000"
            />
          </label>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 12 }}>
          <label style={{ minWidth: 240 }}>
            Khu vực
            <select
              value={filters.locationId}
              onChange={(e) => updateFilters({ locationId: e.target.value })}
            >
              <option value="">Tất cả</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </label>
          <label style={{ minWidth: 240 }}>
            Loại phòng
            <select
              value={filters.categoryId}
              onChange={(e) => updateFilters({ categoryId: e.target.value })}
            >
              <option value="">Tất cả</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div style={{ marginTop: 12 }}>
          <div style={{ color: 'rgba(232,238,252,0.7)', marginBottom: 8 }}>Tiện ích (chọn nhiều)</div>
          <div style={{ display: 'grid', gap: 12 }}>
            {amenityGroups.map((g) => (
              <div key={g.label}>
                <div style={{ color: 'rgba(232,238,252,0.7)', marginBottom: 8 }}>{g.label}</div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {g.items.map((a) => {
                    const checked = filters.amenityIds.includes(a.id);
                    return (
                      <button
                        key={a.id}
                        className="btn"
                        type="button"
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
            ))}
          </div>
          {amenitySummary.length ? (
            <div style={{ marginTop: 10, color: 'rgba(232,238,252,0.7)' }}>
              Đang chọn: {amenitySummary.join(', ')}
            </div>
          ) : null}
        </div>
      </div>
      ) : null}

      <div className="card">
        <div
          role="tablist"
          aria-label="Tìm phòng và so sánh"
          style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 14, alignItems: 'center' }}
        >
          <button
            type="button"
            role="tab"
            aria-selected={homeTab === 'list'}
            className="btn"
            onClick={() => setHomeTab('list')}
            style={{
              borderColor: homeTab === 'list' ? 'rgba(110,168,254,0.9)' : 'rgba(255,255,255,0.12)',
              background: homeTab === 'list' ? 'rgba(110,168,254,0.12)' : 'transparent',
            }}
          >
            Tìm phòng
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={homeTab === 'compare'}
            disabled={compareSelection.length < 2}
            className="btn"
            onClick={() => setHomeTab('compare')}
            style={{
              borderColor: homeTab === 'compare' ? 'rgba(110,168,254,0.9)' : 'rgba(255,255,255,0.12)',
              background: homeTab === 'compare' ? 'rgba(110,168,254,0.12)' : 'transparent',
              opacity: compareSelection.length < 2 ? 0.45 : 1,
            }}
          >
            So sánh ({compareSelection.length}/{MAX_COMPARE_ROOMS})
          </button>
        </div>

        {compareSelection.length > 0 ? (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 10,
              alignItems: 'center',
              marginBottom: 14,
              padding: '10px 12px',
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(110,168,254,0.06)',
            }}
          >
            <span style={{ fontWeight: 700, fontSize: 13, color: 'rgba(232,238,252,0.85)' }}>Đang chọn so sánh:</span>
            {compareSelection.map((r) => (
              <span key={r.id} className="pill" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.title}>
                  {r.title}
                </span>
                <button
                  type="button"
                  aria-label={`Bỏ ${r.title}`}
                  onClick={() => removeFromCompare(r.id)}
                  style={{
                    border: 'none',
                    background: 'rgba(255,255,255,0.1)',
                    color: 'inherit',
                    borderRadius: 8,
                    cursor: 'pointer',
                    padding: '0 6px',
                    lineHeight: 1.4,
                  }}
                >
                  ×
                </button>
              </span>
            ))}
            <button type="button" className="btn btnGhost" style={{ marginLeft: 'auto' }} onClick={clearCompareSelection}>
              Xóa hết
            </button>
          </div>
        ) : (
          <div style={{ color: 'rgba(232,238,252,0.65)', fontSize: 14, marginBottom: 14 }}>
            Tích <strong>So sánh</strong> trên từng phòng (tối đa {MAX_COMPARE_ROOMS}). Khi đủ 2 phòng, trang sẽ chuyển sang tab <strong>So sánh</strong>.
          </div>
        )}

        {homeTab === 'list' ? (
        <>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontWeight: 700 }}>Danh sách phòng</div>
            <div style={{ color: 'rgba(232,238,252,0.7)', marginTop: 4 }}>
              {meta
                ? `${meta.total} kết quả (trang ${meta.page}/${meta.pageCount})`
                : loadingRooms
                  ? 'Đang tải...'
                  : roomsErrText
                    ? '—'
                    : '0 kết quả'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button className="btn btnGhost" disabled={page <= 1 || loadingRooms} onClick={() => setPage((p) => p - 1)}>
              Trang trước
            </button>
            <button
              className="btn btnGhost"
              disabled={page >= totalPages || loadingRooms}
              onClick={() => setPage((p) => p + 1)}
            >
              Trang sau
            </button>
          </div>
        </div>

        {roomsErrText ? <div className="error" style={{ marginTop: 12 }}>{roomsErrText}</div> : null}
        {loadingRooms && !rooms.length ? <div style={{ marginTop: 12, color: 'rgba(232,238,252,0.7)' }}>Đang tải...</div> : null}

        {meta ? (
          <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ color: 'rgba(232,238,252,0.7)' }}>Trang:</span>
            {getPageNumbers().map((p) => (
              <button
                key={p}
                type="button"
                className="btn"
                onClick={() => setPage(p)}
                style={{
                  padding: '8px 12px',
                  borderColor: p === page ? 'rgba(110,168,254,0.9)' : 'rgba(255,255,255,0.12)',
                  background: p === page ? 'rgba(110,168,254,0.12)' : 'transparent',
                }}
                disabled={loadingRooms}
              >
                {p}
              </button>
            ))}
          </div>
        ) : null}

        <div className="grid grid-3" style={{ marginTop: 14 }}>
          {rooms.map((room) => {
            const cover = pickCover(room);
            const inCompare = compareSelection.some((x) => x.id === room.id);
            const compareFull = compareSelection.length >= MAX_COMPARE_ROOMS && !inCompare;
            return (
              <div key={room.id} className="roomItem">
                {cover ? <img className="roomThumb" src={cover} alt={room.title} /> : <div className="roomThumb" />}
                <div className="roomTitle">{room.title}</div>
                <div className="roomMeta">
                  <span className="pill">{room.category?.name || '—'}</span>
                  <span className="pill">{room.location?.name || '—'}</span>
                  <span className="pill">{Number(room.pricePerMonth).toLocaleString('vi-VN')} VND</span>
                </div>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginTop: 10,
                    cursor: compareFull ? 'not-allowed' : 'pointer',
                    fontSize: 14,
                    color: compareFull ? 'rgba(232,238,252,0.45)' : 'rgba(232,238,252,0.85)',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={inCompare}
                    disabled={compareFull}
                    onChange={() => toggleCompareRoom(room)}
                  />
                  Thêm vào so sánh
                </label>
                <Link className="btn" to={`/rooms/${room.id}`} style={{ marginTop: 10 }}>
                  Xem chi tiết
                </Link>
              </div>
            );
          })}
        </div>
        </>
        ) : (
          <CompareRoomsPanel roomsToCompare={compareSelection} onRemove={removeFromCompare} />
        )}
      </div>
    </div>
  );
}
