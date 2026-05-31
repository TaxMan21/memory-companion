import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

const STEPS = [
  {
    title: 'Welcome to Your Demo',
    desc: 'Walk through the core features of Memory Companion. You will create your first memory, see the AI in action, and understand how it all works.',
    icon: '👋'
  },
  {
    title: 'Create a Memory',
    desc: 'Write down a memory. Any memory - a happy moment, a lesson learned, a person who mattered. Add a mood and tags to organize it.',
    icon: '✍️',
    action: 'create'
  },
  {
    title: 'Meet Your AI Companion',
    desc: 'Your AI Companion analyzes your memories to find patterns, suggest connections, and help you recall forgotten details.',
    icon: '🧠',
    action: 'ai'
  },
  {
    title: 'Timeline & Insights',
    desc: 'See your memories organized. Discover your mood patterns, most-used tags, and activity at a glance.',
    icon: '📊'
  },
  {
    title: 'Unlock Full Access',
    desc: 'You have seen what the free version can do. Subscribe to unlock unlimited memories, full AI conversations, and advanced insights.',
    icon: '🚀'
  }
];

export default function Demo() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [step, setStep] = useState(0);
  const [demoMemory, setDemoMemory] = useState({ title: '', content: '', mood: '' });
  const [saving, setSaving] = useState(false);

  const current = STEPS[step];

  const handleCreateMemory = async () => {
    if (!demoMemory.title || !demoMemory.content) return;
    setSaving(true);
    try {
      await api.createMemory(
        demoMemory.title,
        demoMemory.content,
        demoMemory.mood || 'reflective',
        ['demo', 'first-memory']
      );
      setStep(s => Math.min(s + 1, STEPS.length - 1));
    } catch {} finally {
      setSaving(false);
    }
  };

  const handleFinish = async () => {
    try {
      await refreshUser();
    } catch {}
    navigate('/dashboard');
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      handleFinish();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-b from-surface-950 via-surface-900 to-surface-950">
      <div className="w-full max-w-2xl animate-fade-in">
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i <= step ? 'w-8 bg-brand-500' : 'w-4 bg-surface-700'
              }`}
            />
          ))}
        </div>

        <div className="card text-center">
          <div className="text-6xl mb-6">{current.icon}</div>
          <h2 className="text-2xl font-bold mb-3">{current.title}</h2>
          <p className="text-gray-400 mb-8 text-lg">{current.desc}</p>

          {current.action === 'create' && step === 1 && (
            <div className="space-y-4 text-left max-w-md mx-auto mb-6">
              <input
                className="input-field"
                placeholder="Memory title (e.g. My First Day)"
                value={demoMemory.title}
                onChange={e => setDemoMemory(p => ({ ...p, title: e.target.value }))}
              />
              <textarea
                className="input-field min-h-[120px] resize-none"
                placeholder="Write your memory here... What happened? How did you feel?"
                value={demoMemory.content}
                onChange={e => setDemoMemory(p => ({ ...p, content: e.target.value }))}
              />
              <select
                className="input-field"
                value={demoMemory.mood}
                onChange={e => setDemoMemory(p => ({ ...p, mood: e.target.value }))}
              >
                <option value="">How did you feel?</option>
                <option value="happy">Happy</option>
                <option value="reflective">Reflective</option>
                <option value="grateful">Grateful</option>
                <option value="excited">Excited</option>
                <option value="calm">Calm</option>
                <option value="sad">Sad</option>
                <option value="loved">Loved</option>
              </select>
              <button
                onClick={handleCreateMemory}
                disabled={saving || !demoMemory.title || !demoMemory.content}
                className="btn-primary w-full"
              >
                {saving ? 'Saving...' : 'Save Memory'}
              </button>
            </div>
          )}

          {current.action === 'ai' && step === 2 && (
            <div className="bg-surface-700/50 rounded-xl p-6 mb-6 text-left max-w-md mx-auto">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-sm shrink-0">AI</div>
                <div>
                  <p className="text-sm text-gray-200">
                    "I can see you are starting your memory journey! Ask me anything about your memories or
                    request insights. I will help you find patterns and rediscover moments."
                  </p>
                </div>
              </div>
              <div className="bg-surface-800 rounded-lg p-3 text-sm text-gray-400">
                Try asking: "What patterns do you see?" or "Remind me of something important"
              </div>
            </div>
          )}

          {current.action !== 'create' && (
            <button onClick={handleNext} className="btn-primary">
              {step < STEPS.length - 1 ? 'Continue' : 'Go to Dashboard'}
            </button>
          )}

          {current.action === 'create' && step === 1 && (
            <button onClick={() => setStep(s => s + 1)} className="btn-ghost text-sm mt-2">
              Skip for now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
