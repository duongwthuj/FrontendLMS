# LMS Frontend - React Application

Frontend cho hệ thống quản lý giảng dạy (LMS) được xây dựng với React + Vite.

## 🚀 Tính năng

### 1. **Dashboard với Biểu đồ Thống kê** 📊
- **Biểu đồ số lớp offset theo giáo viên** (Bar Chart)
- **Biểu đồ số giờ dạy theo giáo viên** (Bar Chart)
- **Biểu đồ trạng thái lớp offset** (Doughnut Chart)
- **Bộ lọc theo giáo viên và khoảng thời gian**
- Thống kê tổng quan: Tổng giáo viên, lớp offset, trạng thái

### 2. **Quản lý Giáo viên** 👥
- CRUD giáo viên
- Xem chi tiết giáo viên (trình độ, lịch cố định, số lớp offset)
- Quản lý số lớp offset tối đa
- Trạng thái giáo viên (active, inactive, on_leave)

### 3. **Quản lý Môn học** 📚
- CRUD môn học
- Hiển thị danh sách môn học theo card

### 4. **Quản lý Lịch làm việc** 📅
- Xem danh sách ca làm việc
- Tạo lịch làm việc cho giáo viên
- Đánh dấu có thể nhận lớp offset

### 5. **Quản lý Lớp Offset** ⚡ (Tính năng chính)
- **Tự động phân bổ giáo viên thông minh** khi tạo lớp
- Tái phân bổ giáo viên khác
- Đánh dấu hoàn thành / Hủy lớp
- Lọc theo trạng thái (pending, assigned, completed, cancelled)
- Hiển thị thông tin giáo viên được phân công

## 🛠️ Tech Stack

- **React 18** - UI Framework
- **Vite** - Build tool (nhanh hơn Create React App)
- **React Router 6** - Routing
- **Axios** - HTTP client
- **Chart.js + React-Chartjs-2** - Biểu đồ thống kê
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **date-fns** - Date formatting

## 📦 Cài đặt

```bash
cd Web

# Cài dependencies
npm install

# Chạy development server
npm run dev

# Build production
npm run build
```

## 🌐 Configuration

Server sẽ chạy trên: **http://localhost:3000**

API Proxy đã được cấu hình trong `vite.config.js`:
```javascript
proxy: {
  '/api': {
    target: 'http://localhost:5000',
    changeOrigin: true
  }
}
```

## 📂 Cấu trúc Project

```
Web/
├── src/
│   ├── components/          # Shared components
│   │   ├── Layout.jsx
│   │   ├── Sidebar.jsx
│   │   └── Navbar.jsx
│   ├── pages/              # Page components
│   │   ├── Dashboard.jsx   # ⭐ Dashboard với biểu đồ
│   │   ├── Teachers.jsx
│   │   ├── TeacherDetails.jsx
│   │   ├── Subjects.jsx
│   │   ├── Schedule.jsx
│   │   └── OffsetClasses.jsx  # ⭐ Tính năng chính
│   ├── services/           # API services
│   │   └── api.js          # Axios instance & API calls
│   ├── App.jsx             # Main app với routing
│   ├── main.jsx            # Entry point
│   └── index.css           # Global styles
├── index.html
├── vite.config.js
├── tailwind.config.js
└── package.json
```

## 🎨 UI Components

### Dashboard
- **Stats Cards**: Hiển thị tổng quan hệ thống
- **Filter Bar**: Lọc theo giáo viên và khoảng thời gian
- **Bar Charts**: Số lớp offset và số giờ dạy
- **Doughnut Chart**: Phân bố trạng thái lớp

### Tables
- Responsive design
- Actions: View, Edit, Delete
- Status badges với màu sắc phù hợp

### Modals
- Form tạo/sửa với validation
- Responsive và accessible
- Loading states

## 🔥 Tính năng nổi bật

### 1. Dashboard Thống kê
```jsx
// Dashboard.jsx
- Biểu đồ số lớp offset theo giáo viên
- Biểu đồ số giờ dạy
- Bộ lọc linh hoạt
- Tự động tính toán từ API
```

