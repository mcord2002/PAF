import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import './OperationsPages.css';

export default function NotificationsPage() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const unreadCount = items.filter((n) => !n.read).length;

  const load = async () => {
    setError('');
    try {
      const { data } = await api.get('/notifications');
      setItems(data);
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const markRead = async (id) => {
    await api.patch(`/notifications/${id}/read`);
    await load();
  };

  const markAll = async () => {
    await api.post('/notifications/read-all');
    await load();
  };

  const clearOne = async (id) => {
    await api.delete(`/notifications/${id}`);
    await load();
  };

  return (
    <div className="ops-page notifications-page">
      <div className="ops-hero row space-between wrap gap">
        <div>
          <h1 className="h1">Notifications</h1>
          <p className="muted">Booking decisions, ticket updates, and ticket comment activity.</p>
        </div>
        <button type="button" className="btn ghost" onClick={markAll}>
          Mark all read
        </button>
      </div>
      <div className="ops-chip-row">
        <span className="ops-chip">Total: {items.length}</span>
        <span className="ops-chip">Unread: {unreadCount}</span>
        <span className="ops-chip">Read: {Math.max(items.length - unreadCount, 0)}</span>
      </div>

      {error ? <div className="alert error">{error}</div> : null}

      <div className="stack ops-notification-list" style={{ marginTop: 14 }}>
        {items.map((n) => (
          <div key={n.id} className="panel ops-notification-card row space-between wrap gap">
            <div style={{ minWidth: 0 }}>
              <div className="row gap wrap" style={{ alignItems: 'center' }}>
                <div style={{ fontWeight: 750 }}>{n.title}</div>
                {!n.read ? <span className="status neutral">Unread</span> : <span className="tag">Read</span>}
                <span className="tag">{n.type}</span>
              </div>
              <div className="muted" style={{ marginTop: 8 }}>
                {n.message}
              </div>
              <div className="muted" style={{ fontSize: 12, marginTop: 8 }}>
                {new Date(n.createdAt).toLocaleString()}
                {n.relatedEntityId ? ` · ref #${n.relatedEntityId}` : ''}
              </div>
            </div>
            {!n.read ? (
              <div className="row gap">
                <button type="button" className="btn small primary" onClick={() => markRead(n.id)}>
                  Mark read
                </button>
                <button type="button" className="btn small ghost" onClick={() => clearOne(n.id)}>
                  Clear
                </button>
              </div>
            ) : (
              <button type="button" className="btn small ghost" onClick={() => clearOne(n.id)}>
                Clear
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
//Add Notification entity/model and repository
//Initial backend structure for notifications.
//Implement Notification service logic
//Business logic for creating, fetching, and marking notifications.