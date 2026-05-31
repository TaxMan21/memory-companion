import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function SignUp() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirm: '',
    tosAccepted: false, privacyAccepted: false, marketingConsent: false
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirm) {
      setError('Passwords do not match');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (!form.tosAccepted || !form.privacyAccepted) {
      setError('You must accept the Terms of Service and Privacy Policy');
      return;
    }

    setLoading(true);
    try {
      await signup(form.email, form.password, form.name, form.tosAccepted, form.privacyAccepted, form.marketingConsent);
      navigate('/onboarding');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggle = (field) => {
    setForm(p => ({ ...p, [field]: !p[field] }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-6">
          <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-brand-400 to-brand-600 bg-clip-text text-transparent">
            Memory Companion
          </Link>
          <h1 className="text-2xl font-bold mt-6 mb-2">Create your account</h1>
          <p className="text-gray-400">Start your memory journey today</p>
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
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Name</label>
            <input
              type="text"
              className="input-field"
              placeholder="Your name"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              required
              minLength={2}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
            <input
              type="email"
              className="input-field"
              placeholder="you@example.com"
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
            <input
              type="password"
              className="input-field"
              placeholder="At least 8 characters"
              value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              required
              minLength={8}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Confirm Password</label>
            <input
              type="password"
              className="input-field"
              placeholder="Repeat your password"
              value={form.confirm}
              onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-3 pt-2 border-t border-gray-800">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={form.tosAccepted}
                onChange={() => toggle('tosAccepted')}
                className="mt-0.5 h-4 w-4 rounded border-gray-600 bg-surface-800 text-brand-500 focus:ring-brand-500"
              />
              <span className="text-sm text-gray-400 group-hover:text-gray-300">
                I accept the{' '}
                <Link to="/terms" target="_blank" className="text-brand-400 hover:text-brand-300 underline">Terms of Service</Link>
                {' '}and{' '}
                <Link to="/privacy" target="_blank" className="text-brand-400 hover:text-brand-300 underline">Privacy Policy</Link>
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={form.marketingConsent}
                onChange={() => toggle('marketingConsent')}
                className="mt-0.5 h-4 w-4 rounded border-gray-600 bg-surface-800 text-brand-500 focus:ring-brand-500"
              />
              <span className="text-sm text-gray-400 group-hover:text-gray-300">
                I agree to receive product updates and tips (optional)
              </span>
            </label>
          </div>

          <button type="submit" disabled={loading || !form.tosAccepted || !form.privacyAccepted} className="btn-primary w-full">
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-gray-500 text-sm mt-6">
          Already have an account?{' '}
          <Link to="/signin" className="text-brand-400 hover:text-brand-300 font-medium">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
