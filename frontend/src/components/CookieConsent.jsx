import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem('mc_cookies_accepted');
    if (!accepted) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem('mc_cookies_accepted', 'true');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-slide-up">
      <div className="max-w-4xl mx-auto glass rounded-2xl p-4 flex items-center justify-between gap-4 flex-wrap">
        <p className="text-sm text-gray-300">
          We use essential cookies for authentication and security. No tracking cookies are used.{' '}
          <Link to="/privacy" className="text-brand-400 hover:text-brand-300 underline">Learn more</Link>
        </p>
        <div className="flex gap-3 shrink-0">
          <button onClick={accept} className="btn-primary text-sm py-2 px-5">
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
