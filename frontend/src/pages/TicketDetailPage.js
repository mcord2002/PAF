import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { hasRole } from '../utils/roles';
import './TicketDetailPage.css';

export default function TicketDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const admin = hasRole(user, 'ADMIN');
  const tech = hasRole(user, 'TECHNICIAN');

  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [error, setError] = useState('');
  const [commentBody, setCommentBody] = useState('');
  const [status, setStatus] = useState({ next: 'IN_PROGRESS', notes: '' });
  const [assigneeId, setAssigneeId] = useState('');
  const [reject, setReject] = useState({ open: false, reason: '' });

  const base = useMemo(() => process.env.REACT_APP_API_BASE || 'http://localhost:8080/api/v1', []);

  const load = async () => {
    setError('');
    try {
      const [{ data: t }, { data: c }, { data: a }] = await Promise.all([
        api.get(`/tickets/${id}`),
        api.get(`/tickets/${id}/comments`),
        api.get(`/tickets/${id}/attachments`),
      ]);
      setTicket(t);
      setComments(c);
      setAttachments(a);
      setStatus((s) => ({ ...s, next: t.status }));
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const postComment = async (e) => {
    e.preventDefault();
    const body = commentBody.trim();
    if (!body) return;
    if (body.length < 2) {
      setError('Comment must be at least 2 characters.');
      return;
    }
    if (body.length > 1000) {
      setError('Comment cannot exceed 1000 characters.');
      return;
    }
    await api.post(`/tickets/${id}/comments`, { body });
    setCommentBody('');
    await load();
  };

  const upload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    await api.post(`/tickets/${id}/attachments`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    e.target.value = '';
    await load();
  };

  const updateStatus = async (e) => {
    e.preventDefault();
    const notes = status.notes.trim();
    if (notes.length > 2000) {
      setError('Resolution notes cannot exceed 2000 characters.');
      return;
    }
    await api.patch(`/tickets/${id}/status`, { status: status.next, resolutionNotes: notes || null });
    await load();
  };

  const assign = async (e) => {
    e.preventDefault();
    setError('');
    const parsedId = Number(assigneeId);
    if (!assigneeId || !Number.isInteger(parsedId) || parsedId <= 0) {
      setError('Please enter a valid technician user ID.');
      return;
    }
    try {
      await api.patch(`/tickets/${id}/assign`, { assigneeUserId: parsedId });
      setAssigneeId('');
      await load();
    } catch (e2) {
      setError(e2.message || 'Failed to assign technician.');
    }
  };

  const confirmReject = async () => {
    if (!reject.reason.trim()) return;
    if (reject.reason.trim().length < 5) {
      setError('Reject reason must be at least 5 characters.');
      return;
    }
    await api.patch(`/tickets/${id}/reject`, { reason: reject.reason.trim() });
    setReject({ open: false, reason: '' });
    await load();
  };

  const editComment = async (commentId, body) => {
    if (!body) return;
    const nextBody = body.trim();
    if (nextBody.length < 2 || nextBody.length > 1000) {
      setError('Edited comment must be between 2 and 1000 characters.');
      return;
    }
    await api.put(`/tickets/comments/${commentId}`, { body: nextBody });
    await load();
  };

  const deleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    await api.delete(`/tickets/comments/${commentId}`);
    await load();
  };

  if (error && !ticket) {
    return (
      <div>
        <div className="alert error">{error}</div>
        <Link className="btn ghost" to="/tickets">
          Back
        </Link>
      </div>
    );
  }
  if (!ticket) return <div className="muted">Loading…</div>;

  const token = localStorage.getItem('campus_hub_token');
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  return (
    <div className="ticket-detail-page">
      <div className="ticket-hero">
        <div className="ticket-hero-main">
          <div className="muted ticket-breadcrumb">
            <Link to="/tickets">Tickets</Link> / #{ticket.id}
          </div>
          <h1 className="h1 ticket-title">
            {ticket.category}
          </h1>
          <p className="muted">{ticket.description}</p>
        </div>
        <div className="ticket-badges">
          <span className="ticket-badge priority">{ticket.priority}</span>
          <span className="ticket-badge status">{ticket.status}</span>
        </div>
      </div>

      {error ? <div className="alert error">{error}</div> : null}

      <div className="panel stack ticket-panel">
        <div>
          <strong>Reporter:</strong> {ticket.reporterName} (#{ticket.reporterId})
        </div>
        <div>
          <strong>Assignee:</strong> {ticket.assigneeName ? `${ticket.assigneeName} (#${ticket.assigneeId})` : 'Unassigned'}
        </div>
        {ticket.resource ? (
          <div>
            <strong>Resource:</strong> {ticket.resource.name} ({ticket.resource.type})
          </div>
        ) : null}
        {ticket.locationText ? (
          <div>
            <strong>Location:</strong> {ticket.locationText}
          </div>
        ) : null}
        {ticket.resolutionNotes ? (
          <div>
            <strong>Resolution notes:</strong>
            <div className="muted" style={{ whiteSpace: 'pre-wrap' }}>
              {ticket.resolutionNotes}
            </div>
          </div>
        ) : null}
        {ticket.rejectionReason ? (
          <div>
            <strong>Rejection reason:</strong> {ticket.rejectionReason}
          </div>
        ) : null}
      </div>

      {admin ? (
        <div className="panel stack ticket-panel">
          <div style={{ fontWeight: 700 }}>Assign technician</div>
          <form className="row gap wrap" onSubmit={assign}>
            <input
              className="input"
              type="number"
              min="1"
              step="1"
              style={{ maxWidth: 360 }}
              placeholder="Assignee user id (e.g. technician account id)"
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
            />
            <button className="btn primary" type="submit">
              Assign
            </button>
            <button type="button" className="btn danger" onClick={() => setReject({ open: true, reason: '' })}>
              Reject ticket
            </button>
          </form>
          <div className="muted" style={{ fontSize: 12 }}>
            Tip: use the technician demo user id from your database UI, or inspect network responses after login.
          </div>
        </div>
      ) : null}

      {(admin || tech) && ticket.status !== 'REJECTED' && ticket.status !== 'CLOSED' ? (
        <form className="panel grid form-grid ticket-panel" onSubmit={updateStatus}>
          <div style={{ fontWeight: 700, gridColumn: '1 / -1' }}>Update workflow</div>
          <label className="label">
            Next status
            <select className="input" value={status.next} onChange={(e) => setStatus((s) => ({ ...s, next: e.target.value }))}>
              <option value="OPEN">OPEN</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="RESOLVED">RESOLVED</option>
              <option value="CLOSED">CLOSED</option>
            </select>
          </label>
          <label className="label span-2">
            Notes (optional)
            <textarea className="textarea" maxLength={2000} value={status.notes} onChange={(e) => setStatus((s) => ({ ...s, notes: e.target.value }))} />
          </label>
          <div className="span-2">
            <button className="btn primary" type="submit">
              Save status
            </button>
          </div>
        </form>
      ) : null}

      <div className="panel stack ticket-panel">
        <div style={{ fontWeight: 700 }}>Evidence (max 3)</div>
        <div className="row gap wrap">
          <input type="file" accept="image/*" onChange={upload} />
        </div>
        <div className="stack" style={{ marginTop: 10 }}>
          {attachments.map((a) => (
            <div key={a.id} className="row space-between wrap gap">
              <div>
                <div>{a.originalFileName}</div>
                <div className="muted" style={{ fontSize: 12 }}>
                  {a.contentType} · {(a.sizeBytes / 1024).toFixed(1)} KB
                </div>
              </div>
              <a
                className="btn small ghost"
                href={`${base}/tickets/${id}/attachments/${a.id}/file`}
                {...(token ? { headers: authHeaders } : {})}
                target="_blank"
                rel="noreferrer"
                onClick={async (e) => {
                  // fetch with auth for download
                  e.preventDefault();
                  const res = await fetch(`${base}/tickets/${id}/attachments/${a.id}/file`, { headers: authHeaders });
                  const blob = await res.blob();
                  const url = URL.createObjectURL(blob);
                  window.open(url, '_blank');
                }}
              >
                View
              </a>
            </div>
          ))}
        </div>
      </div>

      <div className="panel stack ticket-panel">
        <div style={{ fontWeight: 700 }}>Comments</div>
        <div className="stack">
          {comments.map((c) => (
            <div key={c.id} className="panel ticket-comment-card" style={{ padding: 12 }}>
              <div className="row space-between wrap gap">
                <div>
                  <strong>{c.authorName}</strong> <span className="muted">#{c.authorId}</span>
                </div>
                <div className="muted" style={{ fontSize: 12 }}>
                  {new Date(c.createdAt).toLocaleString()}
                  {c.updatedAt ? ` · edited ${new Date(c.updatedAt).toLocaleString()}` : ''}
                </div>
              </div>
              <div style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>{c.body}</div>
              <div className="row gap" style={{ marginTop: 10 }}>
                {c.authorId === user?.id ? (
                  <button type="button" className="btn small ghost" onClick={() => editComment(c.id, window.prompt('Edit comment', c.body))}>
                    Edit
                  </button>
                ) : null}
                {c.authorId === user?.id || admin ? (
                  <button type="button" className="btn small danger" onClick={() => deleteComment(c.id)}>
                    Delete
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
        <form className="stack" onSubmit={postComment}>
          <label className="label">
            Add comment
            <textarea className="textarea" minLength={2} maxLength={1000} value={commentBody} onChange={(e) => setCommentBody(e.target.value)} />
          </label>
          <div>
            <button className="btn primary" type="submit">
              Post
            </button>
          </div>
        </form>
      </div>

      {reject.open ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setReject({ open: false, reason: '' })}>
          <div className="modal" role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Reject ticket</div>
              <button type="button" className="btn ghost" onClick={() => setReject({ open: false, reason: '' })}>
                Close
              </button>
            </div>
            <div className="modal-body">
              <label className="label">
                Reason
                <textarea className="textarea" minLength={5} maxLength={500} value={reject.reason} onChange={(e) => setReject((r) => ({ ...r, reason: e.target.value }))} />
              </label>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn danger" onClick={confirmReject}>
                Reject
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
