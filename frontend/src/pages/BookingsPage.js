import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { hasRole } from '../utils/roles';
import './OperationsPages.css';

// Icon component
const IconCalendar = () => <svg className="dashboard-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z" /></svg>;

const getBookingStatusIcon = (status) => {
    const icons = {
        PENDING: '⏳',
        APPROVED: '✅',
        REJECTED: '❌',
        CANCELLED: '🚫',
    };
    return icons[status] || '📋';
};

function toInstant(value) {
    if (!value) return null;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString();
}

function statusClass(s) {
    if (s === 'APPROVED') return 'ok';
    if (s === 'REJECTED' || s === 'CANCELLED') return 'bad';
    return 'neutral';
}

export default function BookingsPage() {
    const { user } = useAuth();
    const admin = hasRole(user, 'ADMIN');
    const [mine, setMine] = useState([]);
    const [adminRows, setAdminRows] = useState([]);
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [rejectModal, setRejectModal] = useState(null); // { id, reason }

    const pendingCount = useMemo(() => adminRows.filter(b => b.status === 'PENDING').length, [adminRows]);
    const approvedCount = useMemo(() => adminRows.filter(b => b.status === 'APPROVED').length, [adminRows]);
    const [form, setForm] = useState({
        resourceId: '',
        startLocal: '',
        endLocal: '',
        purpose: '',
        expectedAttendees: '',
    });

    const loadMine = async () => {
        const { data } = await api.get('/bookings/me');
        setMine(data);
    };

    const loadAdmin = async () => {
        const { data } = await api.get('/bookings');
        setAdminRows(data);
    };

    const loadResources = async () => {
        const { data } = await api.get('/resources?status=ACTIVE');
        setResources(data);
        if (!form.resourceId && data[0]?.id) {
            setForm((f) => ({ ...f, resourceId: String(data[0].id) }));
        }
    };

    const refresh = async () => {
        setLoading(true);
        setError('');
        try {
            if (admin) {
                await loadAdmin();
            } else {
                await Promise.all([loadMine(), loadResources()]);
            }
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refresh();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [admin]);

    const rows = useMemo(() => (admin ? adminRows : mine), [admin, adminRows, mine]);

    const submitBooking = async (e) => {
        e.preventDefault();
        setError('');
        const startAt = toInstant(form.startLocal);
        const endAt = toInstant(form.endLocal);
        if (!startAt || !endAt) {
            setError('Please choose valid start and end times.');
            return;
        }
        if (new Date(startAt) >= new Date(endAt)) {
            setError('End time must be after start time.');
            return;
        }
        const purpose = form.purpose.trim();
        if (purpose.length < 5) {
            setError('Purpose must be at least 5 characters.');
            return;
        }
        const attendees = form.expectedAttendees ? Number(form.expectedAttendees) : null;
        if (attendees !== null && (!Number.isInteger(attendees) || attendees < 1)) {
            setError('Expected attendees must be a positive whole number.');
            return;
        }
        try {
            await api.post('/bookings', {
                resourceId: Number(form.resourceId),
                startAt,
                endAt,
                purpose,
                expectedAttendees: attendees,
            });
            setForm((f) => ({ ...f, purpose: '', expectedAttendees: '' }));
            await refresh();
        } catch (err) {
            setError(err.message);
        }
    };

    const approve = async (id) => {
        setError('');
        try {
            await api.patch(`/bookings/${id}/approve`);
            await refresh();
        } catch (e) {
            setError(e.message);
        }
    };

    const confirmReject = async () => {
        if (!rejectModal?.id || !rejectModal.reason?.trim()) return;
        if (rejectModal.reason.trim().length < 5) {
            setError('Reject reason must be at least 5 characters.');
            return;
        }
        setError('');
        try {
            await api.patch(`/bookings/${rejectModal.id}/reject`, { reason: rejectModal.reason.trim() });
            setRejectModal(null);
            await refresh();
        } catch (e) {
            setError(e.message);
        }
    };

    const cancel = async (id) => {
        if (!window.confirm('Cancel this booking?')) return;
        setError('');
        try {
            await api.patch(`/bookings/${id}/cancel`);
            await refresh();
        } catch (e) {
            setError(e.message);
        }
    };

    return (
        <div className="ops-page bookings-page">
            <div className="ops-hero">
                <div>
                    <h1 className="h1">Bookings</h1>
                    <p className="muted">Request a booking, track approvals, and avoid conflicts for the same resource.</p>
                </div>
            </div>

            {admin ? (
                <div className="ops-chip-row">
                    <span className="ops-chip">📋 Total: {adminRows.length}</span>
                    <span className="ops-chip">⏳ Pending: {pendingCount}</span>
                    <span className="ops-chip">✅ Approved: {approvedCount}</span>
                </div>
            ) : (
                <div className="ops-chip-row">
                    <span className="ops-chip">📖 My bookings: {mine.length}</span>
                </div>
            )}

            {!admin ? (
                <div className="panel ops-panel" style={{ marginTop: 14 }}>
                    <div style={{ fontWeight: 700, marginBottom: 10 }}>New booking request</div>
                    <form className="grid form-grid" onSubmit={submitBooking}>
                        <label className="label">
                            Resource
                            <select className="input" value={form.resourceId} onChange={(e) => setForm((f) => ({ ...f, resourceId: e.target.value }))} required>
                                {resources.map((r) => (
                                    <option key={r.id} value={r.id}>
                                        {r.name} — {r.type}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="label">
                            Start (local)
                            <input className="input" type="datetime-local" value={form.startLocal} onChange={(e) => setForm((f) => ({ ...f, startLocal: e.target.value }))} required />
                        </label>
                        <label className="label">
                            End (local)
                            <input className="input" type="datetime-local" value={form.endLocal} onChange={(e) => setForm((f) => ({ ...f, endLocal: e.target.value }))} required />
                        </label>
                        <label className="label span-2">
                            Purpose
                            <input className="input" value={form.purpose} onChange={(e) => setForm((f) => ({ ...f, purpose: e.target.value }))} minLength={5} maxLength={300} required />
                        </label>
                        <label className="label">
                            Expected attendees
                            <input className="input" type="number" min="1" step="1" value={form.expectedAttendees} onChange={(e) => setForm((f) => ({ ...f, expectedAttendees: e.target.value }))} />
                        </label>
                        <div className="span-2" style={{ display: 'flex', alignItems: 'end' }}>
                            <button className="btn primary" type="submit">
                                Submit request
                            </button>
                        </div>
                    </form>
                </div>
            ) : null}

            {error ? <div className="alert error">{error}</div> : null}
            {loading ? <div className="muted">Loading…</div> : null}

            <h2 className="h1" style={{ fontSize: 18, marginTop: 18 }}>
                {admin ? 'Admin queue (all bookings)' : 'My bookings'}
            </h2>
            <div className="table-wrap ops-table-wrap">
                <table className="table">
                    <thead>
                        <tr>
                            <th>📅 When</th>
                            <th>📦 Resource</th>
                            <th>📝 Purpose</th>
                            <th>📊 Status</th>
                            <th />
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((b) => (
                            <tr key={b.id}>
                                <td>
                                    <div>{new Date(b.startAt).toLocaleString()}</div>
                                    <div className="muted">→ {new Date(b.endAt).toLocaleString()}</div>
                                </td>
                                <td>{b.resource?.name}</td>
                                <td>{b.purpose}</td>
                                <td>
                                    <span className={`status ${statusClass(b.status)}`}>{getBookingStatusIcon(b.status)} {b.status}</span>
                                    {b.adminReason ? <div className="muted" style={{ marginTop: 6 }}>{b.adminReason}</div> : null}
                                </td>
                                <td className="right">
                                    {admin && b.status === 'PENDING' ? (
                                        <>
                                            <button type="button" className="btn small primary" onClick={() => approve(b.id)}>
                                                Approve
                                            </button>{' '}
                                            <button type="button" className="btn small danger" onClick={() => setRejectModal({ id: b.id, reason: '' })}>
                                                Reject
                                            </button>
                                        </>
                                    ) : null}
                                    {!admin && (b.status === 'PENDING' || b.status === 'APPROVED') ? (
                                        <button type="button" className="btn small ghost" onClick={() => cancel(b.id)}>
                                            Cancel
                                        </button>
                                    ) : null}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {rejectModal ? (
                <div className="modal-backdrop" role="presentation" onMouseDown={() => setRejectModal(null)}>
                    <div className="modal" role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="modal-title">Reject booking</div>
                            <button type="button" className="btn ghost" onClick={() => setRejectModal(null)}>
                                Close
                            </button>
                        </div>
                        <div className="modal-body">
                            <label className="label">
                                Reason
                                <textarea className="textarea" minLength={5} maxLength={400} value={rejectModal.reason} onChange={(e) => setRejectModal((r) => ({ ...r, reason: e.target.value }))} />
                            </label>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn danger" onClick={confirmReject}>
                                Reject booking
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
