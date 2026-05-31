import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, signout } = useAuth();
  const navigate = useNavigate();

  const handleSignout = async () => {
    await signout();
    navigate('/');
  };

  if (!user) return null;

  return (
    <nav className="glass fixed top-0 left-0 right-0 z-50 h-16 px-6 flex items-center justify-between">
      <div className="flex items-center gap-8">
        <Link to="/dashboard" className="text-xl font-bold bg-gradient-to-r from-brand-400 to-brand-600 bg-clip-text text-transparent">
          Memory Companion
        </Link>
        <div className="hidden md:flex items-center gap-1">
          <Link to="/dashboard" className="btn-ghost text-sm">Dashboard</Link>
          <Link to="/memories" className="btn-ghost text-sm">Memories</Link>
          <Link to="/ai-companion" className="btn-ghost text-sm">AI Companion</Link>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Link to="/settings" className="btn-ghost text-sm">
          {user.name}
        </Link>
        <button onClick={handleSignout} className="btn-ghost text-sm text-gray-400 hover:text-red-400">
          Sign Out
        </button>
      </div>
    </nav>
  );
}
