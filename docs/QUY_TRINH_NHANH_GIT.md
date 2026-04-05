# Quy trình Git nhóm — Hệ thống tìm phòng trọ (DACK)

Tài liệu mô tả **hình thức làm việc trên Git** phục vụ báo cáo / kiểm tra. Repository: **HethongtimPhongTro**.

---

## 1. Cấu trúc nhánh (nhánh công ty — “chính”)

| Nhánh | Vai trò | Ghi chú |
|--------|---------|---------|
| **`main`** | **Master — sản phẩm** | Code ổn định, demo, release. GitHub mặc định dùng `main` thay cho tên `master`. |
| **`develop`** | **Môi trường phát triển / tích hợp** | Mọi tính năng hợp nhất tại đây trước khi (định kỳ) merge lên `main`. |

Luồng tích hợp:

```text
feature/...  →  Pull Request →  develop  →  Pull Request →  main (Master)
```

---

## 2. Nhánh cá nhân / nhiệm vụ (feature)

- **Không** làm trực tiếp trên `main` hoặc `develop`.
- Mỗi thành viên (hoặc mỗi nhiệm vụ nhỏ) làm trên nhánh riêng, tách từ **`develop`**.

### Quy tắc đặt tên

```text
feature/<tên-nhiệm-vụ-hoặc-thành-viên>/<mô-tả-ngắn>
```

**Ví dụ:**

- `feature/homework/task1`
- `feature/loki414/sua-api-booking`
- `feature/sevengrass/giao-dien-admin`
- `feature/thiendo/trang-tro-giup`

**Phân biệt:**

- **Nhánh công ty:** `main`, `develop` — dùng chung, đại diện sản phẩm nhóm.
- **Nhánh cá nhân / task:** `feature/...` — gắn tên nhiệm vụ hoặc người phụ trách trong đường dẫn nhánh.

---

## 3. Phân quyền (quy ước nhóm)

| Vai trò | Quyền |
|---------|--------|
| **Nhóm trưởng** (owner repo, ví dụ **Loki414**) | Tạo / duyệt **Pull Request**, **merge** từ nhánh thành viên vào **`develop`**; quyết định merge **`develop` → `main`** khi đủ ổn định. |
| **Thành viên** (Collaborators) | Push nhánh **`feature/...`** của mình; tạo PR vào **`develop`**; **không** tự merge vào `develop` / `main` nếu đã bật bảo vệ nhánh (xem mục 4). |

---

## 4. Cấu hình trên GitHub (để chụp màn hình cho thầy)

Thực hiện trên repo: **Settings → Rules → Rulesets** (hoặc **Branches → Branch protection rules** — tùy giao diện GitHub).

**Gợi ý rule cho `develop` và `main`:**

- Bật **Require a pull request before merging**.
- **Required approvals:** tối thiểu **1** (nhóm trường duyệt).
- (Tuỳ chọn) **Restrict who can push** — chỉ owner / nhóm trường được push trực tiếp.

**Collaborators** (đã mời): có thể hiển thị tại **Settings → Collaborators and teams** (ảnh minh họa nhóm).

---

## 5. Lệnh Git cơ bản (thành viên)

```bash
git checkout develop
git pull origin develop
git checkout -b feature/ten-ban/ten-mo-ta
# ... chỉnh code ...
git add .
git commit -m "feat: mo ta ngan"
git push -u origin feature/ten-ban/ten-mo-ta
```

Sau đó tạo **Pull Request** trên GitHub: base **`develop`**, compare **`feature/...`**.

---

*Tài liệu chỉ mục đích mô tả quy trình nhóm; có thể bổ sung theo yêu cầu giảng viên.*
