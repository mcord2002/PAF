import React, { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { defaultDashboardPath, primaryDashboardRole } from '../utils/dashboardPath';
import './AppLayout.css';

function roleDisplayName(role) {
  switch (role) {
    case 'ADMIN':
      return 'Admin';
    case 'TECHNICIAN':
      return 'Technician';
    case 'USER':
      return 'User';
    default:
      return role;
  }
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unread, setUnread] = useState(0);
  const primaryRole = primaryDashboardRole(user);
  const dashboardLabel =
    primaryRole === 'ADMIN' ? 'Admin dashboard' : primaryRole === 'TECHNICIAN' ? 'Technician dashboard' : 'User dashboard';
  const roleLabel = roleDisplayName(primaryRole);
  const isTechnicianPrimary = primaryRole === 'TECHNICIAN';
  const notice = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const raw = params.get('notice');
    if (!raw) return '';
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }, [location.search]);

  const dismissNotice = () => {
    const params = new URLSearchParams(location.search);
    params.delete('notice');
    const qs = params.toString();
    navigate(`${location.pathname}${qs ? `?${qs}` : ''}`, { replace: true });
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get('/notifications/unread-count');
        if (!cancelled) setUnread(Number(data.count) || 0);
      } catch {
        if (!cancelled) setUnread(0);
      }
    })();
    const id = setInterval(async () => {
      try {
        const { data } = await api.get('/notifications/unread-count');
        if (!cancelled) setUnread(Number(data.count) || 0);
      } catch {
        /* ignore */
      }
    }, 30000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const onLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-title">Campus Hub</div>
          <div className="brand-sub">Operations</div>
        </div>
        <nav className="nav">
          <NavLink to={defaultDashboardPath(user)} className={({ isActive }) => (isActive ? 'navlink active' : 'navlink')}>
            {dashboardLabel}
          </NavLink>
          {!isTechnicianPrimary ? (
            <NavLink to="/resources" className={({ isActive }) => (isActive ? 'navlink active' : 'navlink')}>
              Facilities
            </NavLink>
          ) : null}
          {!isTechnicianPrimary ? (
            <NavLink to="/bookings" className={({ isActive }) => (isActive ? 'navlink active' : 'navlink')}>
              Bookings
            </NavLink>
          ) : null}
          <NavLink to="/tickets" className={({ isActive }) => (isActive ? 'navlink active' : 'navlink')}>
            Tickets
          </NavLink>
          <NavLink to="/notifications" className={({ isActive }) => (isActive ? 'navlink active' : 'navlink')}>
            Notifications
            {unread > 0 ? <span className="badge">{unread > 99 ? '99+' : unread}</span> : null}
          </NavLink>
        </nav>
        <div className="sidebar-footer">
          <div className="user-chip">
            <div className="user-name">{user?.fullName}</div>
            <div className="user-email">{user?.email}</div>
            <div className="user-roles">
              {roleLabel}
            </div>
          </div>
          <button type="button" className="btn ghost full" onClick={onLogout}>
            Sign out
          </button>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <div className="topbar-title">Smart Campus Operations Hub</div>
          <div className="topbar-actions">
            <span className={`pill ${primaryRole === 'ADMIN' ? 'warn' : primaryRole === 'TECHNICIAN' ? 'ok' : ''}`}>{roleLabel}</span>
            <Link to="/notifications" className="link-quiet">
              Inbox{unread > 0 ? ` (${unread})` : ''}
            </Link>
          </div>
        </header>
        <section className="content">
          {notice ? (
            <div className="notice-banner" role="status">
              <div className="notice-text">{notice}</div>
              <button type="button" className="notice-dismiss" onClick={dismissNotice} aria-label="Dismiss notice">
                ×
              </button>
            </div>
          ) : null}
          <Outlet />
        </section>
      </main>
    </div>
  );
}
