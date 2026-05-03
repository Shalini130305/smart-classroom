import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { adminAPI } from '../services/api';
import { motion } from 'framer-motion';
import {
  Users, BookOpen, DoorOpen, CalendarDays, BarChart3, GraduationCap,
  Bell, MessageSquare, Bot, LineChart, FileText, FileBadge, CalendarCheck,
  Settings, Clock, Activity, ChevronRight, CheckCircle2
} from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      if (user.role === 'admin') {
        const res = await adminAPI.getStats();
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally { setLoading(false); }
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
    </div>
  );

  const adminCards = stats ? [
    {
      title: 'Students',
      icon: Users,
      color: 'from-blue-500 to-cyan-400',
      stats: [
        { label: 'Total Students', value: stats.students?.total || 1250 },
        { label: 'Active Today', value: stats.students?.activeToday || 1178 }
      ],
      action: 'View All',
      href: '/students'
    },
    {
      title: 'Faculty',
      icon: GraduationCap,
      color: 'from-purple-500 to-fuchsia-400',
      stats: [
        { label: 'Total Faculty', value: stats.faculty?.total || 120 },
        { label: 'Present Today', value: stats.faculty?.presentToday || 102 }
      ],
      action: 'Manage',
      href: '/faculty'
    },
    {
      title: 'Courses',
      icon: BookOpen,
      color: 'from-amber-500 to-orange-400',
      stats: [
        { label: 'Total Courses', value: stats.courses?.total || 45 }
      ],
      action: 'View Syllabus',
      href: '/courses'
    },
    {
      title: 'Classrooms',
      icon: DoorOpen,
      color: 'from-emerald-500 to-teal-400',
      stats: [
        { label: 'Available Rooms', value: stats.classrooms?.available || 32 },
        { label: 'Occupied Rooms', value: stats.classrooms?.occupied || 18 }
      ],
      action: 'Allocate',
      href: '/classrooms'
    },
    {
      title: 'Departments',
      icon: BarChart3,
      color: 'from-pink-500 to-rose-400',
      stats: [
        { label: 'Total Departments', value: stats.departments?.total || 12 }
      ],
      action: 'Details',
      href: '/departments'
    },
    {
      title: 'Schedules',
      icon: CalendarDays,
      color: 'from-indigo-500 to-blue-500',
      stats: [
        { label: "Today's Classes", value: stats.schedules?.todaysClasses || 84 }
      ],
      action: 'Timetable',
      href: '/schedules'
    }
  ] : [];

  const extraCards = [
    { title: 'Attendance', icon: Activity, color: 'text-emerald-400', bg: 'bg-emerald-500/10', val: '94%' },
    { title: 'Notifications', icon: Bell, color: 'text-amber-400', bg: 'bg-amber-500/10', val: '12 New' },
    { title: 'Feedback', icon: MessageSquare, color: 'text-purple-400', bg: 'bg-purple-500/10', val: '45' },
    { title: 'AI Assistant', icon: Bot, color: 'text-primary-400', bg: 'bg-primary-500/10', val: 'Ready' },
    { title: 'Analytics', icon: LineChart, color: 'text-cyan-400', bg: 'bg-cyan-500/10', val: 'View' },
    { title: 'Reports', icon: FileText, color: 'text-pink-400', bg: 'bg-pink-500/10', val: 'Generate' },
    { title: 'Exams', icon: FileBadge, color: 'text-rose-400', bg: 'bg-rose-500/10', val: '3 Upcoming' },
    { title: 'Events', icon: CalendarCheck, color: 'text-orange-400', bg: 'bg-orange-500/10', val: '2 This Week' }
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-dark-100">{greeting()}, <span className="gradient-text">{user.first_name}</span> 👋</h1>
          <p className="text-dark-400 mt-1">Welcome to the SRM University Smart Classroom Dashboard</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-dark-800/60 border border-dark-700/50">
            <Clock className="w-4 h-4 text-dark-400" />
            <span className="text-sm text-dark-300">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
          </div>
        </div>
      </div>

      {user.role === 'admin' && (
        <>
          {/* Main Core Cards */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6"
          >
            {adminCards.map((card, idx) => {
              const Icon = card.icon;
              return (
                <motion.div 
                  key={idx} 
                  variants={itemVariants}
                  whileHover={{ y: -5, scale: 1.02 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  onClick={() => navigate(card.href)}
                  className="glass-card relative overflow-hidden group cursor-pointer border border-dark-700/50 hover:border-dark-600/80"
                >
                  {/* Background Glow */}
                  <div className={`absolute -right-10 -top-10 w-32 h-32 bg-gradient-to-br ${card.color} rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity duration-500`} />
                  
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-6">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <button className="flex items-center gap-1 text-xs font-semibold text-primary-400 hover:text-primary-300 bg-primary-500/10 px-3 py-1.5 rounded-lg transition-colors">
                        {card.action} <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                    
                    <h3 className="text-xl font-bold text-dark-100 mb-4">{card.title}</h3>
                    
                    <div className="space-y-3">
                      {card.stats.map((stat, i) => (
                        <div key={i} className="flex justify-between items-center bg-dark-900/40 p-3 rounded-xl">
                          <span className="text-sm text-dark-400">{stat.label}</span>
                          <span className="font-bold text-dark-100">{stat.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Secondary Functionalities */}
          <div>
            <h2 className="text-xl font-bold text-dark-100 mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary-400" /> Platform Features
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {extraCards.map((feat, i) => {
                const Icon = feat.icon;
                return (
                  <motion.div 
                    key={i}
                    whileHover={{ scale: 1.05 }}
                    className="glass-card-hover p-5 flex flex-col items-center justify-center text-center cursor-pointer group"
                  >
                    <div className={`w-12 h-12 rounded-full ${feat.bg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                      <Icon className={`w-6 h-6 ${feat.color}`} />
                    </div>
                    <h4 className="font-bold text-dark-100">{feat.title}</h4>
                    <p className="text-sm text-dark-400 mt-1">{feat.val}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Session Management Widget */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card p-6 border-l-4 border-l-primary-500"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
                  <Settings className="w-5 h-5 text-primary-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-dark-100">Academic Session Management</h2>
                  <p className="text-sm text-dark-400">Configure current terms and semesters</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="btn-secondary py-2 text-sm">Edit Session</button>
                <button className="btn-primary py-2 text-sm">Add Session</button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-dark-900/50 p-4 rounded-xl flex items-center gap-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                <div>
                  <p className="text-xs text-dark-400">Current Session</p>
                  <p className="text-lg font-bold text-dark-100">{stats?.session?.current || '2025-2026'}</p>
                </div>
              </div>
              <div className="bg-dark-900/50 p-4 rounded-xl flex items-center gap-4">
                <CalendarDays className="w-8 h-8 text-blue-400" />
                <div>
                  <p className="text-xs text-dark-400">Current Semester</p>
                  <p className="text-lg font-bold text-dark-100">Semester {stats?.session?.semester || '5'}</p>
                </div>
              </div>
              <div className="bg-dark-900/50 p-4 rounded-xl flex items-center gap-4">
                <BarChart3 className="w-8 h-8 text-purple-400" />
                <div>
                  <p className="text-xs text-dark-400">Active Departments</p>
                  <p className="text-lg font-bold text-dark-100">{stats?.session?.activeDepartments || 12}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}
