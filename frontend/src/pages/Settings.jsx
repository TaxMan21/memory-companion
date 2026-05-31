import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/client.js';

export default function Settings() {
  const { user, signout } = useAuth();
  const navigate = useNavigate();
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [msg, setMsg] = useState('');
  const [confirmDelete, setConfirmDelete] = useState('');
  const [tab, setTab] = useState('account');

  const handleExport = async () => {
    setExporting(true); setMsg('');
    try {
      const data = await api.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `memory-companion-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setMsg('Data exported successfully');
    } catch (err) { setMsg('Export failed: ' + err.message); }
    finally { setExporting(false); }
  };

  const handleDeleteAccount = async () => {
    if (confirmDelete !== 'DELETE') return;
    setDeleting(true); setMsg('');
    try {
      await api.deleteAccount();
      await signout();
      navigate('/');
    } catch (err) { setMsg('Deletion failed: ' + err.message); setDeleting(false); }
  };

  const tabs = [
    { id: 'account', label: 'Account' },
    { id: 'privacy', label: 'Privacy & Data' },
    { id: 'app', label: 'App Settings' }
  ];

  return (
    <div className="min-h-screen p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      {msg && (
        <div className="bg-brand-600/10 border border-brand-500/20 text-brand-300 text-sm rounded-xl px-4 py-3 mb-4">{msg}</div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 glass rounded-xl p-1">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${tab === t.id ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-white'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'account' && (
        <div className="space-y-4">
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Profile</h2>
            <div className="space-y-3">
              <div><label className="block text-sm text-gray-400 mb-1">Name</label><div className="input-field opacity-70">{user.name}</div></div>
              <div><label className="block text-sm text-gray-400 mb-1">Email</label><div className="input-field opacity-70">{user.email}</div></div>
              <div><label className="block text-sm text-gray-400 mb-1">Member since</label><div className="input-field opacity-70">{user.created_at?.split('T')[0]}</div></div>
            </div>
            <Link to="/onboarding" className="text-sm text-brand-400 mt-3 inline-block">Edit profile & preferences</Link>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold mb-3">Companion Profile</h2>
            <p className="text-sm text-gray-400 mb-3">Customize your AI companion's name, personality, and voice</p>
            <Link to="/ai-companion" className="btn-secondary text-sm inline-block">Configure AI Companion</Link>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Subscription</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Status: <span className={`capitalize ${user.subscription_status === 'active' ? 'text-green-400' : 'text-amber-400'}`}>{user.subscription_status === 'active' ? 'Active' : user.subscription_status === 'trial' ? 'Free Trial' : user.subscription_status}</span></p>
                {user.payment_method && user.subscription_status === 'active' && <p className="text-xs text-gray-500 mt-1">Payment: {user.payment_method}</p>}
                {user.subscription_status === 'trial' && <p className="text-sm text-gray-400 mt-1">Upgrade for unlimited access</p>}
              </div>
              {user.subscription_status !== 'active' && <Link to="/subscription" className="btn-primary">Upgrade</Link>}
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Integrations</h2>
            <p className="text-sm text-gray-400 mb-3">Connect external services</p>
            <Link to="/settings?tab=integrations" className="btn-secondary text-sm inline-block">Manage Integrations</Link>
          </div>
        </div>
      )}

      {tab === 'privacy' && (
        <div className="space-y-4">
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Privacy Center</h2>
            <p className="text-sm text-gray-400 mb-4">Full control over your data</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-surface-700/50">
                <div><p className="font-medium text-sm">Export Your Data</p><p className="text-xs text-gray-500">GDPR Art. 20 — Data portability</p></div>
                <button onClick={handleExport} disabled={exporting} className="btn-secondary text-sm">{exporting ? 'Exporting...' : 'Export'}</button>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-surface-700/50">
                <div><p className="font-medium text-sm">Clear Memory History</p><p className="text-xs text-gray-500">Delete all stored memories</p></div>
                <Link to="/memory-vault" className="btn-secondary text-sm">Manage</Link>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-surface-700/50">
                <div><p className="font-medium text-sm">Delete Account</p><p className="text-xs text-gray-500">GDPR Art. 17 — Right to erasure</p></div>
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold mb-3">Legal Documents</h2>
            <div className="flex gap-4">
              <Link to="/terms" target="_blank" className="text-sm text-brand-400 underline">Terms of Service</Link>
              <Link to="/privacy" target="_blank" className="text-sm text-brand-400 underline">Privacy Policy</Link>
            </div>
          </div>

          <div className="card border-red-900/30">
            <h2 className="text-lg font-semibold text-red-400 mb-3">Danger Zone</h2>
            <p className="text-sm text-gray-400 mb-3">Permanently delete your account and all associated data. Cannot be undone.</p>
            <div className="flex items-center gap-3">
              <input className="input-field w-40 text-sm" placeholder='Type "DELETE" to confirm' value={confirmDelete} onChange={e => setConfirmDelete(e.target.value)} />
              <button onClick={handleDeleteAccount} disabled={confirmDelete !== 'DELETE' || deleting}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm">
                {deleting ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === 'app' && (
        <div className="space-y-4">
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Quick Links</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { to: '/daily-briefing', icon: '☀️', label: 'Daily Briefing' },
                { to: '/insights', icon: '📊', label: 'Insights Center' },
                { to: '/tasks', icon: '✅', label: 'Tasks & Reminders' },
                { to: '/goals', icon: '🎯', label: 'Goals & Projects' },
                { to: '/journal', icon: '📖', label: 'Journal' },
                { to: '/timeline', icon: '📅', label: 'Timeline' }
              ].map(l => (
                <Link key={l.to} to={l.to} className="glass rounded-xl p-3 text-center hover:bg-surface-700 transition-colors">
                  <div className="text-xl mb-1">{l.icon}</div>
                  <div className="text-xs">{l.label}</div>
                </Link>
              ))}
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Security</h2>
            <div className="space-y-2 text-sm">
              {['End-to-end encrypted connection', 'Session management active', 'Brute force protection enabled', 'Passwords hashed with bcrypt (12 rounds)', 'Rate limiting on all API routes'].map(s => (
                <div key={s} className="flex items-center gap-2 text-gray-400"><span className="text-green-400">●</span> {s}</div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
