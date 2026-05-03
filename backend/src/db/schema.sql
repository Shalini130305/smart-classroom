-- ============================================
-- AI Smart Classroom & Timetable Scheduler
-- SQLite Database Schema (Fully Normalized)
-- ============================================

-- ============================================
-- 1. USERS & AUTHENTICATION
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'faculty', 'student')),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 2. DEPARTMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS departments (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT UNIQUE NOT NULL,
  code TEXT UNIQUE NOT NULL,
  head_faculty_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 3. COURSES / SUBJECTS
-- ============================================
CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  department_id TEXT REFERENCES departments(id) ON DELETE CASCADE,
  credits INTEGER NOT NULL DEFAULT 3,
  semester INTEGER NOT NULL CHECK (semester BETWEEN 1 AND 8),
  course_type TEXT DEFAULT 'theory' CHECK (course_type IN ('theory', 'lab', 'elective')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 4. CLASSROOMS
-- ============================================
CREATE TABLE IF NOT EXISTS classrooms (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  building TEXT,
  floor INTEGER,
  capacity INTEGER NOT NULL,
  room_type TEXT DEFAULT 'lecture' CHECK (room_type IN ('lecture', 'lab', 'seminar', 'auditorium')),
  has_projector INTEGER DEFAULT 0,
  has_ac INTEGER DEFAULT 0,
  has_smartboard INTEGER DEFAULT 0,
  has_computers INTEGER DEFAULT 0,
  is_available INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 5. FACULTY PROFILES
-- ============================================
CREATE TABLE IF NOT EXISTS faculty_profiles (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  department_id TEXT REFERENCES departments(id) ON DELETE SET NULL,
  designation TEXT,
  specialization TEXT,
  max_hours_per_week INTEGER DEFAULT 20,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 6. STUDENT PROFILES
-- ============================================
CREATE TABLE IF NOT EXISTS student_profiles (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  department_id TEXT REFERENCES departments(id) ON DELETE SET NULL,
  enrollment_number TEXT UNIQUE NOT NULL,
  semester INTEGER NOT NULL CHECK (semester BETWEEN 1 AND 8),
  section TEXT,
  batch_year INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 7. FACULTY-COURSE MAPPING
-- ============================================
CREATE TABLE IF NOT EXISTS faculty_courses (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  faculty_id TEXT NOT NULL REFERENCES faculty_profiles(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  academic_year TEXT NOT NULL,
  UNIQUE(faculty_id, course_id, academic_year)
);

-- ============================================
-- 8. STUDENT-COURSE ENROLLMENT
-- ============================================
CREATE TABLE IF NOT EXISTS student_courses (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  student_id TEXT NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  academic_year TEXT NOT NULL,
  UNIQUE(student_id, course_id, academic_year)
);

-- ============================================
-- 9. TIME SLOTS
-- ============================================
CREATE TABLE IF NOT EXISTS time_slots (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 6),
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  slot_number INTEGER NOT NULL,
  UNIQUE(day_of_week, start_time, end_time)
);

-- ============================================
-- 10. TIMETABLE ENTRIES
-- ============================================
CREATE TABLE IF NOT EXISTS timetable_entries (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  faculty_id TEXT NOT NULL REFERENCES faculty_profiles(id) ON DELETE CASCADE,
  classroom_id TEXT NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
  time_slot_id TEXT NOT NULL REFERENCES time_slots(id) ON DELETE CASCADE,
  section TEXT,
  semester INTEGER NOT NULL,
  academic_year TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(classroom_id, time_slot_id, academic_year),
  UNIQUE(faculty_id, time_slot_id, academic_year)
);

-- ============================================
-- 11. ATTENDANCE
-- ============================================
CREATE TABLE IF NOT EXISTS attendance (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  student_id TEXT NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  timetable_entry_id TEXT NOT NULL REFERENCES timetable_entries(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
  marked_by TEXT REFERENCES users(id),
  remarks TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, timetable_entry_id, date)
);

-- ============================================
-- 12. NOTIFICATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error', 'schedule_change', 'attendance')),
  is_read INTEGER DEFAULT 0,
  link TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 13. AI SCHEDULE LOGS (for audit trail)
-- ============================================
CREATE TABLE IF NOT EXISTS ai_schedule_logs (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  action TEXT NOT NULL,
  details TEXT,
  conflicts_found INTEGER DEFAULT 0,
  resolved INTEGER DEFAULT 0,
  generated_by TEXT REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 14. CHATBOT CONVERSATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS chatbot_conversations (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  response TEXT NOT NULL,
  intent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_timetable_semester ON timetable_entries(semester, academic_year);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_courses_dept ON courses(department_id);
CREATE INDEX IF NOT EXISTS idx_student_dept ON student_profiles(department_id);

-- ============================================
-- INSERT DEFAULT TIME SLOTS
-- ============================================
INSERT OR IGNORE INTO time_slots (id, day_of_week, start_time, end_time, slot_number) VALUES
  (lower(hex(randomblob(16))), 1, '09:00', '10:00', 1), (lower(hex(randomblob(16))), 1, '10:00', '11:00', 2), (lower(hex(randomblob(16))), 1, '11:15', '12:15', 3),
  (lower(hex(randomblob(16))), 1, '12:15', '13:15', 4), (lower(hex(randomblob(16))), 1, '14:00', '15:00', 5), (lower(hex(randomblob(16))), 1, '15:00', '16:00', 6),
  (lower(hex(randomblob(16))), 2, '09:00', '10:00', 1), (lower(hex(randomblob(16))), 2, '10:00', '11:00', 2), (lower(hex(randomblob(16))), 2, '11:15', '12:15', 3),
  (lower(hex(randomblob(16))), 2, '12:15', '13:15', 4), (lower(hex(randomblob(16))), 2, '14:00', '15:00', 5), (lower(hex(randomblob(16))), 2, '15:00', '16:00', 6),
  (lower(hex(randomblob(16))), 3, '09:00', '10:00', 1), (lower(hex(randomblob(16))), 3, '10:00', '11:00', 2), (lower(hex(randomblob(16))), 3, '11:15', '12:15', 3),
  (lower(hex(randomblob(16))), 3, '12:15', '13:15', 4), (lower(hex(randomblob(16))), 3, '14:00', '15:00', 5), (lower(hex(randomblob(16))), 3, '15:00', '16:00', 6),
  (lower(hex(randomblob(16))), 4, '09:00', '10:00', 1), (lower(hex(randomblob(16))), 4, '10:00', '11:00', 2), (lower(hex(randomblob(16))), 4, '11:15', '12:15', 3),
  (lower(hex(randomblob(16))), 4, '12:15', '13:15', 4), (lower(hex(randomblob(16))), 4, '14:00', '15:00', 5), (lower(hex(randomblob(16))), 4, '15:00', '16:00', 6),
  (lower(hex(randomblob(16))), 5, '09:00', '10:00', 1), (lower(hex(randomblob(16))), 5, '10:00', '11:00', 2), (lower(hex(randomblob(16))), 5, '11:15', '12:15', 3),
  (lower(hex(randomblob(16))), 5, '12:15', '13:15', 4), (lower(hex(randomblob(16))), 5, '14:00', '15:00', 5), (lower(hex(randomblob(16))), 5, '15:00', '16:00', 6),
  (lower(hex(randomblob(16))), 6, '09:00', '10:00', 1), (lower(hex(randomblob(16))), 6, '10:00', '11:00', 2), (lower(hex(randomblob(16))), 6, '11:15', '12:15', 3),
  (lower(hex(randomblob(16))), 6, '12:15', '13:15', 4);
