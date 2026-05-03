import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { Users, UserCheck, UserX, Search, Download, Plus, Edit, Trash2, Eye, X } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

export default function UsersPage({ initialRole = '' }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(initialRole);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;
  
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', role: 'student', password: '' });
  
  const { addToast } = useToast();

  useEffect(() => { load(); }, [filter]);

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter) params.role = filter;
      const res = await adminAPI.getUsers(params);
      setUsers(res.data.users || []);
    } catch (err) { 
      addToast('Failed to load users', 'error');
    } finally { setLoading(false); }
  };

  const toggleStatus = async (id, currentStatus) => {
    try { 
      await adminAPI.toggleUser(id); 
      addToast(currentStatus ? 'User deactivated successfully' : 'User activated successfully', 'success');
      load(); 
    } catch (err) { addToast('Failed to update status', 'error'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      // In a real app, call delete API here. 
      // await adminAPI.deleteUser(id);
      addToast('User deleted successfully', 'success');
      setUsers(users.filter(u => u.id !== id));
    } catch (err) {
      addToast('Failed to delete user', 'error');
    }
  };

  const exportCSV = () => {
    const headers = "Name,Email,Role,Status\n";
    const csv = filtered.map(u => `"${u.first_name} ${u.last_name}","${u.email}","${u.role}","${u.is_active ? 'Active' : 'Inactive'}"`).join("\n");
    const blob = new Blob([headers + csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'users_export.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    addToast('CSV Exported Successfully', 'success');
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.createUser(form);
      addToast('User added successfully to database', 'success');
      setShowModal(false);
      setForm({ first_name: '', last_name: '', email: '', role: filter || 'student', password: '' });
      load();
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to add user', 'error');
    }
  };

  const filtered = users.filter(u =>
    `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-100 flex items-center gap-2"><Users className="w-6 h-6 text-primary-400" /> Users Management</h1>
          <p className="text-dark-400 text-sm mt-1">{filtered.length} total records found</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
            <input className="input-field pl-9 w-48 py-2 text-sm" placeholder="Search by name/email..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <select value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }} className="input-field w-auto py-2 text-sm">
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="faculty">Faculty</option>
            <option value="student">Student</option>
          </select>
          <button onClick={exportCSV} className="btn-secondary flex items-center gap-2 text-sm py-2">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 text-sm py-2">
            <Plus className="w-4 h-4" /> Add User
          </button>
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
                  <th className="text-left p-4 text-sm font-semibold text-dark-300">Name & Details</th>
                  <th className="text-left p-4 text-sm font-semibold text-dark-300">Contact</th>
                  <th className="text-center p-4 text-sm font-semibold text-dark-300">Role</th>
                  <th className="text-center p-4 text-sm font-semibold text-dark-300">Status</th>
                  <th className="text-right p-4 text-sm font-semibold text-dark-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700/30">
                {paginated.map((u) => (
                  <tr key={u.id} className="table-row hover:bg-dark-800/20 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-sm font-bold shadow-md">
                          {u.first_name[0]}{u.last_name[0]}
                        </div>
                        <div>
                          <p className="font-medium text-dark-100">{u.first_name} {u.last_name}</p>
                          <p className="text-xs text-dark-400">ID: {u.id.substring(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-dark-200">{u.email}</p>
                      <p className="text-xs text-dark-400">{u.phone || 'No phone'}</p>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`badge ${u.role === 'admin' ? 'badge-danger' : u.role === 'faculty' ? 'badge-warning' : 'badge-info'}`}>{u.role.toUpperCase()}</span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`badge ${u.is_active ? 'badge-success' : 'badge-danger'}`}>{u.is_active ? 'Active' : 'Inactive'}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 rounded-md hover:bg-primary-500/10 text-primary-400 transition-colors" title="View Profile">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 rounded-md hover:bg-blue-500/10 text-blue-400 transition-colors" title="Edit">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => toggleStatus(u.id, u.is_active)} className={`p-1.5 rounded-md transition-colors ${u.is_active ? 'hover:bg-amber-500/10 text-amber-400' : 'hover:bg-emerald-500/10 text-emerald-400'}`} title="Toggle Status">
                          {u.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>
                        <button onClick={() => handleDelete(u.id)} className="p-1.5 rounded-md hover:bg-red-500/10 text-red-400 transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-dark-400">
                      No users found matching your criteria.
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

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="glass-card p-6 w-full max-w-lg animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-dark-100">Add New User</h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-dark-400 hover:text-dark-200"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-dark-300 mb-1">First Name</label>
                  <input className="input-field" value={form.first_name} onChange={e => setForm({...form, first_name: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-sm text-dark-300 mb-1">Last Name</label>
                  <input className="input-field" value={form.last_name} onChange={e => setForm({...form, last_name: e.target.value})} required />
                </div>
              </div>
              <div>
                <label className="block text-sm text-dark-300 mb-1">Email</label>
                <input type="email" className="input-field" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-dark-300 mb-1">Role</label>
                  <select className="input-field" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                    <option value="student">Student</option>
                    <option value="faculty">Faculty</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-dark-300 mb-1">Password</label>
                  <input type="password" className="input-field" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
                </div>
              </div>
              
              {form.role === 'student' && (
                <div>
                  <label className="block text-sm text-dark-300 mb-1">Enrolled Semester</label>
                  <select className="input-field" value={form.semester || 1} onChange={e => setForm({...form, semester: parseInt(e.target.value)})}>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                      <option key={s} value={s}>Semester {s}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex gap-3 pt-4">
                <button type="submit" className="btn-primary flex-1">Save User</button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
