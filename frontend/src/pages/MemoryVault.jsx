import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client.js';

const CATEGORIES = [
  { id: 'personal', label: 'Personal', icon: '👤', color: 'bg-blue-500/20 text-blue-300' },
  { id: 'work', label: 'Work', icon: '💼', color: 'bg-purple-500/20 text-purple-300' },
  { id: 'family', label: 'Family', icon: '👨‍👩‍👧‍👦', color: 'bg-green-500/20 text-green-300' },
  { id: 'health', label: 'Health', icon: '🏥', color: 'bg-red-500/20 text-red-300' },
  { id: 'education', label: 'Education', icon: '📚', color: 'bg-yellow-500/20 text-yellow-300' },
  { id: 'finance', label: 'Finance', icon: '💰', color: 'bg-emerald-500/20 text-emerald-300' },
  { id: 'goals', label: 'Goals', icon: '🎯', color: 'bg-orange-500/20 text-orange-300' }
];

export default function MemoryVault() {
  const [memories, setMemories] = useState([]);
  const [pinned, setPinned] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/memories'),
      api.get('/features/pinned-memories')
    ]).then(([m, p]) => {
      setMemories(m.memories);
      setPinned(p.memories);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const togglePin = async (id) => {
    await api.request(`/features/pin-memory/${id}`, { method: 'POST' });
    const [m, p] = await Promise.all([api.get('/memories'), api.get('/features/pinned-memories')]);
    setMemories(m.memories);
    setPinned(p.memories);
  };

  const deleteMemory = async (id) => {
    await api.del(`/memories/${id}`);
    setMemories(m => m.filter(x => x.id !== id));
    setPinned(p => p.filter(x => x.id !== id));
  };

  const filtered = memories.filter(m => {
    if (search && !m.title.toLowerCase().includes(search.toLowerCase()) && !m.content.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === 'pinned') return pinned.some(p => p.id === m.id);
    if (filter !== 'all') {
      const tags = m.tags || [];
      return tags.includes(filter) || m.mood === filter;
    }
    return true;
  });

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="min-h-screen p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Memory Vault</h1>
        <Link to="/memories" className="btn-primary text-sm px-4 py-2">+ New Memory</Link>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-3 mb-6">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search memories..." className="input flex-1" />
        <select value={filter} onChange={e => setFilter(e.target.value)} className="input w-40">
          <option value="all">All Memories</option>
          <option value="pinned">Pinned</option>
          {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
      </div>

      {/* Pinned Section */}
      {pinned.length > 0 && filter === 'all' && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">📌 Pinned</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pinned.map(m => <MemoryCard key={m.id} memory={m} pinned={true} onPin={togglePin} onDelete={deleteMemory} />)}
          </div>
        </div>
      )}

      {/* All Memories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.filter(m => filter !== 'all' || !pinned.some(p => p.id === m.id)).map(m => (
          <MemoryCard key={m.id} memory={m} pinned={pinned.some(p => p.id === m.id)} onPin={togglePin} onDelete={deleteMemory} />
        ))}
      </div>

      {filtered.length === 0 && <div className="text-center py-16 text-gray-500">No memories found</div>}
    </div>
  );
}

function MemoryCard({ memory, pinned, onPin, onDelete }) {
  return (
    <div className="glass rounded-xl p-4 hover:bg-surface-700/50 transition-colors group">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {pinned && <span className="text-xs">📌</span>}
            <h3 className="font-medium truncate">{memory.title}</h3>
          </div>
          {memory.mood && <span className="text-xs text-gray-500">{memory.mood}</span>}
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onPin(memory.id)} className="p-1.5 rounded-lg hover:bg-surface-600 text-xs">{pinned ? '📌' : '📍'}</button>
          <Link to={`/memories?edit=${memory.id}`} className="p-1.5 rounded-lg hover:bg-surface-600 text-xs">✏️</Link>
          <button onClick={() => onDelete(memory.id)} className="p-1.5 rounded-lg hover:bg-surface-600 text-xs">🗑️</button>
        </div>
      </div>
      <p className="text-sm text-gray-400 line-clamp-2">{memory.content}</p>
      <div className="flex items-center gap-2 mt-2">
        {memory.tags?.map(t => <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-surface-600 text-gray-300">{t}</span>)}
      </div>
      <div className="text-xs text-gray-600 mt-2">{new Date(memory.created_at).toLocaleDateString()}</div>
    </div>
  );
}
