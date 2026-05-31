import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const MAIN_LINKS = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/memories', label: 'Memories', icon: '🧠' },
  { to: '/memory-vault', label: 'Vault', icon: '🗂️' },
  { to: '/ai-companion', label: 'AI Chat', icon: '💬' },
  { to: '/journal', label: 'Journal', icon: '📖' },
  { to: '/timeline', label: 'Timeline', icon: '📅' },
  { to: '/goals', label: 'Goals', icon: '🎯' },
  { to: '/tasks', label: 'Tasks', icon: '✅' },
  { to: '/insights', label: 'Insights', icon: '📊' },
  { to: '/daily-briefing', label: 'Briefing', icon: '☀️' },
  { to: '/relationships', label: 'Relationships', icon: '💝' },
  { to: '/knowledge-base', label: 'Knowledge', icon: '📚' }
];

export default function Navbar() {
  const { user, signout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignout = async () => {
    await signout();
    navigate('/');
  };

  if (!user) return null;

  return (
    <nav className="glass fixed top-0 left-0 right-0 z-50 h-16 px-4 md:px-6 flex items-center justify-between">
      <div className="flex items-center gap-4 md:gap-8">
        <Link to="/dashboard" className="text-lg md:text-xl font-bold bg-gradient-to-r from-brand-400 to-brand-600 bg-clip-text text-transparent whitespace-nowrap">
          Memory Companion
        </Link>
        <div className="hidden md:flex items-center gap-1 overflow-x-auto">
          {MAIN_LINKS.map(l => (
            <Link key={l.to} to={l.to} className={`btn-ghost text-xs whitespace-nowrap ${location.pathname === l.to ? 'text-brand-400 bg-brand-600/20' : ''}`}>
              {l.icon} {l.label}
            </Link>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2 md:gap-4">
        <Link to="/settings" className="btn-ghost text-sm hidden md:block">{user.name}</Link>
        <Link to="/settings" className="md:hidden text-lg">⚙️</Link>
        <button onClick={handleSignout} className="btn-ghost text-sm text-gray-400 hover:text-red-400 hidden md:block">Sign Out</button>
        <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-xl">☰</button>
      </div>

      {menuOpen && (
        <div className="absolute top-16 left-0 right-0 glass border-t border-surface-600 p-4 md:hidden animate-fade-in">
          <div className="grid grid-cols-2 gap-2">
            {MAIN_LINKS.map(l => (
              <Link key={l.to} to={l.to} onClick={() => setMenuOpen(false)} className={`p-2 rounded-lg text-sm ${location.pathname === l.to ? 'bg-brand-600/20 text-brand-400' : 'hover:bg-surface-700'}`}>
                {l.icon} {l.label}
              </Link>
            ))}
          </div>
          <div className="border-t border-surface-600 mt-3 pt-3 flex gap-3">
            <Link to="/settings" onClick={() => setMenuOpen(false)} className="text-sm text-gray-400">Settings</Link>
            <button onClick={handleSignout} className="text-sm text-red-400">Sign Out</button>
          </div>
        </div>
      )}
    </nav>
  );
}
