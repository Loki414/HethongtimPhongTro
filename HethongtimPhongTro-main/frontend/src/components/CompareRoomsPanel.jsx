import React, { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getRoom } from '../api/rooms';

function pickCover(room) {
  const images = room?.images || [];
  if (!images.length) return null;
  const sorted = [...images].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  return sorted[0]?.url || null;
}

function apiErrorMessage(e) {
  return e?.response?.data?.message || e?.message || 'Đã có lỗi xảy ra';
}

export default function CompareRoomsPanel({ roomsToCompare, onRemove }) {
  const roomIds = useMemo(() => roomsToCompare.map((r) => r.id), [roomsToCompare]);

  const queries = useQueries({
    queries: roomIds.map((id) => ({
      queryKey: ['room', id],
      queryFn: () => getRoom(id),
      enabled: roomIds.length >= 2,
    })),
  });

  const loading = roomIds.length >= 2 && queries.some((q) => q.isPending);

  const allAmenityNames = useMemo(() => {
    const set = new Set();
    for (let i = 0; i < roomIds.length; i++) {
      const room = queries[i]?.data;
      for (const a of room?.amenities || []) {
        if (a?.name) set.add(a.name);
      }
    }
    return [...set].sort((a, b) => a.localeCompare(b, 'vi'));
  }, [queries, roomIds.length]);

  if (roomIds.length < 2) {
    return (
      <div style={{ color: 'rgba(232,238,252,0.75)', lineHeight: 1.5 }}>
        Chọn thêm ít nhất <strong>một phòng nữa</strong> ở tab <strong>Tìm phòng</strong> (tối đa 3 phòng). Các phòng đang chọn được giữ khi bạn chuyển tab.
      </div>
    );
  }

  if (loading) {
    return <div style={{ color: 'rgba(232,238,252,0.7)' }}>Đang tải dữ liệu phòng...</div>;
  }

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div style={{ color: 'rgba(232,238,252,0.7)', fontSize: 14 }}>
        So sánh tối đa 3 phòng cạnh nhau. Bấm × trên từng cột để bỏ khỏi danh sách.
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 16,
          alignItems: 'stretch',
        }}
      >
        {roomIds.map((id, i) => {
          const q = queries[i];
          const err = q?.error;
          const room = q?.data;

          return (
            <div
              key={id}
              className="roomItem"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                margin: 0,
                position: 'relative',
                paddingTop: 8,
              }}
            >
              <button
                type="button"
                className="btn btnGhost"
                aria-label="Bỏ phòng khỏi so sánh"
                onClick={() => onRemove(id)}
                style={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  padding: '4px 10px',
                  minWidth: 'auto',
                  lineHeight: 1.2,
                  zIndex: 1,
                }}
              >
                ×
              </button>

              {err ? (
                <div className="error" style={{ fontSize: 14 }}>
                  {apiErrorMessage(err)}
                </div>
              ) : !room ? (
                <div style={{ color: 'rgba(232,238,252,0.6)' }}>Không có dữ liệu.</div>
              ) : (
                <>
                  {pickCover(room) ? (
                    <img className="roomThumb" src={pickCover(room)} alt="" style={{ aspectRatio: '16/10' }} />
                  ) : (
                    <div className="roomThumb" style={{ aspectRatio: '16/10' }} />
                  )}
                  <div className="roomTitle" style={{ paddingRight: 36 }}>
                    {room.title}
                  </div>
                  <div className="roomMeta">
                    <span className="pill">{room.category?.name || '—'}</span>
                    <span className="pill">{room.location?.name || '—'}</span>
                    <span className="pill">{Number(room.pricePerMonth).toLocaleString('vi-VN')} VND/tháng</span>
                    {room.areaSqm ? <span className="pill">{room.areaSqm} m²</span> : null}
                  </div>
                  {room.address ? (
                    <div style={{ fontSize: 13, color: 'rgba(232,238,252,0.7)' }}>{room.address}</div>
                  ) : null}
                  <div style={{ fontSize: 14, color: 'rgba(232,238,252,0.82)', lineHeight: 1.45, flex: 1 }}>
                    {room.description
                      ? room.description.length > 220
                        ? `${room.description.slice(0, 220)}…`
                        : room.description
                      : '—'}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(232,238,252,0.85)' }}>Tiện ích</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {(room.amenities || []).length ? (
                      (room.amenities || []).map((a) => (
                        <span key={a.id} className="pill">
                          {a.name}
                        </span>
                      ))
                    ) : (
                      <span style={{ color: 'rgba(232,238,252,0.55)', fontSize: 13 }}>Chưa khai báo</span>
                    )}
                  </div>
                  <Link className="btn" to={`/rooms/${room.id}`} style={{ marginTop: 'auto' }}>
                    Xem chi tiết
                  </Link>
                </>
              )}
            </div>
          );
        })}
      </div>

      {allAmenityNames.length > 0 ? (
        <div style={{ padding: 14, borderRadius: 14, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.12)', overflowX: 'auto' }}>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>Tiện ích theo từng phòng</div>
          <div style={{ display: 'grid', gap: 6, fontSize: 13 }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `minmax(100px,1.2fr) repeat(${roomIds.length}, minmax(72px,1fr))`,
                gap: 8,
                alignItems: 'center',
                paddingBottom: 8,
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(232,238,252,0.65)',
                fontWeight: 600,
              }}
            >
              <span>Tiện ích</span>
              {roomsToCompare.map((r, i) => {
                const title = queries[i]?.data?.title || r.title;
                return (
                  <span key={r.id} style={{ lineHeight: 1.3 }} title={title}>
                    {title.length > 18 ? `${title.slice(0, 18)}…` : title}
                  </span>
                );
              })}
            </div>
            {allAmenityNames.map((name) => (
              <div
                key={name}
                style={{
                  display: 'grid',
                  gridTemplateColumns: `minmax(100px,1.2fr) repeat(${roomIds.length}, minmax(72px,1fr))`,
                  gap: 8,
                  alignItems: 'center',
                }}
              >
                <span style={{ color: 'rgba(232,238,252,0.88)' }}>{name}</span>
                {roomIds.map((id, i) => {
                  const room = queries[i]?.data;
                  const has = (room?.amenities || []).some((a) => a.name === name);
                  return (
                    <span
                      key={id}
                      className="pill"
                      style={{
                        justifySelf: 'start',
                        opacity: has ? 1 : 0.4,
                        borderColor: has ? 'rgba(110,168,254,0.55)' : 'rgba(255,255,255,0.08)',
                        margin: 0,
                      }}
                    >
                      {has ? 'Có' : 'Không'}
                    </span>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