### 2. Auto-Assignment cho Lớp Offset
```jsx
// OffsetClasses.jsx
<button onClick={handleAutoAssign}>
  <Zap /> Tự động phân công
</button>

// Khi tạo lớp mới
await offsetClassesAPI.createWithAssignment(data)
// → Backend tự động tìm giáo viên phù hợp
// → Gửi email thông báo
```

### 3. Realtime Status Updates
```jsx
// Các trạng thái
- Pending: Chưa phân công
- Assigned: Đã phân công giáo viên
- Completed: Hoàn thành
- Cancelled: Đã hủy
```

## 📊 API Integration

### Dashboard API
```javascript
dashboardAPI.getTeacherStats(teacherId, startDate, endDate)
dashboardAPI.getAllTeachersStats(startDate, endDate)
```

### Teachers API
```javascript
teachersAPI.getAll()
teachersAPI.getDetails(id)
teachersAPI.create(data)
teachersAPI.update(id, data)
```

### Offset Classes API
```javascript
offsetClassesAPI.createWithAssignment(data)  // ⭐ Auto-assign
offsetClassesAPI.autoAssign(id)               // ⭐ Manual trigger
offsetClassesAPI.reallocate(id)               // ⭐ Reassign
offsetClassesAPI.markCompleted(id)
offsetClassesAPI.cancel(id, reason)
```

## 🎯 Workflow Sử dụng

### 1. Xem Dashboard
1. Mở trang chủ (/)
2. Chọn giáo viên từ dropdown (hoặc "Tất cả")
3. Chọn khoảng thời gian
4. Xem biểu đồ thống kê

### 2. Tạo Lớp Offset với Auto-Assignment
1. Vào trang "Lớp Offset"
2. Click "Tạo lớp offset"
3. Điền thông tin:
   - Tên lớp
   - Môn học (SubjectLevel)
   - Ngày và giờ
   - Lý do
4. Click "Tạo & Tự động phân công"
5. Hệ thống tự động:
   - Tìm giáo viên phù hợp
   - Phân công giáo viên
   - Gửi email thông báo

### 3. Quản lý Giáo viên
1. Vào trang "Giáo viên"
2. Thêm giáo viên mới với số lớp offset tối đa
3. Click vào giáo viên để xem chi tiết
4. Xem trình độ và lịch cố định

## 🎨 Styling với Tailwind CSS

```javascript
// Primary color scheme
primary-50 → primary-900

// Responsive classes
sm: md: lg: xl: 2xl:

// Utility classes
flex, grid, rounded-lg, shadow-sm, hover:...
```

## 🔧 Troubleshooting

### Port 3000 đã được sử dụng
```bash
# Thay đổi port trong vite.config.js
server: {
  port: 3001
}
```

### API không kết nối
- Kiểm tra Backend đang chạy trên port 5000
- Kiểm tra proxy trong vite.config.js
- Mở DevTools → Network để debug

### Chart không hiển thị
```bash
# Reinstall chart.js
npm install chart.js react-chartjs-2
```

## 📝 Notes

- **Development**: Code có hot-reload tự động
- **Production**: Chạy `npm run build` để build static files
- **Icons**: Sử dụng lucide-react (tree-shakeable, nhẹ hơn Font Awesome)
- **Date handling**: Sử dụng date-fns (nhẹ hơn moment.js)

## 🚀 Next Steps

1. ✅ Dashboard với biểu đồ thống kê
2. ✅ Auto-assignment lớp offset
3. ⬜ Authentication & Authorization
4. ⬜ Notification system (WebSocket)
5. ⬜ Export reports (PDF, Excel)
6. ⬜ Dark mode
7. ⬜ Mobile responsive optimization

## 📞 Support

Nếu có vấn đề, kiểm tra:
1. Backend đang chạy
2. MongoDB đang chạy
3. npm install đã chạy đầy đủ
4. Browser console có lỗi không

## 📄 License
MIT
