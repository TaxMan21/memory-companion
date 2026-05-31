import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('mc_token');
    if (token) {
      api.setToken(token);
      api.getMe()
        .then(({ user }) => setUser(user))
        .catch(() => {
          api.setToken(null);
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const signup = useCallback(async (email, password, name) => {
    const data = await api.signup(email, password, name);
    api.setToken(data.token);
    setUser(data.user);
    return data;
  }, []);

  const signin = useCallback(async (email, password) => {
    const data = await api.signin(email, password);
    api.setToken(data.token);
    setUser(data.user);
    return data;
  }, []);

  const signout = useCallback(async () => {
    try { await api.signout(); } catch {}
    api.setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const { user: u } = await api.getMe();
      setUser(u);
    } catch {}
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signup, signin, signout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
