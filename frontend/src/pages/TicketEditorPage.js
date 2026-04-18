import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

export default function TicketEditorPage() {
  const navigate = useNavigate();
  const [resources, setResources] = useState([]);
  const [form, setForm] = useState({
    resourceId: '',
    locationText: '',
    category: '',
    description: '',
    priority: 'MEDIUM',
    contactEmail: '',
    contactPhone: '',
  });
  const [error, setError] = useState('');
//ignore part
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/resources');
        setResources(data);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const category = form.category.trim();
    const description = form.description.trim();
    const locationText = form.locationText.trim();
    const contactEmail = form.contactEmail.trim().toLowerCase();
    const contactPhone = form.contactPhone.trim();
    if (category.length < 3) {
      setError('Category must be at least 3 characters.');
      return;
    }
    if (description.length < 10) {
      setError('Description must be at least 10 characters.');
      return;
    }
    if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      setError('Contact email format is invalid.');
      return;
    }
    if (contactPhone && !/^[+]?[0-9()\-\s]{7,20}$/.test(contactPhone)) {
      setError('Contact phone format is invalid.');
      return;
    }
    try {
      const payload = {
        category,
        description,
        priority: form.priority,
        locationText: locationText || undefined,
        contactEmail: contactEmail || undefined,
        contactPhone: contactPhone || undefined,
        resourceId: form.resourceId ? Number(form.resourceId) : null,
      };
      const { data } = await api.post('/tickets', payload);
      navigate(`/tickets/${data.id}`);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h1 className="h1">New incident ticket</h1>
      <p className="muted">Link the issue to a resource when possible, and provide preferred contact details.</p>

      {error ? <div className="alert error">{error}</div> : null}

      <form className="panel grid form-grid" onSubmit={onSubmit}>
        <label className="label span-2">
          Category
          <input className="input" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} minLength={3} maxLength={120} required />
        </label>
        <label className="label span-2">
          Description
          <textarea className="textarea" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} minLength={10} maxLength={1500} required />
        </label>
        <label className="label">
          Priority
          <select className="input" value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}>
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>
        </label>
        <label className="label">
          Related resource (optional)
          <select className="input" value={form.resourceId} onChange={(e) => setForm((f) => ({ ...f, resourceId: e.target.value }))}>
            <option value="">None</option>
            {resources.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </label>
        <label className="label span-2">
          Location text (optional)
          <input className="input" value={form.locationText} onChange={(e) => setForm((f) => ({ ...f, locationText: e.target.value }))} maxLength={200} />
        </label>
        <label className="label">
          Contact email (optional)
          <input className="input" type="email" maxLength={120} value={form.contactEmail} onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))} />
        </label>
        <label className="label">
          Contact phone (optional)
          <input className="input" pattern="^[+]?[0-9()\-\s]{7,20}$" maxLength={20} value={form.contactPhone} onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))} />
        </label>
        <div className="span-2 row gap">
          <button className="btn primary" type="submit">
            Create ticket
          </button>
          <button className="btn ghost" type="button" onClick={() => navigate('/tickets')}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
