import { useState, useEffect } from 'react';
import api from '../api/client.js';

const EVENT_TYPES = ['milestone', 'memory', 'achievement', 'note', 'event'];

export default function Timeline() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ event_type: 'milestone', title: '', description: '', date: '', importance: 5 });

  useEffect(() => { loadEvents(); }, []);

  const loadEvents = async () => {
    try {
      const d = await api.get('/features/timeline');
      setEvents(d.events || d);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const createEvent = async () => {
    if (!form.title.trim() || !form.date) return;
    await api.request('/features/timeline', { method: 'POST', body: JSON.stringify({ ...form, importance: parseInt(form.importance) }) });
    setShowForm(false);
    setForm({ event_type: 'milestone', title: '', description: '', date: '', importance: 5 });
    loadEvents();
  };

  const deleteEvent = async (id) => {
    await api.del(`/features/timeline/${id}`);
    loadEvents();
  };

  const grouped = events.reduce((acc, e) => {
    const key = e.date || e.created_at?.split('T')[0] || 'Unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(e);
    return acc;
  }, {});
  const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a));

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="min-h-screen p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">📅 Timeline</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm px-4 py-2">{showForm ? 'Cancel' : '+ New Event'}</button>
      </div>

      {showForm && (
        <div className="glass rounded-xl p-5 mb-6 animate-fade-in">
          <h3 className="font-semibold mb-4">Add Event</h3>
          <div className="space-y-3">
            <select value={form.event_type} onChange={e => setForm(f => ({ ...f, event_type: e.target.value }))} className="input w-full">
              {EVENT_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Event title" className="input w-full" />
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Description" rows={2} className="input w-full" />
            <div className="flex gap-3">
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="input flex-1" />
              <div className="flex items-center gap-2 flex-1">
                <span className="text-sm text-gray-400">Importance: {form.importance}/10</span>
                <input type="range" min="1" max="10" value={form.importance} onChange={e => setForm(f => ({ ...f, importance: e.target.value }))} className="w-20" />
              </div>
            </div>
            <button onClick={createEvent} className="btn-primary w-full" disabled={!form.title.trim() || !form.date}>Save Event</button>
          </div>
        </div>
      )}

      {events.length === 0 && <div className="text-center py-16 text-gray-500">No timeline events yet. Add your first milestone!</div>}

      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-surface-600" />
        {sortedDates.map(date => (
          <div key={date}>
            <div className="flex items-center gap-3 mb-4 mt-6 first:mt-0">
              <div className="w-9 h-9 rounded-full bg-brand-500/20 border-2 border-brand-500 flex items-center justify-center text-xs font-bold text-brand-400 z-10">📅</div>
              <h2 className="text-sm font-semibold text-gray-400">{new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</h2>
            </div>
            <div className="space-y-3 ml-6">
              {grouped[date].map(e => (
                <div key={e.id} className="glass rounded-xl p-4 ml-4 group">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-surface-600 text-gray-300 capitalize">{e.event_type}</span>
                        <span className="text-yellow-400 text-xs">{'★'.repeat(Math.min(e.importance || 1, 10))}</span>
                      </div>
                      <h3 className="font-medium">{e.title}</h3>
                      {e.description && <p className="text-sm text-gray-400 mt-1">{e.description}</p>}
                      <span className="text-xs text-gray-500 mt-2 block">{e.date || e.created_at?.split('T')[0]}</span>
                    </div>
                    <button onClick={() => deleteEvent(e.id)} className="opacity-0 group-hover:opacity-100 text-xs text-red-400 hover:text-red-300 transition-all ml-3">🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
