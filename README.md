# 🎓 AI Smart Classroom & Timetable Scheduler

A production-ready, full-stack web application for intelligent classroom management and automated timetable scheduling powered by AI.

![Tech Stack](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat&logo=tailwindcss&logoColor=white)

---

## ✨ Features

### 📊 Dashboards
- **Student Dashboard** — View timetable, attendance summary, notifications
- **Faculty Dashboard** — Manage classes, mark attendance, view schedule
- **Admin Dashboard** — Full system overview with stats, user management, AI tools

### 🤖 AI Features
- **Auto Timetable Generation** — Greedy + constraint satisfaction algorithm
- **Conflict Detection** — Detects faculty and room double-bookings
- **Smart Classroom Recommendations** — AI-scored room suggestions based on requirements
- **AI Chatbot** — Natural language queries about schedules, rooms, and attendance

### 🏫 Core Modules
- **Classroom Management** — CRUD with filtering by type, capacity, and features
- **Attendance Management** — Mark, track, and analyze student attendance
- **Notifications** — Real-time alerts with broadcast capability
- **Timetable Scheduler** — Visual weekly timetable with day-grouped view

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Node.js + Express.js |
| Database | PostgreSQL (Supabase) |
| Auth | JWT (JSON Web Tokens) |
| Deployment | Vercel (FE) + Render (BE) + Supabase (DB) |

---

## 📁 Project Structure

```
Student Classroom/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                 # PostgreSQL connection pool
│   │   ├── controllers/
│   │   │   ├── authController.js     # Login, register, profile
│   │   │   ├── adminController.js    # Stats, users, courses, departments
│   │   │   ├── aiController.js       # Timetable gen, conflicts, chatbot
│   │   │   ├── attendanceController.js
│   │   │   ├── classroomController.js
│   │   │   ├── notificationController.js
│   │   │   └── timetableController.js
│   │   ├── db/
│   │   │   ├── schema.sql            # Full normalized schema (14 tables)
│   │   │   ├── init.js               # DB initialization script
│   │   │   └── seed.js               # Sample data seeder
│   │   ├── middleware/
│   │   │   └── auth.js               # JWT auth + role authorization
│   │   ├── routes/
│   │   │   ├── admin.js
│   │   │   ├── ai.js
│   │   │   ├── attendance.js
│   │   │   ├── auth.js
│   │   │   ├── classrooms.js
│   │   │   ├── notifications.js
│   │   │   └── timetable.js
│   │   └── server.js                 # Express entry point
│   ├── .env.example
│   ├── render.yaml
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── DashboardLayout.jsx   # Sidebar + topbar layout
│   │   │   └── ProtectedRoute.jsx    # Auth + role guard
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx       # Auth state management
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── TimetablePage.jsx
│   │   │   ├── ClassroomsPage.jsx
│   │   │   ├── AttendancePage.jsx
│   │   │   ├── NotificationsPage.jsx
│   │   │   ├── UsersPage.jsx
│   │   │   ├── CoursesPage.jsx
│   │   │   └── AIToolsPage.jsx
│   │   ├── services/
│   │   │   └── api.js                # Axios instance + all API calls
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css                 # Tailwind + custom components
│   ├── vercel.json
│   ├── .env.example
│   └── package.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL (or Supabase account)

### 1. Database Setup (Supabase)
1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `backend/src/db/schema.sql`
3. Copy your connection string from **Settings → Database**

### 2. Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env with your Supabase DATABASE_URL and a JWT_SECRET
npm install
npm run db:seed    # Seed sample data
npm run dev        # Start on port 5000
```

### 3. Frontend Setup
```bash
cd frontend
cp .env.example .env
# Edit .env: VITE_API_URL=http://localhost:5000/api
npm install
npm run dev        # Start on port 5173
```

### 4. Demo Login Credentials
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@smartclass.edu | admin123 |
| Faculty | dr.kumar@smartclass.edu | faculty123 |
| Student | aarav.patel@smartclass.edu | student123 |

---

## 🌐 Deployment

### Frontend → Vercel
1. Push `frontend/` to GitHub
2. Import in [vercel.com](https://vercel.com)
3. Set environment variable: `VITE_API_URL=https://your-backend.onrender.com/api`
4. Deploy

### Backend → Render
1. Push `backend/` to GitHub
2. Create **Web Service** on [render.com](https://render.com)
3. Set environment variables:
   - `DATABASE_URL` — Supabase connection string
   - `JWT_SECRET` — A strong secret key
   - `FRONTEND_URL` — Your Vercel URL
   - `NODE_ENV` — `production`
4. Build: `npm install` | Start: `node src/server.js`

### Database → Supabase
1. Create project at [supabase.com](https://supabase.com)
2. Run `schema.sql` in SQL Editor
3. Use connection string in backend `.env`

---

## 📡 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | ❌ | Register user |
| POST | `/api/auth/login` | ❌ | Login |
| GET | `/api/auth/profile` | ✅ | Get profile |
| GET | `/api/classrooms` | ✅ | List classrooms |
| POST | `/api/classrooms` | Admin | Create classroom |
| GET | `/api/timetable` | ✅ | Get timetable |
| POST | `/api/timetable` | Admin | Create entry |
| POST | `/api/attendance` | Faculty/Admin | Mark attendance |
| GET | `/api/attendance/summary` | ✅ | Student summary |
| GET | `/api/notifications` | ✅ | Get notifications |
| POST | `/api/notifications/broadcast` | Admin | Broadcast |
| GET | `/api/admin/stats` | Admin | Dashboard stats |
| POST | `/api/ai/generate-timetable` | Admin | AI generate |
| GET | `/api/ai/detect-conflicts` | ✅ | Find conflicts |
| GET | `/api/ai/recommend-classroom` | ✅ | Room suggestions |
| POST | `/api/ai/chatbot` | ✅ | AI chatbot |

---

## 🗃️ Database Schema

14 fully normalized tables:
`users`, `departments`, `courses`, `classrooms`, `faculty_profiles`, `student_profiles`, `faculty_courses`, `student_courses`, `time_slots`, `timetable_entries`, `attendance`, `notifications`, `ai_schedule_logs`, `chatbot_conversations`

---

## 📄 License

This project is for educational purposes (DBMS Final Year Project).
