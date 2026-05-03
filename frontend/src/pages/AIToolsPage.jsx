import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { aiAPI } from '../services/api';
import { Bot, Sparkles, AlertTriangle, DoorOpen, Send, Zap, Brain, Shield } from 'lucide-react';

export default function AIToolsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('chatbot');
  const [genForm, setGenForm] = useState({ semester: 3, section: 'A', academic_year: '2025-26' });
  const [genResult, setGenResult] = useState(null);
  const [conflicts, setConflicts] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);

  // Chatbot
  const [messages, setMessages] = useState([{ role: 'bot', text: "Hi! I'm the SmartClass AI assistant. Ask me about schedules, classrooms, or attendance!" }]);
  const [input, setInput] = useState('');
  const chatEnd = useRef(null);

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    try {
      const res = await aiAPI.chatbot({ message: userMsg });
      setMessages(prev => [...prev, { role: 'bot', text: res.data.response }]);
    } catch {
      setMessages(prev => [...prev, { role: 'bot', text: 'Sorry, something went wrong. Please try again.' }]);
    }
  };

  const generateTimetable = async () => {
    setLoading(true);
    try {
      const res = await aiAPI.generateTimetable(genForm);
      setGenResult(res.data);
    } catch (err) { alert(err.response?.data?.error || 'Generation failed'); }
    finally { setLoading(false); }
  };

  const detectConflicts = async () => {
    setLoading(true);
    try {
      const res = await aiAPI.detectConflicts({ academic_year: '2025-26' });
      setConflicts(res.data);
    } catch { alert('Failed'); }
    finally { setLoading(false); }
  };

  const getRecommendations = async () => {
    setLoading(true);
    try {
      const res = await aiAPI.recommendClassroom({ course_type: 'theory', min_capacity: 30 });
      setRecommendations(res.data.recommendations || []);
    } catch { alert('Failed'); }
    finally { setLoading(false); }
  };

  const tabs = [
    { id: 'chatbot', label: 'AI Chat', icon: Bot },
    ...(user.role === 'admin' ? [{ id: 'generate', label: 'Generate', icon: Sparkles }] : []),
    { id: 'conflicts', label: 'Conflicts', icon: AlertTriangle },
    { id: 'recommend', label: 'Rooms', icon: DoorOpen },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark-100 flex items-center gap-2"><Brain className="w-6 h-6 text-primary-400" /> AI Tools</h1>
        <p className="text-dark-400 text-sm mt-1">Intelligent scheduling & assistance</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${activeTab === t.id ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20' : 'text-dark-400 hover:text-dark-200 hover:bg-dark-800/50'}`}>
              <Icon className="w-4 h-4" />{t.label}
            </button>
          );
        })}
      </div>

      {/* Chatbot */}
      {activeTab === 'chatbot' && (
        <div className="glass-card flex flex-col h-[500px]">
          <div className="p-4 border-b border-dark-700/50 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center"><Bot className="w-5 h-5 text-white" /></div>
            <div><p className="font-semibold text-dark-100 text-sm">SmartClass AI</p><p className="text-xs text-dark-400">Online</p></div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap ${m.role === 'user' ? 'bg-primary-500 text-white rounded-br-md' : 'bg-dark-700/50 text-dark-200 rounded-bl-md'}`}>
                  {m.text}
                </div>
              </div>
            ))}
            <div ref={chatEnd} />
          </div>
          <div className="p-4 border-t border-dark-700/50">
            <div className="flex gap-2">
              <input className="input-field flex-1" placeholder="Ask about schedules, rooms, attendance..."
                value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage()} />
              <button onClick={sendMessage} className="btn-primary px-4"><Send className="w-5 h-5" /></button>
            </div>
          </div>
        </div>
      )}

      {/* Generate Timetable */}
      {activeTab === 'generate' && user.role === 'admin' && (
        <div className="space-y-4">
          <div className="glass-card p-6">
            <h2 className="text-lg font-bold text-dark-100 mb-4 flex items-center gap-2"><Zap className="w-5 h-5 text-amber-400" /> Auto Generate Timetable</h2>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div><label className="block text-sm text-dark-300 mb-1">Semester</label>
                <select className="input-field" value={genForm.semester} onChange={(e) => setGenForm({...genForm, semester: parseInt(e.target.value)})}>
                  {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                </select>
              </div>
              <div><label className="block text-sm text-dark-300 mb-1">Section</label>
                <input className="input-field" value={genForm.section} onChange={(e) => setGenForm({...genForm, section: e.target.value})} />
              </div>
              <div><label className="block text-sm text-dark-300 mb-1">Academic Year</label>
                <input className="input-field" value={genForm.academic_year} onChange={(e) => setGenForm({...genForm, academic_year: e.target.value})} />
              </div>
            </div>
            <button onClick={generateTimetable} disabled={loading} className="btn-primary flex items-center gap-2">
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Generate Timetable
            </button>
          </div>
          {genResult && (
            <div className="glass-card p-6 animate-slide-up">
              <h3 className="font-bold text-dark-100 mb-3">Generation Result</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="stat-card items-center text-center"><p className="text-2xl font-bold text-emerald-400">{genResult.entries_created}</p><p className="text-xs text-dark-400">Entries Created</p></div>
                <div className="stat-card items-center text-center"><p className="text-2xl font-bold text-amber-400">{genResult.conflict_count}</p><p className="text-xs text-dark-400">Conflicts</p></div>
              </div>
              {genResult.conflicts?.length > 0 && (
                <div className="space-y-2">{genResult.conflicts.map((c, i) => (
                  <div key={i} className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm text-amber-300">⚠️ {c.course}: {c.reason}</div>
                ))}</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Conflict Detection */}
      {activeTab === 'conflicts' && (
        <div className="space-y-4">
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-dark-100 flex items-center gap-2"><Shield className="w-5 h-5 text-red-400" /> Conflict Detection</h2>
              <button onClick={detectConflicts} disabled={loading} className="btn-primary text-sm flex items-center gap-2">
                {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
                Scan Conflicts
              </button>
            </div>
            {conflicts && (
              <div className="animate-slide-up">
                <div className="stat-card items-center text-center mb-4">
                  <p className={`text-3xl font-bold ${conflicts.total_conflicts === 0 ? 'text-emerald-400' : 'text-red-400'}`}>{conflicts.total_conflicts}</p>
                  <p className="text-xs text-dark-400">Total Conflicts Found</p>
                </div>
                {conflicts.faculty_conflicts?.length > 0 && (
                  <div className="mb-4"><h4 className="text-sm font-semibold text-dark-300 mb-2">Faculty Conflicts</h4>
                    {conflicts.faculty_conflicts.map((c, i) => (
                      <div key={i} className="p-3 mb-2 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-300">
                        {c.first_name} {c.last_name}: {c.course1} ↔ {c.course2}
                      </div>
                    ))}
                  </div>
                )}
                {conflicts.total_conflicts === 0 && <p className="text-emerald-400 text-center py-4">✅ No conflicts detected! Schedule is clean.</p>}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Smart Recommendations */}
      {activeTab === 'recommend' && (
        <div className="space-y-4">
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-dark-100 flex items-center gap-2"><DoorOpen className="w-5 h-5 text-accent-400" /> Smart Room Recommendations</h2>
              <button onClick={getRecommendations} disabled={loading} className="btn-primary text-sm flex items-center gap-2">
                {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Get Recommendations
              </button>
            </div>
            {recommendations && (
              <div className="grid gap-3 sm:grid-cols-2 animate-slide-up">
                {recommendations.map((r, i) => (
                  <div key={r.id} className="glass-card-hover p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div><p className="font-bold text-dark-100">{r.name}</p><p className="text-xs text-dark-400">{r.building}</p></div>
                      <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary-500/10 border border-primary-500/20">
                        <Sparkles className="w-3 h-3 text-primary-400" />
                        <span className="text-xs font-bold text-primary-300">{r.ai_score}</span>
                      </div>
                    </div>
                    <div className="text-sm text-dark-300">Capacity: {r.capacity} • {r.room_type}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
