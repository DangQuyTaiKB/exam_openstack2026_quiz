# 📝 Quiz App — Hệ thống thi trắc nghiệm online

## Yêu cầu cài đặt

### 1. Cài Node.js (nếu chưa có)
```bash
# Ubuntu / Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Kiểm tra
node -v   # phải >= 18
npm -v
```

### 2. Upload thư mục lên server
```bash
# Copy toàn bộ thư mục quiz-app lên server
scp -r quiz-app/ user@YOUR_SERVER_IP:/home/user/
```

### 3. Cài dependencies
```bash
cd quiz-app
npm install
```

### 4. Cấu hình trước khi chạy
Sửa file `config.js`:
- `ADMIN_PASSWORD` → đổi mật khẩu admin
- `EXAM_TITLE` → tên bài thi
- `SESSION_NAME` → tên kỳ thi (vd: "Cuối kỳ HK1 2024")
- `NUM_QUESTIONS` → số câu mỗi lần thi
- `EXAM_DURATION_MINUTES` → thời gian (phút)

### 5. Thêm câu hỏi
Sửa file `questions.json` — thêm/bớt câu hỏi theo định dạng:
```json
{
  "id": 11,
  "q": "Nội dung câu hỏi?",
  "opts": ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"],
  "ans": 0
}
```
> `ans` là **chỉ số** đáp án đúng (0 = A, 1 = B, 2 = C, 3 = D)

### 6. Chạy ứng dụng
```bash
node server.js
```

Truy cập:
- **Trang thi:** `http://YOUR_IP:3000`
- **Trang admin:** `http://YOUR_IP:3000/admin.html`

---

## Chạy liên tục với PM2 (khuyên dùng)

```bash
# Cài PM2
npm install -g pm2

# Khởi động
pm2 start server.js --name quiz-app

# Tự khởi động khi reboot server
pm2 startup
pm2 save

# Xem log
pm2 logs quiz-app

# Restart khi sửa config
pm2 restart quiz-app
```

---

## Dùng với Nginx (nếu muốn chạy cổng 80/443)

```nginx
server {
    listen 80;
    server_name YOUR_DOMAIN_OR_IP;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo apt install nginx
sudo nano /etc/nginx/sites-available/quiz
# dán config trên vào, sửa domain/IP
sudo ln -s /etc/nginx/sites-available/quiz /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## Tính năng

| Tính năng | Mô tả |
|---|---|
| Nhập tên thí sinh | Bắt buộc trước khi vào bài |
| Đồng hồ đếm ngược | Tự động nộp khi hết giờ |
| Đáp án ẩn | Không bao giờ gửi đáp án về client |
| Xáo trộn câu hỏi | Lấy ngẫu nhiên từ ngân hàng câu hỏi |
| Kết quả tức thì | Hiển thị ngay sau khi nộp |
| Lưu vào database | SQLite — không cần cài thêm gì |
| Trang admin | Xem danh sách, tìm kiếm, sắp xếp |
| Xuất CSV | Tải về file Excel-compatible, có BOM UTF-8 |

---

## Cấu trúc thư mục

```
quiz-app/
├── server.js          ← Backend chính
├── config.js          ← Cấu hình bài thi (sửa ở đây)
├── questions.json     ← Ngân hàng câu hỏi (sửa ở đây)
├── package.json
├── data/
│   └── quiz.db        ← Database (tự tạo khi chạy lần đầu)
└── public/
    ├── index.html     ← Trang thi của thí sinh
    └── admin.html     ← Trang quản trị
```
