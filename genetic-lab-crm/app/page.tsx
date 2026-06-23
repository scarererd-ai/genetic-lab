'use client';

import { useEffect, useMemo, useState } from 'react';

type Representative = { id: string; name: string; email?: string | null; region?: string | null };
type Laboratory = {
  id: string; companyName: string; contactName?: string | null; email?: string | null; telephone?: string | null;
  region?: string | null; status: 'IN_COMMUNICATION' | 'NDA_SIGNED' | 'CONTRACT_SIGNED'; opportunityStage?: string | null; state: 'ACTIVE' | 'ARCHIVED';
  notes?: string | null; representativeId?: string | null; representative?: Representative | null;
};
type Dashboard = { total: number; active: number; archived: number; byStatus: any[]; byRegion: any[]; byRepresentative: any[] };

const emptyLab = { companyName: '', contactName: '', email: '', telephone: '', region: '', status: 'IN_COMMUNICATION', state: 'ACTIVE', notes: '', representativeId: '', opportunityStage: 'LEAD'} as any;
const emptyRep = { name: '', email: '', region: '' } as any;
const statusOptions = [
  ['IN_COMMUNICATION', 'In Communication'], ['NDA_SIGNED', 'NDA Signed'], ['CONTRACT_SIGNED', 'Contract Signed']
];
const opportunityStageOptions = [
  ['LEAD', 'Lead'],
  ['QUALIFIED', 'Qualified'],
  ['NDA_SENT', 'NDA Sent'],
  ['NDA_SIGNED', 'NDA Signed'],
  ['PROPOSAL_SENT', 'Proposal Sent'],
  ['CONTRACT_SENT', 'Contract Sent'],
  ['CONTRACT_SIGNED', 'Contract Signed'],
  ['ACTIVE_CUSTOMER', 'Active Customer'],
  ['INACTIVE_CUSTOMER', 'Inactive Customer']
];

function displayStatus(status: string) { return status.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase()); }

