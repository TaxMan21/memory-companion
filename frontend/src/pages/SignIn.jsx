import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function SignIn() {
  const { signin } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signin(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-6">
          <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-brand-400 to-brand-600 bg-clip-text text-transparent">
            Memory Companion
          </Link>
          <h1 className="text-2xl font-bold mt-6 mb-2">Welcome back</h1>
          <p className="text-gray-400">Sign in to your memory vault</p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="rounded-xl border border-gray-800 bg-surface-800/50 p-4 text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Free Trial</p>
            <p className="text-2xl font-bold">$0</p>
            <ul className="mt-2 space-y-1 text-xs text-gray-400">
              <li>✓ 5 memories</li>
              <li>✓ Demo access</li>
            </ul>
          </div>
          <div className="rounded-xl border border-brand-500/30 bg-brand-600/10 p-4 text-center relative">
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-brand-600 rounded-full text-[10px] font-semibold">Premium</div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1 mt-1">Unlimited</p>
            <p className="text-2xl font-bold">$9<span className="text-sm text-gray-400">/mo</span></p>
            <ul className="mt-2 space-y-1 text-xs text-gray-400">
              <li>✓ Unlimited memories</li>
              <li>✓ AI Companion</li>
              <li>✓ Insights & patterns</li>
            </ul>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
            <input
              type="email"
              className="input-field"
              placeholder="you@example.com"
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
            <input
              type="password"
              className="input-field"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              required
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-gray-500 text-sm mt-6">
          Don't have an account?{' '}
          <Link to="/signup" className="text-brand-400 hover:text-brand-300 font-medium">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
