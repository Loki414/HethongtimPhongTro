# Triển khai DACK lên Microsoft Azure (Docker)

## Thành phần

| Image | Mục đích |
|--------|----------|
| `backend/Dockerfile` | API Express, cổng `PORT` (mặc định 4000) |
| `frontend/Dockerfile` | Build Vite + **nginx** phục vụ SPA, cổng 80 |

Backend lắng nghe `0.0.0.0` (container / Azure). Biến môi trường xem `backend/src/config/database.js`, `frontend/src/api/client.js` (`VITE_API_BASE_URL`).

## Build cục bộ

```bash
# Backend (MySQL/Redis chạy sẵn, ví dụ docker compose hiện có)
cd backend
docker build -t dack-backend:local .

# Frontend — thay URL API thật khi build
cd ../frontend
docker build -t dack-frontend:local --build-arg VITE_API_BASE_URL=https://<ten-api>.azurecontainerapps.io/api .
```

### Full stack trên máy (MySQL + Redis + API + nginx)

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build
```

Sau khi MySQL sẵn sàng, chạy migration (một lần):

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml run --rm backend npx sequelize-cli db:migrate
```

Mở frontend: `http://localhost:8080`, API: `http://localhost:4000`.

Chạy lẻ từng image:

```bash
docker run --rm -p 4000:4000 --env-file .env.production dack-backend:local
docker run --rm -p 8080:80 dack-frontend:local
```

## Azure (gợi ý: Container Apps + Azure Database)

1. **Azure Container Registry (ACR)** — push image `dack-backend`, `dack-frontend`.
2. **Azure Database for MySQL (Flexible Server)** — tạo DB, firewall cho phép subnet Container Apps (hoặc IP egress).
3. **Azure Cache for Redis** (tuỳ chọn) — hoặc bỏ Redis nếu app chịu fallback local (kiểm tra `redisClient`).
4. **Container Apps** — hai app (hoặc một app + ingress path-based nếu bạn tự cấu hình reverse proxy):
   - **API:** image backend, env: `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME`, `JWT_SECRET`, `NODE_ENV=production`, `CORS_ORIGIN=https://<url-frontend>`, `REDIS_HOST`, `REDIS_PORT`.
   - **Web:** image frontend (đã build với `VITE_API_BASE_URL` trỏ URL API public HTTPS).

5. **Migration DB** (một lần / mỗi release): chạy từ máy có kết nối tới MySQL Azure hoặc job CI:

```bash
cd backend
set DB_HOST=... (hoặc export)
npx sequelize-cli db:migrate
```

(Cần `sequelize-cli` — cài tạm `npm i` đầy đủ hoặc dùng `npx sequelize-cli` trong thư mục backend.)

6. **Upload ảnh:** thư mục `uploads` trong container là tạm — trên production nên gắn **Azure Files** volume hoặc chuyển sang Blob Storage (cần chỉnh code sau).

## Biến quan trọng

| Biến | Ghi chú |
|------|---------|
| `PORT` | Azure thường set sẵn; image `EXPOSE 4000` là mặc định local |
| `CORS_ORIGIN` | URL frontend (có `https://`), có thể nhiều URL cách nhau dấu phẩy |
| `VITE_API_BASE_URL` | Chỉ có hiệu lúc **build** image frontend |

## Static Web Apps (thay nginx container)

Nếu dùng **Azure Static Web Apps** cho frontend: build Vite trên GitHub Actions với `VITE_API_BASE_URL`, deploy `dist/`; backend vẫn Container App / App Service riêng.