export default function Home() {
  const [labs, setLabs] = useState<Laboratory[]>([]);
  const [reps, setReps] = useState<Representative[]>([]);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [filters, setFilters] = useState({ q: '', status: '', state: 'ACTIVE', representativeId: '', region: '' });
  const [editing, setEditing] = useState<any | null>(null);
  const [repEditing, setRepEditing] = useState<any | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const params = useMemo(() => {
    const p = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) p.set(k, v); });
    return p;
  }, [filters]);

  async function refresh() {
    const [labRes, repRes, dashRes] = await Promise.all([
      fetch(`/api/laboratories?${params.toString()}`), fetch('/api/representatives'), fetch('/api/dashboard')
    ]);
    setLabs(await labRes.json());
    setReps(await repRes.json());
    setDashboard(await dashRes.json());
  }
  useEffect(() => { refresh(); }, [params.toString()]);

  async function saveLab(data: any) {
    setBusy(true); setMessage('');
    const payload = { ...data, representativeId: data.representativeId || null };
    const res = await fetch(data.id ? `/api/laboratories/${data.id}` : '/api/laboratories', {
      method: data.id ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    });
    setBusy(false);
    if (!res.ok) { setMessage('Please check required fields and email format.'); return; }
    setEditing(null); await refresh();
  }

  async function saveRep(data: any) {
    setBusy(true); setMessage('');
    const res = await fetch(data.id ? `/api/representatives/${data.id}` : '/api/representatives', {
      method: data.id ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    setBusy(false);
    if (!res.ok) { setMessage('Please enter a representative name and a valid email address.'); return; }
    setRepEditing(null); await refresh();
  }

  async function archiveToggle(lab: Laboratory) {
    await fetch(`/api/laboratories/${lab.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ state: lab.state === 'ACTIVE' ? 'ARCHIVED' : 'ACTIVE' }) });
    await refresh();
  }

  async function remove(lab: Laboratory) {
    if (!confirm(`Delete ${lab.companyName}? This cannot be undone.`)) return;
    await fetch(`/api/laboratories/${lab.id}`, { method: 'DELETE' });
    await refresh();
  }

  async function importExcel(file?: File) {
    if (!file) return;
    setBusy(true); setMessage('Importing Excel file...');
    const form = new FormData(); form.append('file', file);
    const res = await fetch('/api/laboratories/import', { method: 'POST', body: form });
    const json = await res.json();
    setBusy(false);
    setMessage(res.ok ? `Imported ${json.importedLaboratories} laboratories and ${json.importedRepresentatives} representatives.` : json.error || 'Import failed.');
    await refresh();
  }

  function exportUrl() { return `/api/laboratories/export?${params.toString()}`; }

  return <main className="shell">
    <section className="hero">
      <div><div className="eyebrow">Genetic Laboratory CRM v2</div><h1>Laboratory Customer Database</h1><p>Track laboratory contacts, assigned representatives, region coverage, NDA/contract status, and archive inactive records.</p></div>
      <div className="import-card card">
        <label className="btn secondary">Import Excel<input type="file" accept=".xlsx,.xls" hidden onChange={e => importExcel(e.target.files?.[0])} /></label>
        <a className="btn" href={exportUrl()}>Export Current Search</a>
      </div>
    </section>

    <section className="grid">
      <div className="metric"><strong>{dashboard?.total ?? '—'}</strong><span>Total laboratories</span></div>
      <div className="metric"><strong>{dashboard?.active ?? '—'}</strong><span>Active laboratories</span></div>
      <div className="metric"><strong>{dashboard?.archived ?? '—'}</strong><span>Archived laboratories</span></div>
    </section>

    <section className="card" style={{ marginTop: 16 }}>
      <div className="toolbar">
        <div className="field"><label>Search any field</label><input placeholder="Name, company, phone, email, representative, region..." value={filters.q} onChange={e => setFilters({ ...filters, q: e.target.value })} /></div>
        <div className="field"><label>Active/Archived</label><select value={filters.state} onChange={e => setFilters({ ...filters, state: e.target.value })}><option value="ACTIVE">Active</option><option value="ARCHIVED">Archived</option><option value="">All</option></select></div>
        <div className="field"><label>Representative</label><select value={filters.representativeId} onChange={e => setFilters({ ...filters, representativeId: e.target.value })}><option value="">All</option>{reps.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select></div>
        <button className="btn secondary" onClick={() => setFilters({ q: '', status: '', state: 'ACTIVE', representativeId: '', region: '' })}>Clear</button>
        <button className="btn secondary" onClick={() => setRepEditing(emptyRep)}>Add Representative</button>
        <button className="btn" onClick={() => setEditing(emptyLab)}>Add Customer</button>
      </div>
      {message && <p className="hint">{message}</p>}
      <div className="table-wrap">
        <table>
          <thead><tr><th>Laboratory</th><th>Contact</th><th>Email / Phone</th><th>Region</th><th>Representative</th><th>Opportunity Stage</th><th>State</th><th>Notes</th><th>Actions</th></tr></thead>
          <tbody>{labs.map(lab => <tr key={lab.id}>
            <td><strong>{lab.companyName}</strong></td>
            <td>{lab.contactName || '—'}</td>
            <td>{lab.email || '—'}<br />{lab.telephone || ''}</td>
            <td>{lab.region || '—'}</td>
            <td>{lab.representative?.name || 'Unassigned'}<br /><span className="hint">{lab.representative?.email || ''}</span></td>
            <td><span className="pill">{displayStatus(lab.opportunityStage || 'LEAD')}</span></td>
            <td><span className={`pill state-${lab.state}`}>{lab.state}</span></td>
            <td>{lab.notes || '—'}</td>
            <td><div className="actions"><button className="btn secondary" onClick={() => setEditing(lab)}>Edit</button><button className="btn secondary" onClick={() => archiveToggle(lab)}>{lab.state === 'ACTIVE' ? 'Archive' : 'Activate'}</button><button className="btn danger" onClick={() => remove(lab)}>Delete</button></div></td>
          </tr>)}</tbody>
        </table>
      </div>
    </section>

    <section className="card" style={{ marginTop: 16 }}>
      <div className="toolbar">
        <h2 style={{ margin: 0 }}>Representatives</h2>
        <button className="btn secondary" onClick={() => setRepEditing(emptyRep)}>Add Representative</button>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Region / World Area</th><th>Actions</th></tr></thead>
          <tbody>{reps.map(rep => <tr key={rep.id}>
            <td><strong>{rep.name}</strong></td>
            <td>{rep.email || '—'}</td>
            <td>{rep.region || '—'}</td>
            <td><button className="btn secondary" onClick={() => setRepEditing(rep)}>Edit</button></td>
          </tr>)}</tbody>
        </table>
      </div>
    </section>

    {editing && <LabModal lab={editing} reps={reps} busy={busy} onClose={() => setEditing(null)} onSave={saveLab} />}
    {repEditing && <RepModal rep={repEditing} busy={busy} onClose={() => setRepEditing(null)} onSave={saveRep} />}
  </main>;
}

function LabModal({ lab, reps, busy, onClose, onSave }: { lab: any; reps: Representative[]; busy: boolean; onClose: () => void; onSave: (data: any) => void }) {
  const [form, setForm] = useState({ ...emptyLab, ...lab, representativeId: lab.representativeId || '' });
  const update = (k: string, v: string) => setForm((f: any) => ({ ...f, [k]: v }));
  return <div className="modal-backdrop"><div className="modal">
    <h2>{form.id ? 'Edit Laboratory' : 'Add Laboratory Customer'}</h2>
    <div className="form-grid">
      <div className="field"><label>Laboratory / Company *</label><input value={form.companyName} onChange={e => update('companyName', e.target.value)} /></div>
      <div className="field"><label>Contact Name</label><input value={form.contactName || ''} onChange={e => update('contactName', e.target.value)} /></div>
      <div className="field"><label>Email</label><input value={form.email || ''} onChange={e => update('email', e.target.value)} /></div>
      <div className="field"><label>Telephone</label><input value={form.telephone || ''} onChange={e => update('telephone', e.target.value)} /></div>
      <div className="field"><label>Region / World Area</label><input value={form.region || ''} onChange={e => update('region', e.target.value)} /></div>
      <div className="field"><label>Assigned Representative</label><select value={form.representativeId || ''} onChange={e => update('representativeId', e.target.value)}><option value="">Unassigned</option>{reps.map(r => <option key={r.id} value={r.id}>{r.name} {r.region ? `— ${r.region}` : ''}</option>)}</select></div>
      <div className="field"><label>Opportunity Stage</label><select value={form.opportunityStage || 'LEAD'} onChange={e => update('opportunityStage', e.target.value)}>{opportunityStageOptions.map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></div>
      <div className="field"><label>State</label><select value={form.state} onChange={e => update('state', e.target.value)}><option value="ACTIVE">Active</option><option value="ARCHIVED">Archived</option></select></div>
      <div className="field full"><label>Details / Notes</label><textarea value={form.notes || ''} onChange={e => update('notes', e.target.value)} /></div>
    </div>
    <div className="actions" style={{ marginTop: 16, justifyContent: 'flex-end' }}><button className="btn secondary" onClick={onClose}>Cancel</button><button className="btn" disabled={busy} onClick={() => onSave(form)}>{busy ? 'Saving...' : 'Save'}</button></div>
  </div></div>;
}


function RepModal({ rep, busy, onClose, onSave }: { rep: any; busy: boolean; onClose: () => void; onSave: (data: any) => void }) {
  const [form, setForm] = useState({ ...emptyRep, ...rep });
  const update = (k: string, v: string) => setForm((f: any) => ({ ...f, [k]: v }));
  return <div className="modal-backdrop"><div className="modal">
    <h2>{form.id ? 'Edit Representative' : 'Add Representative'}</h2>
    <div className="form-grid">
      <div className="field"><label>Representative Name *</label><input value={form.name || ''} onChange={e => update('name', e.target.value)} /></div>
      <div className="field"><label>Email</label><input value={form.email || ''} onChange={e => update('email', e.target.value)} /></div>
      <div className="field full"><label>Region / World Area</label><input value={form.region || ''} onChange={e => update('region', e.target.value)} /></div>
    </div>
    <div className="actions" style={{ marginTop: 16, justifyContent: 'flex-end' }}><button className="btn secondary" onClick={onClose}>Cancel</button><button className="btn" disabled={busy} onClick={() => onSave(form)}>{busy ? 'Saving...' : 'Save Representative'}</button></div>
  </div></div>;
}

