# LMS API Documentation

This document describes the API endpoints for the Learning Management System (LMS) Backend.

**Base URL**: `https://back-end-lms-drab.vercel.app/api` (Production)
**Local URL**: `http://localhost:5000/api`

**Response Format**:
All responses follow a standard JSON structure:
```json
{
  "success": true, // or false
  "data": { ... }, // Payload
  "message": "Operation successful" // Optional message
}
```

---

## 1. Authentication (`/auth`)

| Method | Endpoint | Description | Payload |
| :--- | :--- | :--- | :--- |
| `POST` | `/register` | Register new user | `{ "name": "...", "email": "...", "password": "..." }` |
| `POST` | `/login` | Login user | `{ "email": "...", "password": "..." }` |
| `GET` | `/me` | Get current user profile | (Requires Token) |

## 2. Dashboard (`/dashboard`)
*Requires Authentication*

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/my-stats` | Get personal statistics | All |
| `GET` | `/teaching-hours` | Get all teachers' hours stats | Admin |
| `GET` | `/teaching-hours/:teacherId` | Get specific teacher's hours | Admin |
| `GET` | `/offset-statistics` | Get offset class stats | Admin |
| `GET` | `/test-class-statistics` | Get test class stats | Admin |

## 3. Notifications (`/notifications`)
*Requires Authentication*

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Get all notifications |
| `GET` | `/unread-count` | Get count of unread notifications |
| `PATCH` | `/:id/read` | Mark a notification as read |
| `PATCH` | `/read-all` | Mark all as read |
| `DELETE` | `/:id` | Delete a notification |
| `DELETE` | `/clear-read` | Delete all read notifications |

## 4. Teachers (`/teachers`)

| Method | Endpoint | Description | Payload Example |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Get all teachers | |
| `GET` | `/:id` | Get teacher by ID | |
| `GET` | `/:id/details` | Get teacher details (levels, schedules) | |
| `POST` | `/` | Create teacher | `{ "name": "...", "email": "...", "maxOffsetClasses": 5 }` |
| `PUT` | `/:id` | Update teacher | `{ "maxOffsetClasses": 10 }` |
| `POST` | `/:id/levels` | Add teacher qualification | `{ "subjectLevelId": "...", "experienceYears": 5 }` |
| `POST` | `/:id/schedules` | Add fixed schedule | `{ "dayOfWeek": "Monday", "startTime": "08:00", "endTime": "09:30" }` |

## 5. Subjects (`/subjects`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Get all subjects |
| `POST` | `/` | Create subject |
| `POST` | `/:id/levels` | Add subject level (e.g., Grade 10) |

## 6. Schedule (`/schedule`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/shifts` | Get all defined shifts |
| `POST` | `/shifts` | Create a new shift definition |
| `POST` | `/work-shifts` | Register teacher availability |
| `POST` | `/work-shifts/bulk` | Register multiple availability slots |
| `GET` | `/work-shifts/availability` | Check teacher availability (Query: `?teacherId=...&date=...`) |

## 7. Offset Classes (`/offset-classes`)
*Start Time & End Time is required for checking conflicts.*

| Method | Endpoint | Description | Payload Example |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Get all offset classes | |
| `GET` | `?status=pending` | Filter by status | |
| `POST` | `/` | Create manual offset class | `{ "className": "...", "scheduledDate": "2024-12-25", "startTime": "...", "endTime": "..." }` |
| `POST` | `/with-assignment` | Create & Auto-assign Teacher | *(Same payload as create)* |
| `POST` | `/bulk` | Create multiple classes | `{ "offsetClasses": [...] }` |
| `POST` | `/:id/auto-assign` | Run auto-assign for existing class | |
| `POST` | `/:id/reallocate` | Re-assign a different teacher | |
| `PATCH` | `/:id/complete` | Mark as completed | |
| `PATCH` | `/:id/cancel` | Cancel class | `{ "reason": "..." }` |

## 8. Supplementary Classes (`/supplementary-classes`)
*Lớp học bổ trợ*

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Get all supplementary classes | All |
| `GET` | `/:id` | Get details | All |
| `POST` | `/with-assignment` | Create & Auto-assign | Admin |
| `POST` | `/:id/auto-assign` | Auto-assign teacher | Admin |
| `PATCH` | `/:id/complete` | Mark as completed | Admin |
| `PATCH` | `/:id/cancel` | Cancel class | Admin |

## 9. Test Classes (`/test-classes`)
*Lớp kiểm tra*

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Get all test classes | All |
| `POST` | `/with-assignment` | Create & Auto-assign | Admin, ST |
| `POST` | `/:id/auto-assign` | Auto-assign teacher | Admin, ST |
| `PATCH` | `/:id/complete` | Mark as completed | Admin, ST |
| `PATCH` | `/:id/cancel` | Cancel class | Admin, ST |
