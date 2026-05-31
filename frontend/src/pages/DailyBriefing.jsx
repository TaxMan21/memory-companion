import { useState, useEffect } from 'react';
import api from '../api/client.js';

export default function DailyBriefing() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [journalNote, setJournalNote] = useState('');

  useEffect(() => {
    api.get('/features/briefing').then(d => setData(d)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const saveJournal = async () => {
    if (!journalNote.trim()) return;
    await api.request('/features/quick-notes', { method: 'POST', body: JSON.stringify({ content: journalNote.trim() }) });
    setJournalNote('');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full" /></div>;

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const tasks = data?.tasks || data?.pendingTasks || [];
  const events = data?.events || data?.todayEvents || [];
  const goals = data?.goals || data?.activeGoals || [];
  const birthdays = data?.birthdays || data?.importantDates || [];

  return (
    <div className="min-h-screen p-6 max-w-4xl mx-auto">
      <div className="glass rounded-xl p-6 mb-6">
        <h1 className="text-3xl font-bold">☀️ Your Daily Briefing</h1>
        <p className="text-gray-400 mt-1">{today}</p>
        {data?.greeting && <p className="text-gray-300 mt-2">{data.greeting}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="glass rounded-xl p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2">✅ Tasks for Today</h3>
          {tasks.length === 0 ? (
            <p className="text-sm text-gray-500">No pending tasks. Enjoy your day!</p>
          ) : (
            <div className="space-y-2">
              {tasks.map(t => (
                <div key={t.id} className="flex items-center gap-2 text-sm p-2 rounded-lg bg-surface-700/50">
                  <div className={`w-2 h-2 rounded-full ${t.priority === 'urgent' ? 'bg-red-500' : t.priority === 'high' ? 'bg-orange-500' : t.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'}`} />
                  <span className="flex-1">{t.title}</span>
                  {t.due_date && <span className="text-xs text-gray-500">{new Date(t.due_date).toLocaleDateString()}</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass rounded-xl p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2">📅 Events Today</h3>
          {events.length === 0 ? (
            <p className="text-sm text-gray-500">No events scheduled today.</p>
          ) : (
            <div className="space-y-2">
              {events.map(e => (
                <div key={e.id} className="text-sm p-2 rounded-lg bg-surface-700/50">
                  <div className="font-medium">{e.title}</div>
                  {e.description && <div className="text-xs text-gray-400">{e.description}</div>}
                  {e.time && <div className="text-xs text-gray-500">{e.time}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="glass rounded-xl p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2">🎯 Goals Progress</h3>
          {goals.length === 0 ? (
            <p className="text-sm text-gray-500">No active goals. Set some goals to track progress!</p>
          ) : (
            <div className="space-y-3">
              {goals.map(g => (
                <div key={g.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="truncate">{g.title}</span>
                    <span className="text-gray-400">{g.progress || 0}%</span>
                  </div>
                  <div className="h-2 bg-surface-600 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${g.progress || 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass rounded-xl p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2">🎂 Birthdays & Important Dates</h3>
          {birthdays.length === 0 ? (
            <p className="text-sm text-gray-500">No important dates today.</p>
          ) : (
            <div className="space-y-2">
              {birthdays.map(b => (
                <div key={b.id} className="text-sm p-2 rounded-lg bg-surface-700/50 flex items-center gap-2">
                  <span>🎉</span>
                  <div>
                    <span className="font-medium">{b.name}</span>
                    {b.date_label && <span className="text-xs text-gray-400 ml-1">- {b.date_label}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="glass rounded-xl p-5">
        <h3 className="font-semibold mb-3 flex items-center gap-2">📝 Journal Prompt</h3>
        <p className="text-gray-300 mb-3">Have you written today? Take a moment to reflect on your day.</p>
        <div className="flex gap-3">
          <input value={journalNote} onChange={e => setJournalNote(e.target.value)} placeholder="Write a quick thought..." className="input flex-1" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), saveJournal())} />
          <button onClick={saveJournal} className="btn-primary text-sm px-4 py-2" disabled={!journalNote.trim()}>Save</button>
        </div>
      </div>
    </div>
  );
}
