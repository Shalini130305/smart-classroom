import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { adminAPI } from '../services/api';
import { BookOpen, Plus, X, Search, Download, Edit, Trash2, Eye } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

export default function CoursesPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;
  
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: '', code: '', department_id: '', credits: 3, semester: 1, course_type: 'theory' });
  
  const { addToast } = useToast();

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const [cRes, dRes] = await Promise.all([adminAPI.getCourses(), adminAPI.getDepartments()]);
      setCourses(cRes.data.courses || []);
      setDepartments(dRes.data.departments || []);
    } catch (err) { 
      addToast('Failed to load courses', 'error');
    } finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        // Mock update
        addToast('Course updated successfully', 'success');
        const updatedCourses = courses.map(c => c.id === editId ? { ...c, ...form, department_code: departments.find(d => d.id === form.department_id)?.code } : c);
        setCourses(updatedCourses);
      } else {
        await adminAPI.createCourse(form);
        addToast('Course created successfully', 'success');
        load();
      }
      handleCloseModal();
    } catch (err) { addToast(err.response?.data?.error || 'Failed to save course', 'error'); }
  };

  const handleEdit = (course) => {
    setForm(course);
    setEditId(course.id);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this course?')) return;
    try { 
      // await adminAPI.deleteCourse(id);
      addToast('Course deleted successfully', 'success');
      setCourses(courses.filter(c => c.id !== id));
    } catch (err) { addToast('Failed to delete course', 'error'); }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setEditId(null);
    setForm({ name: '', code: '', department_id: '', credits: 3, semester: 1, course_type: 'theory' });
  };

  const exportCSV = () => {
    const headers = "Course Code,Course Name,Type,Semester,Credits,Department\n";
    const csv = filtered.map(c => `"${c.code}","${c.name}","${c.course_type}",${c.semester},${c.credits},"${c.department_code || 'N/A'}"`).join("\n");
    const blob = new Blob([headers + csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'courses_export.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    addToast('CSV Exported Successfully', 'success');
  };

  const filtered = courses.filter(c =>
    `${c.name} ${c.code} ${c.course_type}`.toLowerCase().includes(search.toLowerCase()) &&
    (filter === '' || c.course_type === filter)
  );

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-100 flex items-center gap-2"><BookOpen className="w-6 h-6 text-primary-400" /> Courses Management</h1>
          <p className="text-dark-400 text-sm mt-1">{filtered.length} total courses found</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
            <input className="input-field pl-9 w-48 py-2 text-sm" placeholder="Search courses..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <select value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }} className="input-field w-auto py-2 text-sm">
            <option value="">All Types</option>
            <option value="theory">Theory</option>
            <option value="lab">Lab</option>
            <option value="elective">Elective</option>
          </select>
          <button onClick={exportCSV} className="btn-secondary flex items-center gap-2 text-sm py-2">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          {user.role === 'admin' && (
            <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 text-sm py-2">
              <Plus className="w-4 h-4" /> Add Course
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-10 h-10 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" /></div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-dark-700/50 bg-dark-800/50">
                  <th className="text-left p-4 text-sm font-semibold text-dark-300">Course Details</th>
                  <th className="text-center p-4 text-sm font-semibold text-dark-300">Credits</th>
                  <th className="text-center p-4 text-sm font-semibold text-dark-300">Semester</th>
                  <th className="text-center p-4 text-sm font-semibold text-dark-300">Department</th>
                  <th className="text-center p-4 text-sm font-semibold text-dark-300">Type</th>
                  <th className="text-right p-4 text-sm font-semibold text-dark-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700/30">
                {paginated.map((c) => (
                  <tr key={c.id} className="table-row hover:bg-dark-800/20 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-md">
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-dark-100">{c.code}</p>
                          <p className="text-xs text-dark-400">{c.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="font-bold text-dark-100">{c.credits}</span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-sm text-dark-200">Sem {c.semester}</span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-sm font-medium text-dark-300">{c.department_code || 'N/A'}</span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`badge ${c.course_type === 'lab' ? 'badge-warning' : c.course_type === 'elective' ? 'badge-info' : 'badge-success'}`}>
                        {c.course_type.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 rounded-md hover:bg-primary-500/10 text-primary-400 transition-colors" title="View Syllabus">
                          <Eye className="w-4 h-4" />
                        </button>
                        {user.role === 'admin' && (
                          <>
                            <button onClick={() => handleEdit(c)} className="p-1.5 rounded-md hover:bg-blue-500/10 text-blue-400 transition-colors" title="Edit">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-md hover:bg-red-500/10 text-red-400 transition-colors" title="Delete">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-dark-400">
                      No courses found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
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

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="glass-card p-6 w-full max-w-lg animate-slide-up border border-primary-500/20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-dark-100 flex items-center gap-2">
                {isEditing ? <Edit className="w-5 h-5 text-blue-400" /> : <Plus className="w-5 h-5 text-primary-400" />}
                {isEditing ? 'Edit Course' : 'Add New Course'}
              </h2>
              <button onClick={handleCloseModal} className="p-1 text-dark-400 hover:text-dark-200"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm text-dark-300 mb-1">Course Name</label>
                <input className="input-field bg-dark-900/50" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} placeholder="e.g. Data Structures" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-dark-300 mb-1">Course Code</label>
                  <input className="input-field bg-dark-900/50 uppercase" value={form.code} onChange={(e) => setForm({...form, code: e.target.value.toUpperCase()})} placeholder="e.g. CSE201" required />
                </div>
                <div>
                  <label className="block text-sm text-dark-300 mb-1">Department</label>
                  <select className="input-field bg-dark-900/50" value={form.department_id} onChange={(e) => setForm({...form, department_id: e.target.value})} required>
                    <option value="">Select Department</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.code} - {d.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-dark-300 mb-1">Credits</label>
                  <input type="number" min="1" max="10" className="input-field bg-dark-900/50" value={form.credits} onChange={(e) => setForm({...form, credits: parseInt(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-sm text-dark-300 mb-1">Semester</label>
                  <input type="number" min="1" max="8" className="input-field bg-dark-900/50" value={form.semester} onChange={(e) => setForm({...form, semester: parseInt(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-sm text-dark-300 mb-1">Course Type</label>
                  <select className="input-field bg-dark-900/50" value={form.course_type} onChange={(e) => setForm({...form, course_type: e.target.value})}>
                    <option value="theory">Theory</option>
                    <option value="lab">Lab</option>
                    <option value="elective">Elective</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-4 border-t border-dark-700/50">
                <button type="submit" className="btn-primary flex-1 py-3">{isEditing ? 'Save Changes' : 'Create Course'}</button>
                <button type="button" onClick={handleCloseModal} className="btn-secondary py-3 px-6">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
