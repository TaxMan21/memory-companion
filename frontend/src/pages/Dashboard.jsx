import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quickNote, setQuickNote] = useState('');

  useEffect(() => {
    api.get('/features/dashboard').then(d => setData(d)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const addQuickNote = async () => {
    if (!quickNote.trim()) return;
    await api.request('/features/quick-notes', { method: 'POST', body: JSON.stringify({ content: quickNote.trim() }) });
    setQuickNote('');
    api.get('/features/dashboard').then(d => setData(d));
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="min-h-screen p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, {user?.name}</h1>
          <p className="text-gray-400 text-sm">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
        <Link to="/daily-briefing" className="btn-primary text-sm px-4 py-2">Daily Briefing</Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Today's Summary */}
        <div className="glass rounded-xl p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2">📊 Today's Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm"><span className="text-gray-400">Memories</span><span className="font-medium">{data?.memoryCount || 0}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-400">Tasks</span><span className="font-medium">{data?.pendingTasks?.length || 0}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-400">Active Goals</span><span className="font-medium">{data?.activeGoals?.length || 0}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-400">Journal Today</span><span className="font-medium">{data?.journalToday ? '✅' : '—'}</span></div>
          </div>
        </div>

        {/* Quick Note */}
        <div className="glass rounded-xl p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2">📝 Quick Note</h3>
          <textarea value={quickNote} onChange={e => setQuickNote(e.target.value)} placeholder="What's on your mind?" rows={3} className="input w-full text-sm mb-2" onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), addQuickNote())} />
          <button onClick={addQuickNote} className="btn-primary text-sm w-full py-1.5" disabled={!quickNote.trim()}>Save Note</button>
          {data?.quickNotes?.length > 0 && <div className="mt-3 text-xs text-gray-500">Last: {data.quickNotes[0].content.substring(0, 60)}...</div>}
        </div>

        {/* Recent Memories */}
        <div className="glass rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold flex items-center gap-2">🧠 Recent Memories</h3>
            <Link to="/memories" className="text-xs text-brand-400">View all</Link>
          </div>
          {data?.recentMemories?.length === 0 ? <p className="text-sm text-gray-500">No memories yet. <Link to="/memories" className="text-brand-400">Create one</Link></p> :
            <div className="space-y-2">
              {data?.recentMemories?.slice(0, 4).map(m => (
                <Link key={m.id} to="/memories" className="block p-2 rounded-lg bg-surface-700/50 hover:bg-surface-700 transition-colors">
                  <div className="text-sm font-medium truncate">{m.title}</div>
                  <div className="text-xs text-gray-500">{m.mood && `${m.mood} · `}{new Date(m.created_at).toLocaleDateString()}</div>
                </Link>
              ))}
            </div>
          }
        </div>

        {/* Active Goals */}
        <div className="glass rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold flex items-center gap-2">🎯 Active Goals</h3>
            <Link to="/goals" className="text-xs text-brand-400">View all</Link>
          </div>
          {data?.activeGoals?.length === 0 ? <p className="text-sm text-gray-500">No active goals. <Link to="/goals" className="text-brand-400">Set one</Link></p> :
            <div className="space-y-2">
              {data?.activeGoals?.slice(0, 3).map(g => (
                <Link key={g.id} to="/goals" className="block p-2 rounded-lg bg-surface-700/50">
                  <div className="text-sm font-medium truncate">{g.title}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 bg-surface-600 rounded-full overflow-hidden"><div className="h-full bg-brand-500 rounded-full" style={{ width: `${g.progress}%` }} /></div>
                    <span className="text-xs text-gray-400">{g.progress}%</span>
                  </div>
                </Link>
              ))}
            </div>
          }
        </div>

        {/* Upcoming Events */}
        <div className="glass rounded-xl p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2">📅 Upcoming Events</h3>
          {data?.todayEvents?.length === 0 ? <p className="text-sm text-gray-500">No events today</p> :
            <div className="space-y-2">
              {data?.todayEvents?.map(e => <div key={e.id} className="text-sm p-2 rounded-lg bg-surface-700/50">{e.title}</div>)}
            </div>
          }
        </div>

        {/* Pending Tasks */}
        <div className="glass rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold flex items-center gap-2">✅ Pending Tasks</h3>
            <Link to="/tasks" className="text-xs text-brand-400">View all</Link>
          </div>
          {data?.pendingTasks?.length === 0 ? <p className="text-sm text-gray-500">No pending tasks</p> :
            <div className="space-y-1">
              {data?.pendingTasks?.slice(0, 5).map(t => (
                <div key={t.id} className="flex items-center gap-2 text-sm p-1.5">
                  <div className={`w-2 h-2 rounded-full ${t.priority === 'urgent' ? 'bg-red-500' : t.priority === 'high' ? 'bg-orange-500' : t.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'}`} />
                  <span className="truncate flex-1">{t.title}</span>
                  {t.due_date && <span className="text-xs text-gray-500">{new Date(t.due_date).toLocaleDateString()}</span>}
                </div>
              ))}
            </div>
          }
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { to: '/memories', icon: '🧠', label: 'New Memory' },
            { to: '/ai-companion', icon: '💬', label: 'Chat with AI' },
            { to: '/journal', icon: '📖', label: 'Write Journal' },
            { to: '/goals', icon: '🎯', label: 'Set Goal' },
            { to: '/tasks', icon: '✅', label: 'Manage Tasks' },
            { to: '/timeline', icon: '📅', label: 'View Timeline' },
            { to: '/memory-vault', icon: '🗂️', label: 'Memory Vault' },
            { to: '/insights', icon: '📊', label: 'Insights' }
          ].map(a => (
            <Link key={a.to} to={a.to} className="glass rounded-xl p-4 text-center hover:bg-surface-700 transition-colors">
              <div className="text-2xl mb-1">{a.icon}</div>
              <div className="text-sm">{a.label}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
