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

  const handleExport = async () => {
    setExporting(true);
    setMsg('');
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
    } catch (err) {
      setMsg('Export failed: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (confirmDelete !== 'DELETE') return;
    setDeleting(true);
    setMsg('');
    try {
      await api.deleteAccount();
      await signout();
      navigate('/');
    } catch (err) {
      setMsg('Deletion failed: ' + err.message);
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      {msg && (
        <div className="bg-brand-600/10 border border-brand-500/20 text-brand-300 text-sm rounded-xl px-4 py-3 mb-6">
          {msg}
        </div>
      )}

      <div className="space-y-6">
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Profile</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Name</label>
              <div className="input-field opacity-70">{user.name}</div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Email</label>
              <div className="input-field opacity-70">{user.email}</div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Member since</label>
              <div className="input-field opacity-70">{user.created_at?.split('T')[0]}</div>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Subscription</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">
                Status:{' '}
                <span className={`capitalize ${user.subscription_status === 'active' ? 'text-green-400' : 'text-amber-400'}`}>
                  {user.subscription_status === 'active' ? 'Active' : user.subscription_status === 'trial' ? 'Free Trial' : user.subscription_status}
                </span>
              </p>
              {user.subscription_status === 'trial' && (
                <p className="text-sm text-gray-400 mt-1">Upgrade to Premium for unlimited memories and AI features</p>
              )}
            </div>
            {user.subscription_status !== 'active' && (
              <Link to="/subscription" className="btn-primary">Upgrade</Link>
            )}
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Security</h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-gray-400">
              <span className="text-green-400">●</span> End-to-end encrypted connection
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <span className="text-green-400">●</span> Session management active
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <span className="text-green-400">●</span> Brute force protection enabled
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <span className="text-green-400">●</span> Passwords hashed with bcrypt (12 rounds)
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <span className="text-green-400">●</span> Rate limiting on all API routes
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Privacy & Data</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Export Your Data</p>
                <p className="text-sm text-gray-400">Download all your memories and account data (JSON)</p>
              </div>
              <button onClick={handleExport} disabled={exporting} className="btn-secondary text-sm">
                {exporting ? 'Exporting...' : 'Export Data'}
              </button>
            </div>

            <div className="border-t border-gray-800 pt-4">
              <p className="font-medium mb-2">Legal Documents</p>
              <div className="flex gap-4">
                <Link to="/terms" target="_blank" className="text-sm text-brand-400 hover:text-brand-300 underline">Terms of Service</Link>
                <Link to="/privacy" target="_blank" className="text-sm text-brand-400 hover:text-brand-300 underline">Privacy Policy</Link>
              </div>
            </div>

            <div className="border-t border-gray-800 pt-4">
              <p className="font-medium text-red-400">Delete Account</p>
              <p className="text-sm text-gray-400 mb-3">Permanently delete your account and all associated data. This cannot be undone.</p>
              <div className="flex items-center gap-3">
                <input
                  className="input-field w-40 text-sm"
                  placeholder='Type "DELETE" to confirm'
                  value={confirmDelete}
                  onChange={e => setConfirmDelete(e.target.value)}
                />
                <button
                  onClick={handleDeleteAccount}
                  disabled={confirmDelete !== 'DELETE' || deleting}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {deleting ? 'Deleting...' : 'Delete Account'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
