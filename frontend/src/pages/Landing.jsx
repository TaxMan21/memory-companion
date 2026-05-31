import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Landing() {
  const { user } = useAuth();

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 relative">
        <BackgroundEffect />
        <div className="text-center animate-fade-in relative z-10">
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
    <div className="min-h-screen relative overflow-hidden">
      <BackgroundEffect />

      <header className="glass fixed top-0 left-0 right-0 z-50 h-16 px-6 flex items-center justify-between">
        <span className="text-xl font-bold bg-gradient-to-r from-brand-400 to-brand-600 bg-clip-text text-transparent">
          Memory Companion
        </span>
        <div className="flex items-center gap-3">
          <Link to="/signin" className="btn-ghost">Sign In</Link>
          <Link to="/signup" className="btn-primary">Get Started</Link>
        </div>
      </header>

      <main className="relative z-10 pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-600/10 border border-brand-500/20 text-brand-400 text-sm font-medium mb-8 backdrop-blur-sm">
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
            <div key={f.title} className="card text-center animate-slide-up hover:border-brand-500/30 transition-all duration-300 backdrop-blur-sm bg-surface-900/70">
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
              <div key={s.step} className="card flex items-start gap-4 text-left backdrop-blur-sm bg-surface-900/70">
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

        <footer className="max-w-5xl mx-auto mt-20 pt-8 border-t border-gray-800 flex items-center justify-between text-xs text-gray-600">
          <span>&copy; 2026 Memory Companion</span>
          <div className="flex gap-4">
            <Link to="/terms" className="hover:text-gray-400 transition-colors">Terms of Service</Link>
            <Link to="/privacy" className="hover:text-gray-400 transition-colors">Privacy Policy</Link>
          </div>
        </footer>
      </main>
    </div>
  );
}

function BackgroundEffect() {
  return (
    <div className="fixed inset-0 -z-10">
      <div className="absolute inset-0 bg-gradient-to-b from-surface-950 via-surface-900 to-surface-950" />

      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-brand-500 blur-[128px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 rounded-full bg-purple-500 blur-[128px] animate-pulse" style={{ animationDuration: '12s', animationDelay: '2s' }} />
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 rounded-full bg-brand-600 blur-[128px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '4s' }} />
      </div>

      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: `${Math.random() * 3 + 1}px`,
              height: `${Math.random() * 3 + 1}px`,
              left: `${Math.random() * 100}%`,
              bottom: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.5 + 0.1,
              animation: `float-particle ${Math.random() * 15 + 10}s linear infinite`,
              animationDelay: `${Math.random() * 10}s`
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes float-particle {
          0% {
            transform: translateY(0) translateX(0);
            opacity: 0;
          }
          10% {
            opacity: ${Math.random() * 0.5 + 0.2};
          }
          90% {
            opacity: ${Math.random() * 0.3 + 0.1};
          }
          100% {
            transform: translateY(-100vh) translateX(${Math.random() * 100 - 50}px);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
