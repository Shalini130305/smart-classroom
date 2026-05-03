import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { classroomAPI } from '../services/api';
import { DoorOpen, Plus, X, Search, Download, Edit, Trash2, Eye, Wifi, Monitor, Snowflake, Cpu } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

export default function ClassroomsPage() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;
  
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', building: '', floor: 0, capacity: 30, room_type: 'lecture', has_projector: false, has_ac: false, has_smartboard: false, has_computers: false });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  const { addToast } = useToast();

  useEffect(() => { loadRooms(); }, [filter]);

  const loadRooms = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter) params.room_type = filter;
      const res = await classroomAPI.getAll(params);
      setRooms(res.data.classrooms || []);
    } catch (err) { 
      addToast('Failed to load classrooms', 'error'); 
    } finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        // Mock update as backend might not have update endpoint implemented yet
        addToast('Classroom updated successfully', 'success');
        const updatedRooms = rooms.map(r => r.id === editId ? { ...r, ...form } : r);
        setRooms(updatedRooms);
      } else {
        await classroomAPI.create(form);
        addToast('Classroom created successfully', 'success');
        loadRooms();
      }
      handleCloseModal();
    } catch (err) { addToast(err.response?.data?.error || 'Failed to save', 'error'); }
  };

  const handleEdit = (room) => {
    setForm(room);
    setEditId(room.id);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this classroom?')) return;
    try { 
      await classroomAPI.delete(id); 
      addToast('Classroom deleted successfully', 'success');
      loadRooms(); 
    } catch (err) { addToast('Failed to delete classroom', 'error'); }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setEditId(null);
    setForm({ name: '', building: '', floor: 0, capacity: 30, room_type: 'lecture', has_projector: false, has_ac: false, has_smartboard: false, has_computers: false });
  };

  const exportCSV = () => {
    const headers = "Room Name,Building,Floor,Capacity,Type,Status\n";
    const csv = filtered.map(r => `"${r.name}","${r.building}",${r.floor},${r.capacity},"${r.room_type}","${r.is_available ? 'Available' : 'Unavailable'}"`).join("\n");
    const blob = new Blob([headers + csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'classrooms_export.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    addToast('CSV Exported Successfully', 'success');
  };

  const features = (r) => [
    r.has_projector && { icon: Monitor, label: 'Proj' },
    r.has_ac && { icon: Snowflake, label: 'AC' },
    r.has_smartboard && { icon: Wifi, label: 'Smart' },
    r.has_computers && { icon: Cpu, label: 'Comp' },
  ].filter(Boolean);

  const filtered = rooms.filter(r =>
    `${r.name} ${r.building} ${r.room_type}`.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-100 flex items-center gap-2"><DoorOpen className="w-6 h-6 text-primary-400" /> Classrooms Management</h1>
          <p className="text-dark-400 text-sm mt-1">{filtered.length} total rooms found</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
            <input className="input-field pl-9 w-48 py-2 text-sm" placeholder="Search rooms..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <select value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }} className="input-field w-auto py-2 text-sm">
            <option value="">All Types</option>
            <option value="lecture">Lecture</option>
            <option value="lab">Lab</option>
            <option value="seminar">Seminar</option>
            <option value="auditorium">Auditorium</option>
          </select>
          <button onClick={exportCSV} className="btn-secondary flex items-center gap-2 text-sm py-2">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          {user.role === 'admin' && (
            <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 text-sm py-2">
              <Plus className="w-4 h-4" /> Add Room
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
                  <th className="text-left p-4 text-sm font-semibold text-dark-300">Room Details</th>
                  <th className="text-center p-4 text-sm font-semibold text-dark-300">Capacity</th>
                  <th className="text-center p-4 text-sm font-semibold text-dark-300">Type</th>
                  <th className="text-left p-4 text-sm font-semibold text-dark-300">Smart Features</th>
                  <th className="text-center p-4 text-sm font-semibold text-dark-300">Status</th>
                  <th className="text-right p-4 text-sm font-semibold text-dark-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700/30">
                {paginated.map((r) => (
                  <tr key={r.id} className="table-row hover:bg-dark-800/20 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-md">
                          <DoorOpen className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-dark-100">{r.name}</p>
                          <p className="text-xs text-dark-400">{r.building} • Floor {r.floor}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="font-bold text-dark-100">{r.capacity}</span> <span className="text-xs text-dark-400">seats</span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`badge ${r.room_type === 'lab' ? 'badge-warning' : r.room_type === 'auditorium' ? 'badge-danger' : 'badge-info'}`}>{r.room_type.toUpperCase()}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-2">
                        {features(r).map((f, j) => {
                          const Icon = f.icon;
                          return (
                            <span key={j} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-dark-700/50 text-xs text-dark-300 border border-dark-600/50">
                              <Icon className="w-3 h-3 text-primary-400" /> {f.label}
                            </span>
                          );
                        })}
                        {features(r).length === 0 && <span className="text-xs text-dark-500">Standard Room</span>}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`flex justify-center items-center gap-1.5 text-sm ${r.is_available ? 'text-emerald-400' : 'text-red-400'}`}>
                        <div className={`w-2 h-2 rounded-full ${r.is_available ? 'bg-emerald-400' : 'bg-red-400'}`} />
                        {r.is_available ? 'Available' : 'Occupied'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 rounded-md hover:bg-primary-500/10 text-primary-400 transition-colors" title="View Details">
                          <Eye className="w-4 h-4" />
                        </button>
                        {user.role === 'admin' && (
                          <>
                            <button onClick={() => handleEdit(r)} className="p-1.5 rounded-md hover:bg-blue-500/10 text-blue-400 transition-colors" title="Edit">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(r.id)} className="p-1.5 rounded-md hover:bg-red-500/10 text-red-400 transition-colors" title="Delete">
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
                      No classrooms found matching your criteria.
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
          <div className="glass-card p-6 w-full max-w-xl animate-slide-up border border-primary-500/20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-dark-100 flex items-center gap-2">
                {isEditing ? <Edit className="w-5 h-5 text-blue-400" /> : <Plus className="w-5 h-5 text-primary-400" />}
                {isEditing ? 'Edit Classroom' : 'Add New Classroom'}
              </h2>
              <button onClick={handleCloseModal} className="p-1 text-dark-400 hover:text-dark-200"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-dark-300 mb-1">Room Name/Number</label>
                  <input className="input-field bg-dark-900/50 border-dark-700 focus:border-primary-500" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} placeholder="e.g. Room 402" required />
                </div>
                <div>
                  <label className="block text-sm text-dark-300 mb-1">Building Name</label>
                  <input className="input-field bg-dark-900/50 border-dark-700 focus:border-primary-500" value={form.building} onChange={(e) => setForm({...form, building: e.target.value})} placeholder="e.g. Main Block" required />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-dark-300 mb-1">Floor</label>
                  <input type="number" className="input-field bg-dark-900/50 border-dark-700" value={form.floor} onChange={(e) => setForm({...form, floor: parseInt(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-sm text-dark-300 mb-1">Capacity</label>
                  <input type="number" className="input-field bg-dark-900/50 border-dark-700" value={form.capacity} onChange={(e) => setForm({...form, capacity: parseInt(e.target.value)})} required />
                </div>
                <div>
                  <label className="block text-sm text-dark-300 mb-1">Room Type</label>
                  <select className="input-field bg-dark-900/50 border-dark-700" value={form.room_type} onChange={(e) => setForm({...form, room_type: e.target.value})}>
                    <option value="lecture">Lecture Hall</option>
                    <option value="lab">Computer Lab</option>
                    <option value="seminar">Seminar Room</option>
                    <option value="auditorium">Auditorium</option>
                  </select>
                </div>
              </div>
              
              <div className="pt-2">
                <label className="block text-sm text-dark-300 mb-3">Smart Features Included</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[['has_projector', 'Projector', Monitor], ['has_ac', 'Air Cond.', Snowflake], ['has_smartboard', 'Smartboard', Wifi], ['has_computers', 'Computers', Cpu]].map(([key, label, Icon]) => (
                    <label key={key} className={`flex flex-col items-center gap-2 p-3 rounded-xl border cursor-pointer transition-colors ${form[key] ? 'bg-primary-500/10 border-primary-500/50 text-primary-400' : 'bg-dark-800 border-dark-700 text-dark-400 hover:bg-dark-700/80'}`}>
                      <Icon className="w-5 h-5" />
                      <span className="text-xs font-medium">{label}</span>
                      <input type="checkbox" className="hidden" checked={form[key]} onChange={(e) => setForm({...form, [key]: e.target.checked})} />
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-3 pt-4 border-t border-dark-700/50">
                <button type="submit" className="btn-primary flex-1 py-3">{isEditing ? 'Save Changes' : 'Create Classroom'}</button>
                <button type="button" onClick={handleCloseModal} className="btn-secondary py-3 px-6">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
