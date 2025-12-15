# Hướng Dẫn Deploy Frontend Lên Vercel

Tài liệu này hướng dẫn chi tiết các bước đưa dự án React/Vite (Frontend) lên Vercel và kết nối với Backend.

## 1. Chuẩn Bị
- **Tài khoản GitHub**: Đã đăng nhập.
- **Tài khoản Vercel**: Đăng ký bằng GitHub để liên kết dễ dàng.
- **Source Code**: Đã được cấu hình `vercel.json` và `.env.production` (Đã hoàn tất ở các bước trước).

## 2. Đẩy Code Lên GitHub
Trước khi deploy, code phải nằm trên GitHub.

Nếu bạn gặp lỗi khi `git add`, hãy chạy lần lượt các lệnh sau trong Terminal (CMD/PowerShell) tại thư mục dự án:

```powershell
# 1. Xóa cache (nếu trước đó lỡ add file rác)
git rm -r --cached .

# 2. Add lại tất cả file (đã loại bỏ node_modules nhờ .gitignore)
git add .

# 3. Commit code
git commit -m "Ready for Vercel deployment"

# 4. Push lên nhánh main (thay link-repo-cua-ban bằng link thật nếu chưa có remote)
# Nếu đã add remote 'origin' rồi thì chỉ cần:
git push -u origin main
```

## 3. Deploy Trên Vercel
1.  Truy cập [Vercel Dashboard](https://vercel.com/dashboard).
2.  Bấm nút **"Add New..."** -> chọn **"Project"**.
3.  Ở mục **Import Git Repository**, tìm repo bạn vừa push và bấm **Import**.
4.  Tại màn hình **Configure Project**:
    - **Framework Preset**: Vercel thường tự nhận diện là **Vite**. Nếu không, hãy chọn `Vite`.
    - **Root Directory**: Để trống (vì code ở ngay thư mục gốc).
    - **Build and Output Settings**: Giữ nguyên mặc định (`npm run build`).
    - **Environment Variables** (Quan trọng):
        - Bấm mở rộng phần này.
        - Thêm biến môi trường để kết nối Backend:
            - **Key**: `VITE_API_URL`
            - **Value**: `https://back-end-lms-drab.vercel.app/api` (hoặc link backend thực tế của bạn).
        - Bấm **Add**.

5.  Bấm nút **Deploy**.
    - Chờ khoảng 1-2 phút để Vercel cài đặt và build.
    - Khi thấy màn hình pháo giấy chúc mừng là thành công!

## 4. Kiểm Tra Sau Deploy
- Bấm vào Domain mà Vercel cấp (dạng `project-name.vercel.app`).
- Thử các tính năng gọi API (Đăng nhập, xem danh sách...).
- **Nếu API lỗi (Network Error)**:
    - Kiểm tra tab **Network** (F12) xem có đỏ lòm không.
    - Nếu lỗi liên quan đến **CORS**, bạn cần quay lại **Project Backend**, cấu hình lại CORS để cho phép domain Frontend này truy cập.

## 5. Cấu Hình CORS (Tại Backend)
Đây là lỗi phổ biến nhất. Tại code **Backend** (Node.js/Express), bạn cần đảm bảo đã cho phép domain frontend:

```javascript
const cors = require('cors');
app.use(cors({
  origin: ['https://ten-du-an-frontend.vercel.app', 'http://localhost:5173'],
  credentials: true
}));
```
*Lưu ý: Thay `ten-du-an-frontend.vercel.app` bằng domain thật Vercel vừa cấp cho bạn.*
