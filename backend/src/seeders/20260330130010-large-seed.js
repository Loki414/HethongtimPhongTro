/* eslint-disable no-unused-vars */
'use strict';

const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { faker } = require('@faker-js/faker');

// ------------ Config (adjust volume here) ------------
const USER_COUNT = 160; // 100-200
const ROOM_COUNT = 800; // 500-1000
const LOCATION_COUNT = 30; // 20-50
const CATEGORY_COUNT = 8; // 5-10
const AMENITY_COUNT = 20; // 15-30

// Per-room ranges
const IMAGES_PER_ROOM_MIN = 3;
const IMAGES_PER_ROOM_MAX = 8;
const REVIEWS_PER_ROOM_MAX = 10;
const BOOKINGS_PER_ROOM_MAX = 2;

// Per-user ranges
const FAVORITES_PER_USER_MIN = 5;
const FAVORITES_PER_USER_MAX = 20;

// Global
const REPORT_COUNT = 260;
const BATCH_SIZE = 1000;

function now() {
  return new Date();
}

function uuid() {
  return crypto.randomUUID();
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function sampleUnique(arr, n) {
  const out = [];
  const used = new Set();
  const limit = Math.min(n, arr.length);
  while (out.length < limit) {
    const item = pick(arr);
    if (used.has(item)) continue;
    used.add(item);
    out.push(item);
  }
  return out;
}

async function bulkInsertInBatches(queryInterface, table, rows) {
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    // Using bulkInsert is much faster than many inserts.
    // eslint-disable-next-line no-await-in-loop
    await queryInterface.bulkInsert(table, batch);
  }
}

function makeVietnameseName() {
  // Lightweight Vietnamese name generator (more realistic than random latin).
  const last = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương'];
  const mid = ['Văn', 'Thị', 'Hữu', 'Đức', 'Minh', 'Ngọc', 'Thanh', 'Gia', 'Anh', 'Quốc', 'Tuấn', 'Thảo', 'Lan', 'Khánh'];
  const first = ['An', 'Bình', 'Châu', 'Duy', 'Hà', 'Hải', 'Hiếu', 'Hưng', 'Khang', 'Linh', 'Long', 'Nam', 'Phong', 'Quân', 'Sơn', 'Trang', 'Tú', 'Vy', 'Yến'];
  return `${pick(last)} ${pick(mid)} ${pick(first)}`;
}

function makeVNLocations() {
  // 30 locations sample (HCM + Hanoi + Da Nang + Can Tho + Hai Phong ...)
  const base = [
    { name: 'Quận 1', address: 'TP. Hồ Chí Minh - Quận 1' },
    { name: 'Quận 3', address: 'TP. Hồ Chí Minh - Quận 3' },
    { name: 'Quận 5', address: 'TP. Hồ Chí Minh - Quận 5' },
    { name: 'Quận 7', address: 'TP. Hồ Chí Minh - Quận 7' },
    { name: 'Quận 10', address: 'TP. Hồ Chí Minh - Quận 10' },
    { name: 'Bình Thạnh', address: 'TP. Hồ Chí Minh - Bình Thạnh' },
    { name: 'Gò Vấp', address: 'TP. Hồ Chí Minh - Gò Vấp' },
    { name: 'Thủ Đức', address: 'TP. Hồ Chí Minh - TP. Thủ Đức' },
    { name: 'Tân Bình', address: 'TP. Hồ Chí Minh - Tân Bình' },
    { name: 'Tân Phú', address: 'TP. Hồ Chí Minh - Tân Phú' },

    { name: 'Ba Đình', address: 'Hà Nội - Ba Đình' },
    { name: 'Đống Đa', address: 'Hà Nội - Đống Đa' },
    { name: 'Cầu Giấy', address: 'Hà Nội - Cầu Giấy' },
    { name: 'Hai Bà Trưng', address: 'Hà Nội - Hai Bà Trưng' },
    { name: 'Hoàng Mai', address: 'Hà Nội - Hoàng Mai' },
    { name: 'Thanh Xuân', address: 'Hà Nội - Thanh Xuân' },

    { name: 'Hải Châu', address: 'Đà Nẵng - Hải Châu' },
    { name: 'Sơn Trà', address: 'Đà Nẵng - Sơn Trà' },
    { name: 'Liên Chiểu', address: 'Đà Nẵng - Liên Chiểu' },

    { name: 'Ninh Kiều', address: 'Cần Thơ - Ninh Kiều' },
    { name: 'Bình Thủy', address: 'Cần Thơ - Bình Thủy' },

    { name: 'Lê Chân', address: 'Hải Phòng - Lê Chân' },
    { name: 'Ngô Quyền', address: 'Hải Phòng - Ngô Quyền' },

    { name: 'Thành phố Thủ Dầu Một', address: 'Bình Dương - Thủ Dầu Một' },
    { name: 'Thuận An', address: 'Bình Dương - Thuận An' },

    { name: 'Biên Hòa', address: 'Đồng Nai - Biên Hòa' },
    { name: 'Long Thành', address: 'Đồng Nai - Long Thành' },

    { name: 'Nha Trang', address: 'Khánh Hòa - Nha Trang' },
    { name: 'Vũng Tàu', address: 'Bà Rịa - Vũng Tàu' },
  ];

  return base.slice(0, LOCATION_COUNT);
}

