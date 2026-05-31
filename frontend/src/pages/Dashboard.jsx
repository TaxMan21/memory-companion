import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Dashboard() {
  const { user } = useAuth();
  const [memories, setMemories] = useState([]);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [memRes, insRes] = await Promise.allSettled([
          api.getMemories(),
          user.subscription_status === 'active' ? api.getInsights() : Promise.resolve(null)
        ]);
        if (memRes.status === 'fulfilled') setMemories(memRes.value.memories);
        if (insRes.status === 'fulfilled' && insRes.value) setInsights(insRes.value.insights);
      } catch {} finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const isActive = user.subscription_status === 'active';
  const isTrialing = !isActive && user.demo_used === 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16">
        <div className="animate-spin h-8 w-8 border-2 border-brand-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const recentMemories = memories.slice(0, 3);

  return (
    <div className="min-h-screen pt-24 pb-16 px-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Welcome, {user.name}</h1>
          <p className="text-gray-400 mt-1">
            {isActive ? 'Full Access' : isTrialing ? 'Demo Mode - 5 memory limit' : 'Subscription Required'}
          </p>
        </div>
        <Link to="/memories" className="btn-primary">
          + New Memory
        </Link>
      </div>

      {isTrialing && (
        <div className="bg-brand-600/10 border border-brand-500/20 rounded-2xl p-6 mb-8 animate-fade-in">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-lg font-semibold text-brand-300">🎯 Demo Mode Active</h2>
              <p className="text-gray-400 text-sm mt-1">
                You're exploring the app. Create up to 5 memories, then subscribe for unlimited access.
              </p>
            </div>
            <Link to="/subscription" className="btn-primary text-sm">
              View Plans
            </Link>
          </div>
        </div>
      )}

      {!isActive && !isTrialing && (
        <div className="bg-amber-600/10 border border-amber-500/20 rounded-2xl p-6 mb-8 animate-fade-in">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-lg font-semibold text-amber-300">Subscription Required</h2>
              <p className="text-gray-400 text-sm mt-1">
                Your subscription has ended. Subscribe to regain full access.
              </p>
            </div>
            <Link to="/subscription" className="btn-primary text-sm">
              Subscribe Now
            </Link>
          </div>
        </div>
      )}

      {insights && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Memories', value: insights.totalMemories, icon: '📝' },
            { label: 'Top Tag', value: insights.topTags?.[0]?.tag || 'None', icon: '🏷️' },
            { label: 'Best Month', value: insights.mostActiveMonth || 'N/A', icon: '📅' },
            { label: 'Mood', value: insights.moodTrend?.slice(-1)?.[0]?.mood || 'Unknown', icon: '🎭' }
          ].map(s => (
            <div key={s.label} className="card text-center">
              <div className="text-2xl mb-2">{s.icon}</div>
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="card mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Quick Stats</h2>
          <span className="text-sm text-gray-500">{memories.length} total memories</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {['happy', 'sad', 'reflective', 'excited', 'grateful', 'anxious', 'calm', 'loved'].map(mood => {
            const count = memories.filter(m => m.mood === mood).length;
            const max = Math.max(1, ...memories.map(m => memories.filter(x => x.mood === m.mood).length));
            const pct = max > 0 ? (count / max) * 100 : 0;
            return (
              <div key={mood} className="flex flex-col items-center gap-1">
                <div className="w-10 h-20 bg-surface-700 rounded-lg relative overflow-hidden">
                  <div
                    className="absolute bottom-0 w-full bg-brand-500 rounded-t-lg transition-all duration-500"
                    style={{ height: `${pct}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 capitalize">{mood}</span>
              </div>
            );
          })}
        </div>
      </div>

      {recentMemories.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Recent Memories</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {recentMemories.map(m => (
              <Link key={m.id} to={`/memories`} className="card hover:border-brand-500/30 transition-all duration-300 group">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500">{m.created_at?.split('T')[0]}</span>
                  {m.mood && <span className="text-xs capitalize text-gray-400">{m.mood}</span>}
                </div>
                <h3 className="font-semibold group-hover:text-brand-400 transition-colors">{m.title}</h3>
                <p className="text-sm text-gray-400 mt-1 line-clamp-2">{m.content}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {memories.length === 0 && (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">📝</div>
          <h2 className="text-xl font-semibold mb-2">No memories yet</h2>
          <p className="text-gray-400 mb-6">Start capturing your life's moments</p>
          <Link to="/memories" className="btn-primary">
            Create Your First Memory
          </Link>
        </div>
      )}
    </div>
  );
}
