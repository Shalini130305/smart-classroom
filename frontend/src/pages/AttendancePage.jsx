import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { attendanceAPI } from '../services/api';
import { ClipboardCheck, BarChart3 } from 'lucide-react';

export default function AttendancePage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      if (user.role === 'student') {
        const res = await attendanceAPI.getSummary();
        setSummary(res.data.summary || []);
      }
      if (user.role === 'admin') {
        const res = await attendanceAPI.getStats();
        setStats(res.data);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="w-10 h-10 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark-100 flex items-center gap-2"><ClipboardCheck className="w-6 h-6 text-primary-400" /> Attendance</h1>
        <p className="text-dark-400 text-sm mt-1">{user.role === 'student' ? 'Your attendance summary' : 'Manage & view attendance records'}</p>
      </div>

      {/* Admin Stats */}
      {user.role === 'admin' && stats && (
        <div className="grid gap-4 sm:grid-cols-4">
          {[
            { label: 'Total Records', val: stats.overall?.total_records || 0, color: 'text-blue-400' },
            { label: 'Present', val: stats.overall?.total_present || 0, color: 'text-emerald-400' },
            { label: 'Absent', val: stats.overall?.total_absent || 0, color: 'text-red-400' },
            { label: 'Overall %', val: `${stats.overall?.overall_percentage || 0}%`, color: 'text-amber-400' },
          ].map((s, i) => (
            <div key={i} className="stat-card items-center text-center">
              <p className={`text-3xl font-bold ${s.color}`}>{s.val}</p>
              <p className="text-xs text-dark-400">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Admin Department Breakdown */}
      {user.role === 'admin' && stats?.by_department?.length > 0 && (
        <div className="glass-card p-6">
          <h2 className="text-lg font-bold text-dark-100 mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-accent-400" /> By Department (Last 30 Days)</h2>
          <div className="space-y-3">
            {stats.by_department.map((d, i) => (
              <div key={i} className="flex items-center gap-4">
                <span className="w-32 text-sm text-dark-300 truncate">{d.code}</span>
                <div className="flex-1 h-3 bg-dark-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary-500 to-accent-400 rounded-full transition-all duration-500"
                    style={{ width: `${d.percentage || 0}%` }} />
                </div>
                <span className="text-sm font-medium text-dark-200 w-14 text-right">{d.percentage || 0}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Student Summary */}
      {user.role === 'student' && (
        summary.length > 0 ? (
          <div className="glass-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-700/50 bg-dark-800/50">
                  <th className="text-left p-4 text-sm font-semibold text-dark-300">Course</th>
                  <th className="text-center p-4 text-sm font-semibold text-dark-300">Total</th>
                  <th className="text-center p-4 text-sm font-semibold text-dark-300">Present</th>
                  <th className="text-center p-4 text-sm font-semibold text-dark-300">Absent</th>
                  <th className="text-center p-4 text-sm font-semibold text-dark-300">%</th>
                </tr>
              </thead>
              <tbody>
                {summary.map((s, i) => (
                  <tr key={i} className="table-row">
                    <td className="p-4"><p className="font-medium text-dark-100">{s.course_code}</p><p className="text-xs text-dark-400">{s.course_name}</p></td>
                    <td className="p-4 text-center text-dark-300">{s.total_classes}</td>
                    <td className="p-4 text-center text-emerald-400 font-medium">{s.present_count}</td>
                    <td className="p-4 text-center text-red-400 font-medium">{s.absent_count}</td>
                    <td className="p-4 text-center">
                      <span className={`font-bold ${parseFloat(s.attendance_percentage) >= 75 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {s.attendance_percentage}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="glass-card p-12 text-center">
            <ClipboardCheck className="w-12 h-12 text-dark-600 mx-auto mb-3" />
            <p className="text-dark-400">No attendance records yet.</p>
          </div>
        )
      )}

      {/* Faculty placeholder */}
      {user.role === 'faculty' && (
        <div className="glass-card p-12 text-center">
          <ClipboardCheck className="w-12 h-12 text-dark-600 mx-auto mb-3" />
          <p className="text-dark-400 mb-2">Mark attendance for your classes from here.</p>
          <p className="text-xs text-dark-500">Select a timetable entry and date to begin marking attendance.</p>
        </div>
      )}
    </div>
  );
}
