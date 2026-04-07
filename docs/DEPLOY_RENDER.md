# Deploy DACK trên Render (Docker)

Tai lieu nay di theo cach thuc te: backend + frontend deu dong goi bang Docker, DB MySQL dung dich vu ngoai Render.

## 1) Nhung gi da duoc chuan bi san trong repo

- `backend/Dockerfile`: API Node/Express chay production.
- `frontend/Dockerfile`: build Vite + phuc vu bang nginx.
- `render.yaml`: blueprint tao 2 service `dack-backend` va `dack-frontend`.

Ban khong can tu tao service bang tay neu dung Blueprint.

## 2) Nhung phan ban can tu thao tac (can tai khoan cloud)

1. Tao MySQL production (Aiven, PlanetScale, Railway, ...).
2. Day code moi nhat len GitHub.
3. Tren Render, tao Blueprint tu repo (doc muc 3).
4. Dien day du bien moi truong cho backend.
5. Chay migration DB 1 lan.
6. Cap nhat `VITE_API_BASE_URL` theo URL backend that.

## 3) Tao service tren Render bang Blueprint

1. Vao Render Dashboard -> **New +** -> **Blueprint**.
2. Chon repo GitHub cua du an.
3. Render tu dong doc file `render.yaml`.
4. Bam **Apply** de tao 2 service:
   - `dack-backend` (Docker, root `backend`)
   - `dack-frontend` (Docker, root `frontend`)

## 4) Bien moi truong bat buoc cho backend

Trong service `dack-backend`, vao tab Environment va dien:

- `NODE_ENV=production`
- `PORT=4000`
- `DB_HOST=<mysql-host>`
- `DB_PORT=3306`
- `DB_NAME=<db-name>`
- `DB_USER=<db-user>`
- `DB_PASS=<db-password>`
- `JWT_SECRET=<chuoi-bi-mat-dai>`
- `CORS_ORIGIN=https://<frontend-domain>.onrender.com`

Neu dung Redis:

- `REDIS_HOST=<redis-host>`
- `REDIS_PORT=<redis-port>`

## 5) Bien moi truong cho frontend

Trong service `dack-frontend`, dam bao:

- `VITE_API_BASE_URL=https://<backend-domain>.onrender.com/api`

Luu y: Vite nhung bien nay luc build image. Moi lan doi URL API, can trigger deploy lai frontend.

## 6) Chay migration database (bat buoc)

Sau khi backend da set env DB dung:

1. Vao service `dack-backend` -> **Shell**.
2. Chay lenh:

```bash
npx sequelize-cli db:migrate
```

Neu loi ket noi DB:

- Kiem tra firewall/IP allowlist ben nha cung cap MySQL.
- Kiem tra lai `DB_HOST/DB_USER/DB_PASS/DB_NAME/DB_PORT`.

## 7) Kiem tra sau deploy

1. Mo `https://<backend-domain>.onrender.com/health` -> phai tra `{ "ok": true }`.
2. Mo frontend domain va test:
   - Dang ky
   - Dang nhap
   - Quen/Reset mat khau
3. Neu trinh duyet bao CORS, cap nhat lai `CORS_ORIGIN` backend.

## 8) Loi thuong gap

- Frontend goi `localhost`: thieu/sai `VITE_API_BASE_URL`.
- 500 khi goi API: chua migrate DB.
- Auth loi token: thieu `JWT_SECRET`.
- Upload anh khong ben vung: filesystem container tren Render la tam thoi (nen dung object storage).