function makeCategories() {
  const list = [
    { name: 'Phòng trọ', description: 'Phòng trọ phổ thông' },
    { name: 'Chung cư mini', description: 'Chung cư mini, tiện nghi' },
    { name: 'Ký túc xá', description: 'Phòng ở ghép / KTX' },
    { name: 'Căn hộ dịch vụ', description: 'Căn hộ dịch vụ, có dọn dẹp' },
    { name: 'Nhà nguyên căn', description: 'Nhà cho thuê nguyên căn' },
    { name: 'Studio', description: 'Studio khép kín' },
    { name: 'Ở ghép', description: 'Tìm người ở ghép' },
    { name: 'Homestay dài hạn', description: 'Ở dài hạn kiểu homestay' },
  ];
  return list.slice(0, CATEGORY_COUNT);
}

function makeAmenities() {
  const list = [
    'Wifi',
    'Bãi xe',
    'Điều hòa',
    'Thang máy',
    'Bảo vệ 24/7',
    'Camera an ninh',
    'Khóa vân tay',
    'Máy giặt',
    'Tủ lạnh',
    'Nội thất cơ bản',
    'Bếp riêng',
    'WC riêng',
    'Ban công',
    'Giờ giấc tự do',
    'Cho nuôi thú cưng',
    'Gần chợ',
    'Gần trường học',
    'Gần bệnh viện',
    'Internet cáp quang',
    'Dọn phòng định kỳ',
    'Phòng mới xây',
    'Có gác',
    'Tủ quần áo',
    'Nước nóng',
    'Khu bếp chung',
    'Cửa sổ thoáng',
    'Giữ xe miễn phí',
    'Có máy lọc nước',
    'Không chung chủ',
    'Hỗ trợ sửa chữa',
  ];
  return list.slice(0, AMENITY_COUNT);
}

function makeRoomTitle(categoryName, locationName, price) {
  const attrs = [
    'full nội thất',
    'mới xây',
    'thoáng mát',
    'an ninh',
    'gần trung tâm',
    'giờ giấc tự do',
    'có gác',
    'ban công',
    'view đẹp',
  ];
  const suffix = pick(attrs);
  const priceStr = `${Math.round(price / 100000) / 10} triệu`;
  return `${categoryName} ${suffix} - ${locationName} (${priceStr})`;
}

function makeVNAddress(locationName) {
  const streets = ['Nguyễn Trãi', 'Lê Văn Sỹ', 'Trường Sa', 'Hoàng Sa', 'Điện Biên Phủ', 'Cách Mạng Tháng 8', 'Phan Xích Long', 'Lý Thường Kiệt', 'Võ Văn Tần', 'Hai Bà Trưng'];
  return `${randInt(1, 250)} ${pick(streets)}, ${locationName}`;
}

function randomPriceVND() {
  // 1M - 10M (step 50k)
  const base = randInt(20, 200) * 50000;
  return Math.max(1000000, Math.min(10000000, base));
}

function randomPastDate(daysBack = 180) {
  const d = new Date();
  d.setDate(d.getDate() - randInt(0, daysBack));
  d.setHours(randInt(0, 23), randInt(0, 59), randInt(0, 59), 0);
  return d;
}

