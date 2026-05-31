import { useState, useEffect } from 'react';
import api from '../api/client.js';

const FILE_TYPES = ['All', 'Notes', 'Documents', 'Research'];
const FILE_ICONS = { notes: '📝', documents: '📄', research: '🔬' };

export default function KnowledgeBase() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ title: '', content: '', file_type: 'notes', tags: '' });
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('All');

  useEffect(() => { loadItems(); }, []);

  const loadItems = async () => {
    try {
      const d = await api.get('/features/knowledge-base');
      setItems(d.items || d);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const resetForm = () => {
    setForm({ title: '', content: '', file_type: 'notes', tags: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const saveItem = async () => {
    if (!form.title.trim() || !form.content.trim()) return;
    const tags = form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
    const payload = { ...form, tags };
    if (editingId) {
      await api.put(`/features/knowledge-base/${editingId}`, payload);
    } else {
      await api.request('/features/knowledge-base', { method: 'POST', body: JSON.stringify(payload) });
    }
    resetForm();
    loadItems();
  };

  const deleteItem = async (id) => {
    await api.del(`/features/knowledge-base/${id}`);
    loadItems();
  };

  const startEdit = (item) => {
    setForm({ title: item.title, content: item.content, file_type: item.file_type, tags: (item.tags || []).join(', ') });
    setEditingId(item.id);
    setShowForm(true);
  };

  const filtered = items.filter(item => {
    if (filterType !== 'All' && item.file_type !== filterType.toLowerCase()) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return item.title.toLowerCase().includes(q) || item.content.toLowerCase().includes(q) || (item.tags || []).some(t => t.toLowerCase().includes(q));
  });

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="min-h-screen p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">📚 Knowledge Base</h1>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }} className="btn-primary text-sm px-4 py-2">{showForm ? 'Cancel' : '+ New Item'}</button>
      </div>

      {showForm && (
        <div className="glass rounded-xl p-5 mb-6 animate-fade-in">
          <h3 className="font-semibold mb-4">{editingId ? 'Edit Item' : 'New Item'}</h3>
          <div className="space-y-3">
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Title" className="input w-full" />
            <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Content" rows={4} className="input w-full" />
            <div className="flex gap-3">
              <select value={form.file_type} onChange={e => setForm(f => ({ ...f, file_type: e.target.value }))} className="input flex-1">
                <option value="notes">Notes</option>
                <option value="documents">Documents</option>
                <option value="research">Research</option>
              </select>
              <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="Tags (comma separated)" className="input flex-1" />
            </div>
            <button onClick={saveItem} className="btn-primary w-full" disabled={!form.title.trim() || !form.content.trim()}>{editingId ? 'Update' : 'Save'} Item</button>
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-4 flex-wrap">
        {FILE_TYPES.map(t => (
          <button key={t} onClick={() => setFilterType(t)} className={`text-sm px-3 py-1.5 rounded-full transition-colors ${filterType === t ? 'bg-brand-600/20 text-brand-400 border border-brand-500/30' : 'bg-surface-700 text-gray-400 hover:text-white'}`}>
            {t}
          </button>
        ))}
      </div>

      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search knowledge base..." className="input w-full mb-6" />

      {filtered.length === 0 && (
        <div className="text-center py-16 text-gray-500">{search || filterType !== 'All' ? 'No items match your filters.' : 'No knowledge items yet. Start building your library!'}</div>
      )}

      <div className="space-y-3">
        {filtered.map(item => (
          <div key={item.id} className="glass rounded-xl p-4 group">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-3 flex-1">
                <span className="text-xl">{FILE_ICONS[item.file_type] || '📄'}</span>
                <div>
                  <h3 className="font-medium">{item.title}</h3>
                  <span className="text-xs text-gray-500 capitalize">{item.file_type}</span>
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                <button onClick={() => startEdit(item)} className="text-xs p-1 text-gray-400 hover:text-white">✏️</button>
                <button onClick={() => deleteItem(item.id)} className="text-xs p-1 text-gray-400 hover:text-red-400">🗑️</button>
              </div>
            </div>
            <p className="text-sm text-gray-300 whitespace-pre-wrap line-clamp-3">{item.content}</p>
            {item.tags?.length > 0 && (
              <div className="flex gap-1.5 mt-3 flex-wrap">
                {item.tags.map(t => <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-brand-600/20 text-brand-400">#{t}</span>)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
