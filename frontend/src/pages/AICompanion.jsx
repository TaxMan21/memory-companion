import { useState, useRef, useEffect } from 'react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function AICompanion() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    { role: 'ai', text: `Hello ${user.name}! I am your Memory Companion. Ask me about your memories, request insights, or just chat.` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState(null);
  const bottomRef = useRef(null);

  const isActive = user.subscription_status === 'active';

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, insights]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const msg = input.trim();
    setInput('');
    setMessages(p => [...p, { role: 'user', text: msg }]);
    setLoading(true);
    try {
      const data = await api.aiChat(msg);
      setMessages(p => [...p, { role: 'ai', text: data.response }]);
      if (data.insights) {
        setInsights(data.insights);
      }
    } catch (err) {
      setMessages(p => [...p, { role: 'ai', text: `Sorry, I encountered an error: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestions = [
    'Give me a summary of my memories',
    'What patterns do you see?',
    'Remind me of something important',
    'Suggest something to remember today'
  ];

  if (!isActive) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-6 max-w-3xl mx-auto flex items-center justify-center">
        <div className="text-center card">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold mb-2">AI Companion Locked</h2>
          <p className="text-gray-400 mb-6">
            Subscribe to unlock your personal AI companion and get deep insights about your memories.
          </p>
          <a href="/subscription" className="btn-primary">View Plans</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-6 max-w-4xl mx-auto flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">AI Companion</h1>
          <p className="text-gray-400 text-sm mt-1">Your personal memory guide</p>
        </div>
      </div>

      {insights && (
        <div className="card mb-6 animate-fade-in bg-brand-600/5 border-brand-500/20">
          <h3 className="text-sm font-semibold text-brand-400 mb-3">Current Insights</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {insights.memoryCount !== undefined && (
              <div className="text-center">
                <div className="text-2xl font-bold">{insights.memoryCount}</div>
                <div className="text-xs text-gray-500">Memories</div>
              </div>
            )}
            {insights.dominantMood && (
              <div className="text-center">
                <div className="text-2xl font-bold capitalize">{insights.dominantMood}</div>
                <div className="text-xs text-gray-500">Dominant Mood</div>
              </div>
            )}
            {insights.topTags && (
              <div className="text-center">
                <div className="text-2xl font-bold">{insights.topTags.length}</div>
                <div className="text-xs text-gray-500">Topics</div>
              </div>
            )}
            {insights.suggestion && (
              <div className="text-center col-span-2 md:col-span-1">
                <div className="text-xs text-gray-400 truncate">{insights.suggestion}</div>
                <div className="text-xs text-gray-500">Suggestion</div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="card flex-1 flex flex-col mb-4 max-h-[60vh]">
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-1">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                m.role === 'user'
                  ? 'bg-brand-600 text-white rounded-br-md'
                  : 'bg-surface-700 text-gray-200 rounded-bl-md'
              }`}>
                <p className="text-sm whitespace-pre-wrap">{m.text}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start animate-fade-in">
              <div className="bg-surface-700 rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {messages.length === 1 && (
          <div className="flex gap-2 flex-wrap mb-4">
            {suggestions.map(s => (
              <button
                key={s}
                onClick={() => { setInput(s); }}
                className="text-xs px-3 py-1.5 rounded-full bg-surface-700 hover:bg-surface-800 text-gray-400 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-3">
          <input
            className="input-field flex-1"
            placeholder="Ask about your memories..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
          <button onClick={handleSend} disabled={loading || !input.trim()} className="btn-primary">
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