function toDateOnly(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

module.exports = {
  async up(queryInterface, Sequelize) {
    // If you already ran demo seed, unique constraints (e.g., categories.name) will conflict.
    // For realistic load testing, we reset dataset first (keeping migrations table).
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');
    await queryInterface.bulkDelete('reports', null, {});
    await queryInterface.bulkDelete('favorites', null, {});
    await queryInterface.bulkDelete('bookings', null, {});
    await queryInterface.bulkDelete('reviews', null, {});
    await queryInterface.bulkDelete('images', null, {});
    await queryInterface.bulkDelete('room_amenities', null, {});
    await queryInterface.bulkDelete('rooms', null, {});
    await queryInterface.bulkDelete('amenities', null, {});
    await queryInterface.bulkDelete('locations', null, {});
    await queryInterface.bulkDelete('categories', null, {});
    await queryInterface.bulkDelete('users', null, {});
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');

    // Ensure we have room.status column migrated before seeding large dataset
    // (if user forgot to run migrations, seeding will fail clearly).

    const createdAt = now();
    const updatedAt = createdAt;

    // 1) Categories
    const categories = makeCategories().map((c) => ({
      id: uuid(),
      name: c.name,
      description: c.description,
      created_at: createdAt,
      updated_at: updatedAt,
    }));
    await bulkInsertInBatches(queryInterface, 'categories', categories);

    // 2) Locations
    const locations = makeVNLocations().map((l) => ({
      id: uuid(),
      name: l.name,
      address: l.address,
      created_at: createdAt,
      updated_at: updatedAt,
    }));
    await bulkInsertInBatches(queryInterface, 'locations', locations);

    // 3) Amenities
    const amenities = makeAmenities().map((name) => ({
      id: uuid(),
      name,
      created_at: createdAt,
      updated_at: updatedAt,
    }));
    await bulkInsertInBatches(queryInterface, 'amenities', amenities);

    // 4) Users
    // Roles: admin 5%, user 95%
    const passwordHash = await bcrypt.hash('password123', 10);
    const users = [];
    for (let i = 0; i < USER_COUNT; i++) {
      const id = uuid();
      const role = i < Math.max(1, Math.round(USER_COUNT * 0.05)) ? 'admin' : 'user';
      const fullName = makeVietnameseName();
      const email = `user${i + 1}@seed.test`;
      const avatarUrl = `https://i.pravatar.cc/150?u=${encodeURIComponent(id)}`;
      users.push({
        id,
        full_name: role === 'admin' ? `Admin ${fullName}` : fullName,
        email,
        password_hash: passwordHash,
        role,
        avatar_url: avatarUrl,
        created_at: randomPastDate(365),
        updated_at: updatedAt,
      });
    }

    // Keep the two existing demo accounts (if present) by inserting them with fixed emails.
    // (If they already exist, this insert will fail due to unique email; so we skip them here.)
    await bulkInsertInBatches(queryInterface, 'users', users);

    // 5) Rooms
    const roomIds = [];
    const rooms = [];
    const userIds = users.map((u) => u.id);
    const categoryIds = categories.map((c) => c.id);
    const locationIds = locations.map((l) => l.id);

    for (let i = 0; i < ROOM_COUNT; i++) {
      const id = uuid();
      roomIds.push(id);
      const categoryId = pick(categoryIds);
      const locationId = pick(locationIds);
      const ownerId = pick(userIds);
      const categoryName = categories.find((c) => c.id === categoryId)?.name || 'Phòng';
      const locationName = locations.find((l) => l.id === locationId)?.name || 'Khu vực';
      const price = randomPriceVND();
      const title = makeRoomTitle(categoryName, locationName, price);
      const description = faker.lorem.paragraphs({ min: 1, max: 3 });
      const status = Math.random() < 0.78 ? 'available' : 'rented';
      const created = randomPastDate(240);
      rooms.push({
        id,
        user_id: ownerId,
        title,
        description,
        price_per_month: price,
        area_sqm: randInt(12, 55),
        address: makeVNAddress(locationName),
        status,
        category_id: categoryId,
        location_id: locationId,
        created_at: created,
        updated_at: created,
      });
    }
    await bulkInsertInBatches(queryInterface, 'rooms', rooms);

    // 6) Room amenities (n-n)
    const roomAmenities = [];
    const amenityIds = amenities.map((a) => a.id);
    for (const roomId of roomIds) {
      const count = randInt(3, 8);
      const picked = sampleUnique(amenityIds, count);
      for (const amenityId of picked) {
        roomAmenities.push({ room_id: roomId, amenity_id: amenityId });
      }
    }
    await bulkInsertInBatches(queryInterface, 'room_amenities', roomAmenities);

    // 7) Images (3-8 per room)
    const images = [];
    for (const roomId of roomIds) {
      const n = randInt(IMAGES_PER_ROOM_MIN, IMAGES_PER_ROOM_MAX);
      for (let i = 0; i < n; i++) {
        const id = uuid();
        images.push({
          id,
          room_id: roomId,
          url: `https://picsum.photos/seed/${roomId}-${i}/1000/750`,
          file_name: `seed_${roomId}_${i}.jpg`,
          mime_type: 'image/jpeg',
          size_bytes: randInt(120000, 950000),
          sort_order: i,
          created_at: randomPastDate(240),
          updated_at: updatedAt,
        });
      }
    }
    await bulkInsertInBatches(queryInterface, 'images', images);

    // 8) Reviews (0-10 per room)
    const reviews = [];
    const reviewComments = [
      'Phòng sạch sẽ, chủ dễ tính.',
      'Giá hợp lý, vị trí thuận tiện.',
      'Hơi ồn vào buổi tối nhưng tạm ổn.',
      'An ninh tốt, có camera.',
      'Phòng thoáng, có cửa sổ.',
      'Nội thất ổn, wifi mạnh.',
      'Cần cải thiện vệ sinh khu chung.',
      'Thang máy hơi chậm nhưng vẫn ok.',
    ];

    for (const roomId of roomIds) {
      const n = randInt(0, REVIEWS_PER_ROOM_MAX);
      const reviewers = sampleUnique(userIds, Math.min(n, userIds.length));
      for (let i = 0; i < n; i++) {
        const userId = reviewers[i % reviewers.length];
        reviews.push({
          id: uuid(),
          user_id: userId,
          room_id: roomId,
          rating: randInt(1, 5),
          comment: Math.random() < 0.15 ? null : pick(reviewComments),
          created_at: randomPastDate(240),
          updated_at: updatedAt,
        });
      }
    }
    await bulkInsertInBatches(queryInterface, 'reviews', reviews);

    // 9) Bookings (0-2 per room)
    const bookings = [];
    const bookingStatuses = ['pending', 'confirmed', 'cancelled'];
    for (const roomId of roomIds) {
      const n = randInt(0, BOOKINGS_PER_ROOM_MAX);
      for (let i = 0; i < n; i++) {
        const userId = pick(userIds);
        const start = randomPastDate(120);
        const end = new Date(start);
        end.setDate(end.getDate() + randInt(7, 60));
        bookings.push({
          id: uuid(),
          user_id: userId,
          room_id: roomId,
          start_date: toDateOnly(start),
          end_date: toDateOnly(end),
          status: pick(bookingStatuses),
          note: Math.random() < 0.3 ? faker.lorem.sentence() : null,
          created_at: randomPastDate(180),
          updated_at: updatedAt,
        });
      }
    }
    await bulkInsertInBatches(queryInterface, 'bookings', bookings);

    // 10) Favorites (5-20 per user)
    const favorites = [];
    for (const userId of userIds) {
      const n = randInt(FAVORITES_PER_USER_MIN, FAVORITES_PER_USER_MAX);
      const pickedRooms = sampleUnique(roomIds, n);
      for (const roomId of pickedRooms) {
        favorites.push({
          id: uuid(),
          user_id: userId,
          room_id: roomId,
          created_at: randomPastDate(180),
          updated_at: updatedAt,
        });
      }
    }
    await bulkInsertInBatches(queryInterface, 'favorites', favorites);

    // 11) Reports
    const reportReasons = [
      'Tin đăng có dấu hiệu lừa đảo',
      'Giá không đúng mô tả',
      'Hình ảnh không liên quan',
      'Spam / đăng trùng lặp',
      'Thông tin liên hệ không đúng',
      'Nội dung phản cảm',
      'Phòng đã cho thuê nhưng vẫn đăng',
      'Địa chỉ không chính xác',
    ];
    const reports = [];
    for (let i = 0; i < REPORT_COUNT; i++) {
      reports.push({
        id: uuid(),
        reporter_id: pick(userIds),
        room_id: pick(roomIds),
        reason: pick(reportReasons),
        status: Math.random() < 0.75 ? 'open' : 'resolved',
        created_at: randomPastDate(240),
        updated_at: updatedAt,
      });
    }
    await bulkInsertInBatches(queryInterface, 'reports', reports);
  },

  async down(queryInterface) {
    // Clear in reverse order due to FKs
    await queryInterface.bulkDelete('reports', null, {});
    await queryInterface.bulkDelete('favorites', null, {});
    await queryInterface.bulkDelete('bookings', null, {});
    await queryInterface.bulkDelete('reviews', null, {});
    await queryInterface.bulkDelete('images', null, {});
    await queryInterface.bulkDelete('room_amenities', null, {});
    await queryInterface.bulkDelete('rooms', null, {});
    await queryInterface.bulkDelete('amenities', null, {});
    await queryInterface.bulkDelete('locations', null, {});
    await queryInterface.bulkDelete('categories', null, {});
    await queryInterface.bulkDelete('users', null, {});
  },
};

