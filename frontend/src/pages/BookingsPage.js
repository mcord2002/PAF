import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { hasRole } from '../utils/roles';
import './OperationsPages.css';

// Function to return an icon based on booking status
const getBookingStatusIcon = (status) => {
    const icons = {
        PENDING: '⏳',
        APPROVED: '✅',
        REJECTED: '❌',
        CANCELLED: '🚫',
    };
    return icons[status] || '📋'; // default icon
};

// Convert input date value into ISO string format
function toInstant(value) {
    if (!value) return null; // return null if empty
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null; // invalid date check
    return d.toISOString(); // convert to ISO
}

// Return CSS class based on status
function statusClass(s) {
    if (s === 'APPROVED') return 'ok';
    if (s === 'REJECTED' || s === 'CANCELLED') return 'bad';
    return 'neutral';
}

export default function BookingsPage() {
    const { user } = useAuth(); // get logged-in user
    const admin = hasRole(user, 'ADMIN'); // check if admin

    // State variables
    const [mine, setMine] = useState([]); // user bookings
    const [adminRows, setAdminRows] = useState([]); // all bookings for admin
    const [resources, setResources] = useState([]); // available resources
    const [loading, setLoading] = useState(true); // loading state
    const [error, setError] = useState(''); // error message
    const [rejectModal, setRejectModal] = useState(null); // reject modal data

    // Count pending bookings (admin only)
    const pendingCount = useMemo(() => adminRows.filter(b => b.status === 'PENDING').length, [adminRows]);

    // Count approved bookings (admin only)
    const approvedCount = useMemo(() => adminRows.filter(b => b.status === 'APPROVED').length, [adminRows]);

    // Form state for new booking
    const [form, setForm] = useState({
        resourceId: '',
        startLocal: '',
        endLocal: '',
        purpose: '',
        expectedAttendees: '',
    });

    // Load bookings of current user
    const loadMine = async () => {
        const { data } = await api.get('/bookings/me');
        setMine(data);
    };

    // Load all bookings (admin)
    const loadAdmin = async () => {
        const { data } = await api.get('/bookings');
        setAdminRows(data);
    };

    // Load available resources
    const loadResources = async () => {
        const { data } = await api.get('/resources?status=ACTIVE');
        setResources(data);

        // Set default resource if none selected
        if (!form.resourceId && data[0]?.id) {
            setForm((f) => ({ ...f, resourceId: String(data[0].id) }));
        }
    };

    // Refresh data (depends on role)
    const refresh = async () => {
        setLoading(true);
        setError('');
        try {
            if (admin) {
                await loadAdmin(); // admin gets all bookings
            } else {
                await Promise.all([loadMine(), loadResources()]); // user gets own bookings + resources
            }
        } catch (e) {
            setError(e.message); // set error if failed
        } finally {
            setLoading(false); // stop loading
        }
    };

    // Run refresh when component mounts or admin changes
    useEffect(() => {
        refresh();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [admin]);

    // Choose which rows to display based on role
    const rows = useMemo(() => (admin ? adminRows : mine), [admin, adminRows, mine]);

    // Submit new booking
    const submitBooking = async (e) => {
        e.preventDefault();
        setError('');

        // Convert local times
        const startAt = toInstant(form.startLocal);
        const endAt = toInstant(form.endLocal);

        // Validate dates
        if (!startAt || !endAt) {
            setError('Please choose valid start and end times.');
            return;
        }
        if (new Date(startAt) >= new Date(endAt)) {
            setError('End time must be after start time.');
            return;
        }

        // Validate purpose
        const purpose = form.purpose.trim();
        if (purpose.length < 5) {
            setError('Purpose must be at least 5 characters.');
            return;
        }

        // Validate attendees
        const attendees = form.expectedAttendees ? Number(form.expectedAttendees) : null;
        if (attendees !== null && (!Number.isInteger(attendees) || attendees < 1)) {
            setError('Expected attendees must be a positive whole number.');
            return;
        }

        try {
            // Send booking request
            await api.post('/bookings', {
                resourceId: Number(form.resourceId),
                startAt,
                endAt,
                purpose,
                expectedAttendees: attendees,
            });

            // Reset some form fields
            setForm((f) => ({ ...f, purpose: '', expectedAttendees: '' }));

            await refresh(); // reload data
        } catch (err) {
            setError(err.message);
        }
    };

    // Approve booking (admin)
    const approve = async (id) => {
        setError('');
        try {
            await api.patch(`/bookings/${id}/approve`);
            await refresh();
        } catch (e) {
            setError(e.message);
        }
    };

    // Confirm reject booking (admin)
    const confirmReject = async () => {
        if (!rejectModal?.id || !rejectModal.reason?.trim()) return;

        // Validate reason
        if (rejectModal.reason.trim().length < 5) {
            setError('Reject reason must be at least 5 characters.');
            return;
        }

        setError('');
        try {
            await api.patch(`/bookings/${rejectModal.id}/reject`, { reason: rejectModal.reason.trim() });
            setRejectModal(null); // close modal
            await refresh();
        } catch (e) {
            setError(e.message);
        }
    };

    // Cancel booking (user)
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
            {/* Header section */}
            <div className="ops-hero">
                <div>
                    <h1 className="h1">Bookings</h1>
                    <p className="muted">Request a booking, track approvals, and avoid conflicts for the same resource.</p>
                </div>
            </div>

            {/* Stats section */}
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

            {/* Booking form (user only) */}
            {!admin ? (
                <div className="panel ops-panel" style={{ marginTop: 14 }}>
                    <div style={{ fontWeight: 700, marginBottom: 10 }}>New booking request</div>
                    <form className="grid form-grid" onSubmit={submitBooking}>

                        {/* Resource dropdown */}
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

                        {/* Start time */}
                        <label className="label">
                            Start (local)
                            <input className="input" type="datetime-local" value={form.startLocal} onChange={(e) => setForm((f) => ({ ...f, startLocal: e.target.value }))} required />
                        </label>

                        {/* End time */}
                        <label className="label">
                            End (local)
                            <input className="input" type="datetime-local" value={form.endLocal} onChange={(e) => setForm((f) => ({ ...f, endLocal: e.target.value }))} required />
                        </label>

                        {/* Purpose */}
                        <label className="label span-2">
                            Purpose
                            <input className="input" value={form.purpose} onChange={(e) => setForm((f) => ({ ...f, purpose: e.target.value }))} minLength={5} maxLength={300} required />
                        </label>

                        {/* Expected attendees */}
                        <label className="label">
                            Expected attendees
                            <input className="input" type="number" min="1" step="1" value={form.expectedAttendees} onChange={(e) => setForm((f) => ({ ...f, expectedAttendees: e.target.value }))} />
                        </label>

                        {/* Submit button */}
                        <div className="span-2" style={{ display: 'flex', alignItems: 'end' }}>
                            <button className="btn primary" type="submit">
                                Submit request
                            </button>
                        </div>
                    </form>
                </div>
            ) : null}

            {/* Error and loading */}
            {error ? <div className="alert error">{error}</div> : null}
            {loading ? <div className="muted">Loading…</div> : null}

            {/* Table */}
            <h2 className="h1" style={{ fontSize: 18, marginTop: 18 }}>
                {admin ? 'Admin queue (all bookings)' : 'My bookings'}
            </h2>

            {/* Bookings table */}
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
                                    {/* Start and end time */}
                                    <div>{new Date(b.startAt).toLocaleString()}</div>
                                    <div className="muted">→ {new Date(b.endAt).toLocaleString()}</div>
                                </td>

                                <td>{b.resource?.name}</td>
                                <td>{b.purpose}</td>

                                {/* Status */}
                                <td>
                                    <span className={`status ${statusClass(b.status)}`}>
                                        {getBookingStatusIcon(b.status)} {b.status}
                                    </span>

                                    {/* Admin reason */}
                                    {b.adminReason ? <div className="muted" style={{ marginTop: 6 }}>{b.adminReason}</div> : null}
                                </td>

                                {/* Actions */}
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

            {/* Reject modal */}
            {rejectModal ? (
                <div className="modal-backdrop" role="presentation" onMouseDown={() => setRejectModal(null)}>
                    <div className="modal" role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>

                        {/* Modal header */}
                        <div className="modal-header">
                            <div className="modal-title">Reject booking</div>
                            <button type="button" className="btn ghost" onClick={() => setRejectModal(null)}>
                                Close
                            </button>
                        </div>

                        {/* Modal body */}
                        <div className="modal-body">
                            <label className="label">
                                Reason
                                <textarea className="textarea" minLength={5} maxLength={400} value={rejectModal.reason} onChange={(e) => setRejectModal((r) => ({ ...r, reason: e.target.value }))} />
                            </label>
                        </div>

                        {/* Modal footer */}
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