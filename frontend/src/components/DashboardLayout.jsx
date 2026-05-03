import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard, CalendarDays, DoorOpen, ClipboardCheck, Bell, Bot,
  Users, BookOpen, Settings, LogOut, Menu, X, GraduationCap, ChevronRight
} from 'lucide-react';

const navItems = {
  admin: [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/timetable', label: 'Timetable', icon: CalendarDays },
    { path: '/classrooms', label: 'Classrooms', icon: DoorOpen },
    { path: '/attendance', label: 'Attendance', icon: ClipboardCheck },
    { path: '/users', label: 'Users', icon: Users },
    { path: '/courses', label: 'Courses', icon: BookOpen },
    { path: '/notifications', label: 'Notifications', icon: Bell },
    { path: '/ai-tools', label: 'AI Tools', icon: Bot },
  ],
  faculty: [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/timetable', label: 'My Schedule', icon: CalendarDays },
    { path: '/attendance', label: 'Attendance', icon: ClipboardCheck },
    { path: '/classrooms', label: 'Classrooms', icon: DoorOpen },
    { path: '/notifications', label: 'Notifications', icon: Bell },
    { path: '/ai-tools', label: 'AI Assistant', icon: Bot },
  ],
  student: [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/timetable', label: 'My Timetable', icon: CalendarDays },
    { path: '/attendance', label: 'Attendance', icon: ClipboardCheck },
    { path: '/classrooms', label: 'Classrooms', icon: DoorOpen },
    { path: '/notifications', label: 'Notifications', icon: Bell },
    { path: '/ai-tools', label: 'AI Assistant', icon: Bot },
  ],
};

export default function DashboardLayout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const items = navItems[user?.role] || navItems.student;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-dark-950">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-dark-900/95 backdrop-blur-xl border-r border-dark-700/50 transform transition-transform duration-300 flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Logo */}
        <div className="p-6 border-b border-dark-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold gradient-text">SmartClass</h1>
              <p className="text-xs text-dark-400">AI Scheduler</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {items.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
                className={active ? 'sidebar-link-active' : 'sidebar-link'}>
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
                {active && <ChevronRight className="w-4 h-4 ml-auto" />}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-dark-700/50">
          <div className="glass-card p-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold text-sm">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-dark-100 truncate">{user?.first_name} {user?.last_name}</p>
                <p className="text-xs text-dark-400 capitalize">{user?.role}</p>
              </div>
            </div>
          </div>
          <button onClick={handleLogout} className="sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/10">
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top bar */}
        <header className="h-16 bg-dark-900/80 backdrop-blur-xl border-b border-dark-700/50 flex items-center justify-between px-6 sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-dark-400 hover:text-dark-100">
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-primary-300 font-medium">System Online</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/notifications" className="relative p-2 text-dark-400 hover:text-dark-100 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white font-bold">3</span>
            </Link>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto animate-fade-in">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
