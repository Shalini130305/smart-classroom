import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { timetableAPI, adminAPI, classroomAPI } from '../services/api';
import { CalendarDays, Plus, X, Search, Download, Edit, Trash2, Clock, AlertTriangle } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

export default function TimetablePage() {
  const { user } = useAuth();
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Data for selects
  const [courses, setCourses] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);

  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;
  
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ 
    course_id: '', faculty_id: '', classroom_id: '', time_slot_id: '', 
    section: 'A', semester: 1, academic_year: '2025-26' 
  });
  
  const { addToast } = useToast();

  useEffect(() => { 
    loadData(); 
  }, [filter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter) params.semester = filter;
      
      const promises = [timetableAPI.get(params)];
      
      // Only admins need the dropdown data for generating schedules
      if (user?.role === 'admin') {
        promises.push(
          adminAPI.getCourses(),
          adminAPI.getUsers({ role: 'faculty' }),
          classroomAPI.getAll(),
          timetableAPI.getTimeSlots()
        );
      }
      
      const results = await Promise.all(promises);
      setTimetable(results[0].data.timetable || []);
      
      if (user?.role === 'admin') {
        setCourses(results[1].data.courses || []);
        setFaculty(results[2].data.users || []);
        setClassrooms(results[3].data.classrooms || []);
        setTimeSlots(results[4].data.time_slots || []);
      }
    } catch (err) { 
      addToast('Failed to load schedule data', 'error');
    } finally { 
      setLoading(false); 
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await timetableAPI.create(form);
      addToast('Schedule record generated successfully', 'success');
      handleCloseModal();
      loadData();
    } catch (err) { 
      if (err.response?.status === 409) {
        addToast(err.response?.data?.error || 'Conflict detected!', 'error');
      } else {
        addToast('Failed to generate schedule', 'error');
      }
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this schedule entry?')) return;
    try { 
      await timetableAPI.delete(id);
      addToast('Schedule record deleted', 'success');
      setTimetable(timetable.filter(t => t.id !== id));
    } catch (err) { addToast('Failed to delete schedule', 'error'); }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setForm({ course_id: '', faculty_id: '', classroom_id: '', time_slot_id: '', section: 'A', semester: 1, academic_year: '2025-26' });
  };

  const exportCSV = () => {
    const headers = "Day,Time,Course,Faculty,Room,Semester,Type\n";
    const days = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const csv = filtered.map(t => `"${days[t.day_of_week]}","${t.start_time?.slice(0,5)} - ${t.end_time?.slice(0,5)}","${t.course_code} - ${t.course_name}","${t.faculty_first_name} ${t.faculty_last_name}","${t.classroom_name}","Sem ${t.semester}","${t.course_type}"`).join("\n");
    const blob = new Blob([headers + csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'timetable_export.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    addToast('CSV Exported Successfully', 'success');
  };

  const days = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const filtered = timetable.filter(t =>
    `${t.course_name} ${t.course_code} ${t.faculty_first_name} ${t.classroom_name}`.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-100 flex items-center gap-2"><CalendarDays className="w-6 h-6 text-primary-400" /> Schedules Management</h1>
          <p className="text-dark-400 text-sm mt-1">{filtered.length} total schedule records</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
            <input className="input-field pl-9 w-48 py-2 text-sm" placeholder="Search..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <select value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }} className="input-field w-auto py-2 text-sm">
            <option value="">All Semesters</option>
            {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
          </select>
          <button onClick={exportCSV} className="btn-secondary flex items-center gap-2 text-sm py-2">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          {user.role === 'admin' && (
            <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 text-sm py-2">
              <Plus className="w-4 h-4" /> Generate Schedule
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-10 h-10 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" /></div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-dark-700/50 bg-dark-800/50">
                  <th className="text-left p-4 text-sm font-semibold text-dark-300">Day & Time</th>
                  <th className="text-left p-4 text-sm font-semibold text-dark-300">Course</th>
                  <th className="text-left p-4 text-sm font-semibold text-dark-300">Faculty</th>
                  <th className="text-left p-4 text-sm font-semibold text-dark-300">Room</th>
                  <th className="text-center p-4 text-sm font-semibold text-dark-300">Semester</th>
                  <th className="text-right p-4 text-sm font-semibold text-dark-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700/30">
                {paginated.map((t) => (
                  <tr key={t.id} className="table-row hover:bg-dark-800/20 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 flex flex-col items-center justify-center text-white shadow-md">
                          <span className="text-[10px] font-bold uppercase">{days[t.day_of_week].substring(0,3)}</span>
                        </div>
                        <div>
                          <p className="font-bold text-dark-100">{t.start_time?.slice(0,5)} - {t.end_time?.slice(0,5)}</p>
                          <p className="text-xs text-dark-400">Slot {t.slot_number}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="font-medium text-dark-100">{t.course_code}</p>
                      <p className="text-xs text-dark-400">{t.course_name}</p>
                      <span className={`inline-block mt-1 badge ${t.course_type === 'lab' ? 'badge-warning' : 'badge-info'} text-[10px]`}>{t.course_type}</span>
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-medium text-dark-200">{t.faculty_first_name} {t.faculty_last_name}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-bold text-dark-100">{t.classroom_name}</p>
                      <p className="text-xs text-dark-400">{t.building}</p>
                    </td>
                    <td className="p-4 text-center">
                      <span className="badge badge-success">Sem {t.semester} ({t.section})</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {user.role === 'admin' && (
                          <button onClick={() => handleDelete(t.id)} className="p-1.5 rounded-md hover:bg-red-500/10 text-red-400 transition-colors" title="Delete Schedule">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-dark-400">
                      No schedules found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-dark-700/50 bg-dark-900/20">
              <span className="text-sm text-dark-400">
                Showing {(page - 1) * itemsPerPage + 1} to {Math.min(page * itemsPerPage, filtered.length)} of {filtered.length} entries
              </span>
              <div className="flex gap-1">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i + 1)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${page === i + 1 ? 'bg-primary-500 text-white' : 'bg-dark-800 text-dark-300 hover:bg-dark-700'}`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Generate Schedule Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="glass-card p-6 w-full max-w-2xl animate-slide-up border border-primary-500/20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-dark-100 flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-primary-400" /> Generate Schedule Record
              </h2>
              <button onClick={handleCloseModal} className="p-1 text-dark-400 hover:text-dark-200"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="mb-6 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-300 leading-relaxed">
                The system will automatically detect conflicts. If the selected Faculty or Room is already assigned to a different class during the selected Time Slot, the generation will be rejected.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-dark-300 mb-1">Course</label>
                  <select className="input-field bg-dark-900/50" value={form.course_id} onChange={(e) => setForm({...form, course_id: e.target.value})} required>
                    <option value="">Select Course</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-dark-300 mb-1">Faculty</label>
                  <select className="input-field bg-dark-900/50" value={form.faculty_id} onChange={(e) => setForm({...form, faculty_id: e.target.value})} required>
                    <option value="">Select Faculty</option>
                    {faculty.map(f => <option key={f.id} value={f.id}>{f.first_name} {f.last_name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-dark-300 mb-1">Classroom</label>
                  <select className="input-field bg-dark-900/50" value={form.classroom_id} onChange={(e) => setForm({...form, classroom_id: e.target.value})} required>
                    <option value="">Select Room</option>
                    {classrooms.map(c => <option key={c.id} value={c.id}>{c.name} ({c.capacity} seats)</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-dark-300 mb-1">Day & Time Slot</label>
                  <select className="input-field bg-dark-900/50" value={form.time_slot_id} onChange={(e) => setForm({...form, time_slot_id: e.target.value})} required>
                    <option value="">Select Time Slot</option>
                    {timeSlots.map(ts => <option key={ts.id} value={ts.id}>{days[ts.day_of_week]} | {ts.start_time.slice(0,5)} - {ts.end_time.slice(0,5)}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-dark-300 mb-1">Semester</label>
                  <select className="input-field bg-dark-900/50" value={form.semester} onChange={(e) => setForm({...form, semester: parseInt(e.target.value)})} required>
                    {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-dark-300 mb-1">Section</label>
                  <select className="input-field bg-dark-900/50" value={form.section} onChange={(e) => setForm({...form, section: e.target.value})} required>
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-dark-300 mb-1">Academic Year</label>
                  <select className="input-field bg-dark-900/50" value={form.academic_year} onChange={(e) => setForm({...form, academic_year: e.target.value})} required>
                    <option value="2024-25">2024-25</option>
                    <option value="2025-26">2025-26</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-dark-700/50">
                <button type="submit" className="btn-primary flex-1 py-3">Generate Schedule Record</button>
                <button type="button" onClick={handleCloseModal} className="btn-secondary py-3 px-6">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
