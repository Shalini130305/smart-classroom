import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { GraduationCap, Mail, Lock, Eye, EyeOff, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (email, password) => {
    setForm({ email, password });
  };

  return (
    <div className="min-h-screen flex bg-dark-950 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-primary-600/5 rounded-full blur-2xl animate-pulse-slow" style={{ animationDelay: '0.8s' }} />
      </div>

      {/* Left panel - branding */}
      <div className="hidden lg:flex flex-1 items-center justify-center relative p-12">
        <div className="max-w-lg animate-fade-in">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-500/30">
              <GraduationCap className="w-9 h-9 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-extrabold gradient-text">SmartClass</h1>
              <p className="text-dark-400 font-medium">AI-Powered Scheduler</p>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-dark-100 mb-4">Intelligent Classroom Management</h2>
          <p className="text-dark-400 text-lg leading-relaxed mb-8">
            Experience the future of education with AI-driven timetable scheduling, smart classroom recommendations, and real-time conflict detection.
          </p>
          <div className="space-y-4">
            {[
              { icon: '🤖', text: 'AI-powered auto timetable generation' },
              { icon: '⚡', text: 'Real-time conflict detection & resolution' },
              { icon: '🏫', text: 'Smart classroom recommendations' },
              { icon: '📊', text: 'Attendance analytics & insights' },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3 text-dark-300">
                <span className="text-xl">{f.icon}</span>
                <span>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - login form */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-md animate-slide-up">
          <div className="glass-card p-8">
            <div className="lg:hidden flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                <GraduationCap className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold gradient-text">SmartClass</h1>
                <p className="text-xs text-dark-400">AI Scheduler</p>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-dark-100">Welcome back</h2>
              <p className="text-dark-400 mt-1">Sign in to your account</p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="input-field pl-11" placeholder="Enter your email" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                  <input type={showPass ? 'text' : 'password'} value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="input-field pl-11 pr-11" placeholder="Enter your password" required />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-200">
                    {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Sparkles className="w-5 h-5" /> Sign In</>}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-dark-400 text-sm">Don't have an account? <Link to="/register" className="text-primary-400 hover:text-primary-300 font-medium">Sign Up</Link></p>
            </div>

            {/* Quick login */}
            <div className="mt-6 pt-6 border-t border-dark-700/50">
              <p className="text-xs text-dark-500 mb-3 text-center">Quick Demo Login</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Admin', email: 'admin@smartclass.edu', pass: 'admin123' },
                  { label: 'Faculty', email: 'dr.kumar@smartclass.edu', pass: 'faculty123' },
                  { label: 'Student', email: 'aarav.patel@smartclass.edu', pass: 'student123' },
                ].map((d) => (
                  <button key={d.label} type="button" onClick={() => quickLogin(d.email, d.pass)}
                    className="px-3 py-2 text-xs font-medium rounded-lg bg-dark-700/50 text-dark-300 hover:bg-dark-600/50 hover:text-dark-100 transition-all border border-dark-600/50">
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
