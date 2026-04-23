import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { defaultDashboardPath } from '../utils/dashboardPath';
import { hasRole } from '../utils/roles';
import './AuthPages.css';

const GOOGLE_PORTAL_KEY = 'campus_hub_google_portal';

export default function LoginPage() {
  const { login, loginWithGoogle, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const googleButtonRef = useRef(null);
  const fromPath = location.state?.from?.pathname;
  const afterAuth = location.state?.afterAuth;
  const requiredRole = location.state?.requiredRole;
  const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

  useEffect(() => {
    try {
      if (location.state?.requiredRole) {
        sessionStorage.setItem(GOOGLE_PORTAL_KEY, String(location.state.requiredRole));
        return;
      }
      if (!location.state?.afterAuth) {
        sessionStorage.removeItem(GOOGLE_PORTAL_KEY);
      }
    } catch {
      /* ignore */
    }
  }, [location.state?.afterAuth, location.state?.requiredRole]);

  const goToResolvedDestination = useCallback(
    (nextUser) => {
      const target =
        typeof afterAuth === 'string' && afterAuth.startsWith('/') ? afterAuth : null;
      if (target) {
        if (!requiredRole || hasRole(nextUser, requiredRole)) {
          navigate(target, { replace: true });
          return;
        }
        navigate(
          `${defaultDashboardPath(nextUser)}?notice=${encodeURIComponent(
            'මෙම portal එකට ඔබගේ account එකට අවශ්‍ය role එක නැහැ.'
          )}`,
          { replace: true }
        );
        return;
      }
      if (fromPath && fromPath !== '/login' && !fromPath.startsWith('/register') && !fromPath.startsWith('/dashboard')) {
        navigate(fromPath, { replace: true });
      } else {
        navigate(defaultDashboardPath(nextUser), { replace: true });
      }
    },
    [afterAuth, fromPath, navigate, requiredRole]
  );

  useEffect(() => {
    const clientId = googleClientId;
    if (!clientId || !window.google?.accounts?.id || !googleButtonRef.current) {
      return undefined;
    }
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async (response) => {
        if (!response?.credential) {
          setError('Google sign-in did not return a valid token.');
          return;
        }
        setError('');
        setLoading(true);
        try {
          let portal;
          try {
            portal = sessionStorage.getItem(GOOGLE_PORTAL_KEY) || undefined;
          } catch {
            portal = undefined;
          }
          const nextUser = await loginWithGoogle(response.credential, portal);
          try {
            sessionStorage.removeItem(GOOGLE_PORTAL_KEY);
          } catch {
            /* ignore */
          }
          goToResolvedDestination(nextUser);
        } catch (err) {
          setError(err.message || 'Google sign-in failed');
        } finally {
          setLoading(false);
        }
      },
    });
    googleButtonRef.current.innerHTML = '';
    window.google.accounts.id.renderButton(googleButtonRef.current, {
      theme: 'outline',
      size: 'large',
      width: 320,
      text: 'signin_with',
    });
    return () => {
      window.google.accounts.id.cancel();
    };
  }, [goToResolvedDestination, googleClientId, loginWithGoogle]);

  if (isAuthenticated) {
    const target =
      typeof afterAuth === 'string' && afterAuth.startsWith('/') ? afterAuth : null;
    if (target) {
      if (!requiredRole || hasRole(user, requiredRole)) {
        return <Navigate to={target} replace />;
      }
      return (
        <Navigate
          to={`${defaultDashboardPath(user)}?notice=${encodeURIComponent(
            'මෙම portal එකට ඔබගේ account එකට අවශ්‍ය role එක නැහැ.'
          )}`}
          replace
        />
      );
    }
    const to =
      fromPath && fromPath !== '/login' && !fromPath.startsWith('/register') && !fromPath.startsWith('/dashboard')
        ? fromPath
        : defaultDashboardPath(user);
    return <Navigate to={to} replace />;
  }
//validation
  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!cleanPassword) {
      setError('Password is required.');
      return;
    }
    setLoading(true);
    try {
      const nextUser = await login(cleanEmail, cleanPassword);
      goToResolvedDestination(nextUser);
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell login-shell">
      <div className="auth-card">
        <Link className="back-home-link" to="/">
          <span aria-hidden="true">←</span> Home
        </Link>
        <div className="auth-brand">Campus Hub</div>
        <div className="auth-badge">Secure access portal</div>
        <h1 className="auth-h1">Sign in</h1>
        <p className="muted">Use your university email.</p>
        <form className="form" onSubmit={onSubmit}>
          <label className="label">
            Email
            <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required maxLength={120} />
          </label>
          <label className="label">
            Password
            <input
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
            />
          </label>
          {error ? <div className="alert error">{error}</div> : null}
          <button className="btn primary full" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <div className="auth-divider"><span>or</span></div>
        <div className="google-login-wrap" ref={googleButtonRef} />
        {!googleClientId ? (
          <div className="muted oauth-note">Google OAuth is disabled. Set `REACT_APP_GOOGLE_CLIENT_ID` to enable it.</div>
        ) : null}
        <div className="auth-footer muted">
          No account? <Link to="/register">Create one</Link>
        </div>
        <div className="hint muted">
          Demo accounts (password <code>ChangeMe123!</code>):<br />
          <code>admin@campus.edu</code>, <code>tech@campus.edu</code>, <code>user@campus.edu</code>
        </div>
      </div>
    </div>
  );
}


//Add Google OAuth Button and Flow to Frontend 
// //Create a Google OAuth login button and integrate the login flow on the frontend.