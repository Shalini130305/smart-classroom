import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './contexts/ToastContext';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import TimetablePage from './pages/TimetablePage';
import ClassroomsPage from './pages/ClassroomsPage';
import AttendancePage from './pages/AttendancePage';
import NotificationsPage from './pages/NotificationsPage';
import UsersPage from './pages/UsersPage';
import CoursesPage from './pages/CoursesPage';
import AIToolsPage from './pages/AIToolsPage';
import StudentsPage from './pages/StudentsPage';
import FacultyPage from './pages/FacultyPage';
import SchedulesPage from './pages/SchedulesPage';
import DepartmentsPage from './pages/DepartmentsPage';

function DashboardRoute({ children, roles }) {
  return (
    <ProtectedRoute roles={roles}>
      <DashboardLayout>{children}</DashboardLayout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/dashboard" element={<DashboardRoute><DashboardPage /></DashboardRoute>} />
            <Route path="/timetable" element={<DashboardRoute><TimetablePage /></DashboardRoute>} />
            <Route path="/classrooms" element={<DashboardRoute><ClassroomsPage /></DashboardRoute>} />
            <Route path="/attendance" element={<DashboardRoute><AttendancePage /></DashboardRoute>} />
            <Route path="/notifications" element={<DashboardRoute><NotificationsPage /></DashboardRoute>} />
            <Route path="/users" element={<DashboardRoute roles={['admin']}><UsersPage /></DashboardRoute>} />
            <Route path="/courses" element={<DashboardRoute roles={['admin']}><CoursesPage /></DashboardRoute>} />
            <Route path="/students" element={<DashboardRoute roles={['admin']}><StudentsPage /></DashboardRoute>} />
            <Route path="/faculty" element={<DashboardRoute roles={['admin']}><FacultyPage /></DashboardRoute>} />
            <Route path="/schedules" element={<DashboardRoute><SchedulesPage /></DashboardRoute>} />
            <Route path="/departments" element={<DashboardRoute roles={['admin']}><DepartmentsPage /></DashboardRoute>} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}
