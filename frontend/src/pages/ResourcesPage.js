import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client'; // API client for backend requests
import { useAuth } from '../context/AuthContext'; // Auth context to get logged-in user
import { hasRole } from '../utils/roles'; // Utility to check user roles
import './OperationsPages.css';

// Function to return an emoji icon based on resource type
const getTypeIcon = (type) => {
    const icons = {
        LECTURE_HALL: '🎓',
        LAB: '🔬',
        MEETING_ROOM: '👥',
        EQUIPMENT: '🖥️',
    };
    return icons[type] || '📦'; // Default icon if type not found
};

// Default empty resource object (used when creating new resource)
const emptyResource = {
    name: '',
    type: 'LECTURE_HALL',
    capacity: 0,
    location: '',
    availabilityWindows: '',
    status: 'ACTIVE',
};

export default function ResourcesPage() {
    const { user } = useAuth(); // Get current user
    const admin = hasRole(user, 'ADMIN'); // Check if user is admin

    // State variables
    const [items, setItems] = useState([]); // Resource list
    const [loading, setLoading] = useState(true); // Loading state
    const [error, setError] = useState(''); // Error message
    const [filters, setFilters] = useState({ q: '', type: '', minCapacity: '', location: '', status: '' }); // Filters
    const [editor, setEditor] = useState(null); // Modal editor (create/edit)

    // Count active resources
    const activeCount = useMemo(() => items.filter(r => r.status === 'ACTIVE').length, [items]);

    // Count out-of-service resources
    const outOfServiceCount = useMemo(() => items.filter(r => r.status === 'OUT_OF_SERVICE').length, [items]);

    // Build query string based on filters
    const query = useMemo(() => {
        const p = new URLSearchParams();
        if (filters.q) p.set('q', filters.q);
        if (filters.type) p.set('type', filters.type);
        if (filters.minCapacity) p.set('minCapacity', filters.minCapacity);
        if (filters.location) p.set('location', filters.location);
        if (filters.status) p.set('status', filters.status);
        return p.toString();
    }, [filters]);

    // Load resources from backend
    const load = async () => {
        setLoading(true);
        setError('');
        try {
            const { data } = await api.get(`/resources${query ? `?${query}` : ''}`);
            setItems(data); // Save data to state
        } catch (e) {
            setError(e.message); // Show error if request fails
        } finally {
            setLoading(false);
        }
    };

    // Reload data whenever query changes
    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query]);

    // Open create modal
    const openCreate = () => setEditor({ mode: 'create', payload: { ...emptyResource } });

    // Open edit modal with selected resource
    const openEdit = (r) => setEditor({ mode: 'edit', id: r.id, payload: { ...r } });

    // Save (create or update)
    const save = async () => {
        setError('');

        // Prepare request body
        const body = {
            ...editor.payload,
            name: String(editor.payload.name || '').trim(),
            location: String(editor.payload.location || '').trim(),
            availabilityWindows: String(editor.payload.availabilityWindows || '').trim(),
            capacity: Number(editor.payload.capacity),
        };

        // Validation
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

        // API call (create or update)
        if (editor.mode === 'create') {
            await api.post('/resources', body);
        } else {
            await api.put(`/resources/${editor.id}`, body);
        }

        setEditor(null); // Close modal
        await load(); // Reload data
    };

    // Delete resource

    return (
        <div className="ops-page resources-page">
            {/* Header section */}
            <div className="ops-hero">
                <div>
                    <h1 className="h1">Facilities and assets</h1>
                    <p className="muted">
                        Search and filter the bookable catalogue. Manage resource availability and capacity.
                    </p>
                </div>

                {/* Show create button only for admin */}
                {admin ? (
                    <button type="button" className="btn primary" onClick={openCreate}>
                        ➕ New resource
                    </button>
                ) : null}
            </div>

            {/* Summary chips */}
            <div className="ops-chip-row">
                <span className="ops-chip">📊 Total: {items.length}</span>
                <span className="ops-chip">✅ Active: {activeCount}</span>
                <span className="ops-chip">⛔ Out of service: {outOfServiceCount}</span>
            </div>

            {/* Filter panel */}
            <div className="panel ops-panel">
                <div className="grid form-grid">

                    {/* Search filter */}
                    <label className="label">
                        Search
                        <input
                            className="input"
                            value={filters.q}
                            onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
                            placeholder="Name contains…"
                        />
                    </label>

                    {/* Type filter */}
                    <label className="label">
                        Type
                        <select
                            className="input"
                            value={filters.type}
                            onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}
                        >
                            <option value="">Any</option>
                            <option value="LECTURE_HALL">Lecture hall</option>
                            <option value="LAB">Lab</option>
                            <option value="MEETING_ROOM">Meeting room</option>
                            <option value="EQUIPMENT">Equipment</option>
                        </select>
                    </label>

                    {/* Capacity filter */}
                    <label className="label">
                        Min capacity
                        <input
                            className="input"
                            value={filters.minCapacity}
                            onChange={(e) => setFilters((f) => ({ ...f, minCapacity: e.target.value }))}
                        />
                    </label>

                    {/* Location filter */}
                    <label className="label">
                        Location contains
                        <input
                            className="input"
                            value={filters.location}
                            onChange={(e) => setFilters((f) => ({ ...f, location: e.target.value }))}
                        />
                    </label>

                    {/* Status filter */}
                    <label className="label">
                        Status
                        <select
                            className="input"
                            value={filters.status}
                            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
                        >
                            <option value="">Any</option>
                            <option value="ACTIVE">ACTIVE</option>
                            <option value="OUT_OF_SERVICE">OUT_OF_SERVICE</option>
                        </select>
                    </label>
                </div>
            </div>

            {/* Error message */}
            {error ? <div className="alert error">{error}</div> : null}

            {/* Loading message */}
            {loading ? <div className="muted">Loading…</div> : null}

            {/* Resource table */}
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

                                {/* Type with icon */}
                                <td>
                                    <span className="tag" style={{ fontSize: '16px' }}>
                                        {getTypeIcon(r.type)} {r.type}
                                    </span>
                                </td>

                                <td>{r.capacity}</td>
                                <td>{r.location}</td>
                                <td>{r.availabilityWindows}</td>

                                {/* Status display */}
                                <td>
                                    <span className={`status ${r.status === 'ACTIVE' ? 'ok' : 'bad'}`}>
                                        {r.status === 'ACTIVE' ? '✅' : '⛔'} {r.status}
                                    </span>
                                </td>

                                {/* Admin actions */}
                                {admin ? (
                                    <td className="right">
                                        <button
                                            type="button"
                                            className="btn small ghost"
                                            onClick={() => openEdit(r)}
                                        >
                                            Edit
                                        </button>{' '}

                                    </td>
                                ) : null}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal (Create/Edit) */}
            {editor ? (
                <div className="modal-backdrop" role="presentation" onMouseDown={() => setEditor(null)}>
                    <div
                        className="modal"
                        role="dialog"
                        aria-modal="true"
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        {/* Modal header */}
                        <div className="modal-header">
                            <div className="modal-title">
                                {editor.mode === 'create' ? 'Create resource' : 'Edit resource'}
                            </div>
                            <button type="button" className="btn ghost" onClick={() => setEditor(null)}>
                                Close
                            </button>
                        </div>

                        {/* Modal form */}
                        <div className="modal-body grid form-grid">
                            {/* Name */}
                            <label className="label">
                                Name
                                <input
                                    className="input"
                                    minLength={3}
                                    maxLength={150}
                                    value={editor.payload.name}
                                    onChange={(e) =>
                                        setEditor((ed) => ({
                                            ...ed,
                                            payload: { ...ed.payload, name: e.target.value },
                                        }))
                                    }
                                />
                            </label>

                            {/* Type */}
                            <label className="label">
                                Type
                                <select
                                    className="input"
                                    value={editor.payload.type}
                                    onChange={(e) =>
                                        setEditor((ed) => ({
                                            ...ed,
                                            payload: { ...ed.payload, type: e.target.value },
                                        }))
                                    }
                                >
                                    <option value="LECTURE_HALL">LECTURE_HALL</option>
                                    <option value="LAB">LAB</option>
                                    <option value="MEETING_ROOM">MEETING_ROOM</option>
                                    <option value="EQUIPMENT">EQUIPMENT</option>
                                </select>
                            </label>

                            {/* Capacity */}
                            <label className="label">
                                Capacity
                                <input
                                    className="input"
                                    type="number"
                                    min="1"
                                    step="1"
                                    value={editor.payload.capacity}
                                    onChange={(e) =>
                                        setEditor((ed) => ({
                                            ...ed,
                                            payload: {
                                                ...ed.payload,
                                                capacity: Number(e.target.value),
                                            },
                                        }))
                                    }
                                />
                            </label>

                            {/* Location */}
                            <label className="label">
                                Location
                                <input
                                    className="input"
                                    minLength={2}
                                    maxLength={150}
                                    value={editor.payload.location}
                                    onChange={(e) =>
                                        setEditor((ed) => ({
                                            ...ed,
                                            payload: { ...ed.payload, location: e.target.value },
                                        }))
                                    }
                                />
                            </label>

                            {/* Availability */}
                            <label className="label span-2">
                                Availability windows
                                <input
                                    className="input"
                                    value={editor.payload.availabilityWindows || ''}
                                    onChange={(e) =>
                                        setEditor((ed) => ({
                                            ...ed,
                                            payload: {
                                                ...ed.payload,
                                                availabilityWindows: e.target.value,
                                            },
                                        }))
                                    }
                                />
                            </label>

                            {/* Status */}
                            <label className="label">
                                Status
                                <select
                                    className="input"
                                    value={editor.payload.status}
                                    onChange={(e) =>
                                        setEditor((ed) => ({
                                            ...ed,
                                            payload: { ...ed.payload, status: e.target.value },
                                        }))
                                    }
                                >
                                    <option value="ACTIVE">ACTIVE</option>
                                    <option value="OUT_OF_SERVICE">OUT_OF_SERVICE</option>
                                </select>
                            </label>
                        </div>

                        {/* Modal footer */}
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