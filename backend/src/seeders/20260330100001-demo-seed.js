/* eslint-disable no-unused-vars */
'use strict';

const bcrypt = require('bcrypt');
const crypto = require('crypto');

function now() {
  return new Date();
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const adminId = crypto.randomUUID();
    const userId = crypto.randomUUID();

    const categoryStudioId = crypto.randomUUID();
    const categoryApartmentId = crypto.randomUUID();
    const categoryHouseId = crypto.randomUUID();

    const locationD1Id = crypto.randomUUID();
    const locationD2Id = crypto.randomUUID();

    const amenityWifiId = crypto.randomUUID();
    const amenityParkingId = crypto.randomUUID();
    const amenityACId = crypto.randomUUID();
    const amenityElevatorId = crypto.randomUUID();
    const amenityPetId = crypto.randomUUID();

    const room1Id = crypto.randomUUID();
    const room2Id = crypto.randomUUID();
    const room3Id = crypto.randomUUID();

    const image1Id = crypto.randomUUID();
    const image2Id = crypto.randomUUID();
    const image3Id = crypto.randomUUID();

    const review1Id = crypto.randomUUID();
    const review2Id = crypto.randomUUID();

    const booking1Id = crypto.randomUUID();

    const favorite1Id = crypto.randomUUID();

    const report1Id = crypto.randomUUID();

    const adminPasswordHash = await bcrypt.hash('admin1234', 10);
    const userPasswordHash = await bcrypt.hash('user1234', 10);

    await queryInterface.bulkInsert('users', [
      {
        id: adminId,
        full_name: 'Admin DACK',
        email: 'admin@dack.test',
        password_hash: adminPasswordHash,
        role: 'admin',
        avatar_url: null,
        created_at: now(),
        updated_at: now(),
      },
      {
        id: userId,
        full_name: 'User Demo',
        email: 'user@dack.test',
        password_hash: userPasswordHash,
        role: 'user',
        avatar_url: null,
        created_at: now(),
        updated_at: now(),
      },
    ]);

    await queryInterface.bulkInsert('categories', [
      { id: categoryStudioId, name: 'Studio', description: 'Phòng studio' , created_at: now(), updated_at: now() },
      { id: categoryApartmentId, name: 'Căn hộ', description: 'Căn hộ cho thuê', created_at: now(), updated_at: now() },
      { id: categoryHouseId, name: 'Nhà', description: 'Nhà/Nguyên căn', created_at: now(), updated_at: now() },
    ]);

    await queryInterface.bulkInsert('locations', [
      { id: locationD1Id, name: 'Quận 1', address: 'TP. HCM - Quận 1', created_at: now(), updated_at: now() },
      { id: locationD2Id, name: 'Quận 2', address: 'TP. HCM - Quận 2', created_at: now(), updated_at: now() },
    ]);

    await queryInterface.bulkInsert('amenities', [
      { id: amenityWifiId, name: 'Wifi', created_at: now(), updated_at: now() },
      { id: amenityParkingId, name: 'Bãi xe', created_at: now(), updated_at: now() },
      { id: amenityACId, name: 'Điều hòa', created_at: now(), updated_at: now() },
      { id: amenityElevatorId, name: 'Thang máy', created_at: now(), updated_at: now() },
      { id: amenityPetId, name: 'Thú cưng', created_at: now(), updated_at: now() },
    ]);

    await queryInterface.bulkInsert('rooms', [
      {
        id: room1Id,
        user_id: userId,
        title: 'Phòng studio full nội thất - Quận 1',
        description: 'Gần trung tâm, an ninh tốt.',
        price_per_month: 4500000,
        area_sqm: 25,
        address: 'Đường A, Quận 1',
        category_id: categoryStudioId,
        location_id: locationD1Id,
        created_at: now(),
        updated_at: now(),
      },
      {
        id: room2Id,
        user_id: userId,
        title: 'Căn hộ mini có bãi xe - Quận 2',
        description: 'Có chỗ để xe, wifi mạnh.',
        price_per_month: 6000000,
        area_sqm: 32,
        address: 'Đường B, Quận 2',
        category_id: categoryApartmentId,
        location_id: locationD2Id,
        created_at: now(),
        updated_at: now(),
      },
      {
        id: room3Id,
        user_id: userId,
        title: 'Nhà riêng thoáng - Quận 2',
        description: 'Thích hợp gia đình nhỏ.',
        price_per_month: 8500000,
        area_sqm: 45,
        address: 'Đường C, Quận 2',
        category_id: categoryHouseId,
        location_id: locationD2Id,
        created_at: now(),
        updated_at: now(),
      },
    ]);

    await queryInterface.bulkInsert('room_amenities', [
      { room_id: room1Id, amenity_id: amenityWifiId },
      { room_id: room1Id, amenity_id: amenityACId },
      { room_id: room2Id, amenity_id: amenityWifiId },
      { room_id: room2Id, amenity_id: amenityParkingId },
      { room_id: room2Id, amenity_id: amenityACId },
      { room_id: room3Id, amenity_id: amenityParkingId },
      { room_id: room3Id, amenity_id: amenityElevatorId },
      { room_id: room3Id, amenity_id: amenityPetId },
    ]);

    await queryInterface.bulkInsert('images', [
      {
        id: image1Id,
        room_id: room1Id,
        url: 'https://picsum.photos/seed/room1/800/600',
        file_name: 'room1_1.jpg',
        mime_type: 'image/jpeg',
        size_bytes: 12345,
        sort_order: 0,
        created_at: now(),
        updated_at: now(),
      },
      {
        id: image2Id,
        room_id: room2Id,
        url: 'https://picsum.photos/seed/room2/800/600',
        file_name: 'room2_1.jpg',
        mime_type: 'image/jpeg',
        size_bytes: 12345,
        sort_order: 0,
        created_at: now(),
        updated_at: now(),
      },
      {
        id: image3Id,
        room_id: room3Id,
        url: 'https://picsum.photos/seed/room3/800/600',
        file_name: 'room3_1.jpg',
        mime_type: 'image/jpeg',
        size_bytes: 12345,
        sort_order: 0,
        created_at: now(),
        updated_at: now(),
      },
    ]);

    await queryInterface.bulkInsert('reviews', [
      {
        id: review1Id,
        user_id: userId,
        room_id: room1Id,
        rating: 5,
        comment: 'Phòng đẹp, yên tĩnh.',
        created_at: now(),
        updated_at: now(),
      },
      {
        id: review2Id,
        user_id: userId,
        room_id: room2Id,
        rating: 4,
        comment: 'Giá ổn, chỗ để xe tiện.',
        created_at: now(),
        updated_at: now(),
      },
    ]);

    await queryInterface.bulkInsert('bookings', [
      {
        id: booking1Id,
        user_id: userId,
        room_id: room1Id,
        start_date: '2026-04-01',
        end_date: '2026-04-30',
        status: 'confirmed',
        note: 'Book thử',
        created_at: now(),
        updated_at: now(),
      },
    ]);

    await queryInterface.bulkInsert('favorites', [
      {
        id: favorite1Id,
        user_id: userId,
        room_id: room2Id,
        created_at: now(),
        updated_at: now(),
      },
    ]);

    await queryInterface.bulkInsert('reports', [
      {
        id: report1Id,
        reporter_id: userId,
        room_id: room3Id,
        reason: 'Nội dung không đúng mô tả',
        status: 'open',
        created_at: now(),
        updated_at: now(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    // Simple cleanup: delete all demo data.
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

