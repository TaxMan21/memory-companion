import { useState, useRef, useEffect } from 'react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function AICompanion() {
  const { user } = useAuth();
  const [tab, setTab] = useState('chat');
  const [messages, setMessages] = useState([
    { role: 'ai', text: `Hello ${user.name}! I am your Memory Companion. Ask me about your memories, request insights, or just chat.` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [currentConv, setCurrentConv] = useState(null);
  const [companionProfile, setCompanionProfile] = useState({});
  const [profileForm, setProfileForm] = useState({ ai_name: 'AI Companion', personality_traits: ['helpful', 'empathetic'], voice: 'default', backstory: '', custom_instructions: '' });
  const bottomRef = useRef(null);

  useEffect(() => {
    api.get('/features/companion-profile').then(d => {
      if (d.companionProfile?.id) {
        setCompanionProfile(d.companionProfile);
        setProfileForm({
          ai_name: d.companionProfile.ai_name || 'AI Companion',
          personality_traits: JSON.parse(d.companionProfile.personality_traits || '["helpful","empathetic"]'),
          voice: d.companionProfile.voice || 'default',
          backstory: d.companionProfile.backstory || '',
          custom_instructions: d.companionProfile.custom_instructions || ''
        });
      }
    }).catch(() => {});
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput('');
    setMessages(m => [...m, { role: 'user', text }]);
    setLoading(true);

    try {
      const data = await api.request('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ message: text, conversation_id: currentConv })
      });
      setMessages(m => [...m, { role: 'ai', text: data.response }]);
      if (data.conversation_id) setCurrentConv(data.conversation_id);
    } catch (err) {
      setMessages(m => [...m, { role: 'ai', text: `Error: ${err.message}` }]);
    } finally { setLoading(false); }
  };

  const loadConversation = async (id) => {
    setCurrentConv(id);
    try {
      const d = await api.get(`/ai/conversations/${id}`);
      setMessages(d.messages.map(m => ({ role: m.role === 'assistant' ? 'ai' : m.role, text: m.content })));
    } catch (e) { console.error(e); }
  };

  const newChat = () => {
    setCurrentConv(null);
    setMessages([{ role: 'ai', text: `Hello ${user.name}! How can I help you today?` }]);
  };

  const saveProfile = async () => {
    await api.put('/features/companion-profile', profileForm);
    const d = await api.get('/features/companion-profile');
    setCompanionProfile(d.companionProfile);
  };

  const TRAITS = ['helpful', 'empathetic', 'witty', 'wise', 'encouraging', 'thoughtful', 'playful', 'direct', 'calm', 'curious'];

  return (
    <div className="min-h-screen p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">AI Companion</h1>
      <div className="flex gap-1 mb-6 glass rounded-xl p-1">
        {['chat', 'conversations', 'profile'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium capitalize transition-all ${tab === t ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-white'}`}>
            {t === 'chat' ? '💬 Chat' : t === 'conversations' ? '📋 History' : '⚙️ Profile'}
          </button>
        ))}
      </div>

      {tab === 'chat' && (
        <div className="glass rounded-xl h-[65vh] flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-xl ${m.role === 'user' ? 'bg-brand-600 text-white' : 'bg-surface-700 text-gray-200'}`}>
                  <p className="text-sm whitespace-pre-wrap">{m.text}</p>
                </div>
              </div>
            ))}
            {loading && <div className="flex justify-start"><div className="bg-surface-700 p-3 rounded-xl"><div className="animate-spin w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full" /></div></div>}
            <div ref={bottomRef} />
          </div>
          <div className="border-t border-surface-600 p-4">
            <div className="flex gap-2">
              <input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask me anything..." className="input flex-1" onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())} />
              <button onClick={sendMessage} disabled={loading || !input.trim()} className="btn-primary px-4">Send</button>
            </div>
          </div>
        </div>
      )}

      {tab === 'conversations' && (
        <div className="space-y-2">
          <button onClick={newChat} className="btn-primary text-sm mb-4">+ New Chat</button>
          <div className="space-y-2">
            {conversations.map(c => (
              <button key={c.id} onClick={() => { loadConversation(c.id); setTab('chat'); }}
                className="glass rounded-xl p-3 w-full text-left hover:bg-surface-700 transition-colors">
                <div className="text-sm truncate">{c.lastMessage}</div>
                <div className="text-xs text-gray-500">{new Date(c.lastMessageAt).toLocaleDateString()}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {tab === 'profile' && (
        <div className="glass rounded-xl p-6 max-w-lg mx-auto">
          <h2 className="text-lg font-semibold mb-4">Companion Profile</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">AI Name</label>
              <input value={profileForm.ai_name} onChange={e => setProfileForm(f => ({ ...f, ai_name: e.target.value }))} className="input w-full" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Personality Traits</label>
              <div className="flex flex-wrap gap-2">
                {TRAITS.map(t => (
                  <button key={t} onClick={() => setProfileForm(f => ({
                    ...f, personality_traits: f.personality_traits.includes(t)
                      ? f.personality_traits.filter(x => x !== t) : [...f.personality_traits, t]
                  }))}
                    className={`text-xs px-3 py-1.5 rounded-full transition-all ${profileForm.personality_traits.includes(t) ? 'bg-brand-600 text-white' : 'bg-surface-700 text-gray-400 hover:bg-surface-600'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Voice</label>
              <select value={profileForm.voice} onChange={e => setProfileForm(f => ({ ...f, voice: e.target.value }))} className="input w-full">
                <option value="default">Default</option>
                <option value="calm">Calm</option>
                <option value="energetic">Energetic</option>
                <option value="warm">Warm</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Backstory</label>
              <textarea value={profileForm.backstory} onChange={e => setProfileForm(f => ({ ...f, backstory: e.target.value }))} rows={3} className="input w-full" placeholder="Give your AI companion a backstory..." />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Custom Instructions</label>
              <textarea value={profileForm.custom_instructions} onChange={e => setProfileForm(f => ({ ...f, custom_instructions: e.target.value }))} rows={3} className="input w-full" placeholder="How should the AI behave specifically?" />
            </div>
            <button onClick={saveProfile} className="btn-primary w-full">Save Profile</button>
          </div>
        </div>
      )}
    </div>
  );
}
