import { useState, useEffect } from 'react';
import { notificationAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Bell, CheckCheck, Trash2, Send, X } from 'lucide-react';

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [broadcastForm, setBroadcastForm] = useState({ title: '', message: '', type: 'info', role: '' });

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const res = await notificationAPI.getAll();
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unread_count || 0);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const markRead = async (id) => {
    await notificationAPI.markRead(id);
    load();
  };

  const markAllRead = async () => {
    await notificationAPI.markAllRead();
    load();
  };

  const deleteNotif = async (id) => {
    await notificationAPI.delete(id);
    load();
  };

  const handleBroadcast = async (e) => {
    e.preventDefault();
    try {
      await notificationAPI.broadcast(broadcastForm);
      setShowBroadcast(false);
      setBroadcastForm({ title: '', message: '', type: 'info', role: '' });
      alert('Broadcast sent!');
    } catch (err) { alert('Failed to send'); }
  };

  const typeColors = {
    info: 'border-l-blue-400 bg-blue-500/5',
    success: 'border-l-emerald-400 bg-emerald-500/5',
    warning: 'border-l-amber-400 bg-amber-500/5',
    error: 'border-l-red-400 bg-red-500/5',
    schedule_change: 'border-l-purple-400 bg-purple-500/5',
    attendance: 'border-l-cyan-400 bg-cyan-500/5',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-100 flex items-center gap-2"><Bell className="w-6 h-6 text-primary-400" /> Notifications</h1>
          <p className="text-dark-400 text-sm mt-1">{unreadCount} unread</p>
        </div>
        <div className="flex gap-3">
          {unreadCount > 0 && <button onClick={markAllRead} className="btn-secondary text-sm flex items-center gap-2"><CheckCheck className="w-4 h-4" /> Mark All Read</button>}
          {user.role === 'admin' && <button onClick={() => setShowBroadcast(true)} className="btn-primary text-sm flex items-center gap-2"><Send className="w-4 h-4" /> Broadcast</button>}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-10 h-10 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" /></div>
      ) : notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.map((n, i) => (
            <div key={n.id} className={`glass-card p-4 border-l-4 ${typeColors[n.type] || typeColors.info} ${!n.is_read ? 'ring-1 ring-primary-500/20' : 'opacity-80'} animate-slide-up`} style={{ animationDelay: `${i * 0.03}s` }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`font-semibold ${n.is_read ? 'text-dark-300' : 'text-dark-100'}`}>{n.title}</h3>
                    {!n.is_read && <span className="w-2 h-2 rounded-full bg-primary-400" />}
                  </div>
                  <p className="text-sm text-dark-400">{n.message}</p>
                  <p className="text-xs text-dark-500 mt-2">{new Date(n.created_at).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  {!n.is_read && <button onClick={() => markRead(n.id)} className="p-1.5 text-dark-400 hover:text-primary-400 transition-colors"><CheckCheck className="w-4 h-4" /></button>}
                  <button onClick={() => deleteNotif(n.id)} className="p-1.5 text-dark-400 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card p-12 text-center"><Bell className="w-12 h-12 text-dark-600 mx-auto mb-3" /><p className="text-dark-400">No notifications yet.</p></div>
      )}

      {/* Broadcast Modal */}
      {showBroadcast && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="glass-card p-6 w-full max-w-lg animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-dark-100">Broadcast Notification</h2>
              <button onClick={() => setShowBroadcast(false)} className="p-1 text-dark-400 hover:text-dark-200"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleBroadcast} className="space-y-4">
              <div><label className="block text-sm text-dark-300 mb-1">Title</label><input className="input-field" value={broadcastForm.title} onChange={(e) => setBroadcastForm({...broadcastForm, title: e.target.value})} required /></div>
              <div><label className="block text-sm text-dark-300 mb-1">Message</label><textarea className="input-field h-24 resize-none" value={broadcastForm.message} onChange={(e) => setBroadcastForm({...broadcastForm, message: e.target.value})} required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm text-dark-300 mb-1">Type</label>
                  <select className="input-field" value={broadcastForm.type} onChange={(e) => setBroadcastForm({...broadcastForm, type: e.target.value})}>
                    <option value="info">Info</option><option value="success">Success</option><option value="warning">Warning</option><option value="error">Error</option>
                  </select>
                </div>
                <div><label className="block text-sm text-dark-300 mb-1">Target Role</label>
                  <select className="input-field" value={broadcastForm.role} onChange={(e) => setBroadcastForm({...broadcastForm, role: e.target.value})}>
                    <option value="">All Users</option><option value="student">Students</option><option value="faculty">Faculty</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3"><button type="submit" className="btn-primary flex-1">Send Broadcast</button><button type="button" onClick={() => setShowBroadcast(false)} className="btn-secondary">Cancel</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
