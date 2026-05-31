import { useState, useEffect } from 'react';
import api from '../api/client.js';

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', category: 'personal', target_date: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadGoals(); }, []);

  const loadGoals = async () => {
    try {
      const d = await api.get('/features/goals');
      setGoals(d.goals);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const createGoal = async () => {
    await api.request('/features/goals', { method: 'POST', body: JSON.stringify(form) });
    setShowForm(false);
    setForm({ title: '', description: '', category: 'personal', target_date: '' });
    loadGoals();
  };

  const toggleMilestone = async (milestone) => {
    await api.request(`/features/milestones/${milestone.id}`, { method: 'PUT', body: JSON.stringify({ completed: !milestone.completed }) });
    loadGoals();
  };

  const updateStatus = async (id, status) => {
    await api.request(`/features/goals/${id}`, { method: 'PUT', body: JSON.stringify({ status }) });
    loadGoals();
  };

  const deleteGoal = async (id) => {
    await api.del(`/features/goals/${id}`);
    loadGoals();
  };

  const addMilestone = async (goalId) => {
    const title = prompt('Milestone title:');
    if (!title) return;
    await api.request('/features/milestones', { method: 'POST', body: JSON.stringify({ goal_id: goalId, title }) });
    loadGoals();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="min-h-screen p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">🎯 Goals & Projects</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm px-4 py-2">{showForm ? 'Cancel' : '+ New Goal'}</button>
      </div>

      {showForm && (
        <div className="glass rounded-xl p-5 mb-6 animate-fade-in">
          <h3 className="font-semibold mb-4">Create Goal</h3>
          <div className="space-y-3">
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Goal title" className="input w-full" />
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Description" rows={2} className="input w-full" />
            <div className="flex gap-3">
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="input flex-1">
                {['personal', 'health', 'career', 'education', 'finance', 'relationships', 'creative'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input type="date" value={form.target_date} onChange={e => setForm(f => ({ ...f, target_date: e.target.value }))} className="input flex-1" />
            </div>
            <button onClick={createGoal} className="btn-primary w-full" disabled={!form.title.trim()}>Create Goal</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {['active', 'paused', 'completed', 'archived'].map(status => {
          const filtered = goals.filter(g => g.status === status);
          if (filtered.length === 0) return null;
          return (
            <div key={status} className="col-span-full">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 capitalize">{status} ({filtered.length})</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filtered.map(g => (
                  <div key={g.id} className="glass rounded-xl p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium">{g.title}</h3>
                      <div className="flex gap-1">
                        {g.status === 'active' && <button onClick={() => updateStatus(g.id, 'paused')} className="text-xs p-1 text-gray-400 hover:text-white">⏸️</button>}
                        {g.status !== 'completed' && <button onClick={() => updateStatus(g.id, 'completed')} className="text-xs p-1 text-gray-400 hover:text-green-400">✅</button>}
                        <button onClick={() => deleteGoal(g.id)} className="text-xs p-1 text-gray-400 hover:text-red-400">🗑️</button>
                      </div>
                    </div>
                    {g.description && <p className="text-sm text-gray-400 mb-3">{g.description}</p>}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex-1 h-2 bg-surface-600 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${g.progress}%` }} />
                      </div>
                      <span className="text-xs text-gray-400">{g.progress}%</span>
                    </div>
                    {g.target_date && <div className="text-xs text-gray-500 mb-2">Due: {new Date(g.target_date).toLocaleDateString()}</div>}
                    <div className="space-y-1">
                      {g.milestones?.map(m => (
                        <label key={m.id} className="flex items-center gap-2 text-sm cursor-pointer">
                          <input type="checkbox" checked={!!m.completed} onChange={() => toggleMilestone(m)} className="w-4 h-4" />
                          <span className={m.completed ? 'line-through text-gray-500' : ''}>{m.title}</span>
                        </label>
                      ))}
                    </div>
                    <button onClick={() => addMilestone(g.id)} className="text-xs text-brand-400 mt-2">+ Add milestone</button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {goals.length === 0 && <div className="text-center py-16 text-gray-500">No goals yet. Create your first goal to start tracking progress!</div>}
    </div>
  );
}
