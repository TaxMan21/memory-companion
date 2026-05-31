import { useAuth } from '../context/AuthContext.jsx';
import { Link } from 'react-router-dom';

export default function Settings() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen pt-24 pb-16 px-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

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
              {user.subscription_status !== 'active' && (
                <p className="text-sm text-gray-400 mt-1">
                  Upgrade to Premium for unlimited memories and AI features
                </p>
              )}
            </div>
            {user.subscription_status !== 'active' && (
              <Link to="/subscription" className="btn-primary">
                Upgrade
              </Link>
            )}
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Security</h2>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span className="text-green-400">●</span>
            End-to-end encrypted connection
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400 mt-2">
            <span className="text-green-400">●</span>
            Session management active
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400 mt-2">
            <span className="text-green-400">●</span>
            Brute force protection enabled
          </div>
        </div>
      </div>
    </div>
  );
}
