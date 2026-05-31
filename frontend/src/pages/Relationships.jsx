import { useState, useEffect } from 'react';
import api from '../api/client.js';

const RELATION_TYPES = ['family', 'friend', 'colleague', 'partner', 'mentor', 'other'];

export default function Relationships() {
  const [relationships, setRelationships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', relation_type: 'friend', email: '', phone: '', notes: '', important_date: '', date_label: '' });
  const [expandedId, setExpandedId] = useState(null);
  const [interactions, setInteractions] = useState([]);

  useEffect(() => { loadRelationships(); }, []);

  const loadRelationships = async () => {
    try {
      const d = await api.get('/features/relationships');
      setRelationships(d.relationships || d);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const loadInteractions = async (id) => {
    try {
      const d = await api.get(`/features/relationships/${id}/interactions`);
      setInteractions(d.interactions || d);
    } catch { setInteractions([]); }
  };

  const toggleExpand = (id) => {
    if (expandedId === id) { setExpandedId(null); setInteractions([]); return; }
    setExpandedId(id);
    loadInteractions(id);
  };

  const resetForm = () => {
    setForm({ name: '', relation_type: 'friend', email: '', phone: '', notes: '', important_date: '', date_label: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const saveRelationship = async () => {
    if (!form.name.trim()) return;
    const payload = { ...form, email: form.email || null, phone: form.phone || null, notes: form.notes || null, important_date: form.important_date || null, date_label: form.date_label || null };
    if (editingId) {
      await api.put(`/features/relationships/${editingId}`, payload);
    } else {
      await api.request('/features/relationships', { method: 'POST', body: JSON.stringify(payload) });
    }
    resetForm();
    loadRelationships();
  };

  const deleteRelationship = async (id) => {
    await api.del(`/features/relationships/${id}`);
    if (expandedId === id) { setExpandedId(null); setInteractions([]); }
    loadRelationships();
  };

  const startEdit = (r) => {
    setForm({ name: r.name, relation_type: r.relation_type, email: r.email || '', phone: r.phone || '', notes: r.notes || '', important_date: r.important_date || '', date_label: r.date_label || '' });
    setEditingId(r.id);
    setShowForm(true);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="min-h-screen p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">🤝 Relationships</h1>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }} className="btn-primary text-sm px-4 py-2">{showForm ? 'Cancel' : '+ New Contact'}</button>
      </div>

      {showForm && (
        <div className="glass rounded-xl p-5 mb-6 animate-fade-in">
          <h3 className="font-semibold mb-4">{editingId ? 'Edit Contact' : 'New Contact'}</h3>
          <div className="space-y-3">
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Name" className="input w-full" />
            <select value={form.relation_type} onChange={e => setForm(f => ({ ...f, relation_type: e.target.value }))} className="input w-full">
              {RELATION_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
            <div className="flex gap-3">
              <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="Email" type="email" className="input flex-1" />
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="Phone" className="input flex-1" />
            </div>
            <div className="flex gap-3">
              <input type="date" value={form.important_date} onChange={e => setForm(f => ({ ...f, important_date: e.target.value }))} className="input flex-1" />
              <input value={form.date_label} onChange={e => setForm(f => ({ ...f, date_label: e.target.value }))} placeholder="Date label (e.g. Birthday)" className="input flex-1" />
            </div>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Notes" rows={2} className="input w-full" />
            <button onClick={saveRelationship} className="btn-primary w-full" disabled={!form.name.trim()}>{editingId ? 'Update' : 'Save'} Contact</button>
          </div>
        </div>
      )}

      {relationships.length === 0 && <div className="text-center py-16 text-gray-500">No contacts yet. Add your first relationship!</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {relationships.map(r => (
          <div key={r.id} className="glass rounded-xl p-4 cursor-pointer hover:border-brand-500/30 transition-all" onClick={() => toggleExpand(r.id)}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-medium">{r.name}</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-surface-600 text-gray-300 capitalize">{r.relation_type}</span>
              </div>
              <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                {expandedId === r.id && <button onClick={() => startEdit(r)} className="text-xs p-1 text-gray-400 hover:text-white">✏️</button>}
                {expandedId === r.id && <button onClick={() => deleteRelationship(r.id)} className="text-xs p-1 text-gray-400 hover:text-red-400">🗑️</button>}
              </div>
            </div>
            <div className="text-xs text-gray-400 space-y-0.5">
              {r.email && <div>📧 {r.email}</div>}
              {r.phone && <div>📞 {r.phone}</div>}
            </div>

            {expandedId === r.id && (
              <div className="mt-3 pt-3 border-t border-surface-600 animate-fade-in" onClick={e => e.stopPropagation()}>
                {r.important_date && (
                  <div className="text-xs text-gray-400 mb-2">
                    📌 {r.date_label || 'Important Date'}: {new Date(r.important_date).toLocaleDateString()}
                  </div>
                )}
                {r.notes && <p className="text-sm text-gray-300 mb-3">{r.notes}</p>}
                <div>
                  <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">Interaction History</h4>
                  {interactions.length === 0 ? (
                    <p className="text-xs text-gray-500">No interactions recorded.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {interactions.map(i => (
                        <div key={i.id} className="text-xs bg-surface-700/50 rounded-lg p-2">
                          <div className="flex justify-between">
                            <span className="text-gray-300">{i.notes || i.type || 'Interaction'}</span>
                            <span className="text-gray-500">{new Date(i.date || i.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
