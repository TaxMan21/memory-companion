import { useState, useEffect } from 'react';
import api from '../api/client.js';

const FILTERS = ['All', 'Pending', 'In Progress', 'Completed'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const PRIORITY_COLORS = { low: 'bg-green-500', medium: 'bg-yellow-500', high: 'bg-orange-500', urgent: 'bg-red-500' };

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filter, setFilter] = useState('All');
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', due_date: '', category: '', is_recurring: false });

  useEffect(() => { loadTasks(); }, []);

  const loadTasks = async () => {
    try {
      const d = await api.get('/features/tasks');
      setTasks(d.tasks || d);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const resetForm = () => {
    setForm({ title: '', description: '', priority: 'medium', due_date: '', category: '', is_recurring: false });
    setEditingId(null);
    setShowForm(false);
  };

  const saveTask = async () => {
    if (!form.title.trim()) return;
    const payload = { ...form, due_date: form.due_date || null, category: form.category || null };
    if (editingId) {
      await api.put(`/features/tasks/${editingId}`, payload);
    } else {
      await api.request('/features/tasks', { method: 'POST', body: JSON.stringify(payload) });
    }
    resetForm();
    loadTasks();
  };

  const toggleComplete = async (task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    await api.put(`/features/tasks/${task.id}`, { status: newStatus });
    loadTasks();
  };

  const deleteTask = async (id) => {
    await api.del(`/features/tasks/${id}`);
    loadTasks();
  };

  const startEdit = (task) => {
    setForm({ title: task.title, description: task.description || '', priority: task.priority, due_date: task.due_date || '', category: task.category || '', is_recurring: task.is_recurring || false });
    setEditingId(task.id);
    setShowForm(true);
  };

  const sorted = [...tasks].sort((a, b) => {
    const pOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    const diff = (pOrder[a.priority] ?? 99) - (pOrder[b.priority] ?? 99);
    if (diff !== 0) return diff;
    if (a.due_date && b.due_date) return new Date(a.due_date) - new Date(b.due_date);
    if (a.due_date) return -1;
    if (b.due_date) return 1;
    return 0;
  });

  const filtered = sorted.filter(t => {
    if (filter === 'All') return true;
    if (filter === 'Pending') return t.status === 'pending';
    if (filter === 'In Progress') return t.status === 'in_progress';
    if (filter === 'Completed') return t.status === 'completed';
    return true;
  });

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="min-h-screen p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">✅ Tasks</h1>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }} className="btn-primary text-sm px-4 py-2">{showForm ? 'Cancel' : '+ New Task'}</button>
      </div>

      {showForm && (
        <div className="glass rounded-xl p-5 mb-6 animate-fade-in">
          <h3 className="font-semibold mb-4">{editingId ? 'Edit Task' : 'New Task'}</h3>
          <div className="space-y-3">
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Task title" className="input w-full" />
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Description" rows={2} className="input w-full" />
            <div className="flex gap-3">
              <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} className="input flex-1">
                {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
              <input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} className="input flex-1" />
            </div>
            <div className="flex gap-3 items-center">
              <input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="Category" className="input flex-1" />
              <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                <input type="checkbox" checked={form.is_recurring} onChange={e => setForm(f => ({ ...f, is_recurring: e.target.checked }))} className="w-4 h-4" />
                Recurring
              </label>
            </div>
            <button onClick={saveTask} className="btn-primary w-full" disabled={!form.title.trim()}>{editingId ? 'Update' : 'Save'} Task</button>
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-4 flex-wrap">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`text-sm px-3 py-1.5 rounded-full transition-colors ${filter === f ? 'bg-brand-600/20 text-brand-400 border border-brand-500/30' : 'bg-surface-700 text-gray-400 hover:text-white'}`}>
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 && <div className="text-center py-16 text-gray-500">{filter !== 'All' ? `No ${filter.toLowerCase()} tasks.` : 'No tasks yet. Create your first task!'}</div>}

      <div className="space-y-2">
        {filtered.map(t => (
          <div key={t.id} className="glass rounded-xl p-4 group">
            <div className="flex items-start gap-3">
              <input type="checkbox" checked={t.status === 'completed'} onChange={() => toggleComplete(t)} className="w-5 h-5 mt-0.5 cursor-pointer" />
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className={`font-medium ${t.status === 'completed' ? 'line-through text-gray-500' : ''}`}>{t.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`w-2 h-2 rounded-full ${PRIORITY_COLORS[t.priority] || 'bg-gray-500'}`} />
                      <span className="text-xs capitalize text-gray-400">{t.priority}</span>
                      {t.category && <span className="text-xs px-2 py-0.5 rounded-full bg-surface-600 text-gray-300">{t.category}</span>}
                      {t.is_recurring && <span className="text-xs text-brand-400">🔄</span>}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => startEdit(t)} className="text-xs p-1 text-gray-400 hover:text-white">✏️</button>
                    <button onClick={() => deleteTask(t.id)} className="text-xs p-1 text-gray-400 hover:text-red-400">🗑️</button>
                  </div>
                </div>
                {t.description && <p className="text-sm text-gray-400 mt-1">{t.description}</p>}
                {t.due_date && <div className="text-xs text-gray-500 mt-2">Due: {new Date(t.due_date).toLocaleDateString()}</div>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
