import { useState, useEffect } from 'react';
import api from '../api/client.js';

const MOODS = ['😊 Happy', '😌 Calm', '😢 Sad', '😠 Angry', '😰 Anxious', '🤔 Thoughtful', '🥱 Tired', '⚡ Energetic', '💖 Grateful', '😐 Neutral'];

export default function Journal() {
  const [entries, setEntries] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', mood: '', mood_score: 5, tags: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadEntries(); }, []);

  const loadEntries = async () => {
    try { const d = await api.get('/features/journal'); setEntries(d.entries); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const createEntry = async () => {
    await api.request('/features/journal', { method: 'POST', body: JSON.stringify({ ...form, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean) }) });
    setShowForm(false);
    setForm({ title: '', content: '', mood: '', mood_score: 5, tags: '' });
    loadEntries();
  };

  const deleteEntry = async (id) => {
    await api.del(`/features/journal/${id}`);
    loadEntries();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="min-h-screen p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">📖 Journal</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm px-4 py-2">{showForm ? 'Cancel' : '+ New Entry'}</button>
      </div>

      {showForm && (
        <div className="glass rounded-xl p-5 mb-6 animate-fade-in">
          <div className="space-y-3">
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Title (optional)" className="input w-full" />
            <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Write your thoughts..." rows={5} className="input w-full" />
            <div className="flex gap-3 flex-wrap">
              <select value={form.mood} onChange={e => setForm(f => ({ ...f, mood: e.target.value }))} className="input">
                <option value="">Mood</option>
                {MOODS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Mood: {form.mood_score}/10</span>
                <input type="range" min="1" max="10" value={form.mood_score} onChange={e => setForm(f => ({ ...f, mood_score: parseInt(e.target.value) }))} className="w-24" />
              </div>
              <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="Tags (comma-separated)" className="input flex-1" />
            </div>
            <button onClick={createEntry} className="btn-primary w-full" disabled={!form.content.trim()}>Save Entry</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {entries.map(e => (
          <div key={e.id} className="glass rounded-xl p-4 group">
            <div className="flex items-start justify-between mb-2">
              <div>
                {e.title && <h3 className="font-medium">{e.title}</h3>}
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{new Date(e.created_at).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  {e.mood && <span>{e.mood}</span>}
                  {e.mood_score && <span>· {e.mood_score}/10</span>}
                </div>
              </div>
              <button onClick={() => deleteEntry(e.id)} className="opacity-0 group-hover:opacity-100 text-xs text-gray-500 hover:text-red-400 transition-all">🗑️</button>
            </div>
            <p className="text-sm text-gray-300 whitespace-pre-wrap">{e.content}</p>
            {e.tags?.length > 0 && (
              <div className="flex gap-1 mt-2">
                {e.tags.map(t => <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-surface-600 text-gray-300">{t}</span>)}
              </div>
            )}
          </div>
        ))}
      </div>

      {entries.length === 0 && <div className="text-center py-16 text-gray-500">No journal entries yet. Start writing your thoughts!</div>}
    </div>
  );
}
