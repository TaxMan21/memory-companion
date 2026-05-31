import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Landing() {
  const { user } = useAuth();

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center animate-fade-in">
          <h1 className="text-4xl font-bold mb-4">Welcome back, {user.name}</h1>
          <p className="text-gray-400 mb-8">Continue your memory journey</p>
          <Link to="/dashboard" className="btn-primary text-lg px-8 py-3">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="glass fixed top-0 left-0 right-0 z-50 h-16 px-6 flex items-center justify-between">
        <span className="text-xl font-bold bg-gradient-to-r from-brand-400 to-brand-600 bg-clip-text text-transparent">
          Memory Companion
        </span>
        <div className="flex items-center gap-3">
          <Link to="/signin" className="btn-ghost">Sign In</Link>
          <Link to="/signup" className="btn-primary">Get Started</Link>
        </div>
      </header>

      <main className="pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-600/10 border border-brand-500/20 text-brand-400 text-sm font-medium mb-8">
            AI-Powered Memory Companion
          </div>

          <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6">
            Your Memories,{' '}
            <span className="bg-gradient-to-r from-brand-400 to-purple-400 bg-clip-text text-transparent">
              Supercharged
            </span>
          </h1>

          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-12">
            An intelligent companion that helps you capture, connect, and rediscover your life's most precious moments.
          </p>

          <div className="flex items-center justify-center gap-4 mb-20">
            <Link to="/signup" className="btn-primary text-lg px-8 py-3 animate-pulse-glow">
              Start Free Trial
            </Link>
            <Link to="/signin" className="btn-secondary text-lg px-8 py-3">
              Sign In
            </Link>
          </div>
        </div>

        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6 mb-20">
          {[
            {
              title: 'AI-Powered Insights',
              desc: 'Get personalized reflections and connections between your memories.',
              icon: '🧠'
            },
            {
              title: 'Smart Recall',
              desc: 'Ask your companion anything about your past and get instant answers.',
              icon: '🔮'
            },
            {
              title: 'Memory Timeline',
              desc: 'Visualize your life story with beautiful timelines and patterns.',
              icon: '✨'
            }
          ].map(f => (
            <div key={f.title} className="card text-center animate-slide-up hover:border-brand-500/30 transition-all duration-300">
              <div className="text-4xl mb-4">{f.icon}</div>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">How It Works</h2>
          <div className="space-y-4">
            {[
              { step: '1', title: 'Sign Up Free', desc: 'Create your secure account in seconds.' },
              { step: '2', title: 'Try the Demo', desc: 'Experience the full app with guided onboarding.' },
              { step: '3', title: 'Subscribe', desc: 'Unlock unlimited memories and AI features.' }
            ].map(s => (
              <div key={s.step} className="card flex items-start gap-4 text-left">
                <div className="w-10 h-10 rounded-full bg-brand-600 flex items-center justify-center font-bold shrink-0">
                  {s.step}
                </div>
                <div>
                  <h3 className="font-semibold">{s.title}</h3>
                  <p className="text-gray-400 text-sm">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
