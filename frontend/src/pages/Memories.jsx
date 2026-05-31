import { useState, useEffect } from 'react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Memories() {
  const { user } = useAuth();
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ title: '', content: '', mood: '', tags: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const isActive = user.subscription_status === 'active';
  const canCreate = isActive || memories.length < 5;

  const loadMemories = async () => {
    try {
      const { memories: m } = await api.getMemories();
      setMemories(m);
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadMemories(); }, []);

  const resetForm = () => {
    setForm({ title: '', content: '', mood: '', tags: '' });
    setError('');
    setEditingId(null);
    setShowCreate(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      setError('Title and content are required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const tags = form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
      if (editingId) {
        await api.updateMemory(editingId, { title: form.title, content: form.content, mood: form.mood || null, tags });
      } else {
        await api.createMemory(form.title, form.content, form.mood || null, tags);
      }
      resetForm();
      await loadMemories();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (m) => {
    setForm({ title: m.title, content: m.content, mood: m.mood || '', tags: (m.tags || []).join(', ') });
    setEditingId(m.id);
    setShowCreate(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this memory?')) return;
    try {
      await api.deleteMemory(id);
      await loadMemories();
    } catch {}
  };

  const filtered = memories.filter(m =>
    m.title.toLowerCase().includes(search.toLowerCase()) ||
    m.content.toLowerCase().includes(search.toLowerCase()) ||
    (m.tags || []).some(t => t.toLowerCase().includes(search.toLowerCase()))
  );

  const moods = ['', 'happy', 'sad', 'reflective', 'excited', 'grateful', 'anxious', 'calm', 'loved'];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16">
        <div className="animate-spin h-8 w-8 border-2 border-brand-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Memories</h1>
          <p className="text-gray-400 mt-1">{memories.length} memories preserved · <Link to="/memory-vault" className="text-brand-400">Open Vault</Link></p>
        </div>
        {canCreate && !showCreate && (
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            + New Memory
          </button>
        )}
      </div>

      {!canCreate && !showCreate && (
        <div className="bg-amber-600/10 border border-amber-500/20 rounded-2xl p-4 mb-6 text-sm text-amber-300">
          Trial limit reached. Subscribe for unlimited memories.
        </div>
      )}

      {showCreate && (
        <form onSubmit={handleCreate} className="card mb-8 animate-fade-in">
          <h2 className="text-xl font-semibold mb-4">{editingId ? 'Edit Memory' : 'New Memory'}</h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3 mb-4">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <input
              className="input-field"
              placeholder="Memory title"
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              maxLength={200}
              required
              autoFocus
            />
            <textarea
              className="input-field min-h-[160px] resize-none"
              placeholder="Write your memory..."
              value={form.content}
              onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
              maxLength={10000}
              required
            />
            <div className="flex gap-4 flex-wrap">
              <select
                className="input-field w-auto"
                value={form.mood}
                onChange={e => setForm(p => ({ ...p, mood: e.target.value }))}
              >
                {moods.map(m => (
                  <option key={m} value={m}>{m ? m.charAt(0).toUpperCase() + m.slice(1) : 'No mood'}</option>
                ))}
              </select>
              <input
                className="input-field flex-1"
                placeholder="Tags (comma separated)"
                value={form.tags}
                onChange={e => setForm(p => ({ ...p, tags: e.target.value }))}
              />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Saving...' : editingId ? 'Update' : 'Save Memory'}
              </button>
              <button type="button" onClick={resetForm} className="btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      <input
        className="input-field mb-6"
        placeholder="Search memories..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {filtered.length === 0 && (
        <div className="text-center py-20 text-gray-500">
          {search ? 'No memories match your search.' : 'No memories yet. Create your first one!'}
        </div>
      )}

      <div className="space-y-4">
        {filtered.map(m => (
          <div key={m.id} className="card hover:border-brand-500/30 transition-all duration-300">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold text-lg">{m.title}</h3>
                {m.mood && (
                  <span className="text-xs capitalize px-2.5 py-0.5 rounded-full bg-surface-700 text-gray-300">
                    {m.mood}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleEdit(m)} className="btn-ghost text-xs">Edit</button>
                <button onClick={() => handleDelete(m.id)} className="btn-ghost text-xs text-red-400 hover:text-red-300">Delete</button>
              </div>
            </div>
            <p className="text-gray-300 whitespace-pre-wrap">{m.content}</p>
            <div className="flex items-center justify-between mt-4">
              <div className="flex gap-2 flex-wrap">
                {(m.tags || []).map(t => (
                  <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-brand-600/20 text-brand-400">
                    #{t}
                  </span>
                ))}
              </div>
              <span className="text-xs text-gray-500">{m.created_at?.split('T')[0]}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
