const { Op } = require('sequelize');
const { Room, Category, Location, Amenity, Image, Booking, Review, User, sequelize } = require('../models');
const { invalidateRoomsCache } = require('../core/cache/roomsCache');

async function listRooms({ query }) {
  const {
    page,
    pageSize,
    minPrice,
    maxPrice,
    locationId,
    categoryId,
    amenityIds,
    q,
  } = query;

  const where = {};
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.pricePerMonth = {};
    if (minPrice !== undefined) where.pricePerMonth[Op.gte] = minPrice;
    if (maxPrice !== undefined) where.pricePerMonth[Op.lte] = maxPrice;
  }
  if (locationId) where.locationId = locationId;
  if (categoryId) where.categoryId = categoryId;
  if (q) {
    where[Op.or] = [
      { title: { [Op.like]: `%${q}%` } },
      { description: { [Op.like]: `%${q}%` } },
      { address: { [Op.like]: `%${q}%` } },
    ];
  }

  // Amenity filter (AND semantics):
  // - If user selects multiple amenityIds, the room must have ALL of them.
  // - We implement this with a subquery on room_amenities so that the response still includes
  //   the full amenities list (not only the matched subset).
  if (amenityIds && amenityIds.length) {
    const inList = amenityIds.map((id) => sequelize.escape(id)).join(',');
    const mustHaveAllSql = [
      '`Room`.`id` IN (',
      `  SELECT room_id FROM room_amenities`,
      `  WHERE amenity_id IN (${inList})`,
      `  GROUP BY room_id`,
      `  HAVING COUNT(DISTINCT amenity_id) = ${Number(amenityIds.length)}`,
      ')',
    ].join('\n');

    where[Op.and] = where[Op.and] || [];
    where[Op.and].push(sequelize.literal(mustHaveAllSql));
  }

  const include = [
    { model: Category, as: 'category', attributes: ['id', 'name'] },
    { model: Location, as: 'location', attributes: ['id', 'name'] },
    {
      model: Amenity,
      as: 'amenities',
      attributes: ['id', 'name'],
      through: { attributes: [] },
      required: false,
    },
    {
      model: Image,
      as: 'images',
      attributes: ['id', 'url', 'sortOrder'],
      required: false,
      order: [['sortOrder', 'ASC']],
    },
  ];

  const { count, rows } = await Room.findAndCountAll({
    where,
    include,
    distinct: true,
    limit: pageSize,
    offset: (page - 1) * pageSize,
    order: [['createdAt', 'DESC']],
  });

  return {
    items: rows,
    meta: {
      total: count,
      page,
      pageSize,
      pageCount: Math.ceil(count / pageSize),
    },
  };
}

async function getRoomById(id) {
  return Room.findByPk(id, {
    include: [
      { model: Category, as: 'category', attributes: ['id', 'name', 'description'] },
      { model: Location, as: 'location', attributes: ['id', 'name', 'address'] },
      { model: User, as: 'owner', attributes: ['id', 'fullName', 'avatarUrl'] },
      { model: Amenity, as: 'amenities', attributes: ['id', 'name'], through: { attributes: [] } },
      { model: Image, as: 'images', attributes: ['id', 'url', 'sortOrder'], order: [['sortOrder', 'ASC']] },
      { model: Review, as: 'reviews', attributes: ['id', 'rating', 'comment', 'createdAt'], required: false },
    ],
  });
}

async function createRoom({ userId, payload }) {
  const { amenityIds, ...roomFields } = payload;
  const created = await Room.create({ ...roomFields, userId });

  if (amenityIds && amenityIds.length) {
    await created.setAmenities(amenityIds);
  }

  const result = await getRoomById(created.id);
  // Invalidate cached GET /rooms results after write.
  await invalidateRoomsCache();
  return result;
}

async function updateRoom({ user, roomId, payload }) {
  const room = await Room.findByPk(roomId);
  if (!room) return null;
  const isOwner = room.userId === user.id;
  const isAdmin = user.role === 'admin';
  if (!isAdmin && !isOwner) return null;

  const { amenityIds, ...roomFields } = payload;
  await room.update(roomFields);
  if (amenityIds) {
    await room.setAmenities(amenityIds);
  }
  const result = await getRoomById(room.id);
  await invalidateRoomsCache();
  return result;
}

async function deleteRoom({ user, roomId }) {
  const room = await Room.findByPk(roomId);
  if (!room) return false;
  const isOwner = room.userId === user.id;
  const isAdmin = user.role === 'admin';
  if (!isAdmin && !isOwner) return false;

  await room.destroy();
  await invalidateRoomsCache();
  return true;
}

module.exports = {
  listRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
};
