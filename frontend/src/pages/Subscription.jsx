import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Subscription() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const isActive = user.subscription_status === 'active';

  const handleSubscribe = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.createCheckout();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.success) {
        setSuccess(true);
        await refreshUser();
        setTimeout(() => navigate('/dashboard'), 2000);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success || isActive) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center card max-w-md animate-fade-in">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold mb-2">Subscription Active</h2>
          <p className="text-gray-400 mb-6">
            You have full access to all features. Enjoy your memory journey!
          </p>
          <button onClick={() => navigate('/dashboard')} className="btn-primary">
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-6 max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Unlock Your Memory Journey</h1>
        <p className="text-gray-400 text-lg">
          Get full access to all features and never lose a memory again
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto mb-12">
        <div className="card border-gray-700">
          <h3 className="text-xl font-bold mb-4">Free Trial</h3>
          <div className="text-3xl font-bold mb-4">$0</div>
          <ul className="space-y-3 mb-8">
            {['5 memories', 'Basic storage', 'Demo access'].map(f => (
              <li key={f} className="flex items-center gap-2 text-sm text-gray-400">
                <span className="text-brand-400">✓</span> {f}
              </li>
            ))}
          </ul>
          <div className="text-sm text-gray-500 text-center">Current plan</div>
        </div>

        <div className="card border-brand-500/50 bg-brand-600/5 relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-brand-600 rounded-full text-xs font-semibold">
            Recommended
          </div>
          <h3 className="text-xl font-bold mb-4">Premium</h3>
          <div className="text-3xl font-bold mb-4">$9<span className="text-lg text-gray-400">/mo</span></div>
          <ul className="space-y-3 mb-8">
            {[
              'Unlimited memories',
              'AI Companion chat',
              'Advanced insights & analytics',
              'Mood tracking & patterns',
              'Priority support',
              'Early access to new features'
            ].map(f => (
              <li key={f} className="flex items-center gap-2 text-sm">
                <span className="text-brand-400">✓</span> {f}
              </li>
            ))}
          </ul>
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="btn-primary w-full animate-pulse-glow"
          >
            {loading ? 'Processing...' : 'Subscribe Now'}
          </button>
          {error && (
            <p className="text-red-400 text-sm text-center mt-3">{error}</p>
          )}
        </div>
      </div>

      {user.demo_used === 0 && (
        <div className="text-center">
          <button onClick={() => navigate('/demo')} className="btn-ghost">
            ← Continue Free Demo First
          </button>
        </div>
      )}
    </div>
  );
}
