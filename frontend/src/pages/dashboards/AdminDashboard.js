import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setError('');
      try {
        const [b, t] = await Promise.all([api.get('/bookings'), api.get('/tickets?scope=all')]);
        if (!cancelled) {
          setBookings(b.data || []);
          setTickets(t.data || []);
        }
      } catch (e) {
        if (!cancelled) setError(e.message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const pendingBookings = useMemo(() => bookings.filter((x) => x.status === 'PENDING').length, [bookings]);
  const openTickets = useMemo(
    () => tickets.filter((x) => x.status === 'OPEN' || x.status === 'IN_PROGRESS').length,
    [tickets]
  );
  const resolvedTickets = useMemo(() => tickets.filter((x) => x.status === 'RESOLVED').length, [tickets]);
  const urgentQueue = useMemo(
    () =>
      tickets
        .filter((x) => x.status === 'OPEN' || x.status === 'IN_PROGRESS')
        .slice(0, 5)
        .map((x) => ({
          id: x.id,
          title: x.category || 'General issue',
          priority: x.priority || 'NORMAL',
          status: x.status,
        })),
    [tickets]
  );
  const recentBookings = useMemo(
    () =>
      bookings
        .slice(0, 5)
        .map((x) => ({ id: x.id, status: x.status, purpose: x.purpose || 'Booking request' })),
    [bookings]
  );

  return (
    <div className="admin-dash">
      <section className="admin-hero">
        <div>
          <p className="admin-kicker">Control center</p>
          <h1 className="h1">Administrator dashboard</h1>
          <p className="muted">
            Signed in as <strong>{user?.fullName}</strong>. Approve bookings, manage resources, assign technicians, and
            monitor campus operations from one place.
          </p>
        </div>
        <div className="admin-hero-chips">
          <div className="admin-chip">Total bookings: {bookings.length}</div>
          <div className="admin-chip">Total tickets: {tickets.length}</div>
          <div className="admin-chip">Pending focus: {pendingBookings + openTickets}</div>
        </div>
      </section>
      {error ? <div className="alert error">{error}</div> : null}

      <section className="admin-metrics">
        <article className="admin-metric-card">
          <p className="metric-label">Pending bookings</p>
          <p className="metric-value">{pendingBookings}</p>
          <p className="metric-meta">Awaiting approve/reject decisions.</p>
        </article>
        <article className="admin-metric-card">
          <p className="metric-label">Active tickets</p>
          <p className="metric-value">{openTickets}</p>
          <p className="metric-meta">Open and in-progress incidents.</p>
        </article>
        <article className="admin-metric-card">
          <p className="metric-label">Resolved pending close</p>
          <p className="metric-value">{resolvedTickets}</p>
          <p className="metric-meta">Check and close after validation.</p>
        </article>
        <article className="admin-metric-card">
          <p className="metric-label">Service health</p>
          <p className="metric-value">{Math.max(100 - (pendingBookings + openTickets) * 3, 68)}%</p>
          <p className="metric-meta">Derived from current operational load.</p>
        </article>
      </section>

      <section className="admin-actions">
        <Link className="admin-action-card" to="/bookings">
          <div className="card-title">Booking approvals</div>
          <div className="card-body muted">Review pending requests and avoid scheduling conflicts.</div>
          <span className="admin-link">Open queue</span>
        </Link>
        <Link className="admin-action-card" to="/tickets">
          <div className="card-title">Maintenance tickets</div>
          <div className="card-body muted">Assign technicians and monitor issue status updates.</div>
          <span className="admin-link">Manage tickets</span>
        </Link>
        <Link className="admin-action-card" to="/resources">
          <div className="card-title">Facilities catalogue</div>
          <div className="card-body muted">Create, update, and retire campus resources.</div>
          <span className="admin-link">Manage resources</span>
        </Link>
        <Link className="admin-action-card" to="/notifications">
          <div className="card-title">Notifications</div>
          <div className="card-body muted">Track system events triggered by admin actions.</div>
          <span className="admin-link">View notifications</span>
        </Link>
      </section>

      <section className="admin-secondary-grid">
        <article className="admin-panel">
          <div className="admin-panel-head">
            <h3>Priority ticket queue</h3>
            <Link to="/tickets" className="admin-inline-link">
              Open all
            </Link>
          </div>
          {urgentQueue.length > 0 ? (
            <div className="admin-list">
              {urgentQueue.map((item) => (
                <Link key={item.id} className="admin-list-item" to={`/tickets/${item.id}`}>
                  <div>
                    <div className="admin-list-title">#{item.id} - {item.title}</div>
                    <div className="muted">{item.status}</div>
                  </div>
                  <span className={`admin-pill ${item.priority.toLowerCase()}`}>{item.priority}</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="muted">No active ticket queue right now.</p>
          )}
        </article>

        <article className="admin-panel">
          <div className="admin-panel-head">
            <h3>Recent booking activity</h3>
            <Link to="/bookings" className="admin-inline-link">
              Review
            </Link>
          </div>
          {recentBookings.length > 0 ? (
            <div className="admin-list">
              {recentBookings.map((item) => (
                <div key={item.id} className="admin-list-item">
                  <div>
                    <div className="admin-list-title">#{item.id} - {item.purpose}</div>
                    <div className="muted">Current status: {item.status}</div>
                  </div>
                  <span className={`admin-pill ${item.status.toLowerCase()}`}>{item.status}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">No booking activity to show yet.</p>
          )}
        </article>
      </section>

      <div className="callout admin-checklist">
        <div className="callout-title">Operational checklist</div>
        <ul className="muted">
          <li>Clear pending bookings regularly (conflicts are blocked automatically).</li>
          <li>Assign technicians on high-priority tickets from ticket details.</li>
          <li>Keep resource status accurate (OUT_OF_SERVICE stops new bookings).</li>
        </ul>
      </div>
    </div>
  );
}

//Create Role Management UI (Frontend) 
// // Set up a frontend page/component for managing user roles (e.g., admin panel). 