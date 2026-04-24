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
    
  );
}
