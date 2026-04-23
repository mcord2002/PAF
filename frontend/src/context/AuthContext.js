import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

const TOKEN_KEY = 'campus_hub_token';
const USER_KEY = 'campus_hub_user';

function readStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(readStoredUser);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    try {
      sessionStorage.removeItem('campus_hub_google_portal');
    } catch {
      /* ignore */
    }
    setToken(null);
    setUser(null);
  }, []);

  const persist = useCallback((nextToken, nextUser) => {
    localStorage.setItem(TOKEN_KEY, nextToken);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
  }, []);

  const login = useCallback(
    async (email, password) => {
      const { data } = await api.post('/auth/login', { email, password });
      persist(data.token, data.user);
      return data.user;
    },
    [persist]
  );

  const loginWithGoogle = useCallback(
    async (idToken, portal) => {
      const body = portal ? { idToken, portal } : { idToken };
      const { data } = await api.post('/auth/google', body);
      persist(data.token, data.user);
      return data.user;
    },
    [persist]
  );

  const register = useCallback(
    async (payload) => {
      const { data } = await api.post('/auth/register', payload);
      persist(data.token, data.user);
      return data.user;
    },
    [persist]
  );

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token && user),
      login,
      loginWithGoogle,
      register,
      logout,
    }),
    [token, user, login, loginWithGoogle, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}


//Add Google OAuth Button and Flow to Frontend 
// //Create a Google OAuth login button and integrate the login flow on the frontend.


//Add Google OAuth Button and Flow to Frontend 
// //Create a Google OAuth login button and integrate the login flow on the frontend.