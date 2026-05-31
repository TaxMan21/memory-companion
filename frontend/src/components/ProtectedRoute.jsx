import { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/client.js';

export default function ProtectedRoute({ children, requireSubscription = false }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (location.pathname === '/onboarding') { setOnboardingChecked(true); return; }

    api.get('/features/profile').then(d => {
      const profile = d.profile;
      setNeedsOnboarding(!profile?.id || !profile.onboarding_complete);
    }).catch(() => {
      setNeedsOnboarding(true);
    }).finally(() => setOnboardingChecked(true));
  }, [user, location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-brand-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  if (requireSubscription && user.subscription_status !== 'active') {
    return <Navigate to="/subscription" state={{ from: location }} replace />;
  }

  if (onboardingChecked && needsOnboarding && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
}
