# DACK Backend (Node.js + Express + Sequelize + MySQL)

## 1) Cài đặt

Yêu cầu: Node.js, npm. MySQL + Redis chạy bằng Docker (xem `../docker-compose.yml`).

```bash
cd backend
npm install
```

Copy cấu hình:
```bash
# nếu bạn đã có backend/.env thì không cần copy
cp .env.example .env
```

## 2) Tạo database (migration) + dữ liệu mẫu (seed)

```bash
npm run db:migrate
npm run db:seed
```

## 2.1) Large seed dataset (100+ users, 500+ rooms)

Seeder `src/seeders/20260330130010-large-seed.js` sẽ tạo dữ liệu lớn để test pagination/filter/search.

Chạy:
```bash
npx sequelize-cli db:seed:all
```

## 3) Chạy server
```bash
npm run dev
```
Mặc định chạy tại `http://localhost:4000`.

## 4) Tài khoản mẫu (seed)

- Admin: `admin@dack.test` / `admin1234`
- User: `user@dack.test` / `user1234`

## 5) Auth (JWT)

### Register
`POST /api/auth/register`

Request body:
```json
{
  "fullName": "Nguyen Van A",
  "email": "a@test.com",
  "password": "123456",
  "role": "user"
}
```

### Login
`POST /api/auth/login`

Response:
```json
{
  "message": "Logged in",
  "data": {
    "token": "JWT_TOKEN...",
    "user": { "id": "...", "email": "...", "role": "user" }
  }
}
```

Gửi JWT:
`Authorization: Bearer <token>`

## 6) Room search + pagination

`GET /api/rooms`

Query (các query bạn có thể dùng):
- `page` (default 1)
- `pageSize` (default 10)
- `minPrice`, `maxPrice`
- `locationId`, `categoryId`
- `amenityIds` (chuỗi uuid phân tách bởi dấu phẩy, ví dụ `id1,id2`)
- `q` (search theo `title/description/address`)

Ví dụ:
`GET /api/rooms?page=1&pageSize=10&minPrice=4000000&amenityIds=uuid-wifi,uuid-ac&q=quận 2`

## 7) Upload ảnh phòng

Endpoint:
`POST /api/rooms/:roomId/images`

Request:
- `Content-Type: multipart/form-data`
- field `images` (nhiều ảnh, tối đa 10)
- có `Authorization`

Trả về danh sách record trong model `Image`.

## 8) RBAC (role-based)

- `user`:
  - Có thể tạo/cập nhật/xoá phòng do mình tạo (`Room.userId`)
  - Có thể CRUD: `Booking`, `Review`, `Favorite`, `Report` nhưng chỉ trên dữ liệu của chính mình
- `admin`:
  - Quản lý toàn hệ thống, có thể CRUD đầy đủ các bảng còn lại

## 9) Production improvements added

- Winston logging (file: `backend/logs/error.log`, `backend/logs/combined.log`)
- Redis caching cho `GET /api/rooms` (cache invalidated khi tạo/cập nhật/xóa phòng hoặc upload ảnh phòng)
- Booking creation có transaction
- Soft delete (Sequelize `paranoid`) cho các bảng: `rooms`, `bookings`, `reviews`, `favorites`, `reports`, `images`

## 10) Swagger API Docs

Mở: `http://localhost:4000/api-docs`

