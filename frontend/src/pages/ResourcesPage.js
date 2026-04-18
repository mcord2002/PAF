
import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { hasRole } from '../utils/roles';
import './OperationsPages.css';

const emptyResource = {
    name: '',
    type: 'LECTURE_HALL',
    capacity: 0,
    location: '',
    availabilityWindows: '',
    status: 'ACTIVE',
};

export default function ResourcesPage() {
    const { user } = useAuth();
    const admin = hasRole(user, 'ADMIN');
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState({ q: '', type: '', minCapacity: '', location: '', status: '' });
    const [editor, setEditor] = useState(null); // null | { mode:'create'|'edit', payload }

    const query = useMemo(() => {
        const p = new URLSearchParams();
        if (filters.q) p.set('q', filters.q);
        if (filters.type) p.set('type', filters.type);
        if (filters.minCapacity) p.set('minCapacity', filters.minCapacity);
        if (filters.location) p.set('location', filters.location);
        if (filters.status) p.set('status', filters.status);
        return p.toString();
    }, [filters]);

    const load = async () => {
        setLoading(true);
        setError('');
        try {
            const { data } = await api.get(`/resources${query ? `?${query}` : ''}`);
            setItems(data);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query]);

    const openCreate = () => setEditor({ mode: 'create', payload: { ...emptyResource } });
    const openEdit = (r) => setEditor({ mode: 'edit', id: r.id, payload: { ...r } });

    const save = async () => {
        setError('');
        const body = {
            ...editor.payload,
            name: String(editor.payload.name || '').trim(),
            location: String(editor.payload.location || '').trim(),
            availabilityWindows: String(editor.payload.availabilityWindows || '').trim(),
            capacity: Number(editor.payload.capacity),
        };
        if (body.name.length < 3) {
            setError('Resource name must be at least 3 characters.');
            return;
        }
        if (!Number.isInteger(body.capacity) || body.capacity < 1) {
            setError('Capacity must be a positive whole number.');
            return;
        }
        if (body.location.length < 2) {
            setError('Location must be at least 2 characters.');
            return;
        }
        if (editor.mode === 'create') {
            await api.post('/resources', body);
        } else {
            await api.put(`/resources/${editor.id}`, body);
        }
        setEditor(null);
        await load();
    };

    const remove = async (id) => {
        if (!window.confirm('Delete this resource?')) return;
        await api.delete(`/resources/${id}`);
        await load();
    };

    return (
        <div className="ops-page resources-page">
            <div className="ops-hero row space-between align-start wrap gap">
                <div>
                    <h1 className="h1">Facilities and assets</h1>
                    <p className="muted">Search and filter the bookable catalogue.</p>
                </div>
                {admin ? (
                    <button type="button" className="btn primary" onClick={openCreate}>
                        New resource
                    </button>
                ) : null}
            </div>

            <div className="panel ops-panel">
                <div className="grid form-grid">
                    <label className="label">
                        Search
                        <input className="input" value={filters.q} onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))} placeholder="Name contains…" />
                    </label>
                    <label className="label">
                        Type
                        <select className="input" value={filters.type} onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}>
                            <option value="">Any</option>
                            <option value="LECTURE_HALL">Lecture hall</option>
                            <option value="LAB">Lab</option>
                            <option value="MEETING_ROOM">Meeting room</option>
                            <option value="EQUIPMENT">Equipment</option>
                        </select>
                    </label>
                    <label className="label">
                        Min capacity
                        <input className="input" value={filters.minCapacity} onChange={(e) => setFilters((f) => ({ ...f, minCapacity: e.target.value }))} />
                    </label>
                    <label className="label">
                        Location contains
                        <input className="input" value={filters.location} onChange={(e) => setFilters((f) => ({ ...f, location: e.target.value }))} />
                    </label>
                    <label className="label">
                        Status
                        <select className="input" value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
                            <option value="">Any</option>
                            <option value="ACTIVE">ACTIVE</option>
                            <option value="OUT_OF_SERVICE">OUT_OF_SERVICE</option>
                        </select>
                    </label>
                </div>
            </div>

            {error ? <div className="alert error">{error}</div> : null}
            {loading ? <div className="muted">Loading…</div> : null}

            <div className="table-wrap ops-table-wrap">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Type</th>
                            <th>Capacity</th>
                            <th>Location</th>
                            <th>Availability</th>
                            <th>Status</th>
                            {admin ? <th /> : null}
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((r) => (
                            <tr key={r.id}>
                                <td>{r.name}</td>
                                <td>
                                    <span className="tag">{r.type}</span>
                                </td>
                                <td>{r.capacity}</td>
                                <td>{r.location}</td>
                                <td>
                                    {r.availabilityWindows ? r.availabilityWindows : '-'}
                                </td>
                                <td>
                                    <span className={`status ${r.status === 'ACTIVE' ? 'ok' : 'bad'}`}>{r.status}</span>
                                </td>
                                {admin ? (
                                    <td className="right">
                                        <button type="button" className="btn small ghost" onClick={() => openEdit(r)}>
                                            Edit
                                        </button>{' '}
                                        <button type="button" className="btn small danger" onClick={() => remove(r.id)}>
                                            Delete
                                        </button>
                                    </td>
                                ) : null}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {editor ? (
                <div className="modal-backdrop" role="presentation" onMouseDown={() => setEditor(null)}>
                    <div className="modal" role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="modal-title">{editor.mode === 'create' ? 'Create resource' : 'Edit resource'}</div>
                            <button type="button" className="btn ghost" onClick={() => setEditor(null)}>
                                Close
                            </button>
                        </div>
                        <div className="modal-body grid form-grid">
                            <label className="label">
                                Name
                                <input className="input" minLength={3} maxLength={150} value={editor.payload.name} onChange={(e) => setEditor((ed) => ({ ...ed, payload: { ...ed.payload, name: e.target.value } }))} />
                            </label>
                            <label className="label">
                                Type
                                <select
                                    className="input"
                                    value={editor.payload.type}
                                    onChange={(e) => setEditor((ed) => ({ ...ed, payload: { ...ed.payload, type: e.target.value } }))}
                                >
                                    <option value="LECTURE_HALL">LECTURE_HALL</option>
                                    <option value="LAB">LAB</option>
                                    <option value="MEETING_ROOM">MEETING_ROOM</option>
                                    <option value="EQUIPMENT">EQUIPMENT</option>
                                </select>
                            </label>
                            <label className="label">
                                Capacity
                                <input
                                    className="input"
                                    type="number"
                                    min="1"
                                    step="1"
                                    value={editor.payload.capacity}
                                    onChange={(e) => setEditor((ed) => ({ ...ed, payload: { ...ed.payload, capacity: Number(e.target.value) } }))}
                                />
                            </label>
                            <label className="label">
                                Location
                                <input className="input" minLength={2} maxLength={150} value={editor.payload.location} onChange={(e) => setEditor((ed) => ({ ...ed, payload: { ...ed.payload, location: e.target.value } }))} />
                            </label>
                            <label className="label span-2">
                                Availability windows
                                <input
                                    className="input"
                                    value={editor.payload.availabilityWindows || ''}
                                    onChange={(e) => setEditor((ed) => ({ ...ed, payload: { ...ed.payload, availabilityWindows: e.target.value } }))}
                                />
                            </label>
                            <label className="label">
                                Status
                                <select
                                    className="input"
                                    value={editor.payload.status}
                                    onChange={(e) => setEditor((ed) => ({ ...ed, payload: { ...ed.payload, status: e.target.value } }))}
                                >
                                    <option value="ACTIVE">ACTIVE</option>
                                    <option value="OUT_OF_SERVICE">OUT_OF_SERVICE</option>
                                </select>
                            </label>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn primary" onClick={save}>
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
