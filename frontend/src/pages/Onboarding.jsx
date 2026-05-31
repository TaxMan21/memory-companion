import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

const PERSONALITY_STYLES = [
  { id: 'friendly', label: 'Friendly', desc: 'Warm and approachable', icon: '🤗' },
  { id: 'professional', label: 'Professional', desc: 'Formal and precise', icon: '💼' },
  { id: 'motivational', label: 'Motivational', desc: 'Encouraging and uplifting', icon: '🔥' },
  { id: 'coach', label: 'Coach', desc: 'Structured and goal-oriented', icon: '🎯' },
  { id: 'mentor', label: 'Mentor', desc: 'Wise and guiding', icon: '🧠' },
  { id: 'casual', label: 'Casual Friend', desc: 'Relaxed and chatty', icon: '😊' }
];

const MEMORY_CATEGORIES = [
  { id: 'personal', label: 'Personal Information', icon: '👤' },
  { id: 'goals', label: 'Goals', icon: '🎯' },
  { id: 'relationships', label: 'Relationships', icon: '💝' },
  { id: 'projects', label: 'Projects', icon: '📁' },
  { id: 'preferences', label: 'Preferences', icon: '⭐' },
  { id: 'dates', label: 'Important Dates', icon: '📅' }
];

const STEPS = ['welcome', 'profile', 'personality', 'permissions'];

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({ nickname: '', date_of_birth: '', timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, language: 'en' });
  const [personality, setPersonality] = useState({ style: 'friendly', response_length: 'medium', humor_level: 5, communication_style: 'conversational' });
  const [permissions, setPermissions] = useState({ long_term_memory: true, categories: MEMORY_CATEGORIES.map(c => c.id), can_remember: 'everything', cannot_remember: [] });

  const saveAll = async () => {
    setLoading(true);
    try {
      await api.put('/features/profile', { ...profile, onboarding_complete: true });
      await api.put('/features/personality', personality);
      await api.put('/features/memory-permissions', permissions);
      await refreshUser();
      navigate('/dashboard');
    } catch (err) {
      console.error('Onboarding save error:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (id) => {
    setPermissions(p => ({
      ...p,
      categories: p.categories.includes(id) ? p.categories.filter(c => c !== id) : [...p.categories, id]
    }));
  };

  const renderStep = () => {
    switch (STEPS[step]) {
      case 'welcome':
        return (
          <div className="text-center animate-fade-in">
            <div className="text-6xl mb-6">🧠</div>
            <h1 className="text-3xl font-bold mb-4">Welcome to Memory Companion</h1>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              Your personal AI companion that remembers everything important to you.
              Capture memories, track goals, journal your thoughts, and grow with insights.
            </p>
            <div className="grid grid-cols-3 gap-4 mb-8 max-w-lg mx-auto">
              {[['🗂️', 'Smart Memory'], ['🤖', 'AI Companion'], ['📊', 'Deep Insights']].map(([icon, label]) => (
                <div key={label} className="glass rounded-xl p-4 text-center">
                  <div className="text-3xl mb-2">{icon}</div>
                  <div className="text-sm text-gray-300">{label}</div>
                </div>
              ))}
            </div>
            <button onClick={() => setStep(1)} className="btn-primary text-lg px-8 py-3">Get Started</button>
          </div>
        );

      case 'profile':
        return (
          <div className="animate-fade-in max-w-md mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-center">Set Up Your Profile</h2>
            <p className="text-gray-400 text-center mb-6">Personalize your AI companion experience</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Name</label>
                <input value={user?.name || ''} disabled className="input w-full opacity-60" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nickname (optional)</label>
                <input value={profile.nickname} onChange={e => setProfile(p => ({ ...p, nickname: e.target.value }))} placeholder="What should I call you?" className="input w-full" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Date of Birth</label>
                <input type="date" value={profile.date_of_birth} onChange={e => setProfile(p => ({ ...p, date_of_birth: e.target.value }))} className="input w-full" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Timezone</label>
                <select value={profile.timezone} onChange={e => setProfile(p => ({ ...p, timezone: e.target.value }))} className="input w-full">
                  {Intl.supportedValuesOf?.('timeZone')?.map(tz => <option key={tz} value={tz}>{tz}</option>) || <option value="UTC">UTC</option>}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Language</label>
                <select value={profile.language} onChange={e => setProfile(p => ({ ...p, language: e.target.value }))} className="input w-full">
                  <option value="en">English</option>
                  <option value="af">Afrikaans</option>
                  <option value="zu">Zulu</option>
                  <option value="xh">Xhosa</option>
                </select>
              </div>
            </div>
            <button onClick={() => setStep(2)} className="btn-primary w-full mt-6">Continue</button>
          </div>
        );

      case 'personality':
        return (
          <div className="animate-fade-in max-w-md mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-center">AI Personality</h2>
            <p className="text-gray-400 text-center mb-6">How should your AI companion behave?</p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {PERSONALITY_STYLES.map(s => (
                <button key={s.id} onClick={() => setPersonality(p => ({ ...p, style: s.id }))}
                  className={`glass rounded-xl p-4 text-center transition-all ${personality.style === s.id ? 'ring-2 ring-brand-500 bg-brand-600/20' : 'hover:bg-surface-700'}`}>
                  <div className="text-3xl mb-1">{s.icon}</div>
                  <div className="font-medium text-sm">{s.label}</div>
                  <div className="text-xs text-gray-500">{s.desc}</div>
                </button>
              ))}
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Response Length</label>
                <select value={personality.response_length} onChange={e => setPersonality(p => ({ ...p, response_length: e.target.value }))} className="input w-full">
                  <option value="short">Short & Concise</option>
                  <option value="medium">Balanced</option>
                  <option value="long">Detailed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Humor Level: {personality.humor_level}/10</label>
                <input type="range" min="1" max="10" value={personality.humor_level} onChange={e => setPersonality(p => ({ ...p, humor_level: parseInt(e.target.value) }))} className="w-full" />
                <div className="flex justify-between text-xs text-gray-500"><span>Serious</span><span>Very Funny</span></div>
              </div>
            </div>
            <button onClick={() => setStep(3)} className="btn-primary w-full mt-6">Continue</button>
          </div>
        );

      case 'permissions':
        return (
          <div className="animate-fade-in max-w-md mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-center">Memory Permissions</h2>
            <p className="text-gray-400 text-center mb-6">Control what your AI companion remembers</p>
            <div className="space-y-4 mb-6">
              <label className="flex items-center gap-3 glass rounded-xl p-4 cursor-pointer">
                <input type="checkbox" checked={permissions.long_term_memory} onChange={e => setPermissions(p => ({ ...p, long_term_memory: e.target.checked }))} className="w-5 h-5" />
                <div><div className="font-medium">Enable Long-Term Memory</div><div className="text-sm text-gray-400">AI remembers context across conversations</div></div>
              </label>
              <div className="glass rounded-xl p-4">
                <div className="font-medium mb-3">Memory Categories</div>
                <div className="grid grid-cols-2 gap-2">
                  {MEMORY_CATEGORIES.map(c => (
                    <button key={c.id} onClick={() => toggleCategory(c.id)}
                      className={`flex items-center gap-2 p-2 rounded-lg text-sm transition-all ${permissions.categories.includes(c.id) ? 'bg-brand-600/30 text-brand-300' : 'bg-surface-700 text-gray-400'}`}>
                      <span>{c.icon}</span><span>{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">What AI CAN remember</label>
                <textarea value={permissions.can_remember} onChange={e => setPermissions(p => ({ ...p, can_remember: e.target.value }))} rows={2} className="input w-full" placeholder="Everything related to my personal growth, goals, and daily life" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">What AI CANNOT remember</label>
                <textarea value={permissions.cannot_remember} onChange={e => setPermissions(p => ({ ...p, cannot_remember: e.target.value }))} rows={2} className="input w-full" placeholder="Financial passwords, private credentials, sensitive data" />
              </div>
            </div>
            <button onClick={saveAll} disabled={loading} className="btn-primary w-full text-lg py-3">
              {loading ? 'Setting up...' : 'Complete Setup'}
            </button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-2xl">
        <div className="flex justify-center gap-2 mb-8">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-2 rounded-full transition-all ${i === step ? 'w-12 bg-brand-500' : i < step ? 'w-8 bg-brand-700' : 'w-8 bg-surface-600'}`} />
          ))}
        </div>
        {renderStep()}
      </div>
    </div>
  );
}
