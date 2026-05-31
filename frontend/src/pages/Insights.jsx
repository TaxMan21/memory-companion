import { useState, useEffect } from 'react';
import api from '../api/client.js';

export default function Insights() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/features/insights').then(d => setData(d)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full" /></div>;

  const stats = [
    { icon: '🧠', label: 'Total Memories', value: data?.totalMemories ?? data?.memories ?? 0 },
    { icon: '📖', label: 'Journal Entries', value: data?.totalJournalEntries ?? data?.journalEntries ?? 0 },
    { icon: '✅', label: 'Tasks', value: data?.totalTasks ?? data?.tasks ?? 0 },
    { icon: '🎯', label: 'Active Goals', value: data?.activeGoals ?? data?.goals ?? 0 },
  ];

  const taskCompletion = data?.taskCompletionRate ?? data?.taskRate ?? 0;
  const goalCompletion = data?.goalCompletionRate ?? data?.goalRate ?? 0;
  const moodData = data?.moodTrend ?? data?.moods ?? [];
  const topTags = data?.topTags ?? data?.tags ?? [];
  const recentActivity = data?.recentActivity ?? data?.activity ?? [];

  const maxMood = Math.max(...moodData.map(m => m.count || m.value || 0), 1);
  const maxActivity = Math.max(...recentActivity.map(a => a.count || a.value || 0), 1);

  return (
    <div className="min-h-screen p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">📊 Insights</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {stats.map(s => (
          <div key={s.label} className="glass rounded-xl p-5 text-center">
            <div className="text-3xl mb-2">{s.icon}</div>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-sm text-gray-400">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="glass rounded-xl p-5">
          <h3 className="font-semibold mb-4">📈 Completion Rates</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1"><span className="text-gray-400">Tasks</span><span>{Math.round(taskCompletion)}%</span></div>
              <div className="h-3 bg-surface-600 rounded-full overflow-hidden">
                <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${Math.min(taskCompletion, 100)}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1"><span className="text-gray-400">Goals</span><span>{Math.round(goalCompletion)}%</span></div>
              <div className="h-3 bg-surface-600 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${Math.min(goalCompletion, 100)}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className="glass rounded-xl p-5">
          <h3 className="font-semibold mb-4">😊 Mood Trend</h3>
          {moodData.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No mood data yet.</p>
          ) : (
            <div className="flex items-end gap-2 h-32">
              {moodData.map((m, i) => {
                const val = m.count || m.value || 0;
                const pct = (val / maxMood) * 100;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full bg-brand-500/20 rounded-t-md" style={{ height: `${pct}%`, minHeight: 4 }}>
                      <div className="w-full h-full bg-brand-500 rounded-t-md" style={{ height: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-gray-500 truncate w-full text-center">{m.label || m.mood || m.date || ''}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass rounded-xl p-5">
          <h3 className="font-semibold mb-4">🏷️ Top Tags</h3>
          {topTags.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No tags used yet.</p>
          ) : (
            <div className="flex gap-2 flex-wrap">
              {topTags.map(t => (
                <span key={t.tag || t.name || t} className="px-3 py-1.5 rounded-full bg-brand-600/20 text-brand-400 text-sm cursor-pointer hover:bg-brand-600/30 transition-colors">
                  #{(t.tag || t.name || t)} {t.count ? `(${t.count})` : ''}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="glass rounded-xl p-5">
          <h3 className="font-semibold mb-4">📅 Last 30 Days</h3>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No recent activity.</p>
          ) : (
            <div className="flex items-end gap-1 h-32">
              {recentActivity.map((a, i) => {
                const val = a.count || a.value || 0;
                const pct = (val / maxActivity) * 100;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <div className="w-full bg-brand-500/20 rounded-t-sm" style={{ height: `${Math.max(pct, 2)}%` }}>
                      <div className="w-full h-full bg-gradient-to-t from-brand-500 to-brand-400 rounded-t-sm" style={{ height: `${pct}%` }} />
                    </div>
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-surface-700 text-xs text-white px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity">
                      {a.label || a.date || ''}: {val}
                    </div>
                    <span className="text-xs text-gray-500 truncate w-full text-center" style={{ fontSize: 8 }}>{a.label || a.date ? (a.label || a.date).slice(-5) : ''}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
