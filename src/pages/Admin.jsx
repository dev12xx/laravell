import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';
const STAGES_AR = [
  'تم إرسال الإبلاغ',
  'قيد المعالجة',
  'مرفوض',
  'مقبول',
  'لقد تم دراسة الملف',
  'لقد تم إرسال الرد في إيميلك',
]

const ADMIN_USER = 'admin';
const ADMIN_PASS = 'admin';

function readReports() {
  try {
    const raw = localStorage.getItem('reports') || '{}';
    const obj = JSON.parse(raw);
    return Object.values(obj).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch {
    return [];
  }
}

const Admin = () => {
  const navigate = useNavigate();
  const [auth, setAuth] = useState(() => sessionStorage.getItem('isAdmin') === 'true');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [reports, setReports] = useState(() => readReports());
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState(null);
  const [lastKnownIds, setLastKnownIds] = useState(() => new Set(readReports().map(r => r.id)));
  const [delId, setDelId] = useState('');
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [selectedStage, setSelectedStage] = useState(0);
  const [tab, setTab] = useState('rejected');
  const [isMobile, setIsMobile] = useState(() => window.matchMedia && window.matchMedia('(max-width: 768px)').matches);
  const gridCols = isMobile ? '1fr' : '180px 1fr';
  const [editingId, setEditingId] = useState(null);
  const [stageEdits, setStageEdits] = useState({});
  const [backendItems, setBackendItems] = useState([]);
  const [backendLoading, setBackendLoading] = useState(false);
  const [backendError, setBackendError] = useState('');
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState('');

  const pretty = (k) => (k || '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase());

  const formatVal = (k, v) => {
    if (v == null || v === '') return '';
    if (k.toLowerCase().includes('date')) {
      try { return new Date(v).toLocaleString('fr-DZ'); } catch { return String(v); }
    }
    if (typeof v === 'boolean') return v ? 'Oui' : 'Non';
    if (typeof v === 'object') return JSON.stringify(v);
    return String(v);
  };

  async function syncReportToBackend(trackingId, record) {
    try {
      await fetch(`${API_BASE}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tracking_id: trackingId,
          payload: record,
        }),
      });
    } catch (e) {
      console.error('Failed to sync report to backend', e);
    }
  }

  async function deleteReportFromBackend(trackingId) {
    try {
      await fetch(`${API_BASE}/reports/${encodeURIComponent(trackingId)}`, {
        method: 'DELETE',
      });
    } catch (e) {
      console.error('Failed to delete report from backend', e);
    }
  }

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const allVisibleIds = () => filtered.map(r => r.id);
  const toggleSelectAll = () => {
    const ids = allVisibleIds();
    const allSelected = ids.every(id => selectedIds.has(id));
    setSelectedIds(allSelected ? new Set() : new Set(ids));
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    const idsArr = Array.from(selectedIds);
    const ok = confirm(`Supprimer ${idsArr.length} élément(s) ?`);
    if (!ok) return;
    try {
      const map = JSON.parse(localStorage.getItem('reports') || '{}');
      idsArr.forEach(id => { delete map[id]; });
      localStorage.setItem('reports', JSON.stringify(map));
      idsArr.forEach(id => { deleteReportFromBackend(id); });
      const next = readReports();
      setReports(next);
      setLastKnownIds(new Set(next.map(r => r.id)));
      if (selected && selectedIds.has(selected.id)) setSelected(null);
      setSelectedIds(new Set());
    } catch (e) {
      console.error(e);
      alert('Erreur lors de la suppression multiple');
    }
  };

  const loadBackendReports = async () => {
    try {
      setReportsLoading(true);
      setReportsError('');
      const res = await fetch(`${API_BASE}/reports`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const normalized = (Array.isArray(data) ? data : []).map((row) => {
        const payload = row && row.payload ? row.payload : {};
        const id = payload.id || row.tracking_id;
        return { ...payload, id };
      }).sort((a, b) => {
        const da = new Date(a.createdAt || a.updatedAt || 0);
        const db = new Date(b.createdAt || b.updatedAt || 0);
        return db - da;
      });

      setReports(normalized);
      const map = {};
      for (const r of normalized) {
        if (r && r.id) {
          map[r.id] = r;
        }
      }
      localStorage.setItem('reports', JSON.stringify(map));
      setLastKnownIds(new Set(normalized.map(r => r.id)));
    } catch (e) {
      console.error(e);
      setReportsError('Erreur de chargement des dossiers depuis le backend, affichage du cache local.');
      const local = readReports();
      setReports(local);
      setLastKnownIds(new Set(local.map(r => r.id)));
    } finally {
      setReportsLoading(false);
    }
  };

  const loadBackendItems = async () => {
    try {
      setBackendLoading(true);
      setBackendError('');
      const res = await fetch(`${API_BASE}/items`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setBackendItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setBackendError('Erreur de chargement depuis le backend');
    } finally {
      setBackendLoading(false);
    }
  };

  const createBackendTestItem = async () => {
    try {
      setBackendLoading(true);
      setBackendError('');
      const res = await fetch(`${API_BASE}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test depuis Admin',
          description: 'Élément de test créé depuis le panneau Admin.jsx',
          price: 0,
          quantity: 0,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await loadBackendItems();
    } catch (e) {
      console.error(e);
      setBackendError("Erreur lors de la création d'un élément de test");
    } finally {
      setBackendLoading(false);
    }
  };

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'reports') {
        const next = readReports();
        setReports(next);
        const ids = new Set(next.map(r => r.id));
        for (const r of next) {
          if (!lastKnownIds.has(r.id)) {
            setSelected(r);
            break;
          }
        }
        setLastKnownIds(ids);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [lastKnownIds]);

  useEffect(() => {
    loadBackendItems();
    loadBackendReports();
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const onChange = (e) => setIsMobile(e.matches);
    if (mq.addEventListener) mq.addEventListener('change', onChange); else mq.addListener(onChange);
    setIsMobile(mq.matches);
    return () => { if (mq.removeEventListener) mq.removeEventListener('change', onChange); else mq.removeListener(onChange); };
  }, []);

  useEffect(() => {
    let prevKey = localStorage.getItem('reports');
    const iv = setInterval(() => {
      const cur = localStorage.getItem('reports');
      if (cur !== prevKey) {
        prevKey = cur;
        const next = readReports();
        const ids = new Set(next.map(r => r.id));
        for (const r of next) {
          if (!lastKnownIds.has(r.id)) {
            setSelected(r);
            break;
          }
        }
        setLastKnownIds(ids);
        setReports(next);
      }
    }, 1500);
    return () => clearInterval(iv);
  }, [lastKnownIds]);

  useEffect(() => {
    if (selected) {
      const st = Number(selected.stage || 0);
      setSelectedStage(Number.isFinite(st) ? st : 0);
    }
  }, [selected]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return reports;
    return reports.filter((r) => {
      return (
        r.id.toLowerCase().includes(term) ||
        (r.type || '').toLowerCase().includes(term) ||
        (r.status || '').toLowerCase().includes(term) ||
        (r.createdAtDZ || '').toLowerCase().includes(term) ||
        JSON.stringify(r.data || {}).toLowerCase().includes(term)
      );
    });
  }, [q, reports]);

  const groups = useMemo(() => {
    const g = { not_started: [], studied: [], appeal_wait: [], rejected: [], in_progress: [] };
    for (const r of filtered) {
      const stg = Number(r.stage || 0);
      const hasAppeal = !!r.appeal;
      const decided = !!r.appealDecision;
      if (stg === 0 && r.status !== 'accepted' && r.status !== 'rejected') g.not_started.push(r);
      else if (stg >= 4 || r.status === 'accepted') g.studied.push(r);
      else if (r.status === 'rejected' && hasAppeal && !decided) g.appeal_wait.push(r);
      else if (r.status === 'rejected') g.rejected.push(r);
      else g.in_progress.push(r);
    }
    return g;
  }, [filtered]);

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    if (username === ADMIN_USER && password === ADMIN_PASS) {
      sessionStorage.setItem('isAdmin', 'true');
      setAuth(true);
      setUsername('');
      setPassword('');
    } else {
      setError('Identifiants invalides');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('isAdmin');
    setAuth(false);
  };

  const handleDeleteById = () => {
    const raw = (delId || '').trim();
    if (!raw) return;
    const id = raw.toUpperCase();
    try {
      const map = JSON.parse(localStorage.getItem('reports') || '{}');
      if (!map[id]) {
        alert('ID introuvable');
        return;
      }
      const ok = confirm(`Supprimer le dossier ${id} ?`);
      if (!ok) return;
      delete map[id];
      localStorage.setItem('reports', JSON.stringify(map));
      deleteReportFromBackend(id);
      const next = readReports();
      setReports(next);
      setLastKnownIds(new Set(next.map(r => r.id)));
      if (selected?.id === id) setSelected(null);
      setDelId('');
    } catch (e) {
      console.error(e);
      alert('Erreur lors de la suppression');
    }
  };

  if (!auth) {
    return (
      <div className="container" style={{ maxWidth: 480, margin: '2rem auto' }}>
        <h2 style={{ marginBottom: '1rem' }}>Espace Admin</h2>
        <form onSubmit={handleLogin} style={{ display: 'grid', gap: '0.75rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: 4 }}>Utilisateur</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{ width: '100%', padding: '0.5rem' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 4 }}>Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '0.5rem' }}
            />
          </div>
          {error ? (
            <div style={{ color: '#b91c1c', fontSize: 14 }}>{error}</div>
          ) : null}
          <button type="submit" className="btn btn-primary">Se connecter</button>
        </form>
      </div>
    );
  }

  return (
    <div className="container" style={{ marginTop: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0 }}>Tableau de bord Admin</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="search"
            placeholder="Rechercher..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ padding: '0.5rem', minWidth: 220 }}
          />
          <button className="btn btn-secondary" onClick={loadBackendReports} disabled={reportsLoading}>Rafraîchir</button>
          <button className="btn btn-primary" onClick={handleLogout}>Se déconnecter</button>
        </div>
      </div>
      <div style={{ marginTop: 4, fontSize: 12, color: '#64748b' }}>
        {reportsLoading
          ? 'Chargement des dossiers depuis le backend...'
          : reportsError
            ? reportsError
            : `Dossiers: ${reports.length}`}
      </div>
      <div style={{ marginTop: '0.5rem', fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span><strong>Backend Laravel/MySQL :</strong></span>
        <span>
          {backendLoading
            ? 'Chargement...'
            : backendError
              ? backendError
              : `Items: ${backendItems.length}`}
        </span>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={loadBackendItems}
          style={{ padding: '0.25rem 0.5rem', fontSize: 12 }}
        >
          Rafraîchir backend
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={createBackendTestItem}
          style={{ padding: '0.25rem 0.5rem', fontSize: 12 }}
        >
          Créer un élément de test
        </button>
      </div>

      {(() => {
        const tabs = [
          { key:'not_started', title:'قيد المعالجة', color:'#3b82f6', list: [...groups.not_started, ...groups.in_progress] },
          { key:'rejected', title:'ملفات مرفوضة', color:'#ef4444', list: groups.rejected },
          { key:'appeal_wait', title:'ملفات تنتظر دراسة الطعن', color:'#f59e0b', list: groups.appeal_wait },
          { key:'studied', title:'ملفات مدروسة', color:'#10b981', list: groups.studied },
        ];
        const active = tabs.find(t => t.key === tab) || tabs[0];
        const TabButton = ({t}) => (
          <button onClick={() => setTab(t.key)} style={{
            padding: isMobile ? '4px 8px' : '8px 12px', borderRadius:9999, border: '1px solid #e5e7eb', background: t.key===tab ? '#111827' : '#fff', color: t.key===tab ? '#fff' : '#111827', cursor:'pointer', display:'inline-flex', alignItems:'center', gap: isMobile ? 6 : 8, fontSize: isMobile ? 12 : 14, flex: '0 0 auto'
          }}>
            <span style={{ width:10, height:10, borderRadius:9999, background:t.color }} />
            {t.title} <span style={{ color: t.key===tab ? '#e5e7eb' : '#64748b' }}>({t.list.length})</span>
          </button>
        );
        const list = active.list;
        return (
          <div style={{ marginTop:'1rem' }}>
            <div style={{ display:'flex', gap: isMobile ? 6 : 8, flexWrap: isMobile ? 'nowrap' : 'wrap', overflowX: isMobile ? 'auto' : 'visible', paddingBottom: isMobile ? 4 : 0 }}>
              {tabs.map(t => <TabButton key={t.key} t={t} />)}
            </div>
            <div style={{ marginTop:8, border:'1px solid #e5e7eb', borderRadius:8, overflow:'hidden' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px', background:'#f8fafc', borderBottom:'1px solid #e5e7eb' }}>
                <span style={{ width:10, height:10, borderRadius:9999, background: active.color }} />
                <strong>{active.title}</strong>
                <span style={{ color:'#64748b', fontSize:12 }}>({list.length})</span>
              </div>
              {isMobile ? (
                <div style={{ display:'grid', gap:8, padding:12 }}>
                  {list.length === 0 ? (
                    <div style={{ padding:'12px', color:'#6b7280' }}>Aucun enregistrement</div>
                  ) : (
                    list.map((r) => (
                      <div
                        key={r.id}
                        style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:12, background:'#fff' }}
                        onClick={() => setSelected(r)}
                      >
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                          <div style={{ fontFamily:'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace', fontWeight:700 }}>{r.id}</div>
                          <span style={{ width:10, height:10, borderRadius:9999, background: (r.status === 'rejected' ? (r.appeal && !r.appealDecision ? '#f59e0b' : '#ef4444') : (r.status === 'accepted' || Number(r.stage||0) >= 4 ? '#10b981' : '#9ca3af')) }} />
                        </div>
                        {editingId === r.id && (
                          <div
                            style={{ marginTop:8, display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <select
                              value={stageEdits[r.id] ?? Number(r.stage || 0)}
                              onChange={(e) => setStageEdits(prev => ({ ...prev, [r.id]: Number(e.target.value) }))}
                              style={{ padding:'6px 10px', borderRadius:8, border:'1px solid #cbd5e1', background:'#fff' }}
                            >
                              {STAGES_AR.map((label, idx) => (
                                <option key={idx} value={idx}>{label}</option>
                              ))}
                            </select>
                            <button
                              className="btn btn-secondary"
                              type="button"
                              onClick={() => {
                                try {
                                  const map = JSON.parse(localStorage.getItem('reports') || '{}');
                                  if (!map[r.id]) return;
                                  const newStage = stageEdits[r.id] ?? Number(r.stage || 0);
                                  const now = new Date().toISOString();
                                  map[r.id].stage = newStage;
                                  map[r.id].status = (newStage === 3) ? 'accepted' : (newStage === 2) ? 'rejected' : 'in_progress';
                                  map[r.id].updatedAt = now;
                                  if (!map[r.id].stageTimes) map[r.id].stageTimes = {};
                                  if (!map[r.id].stageTimes[String(newStage)]) map[r.id].stageTimes[String(newStage)] = now;
                                  localStorage.setItem('reports', JSON.stringify(map));
                                  syncReportToBackend(r.id, map[r.id]);
                                  setEditingId(null);
                                  setReports(readReports());
                                } catch {}
                              }}
                            >
                              حفظ
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse' }}>
                    <thead>
                      <tr>
                        <th style={{ width:36, borderBottom:'1px solid #e5e7eb', padding:'8px' }}>
                          <input type="checkbox" aria-label="Tout sélectionner" onChange={toggleSelectAll} checked={list.length > 0 && list.every(r => selectedIds.has(r.id))} />
                        </th>
                        <th style={{ textAlign:'left', borderBottom:'1px solid #e5e7eb', padding:'8px' }}>ID</th>
                        <th style={{ textAlign:'left', borderBottom:'1px solid #e5e7eb', padding:'8px' }}>Type</th>
                        <th style={{ textAlign:'left', borderBottom:'1px solid #e5e7eb', padding:'8px' }}>Statut</th>
                        <th style={{ textAlign:'left', borderBottom:'1px solid #e5e7eb', padding:'8px' }}>Enregistré</th>
                        <th style={{ textAlign:'left', borderBottom:'1px solid #e5e7eb', padding:'8px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ padding:'12px', color:'#6b7280' }}>Aucun enregistrement</td>
                        </tr>
                      ) : (
                        list.map((r) => (
                          <tr key={r.id} style={{ cursor:'pointer' }}>
                            <td style={{ padding:'8px', borderBottom:'1px solid #f3f4f6' }} onClick={(e) => e.stopPropagation()}>
                              <input type="checkbox" aria-label={`Sélectionner ${r.id}`} checked={selectedIds.has(r.id)} onChange={() => toggleSelect(r.id)} />
                            </td>
                            <td style={{ padding:'8px', borderBottom:'1px solid #f3f4f6', fontFamily:'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace' }}>{r.id}</td>
                            <td style={{ padding:'8px', borderBottom:'1px solid #f3f4f6' }}>{r.type}</td>
                            <td style={{ padding:'8px', borderBottom:'1px solid #f3f4f6', textTransform:'capitalize', display:'flex', alignItems:'center', gap:8 }}>
                              <span style={{ width:10, height:10, borderRadius:9999, background: (r.status === 'rejected' ? (r.appeal ? '#f59e0b' : '#ef4444') : (r.status === 'accepted' || Number(r.stage||0) >= 4 ? '#10b981' : '#9ca3af')) }} />
                              {r.status}
                            </td>
                            <td style={{ padding:'8px', borderBottom:'1px solid #f3f4f6' }}>{r.createdAtDZ}</td>
                            <td style={{ padding:'8px', borderBottom:'1px solid #f3f4f6' }}>
                              <button className="btn btn-secondary" type="button" onClick={(e) => { e.stopPropagation(); setSelected(r); }}>Détails</button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {selected && (
        <div
          className="modal-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setSelected(null); }}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}
        >
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{ background:'#fff', width:'min(900px, 92vw)', maxHeight:'90vh', overflow:'auto', borderRadius:8, padding:16 }}
          >
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12 }}>
              <h3 style={{ margin:0 }}>Dossier: {selected.id}</h3>
              <div style={{ display:'flex', gap:8 }}>
                <button
                  onClick={() => setSelected(null)}
                  aria-label="Fermer"
                  title="Fermer"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '9999px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                    lineHeight: 1,
                    background: '#111827',
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  ×
                </button>
              </div>
            </div>
            <div style={{ marginTop:12, display:'grid', gap:8 }}>
              <section style={{ background:'#f8fafc', padding:12, borderRadius:8 }}>
                <div style={{ fontWeight:600, marginBottom:8 }}>Informations générales</div>
                <div style={{ display:'grid', gridTemplateColumns: gridCols, gap:8 }}>
                  <div><strong>ID</strong></div><div>{selected.id}</div>
                  <div><strong>Type</strong></div><div style={{ textTransform:'capitalize' }}>{selected.type}</div>
                  <div><strong>Statut</strong></div><div style={{ textTransform:'capitalize' }}>{selected.status}</div>
                  <div><strong>Enregistré</strong></div><div>{selected.createdAtDZ}</div>
                </div>
              </section>

              {selected?.appeal && (
                <section style={{ background:'#fff', padding:12, border:'1px solid #e5e7eb', borderRadius:8 }}>
                  <div style={{ fontWeight:600, marginBottom:8 }}>الطعـن المرسل</div>
                  <div style={{ display:'grid', gridTemplateColumns: gridCols, gap:8 }}>
                    <div><strong>تاريخ الإرسال</strong></div>
                    <div>{(() => { try { return new Date(selected.appeal.submittedAt).toLocaleString('ar-DZ'); } catch { return selected.appeal.submittedAt; } })()}</div>
                    {selected.appeal.message && (
                      <>
                        <div><strong>الرسالة</strong></div>
                        <div style={{ whiteSpace:'pre-wrap', background:'#f8fafc', padding:10, borderRadius:6 }}>{selected.appeal.message}</div>
                      </>
                    )}
                    {Array.isArray(selected.appeal.files) && selected.appeal.files.length > 0 && (
                      <>
                        <div><strong>الملفات المرفقة</strong></div>
                        <div>
                          <ul style={{ margin:0, paddingLeft:16 }}>
                            {selected.appeal.files.map((f, i) => (
                              <li key={i} style={{ marginBottom:6 }}>
                                <a href={f.dataUrl || '#'} download={f.name || `file-${i}`} target="_blank" rel="noreferrer">
                                  {f.name || `file-${i}`}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </>
                    )}
                  </div>
                  <div style={{ gridColumn:'1 / -1', marginTop:8, display:'flex', gap:8, flexWrap:'wrap' }}>
                    <button
                      className="btn btn-primary"
                      type="button"
                      onClick={() => {
                        try {
                          const map = JSON.parse(localStorage.getItem('reports') || '{}');
                          if (!map[selected.id]) return;
                          const now = new Date().toISOString();
                          map[selected.id].appealDecision = 'accepted';
                          map[selected.id].appealDecisionAt = now;
                          map[selected.id].status = 'accepted';
                          map[selected.id].stage = 3; // مقبول
                          if (!map[selected.id].stageTimes) map[selected.id].stageTimes = {};
                          if (!map[selected.id].stageTimes['3']) map[selected.id].stageTimes['3'] = now;
                          map[selected.id].updatedAt = now;
                          localStorage.setItem('reports', JSON.stringify(map));
                          syncReportToBackend(selected.id, map[selected.id]);
                          setSelected(prev => prev ? ({ ...prev, status:'accepted', stage:3, appealDecision:'accepted', appealDecisionAt: now, stageTimes: { ...(prev.stageTimes||{}), '3': (prev.stageTimes?.['3']||now) } }) : prev);
                          setReports(readReports());
                        } catch {}
                      }}
                    >قبول الطعن</button>
                    <button
                      className="btn btn-secondary"
                      type="button"
                      onClick={() => {
                        try {
                          const map = JSON.parse(localStorage.getItem('reports') || '{}');
                          if (!map[selected.id]) return;
                          const now = new Date().toISOString();
                          map[selected.id].appealDecision = 'rejected';
                          map[selected.id].appealDecisionAt = now;
                          map[selected.id].status = 'rejected';
                          map[selected.id].stage = 2; // مرفوض
                          map[selected.id].appealBanner = 'rejected'; // one-time banner for Suivi
                          map[selected.id].updatedAt = now;
                          localStorage.setItem('reports', JSON.stringify(map));
                          syncReportToBackend(selected.id, map[selected.id]);
                          setSelected(prev => prev ? ({ ...prev, status:'rejected', stage:2, appealDecision:'rejected', appealDecisionAt: now, appealBanner:'rejected' }) : prev);
                          setReports(readReports());
                        } catch {}
                      }}
                    >رفض الطعن</button>
                  </div>
                </section>
              )}

              <section style={{ background:'linear-gradient(180deg, #ffffff, #fbfdff)', padding: isMobile ? 12 : 16, border:'1px solid #dbeafe', borderRadius:12, boxShadow:'0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(59,130,246,0.06)' }}>
                <div style={{ fontWeight:600, marginBottom:8 }}>التقدم</div>
                <div style={{ display:'flex', gap:12, alignItems:'center', flexWrap:'wrap', padding:'8px 10px', background:'#f8fafc', borderRadius:10, border:'1px solid #eef2f7' }}>
                  <label><strong>المرحلة الحالية</strong></label>
                  <select value={selectedStage} onChange={(e) => setSelectedStage(Number(e.target.value))} style={{ padding:'6px 10px', borderRadius:8, border:'1px solid #cbd5e1', background:'#fff' }}>
                    {STAGES_AR.map((label, idx) => (
                      <option key={idx} value={idx}>{label}</option>
                    ))}
                  </select>
                  <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={() => {
                      try {
                        const map = JSON.parse(localStorage.getItem('reports') || '{}');
                        if (!map[selected.id]) return;
                        const now = new Date().toISOString();
                        map[selected.id].stage = selectedStage;
                        map[selected.id].status = (selectedStage === 3)
                          ? 'accepted'
                          : (selectedStage === 2)
                          ? 'rejected'
                          : 'in_progress';
                        map[selected.id].updatedAt = now;
                        if (!map[selected.id].stageTimes) map[selected.id].stageTimes = {};
                        const key = String(selectedStage);
                        if (!map[selected.id].stageTimes[key]) {
                          map[selected.id].stageTimes[key] = now;
                        }
                        localStorage.setItem('reports', JSON.stringify(map));
                        syncReportToBackend(selected.id, map[selected.id]);
                        setSelected({
                          ...selected,
                          stage: selectedStage,
                          stageTimes: {
                            ...(selected.stageTimes || {}),
                            ...(selected.stageTimes?.[String(selectedStage)] ? {} : { [String(selectedStage)]: now })
                          }
                        });
                        setReports(readReports());
                      } catch {}
                    }}
                  >حفظ المرحلة</button>
                </div>
                <div style={{ marginTop:12, display:'grid', gridTemplateColumns:'32px 1fr', gap:14 }}>
                  {STAGES_AR.map((label, idx) => (
                    <React.Fragment key={idx}>
                      <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
                        <div style={{ width:28, height:28, borderRadius:'9999px', background: idx <= selectedStage ? (label === 'مرفوض' ? '#ef4444' : 'linear-gradient(135deg, #10b981, #34d399)') : '#e5e7eb', color: idx <= selectedStage ? '#fff' : '#6b7280', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, boxShadow: idx === selectedStage ? (label === 'مرفوض' ? '0 0 0 4px rgba(239,68,68,0.15)' : '0 0 0 4px rgba(16,185,129,0.15)') : 'none', border: idx === selectedStage ? (label === 'مرفوض' ? '1px solid #dc2626' : '1px solid #059669') : '1px solid #e5e7eb' }}>{idx <= selectedStage ? '✓' : ''}</div>
                        {idx < STAGES_AR.length - 1 && <div style={{ width:2, flex:1, background: idx < selectedStage ? '#10b981' : '#e5e7eb', marginTop:6, marginBottom:6, borderRadius:2 }} />}
                      </div>
                      <div style={{ paddingBottom:14 }}>
                        <div style={{ padding:'10px 12px', borderRadius:10, border: idx === selectedStage ? '1px solid #93c5fd' : '1px solid #e5e7eb', background: idx === selectedStage ? 'linear-gradient(180deg, #ffffff, #f0f7ff)' : '#ffffff', boxShadow: idx === selectedStage ? '0 1px 2px rgba(0,0,0,0.04), 0 6px 16px rgba(59,130,246,0.08)' : 'none', fontWeight: idx === selectedStage ? 700 : 600, color: idx === selectedStage ? '#0ea5e9' : '#111827' }}>
                          {label}
                          {(() => {
                            try {
                              const t = selected?.stageTimes?.[String(idx)];
                              if (!t) return null;
                              const d = new Date(t).toLocaleDateString('ar-DZ', { year: 'numeric', month: 'long', day: 'numeric' });
                              return (
                                <div style={{ marginTop:6, display:'inline-block', background:'#fde68a', color:'#92400e', padding:'2px 6px', borderRadius:6, fontSize:12 }}>
                                  {d}
                                </div>
                              );
                            } catch {
                              return null;
                            }
                          })()}
                        </div>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </section>

              {selected?.data && (
                <section style={{ background:'#fff', padding:12, border:'1px solid #e5e7eb', borderRadius:8 }}>
                  <div style={{ fontWeight:600, marginBottom:8 }}>Coordonnées</div>
                  <div style={{ display:'grid', gridTemplateColumns: gridCols, gap:8 }}>
                    {['fullName','company','email','phone'].map((k) => (
                      selected.data[k] != null && selected.data[k] !== '' ? (
                        <React.Fragment key={k}>
                          <div><strong>{pretty(k)}</strong></div>
                          <div>{formatVal(k, selected.data[k])}</div>
                        </React.Fragment>
                      ) : null
                    ))}
                  </div>
                </section>
              )}

              {selected?.data && (
                <section style={{ background:'#fff', padding:12, border:'1px solid #e5e7eb', borderRadius:8 }}>
                  <div style={{ fontWeight:600, marginBottom:8 }}>Détails الحادث</div>
                  <div style={{ display:'grid', gridTemplateColumns: gridCols, gap:8 }}>
                    {['incidentDate','location','department','orderNumber','relationType','personsInvolved'].map((k) => (
                      selected.data[k] != null && selected.data[k] !== '' ? (
                        <React.Fragment key={k}>
                          <div><strong>{pretty(k)}</strong></div>
                          <div>{formatVal(k, selected.data[k])}</div>
                        </React.Fragment>
                      ) : null
                    ))}
                    {selected.data['description'] ? (
                      <>
                        <div style={{ gridColumn:'1 / -1' }}>
                          <div style={{ fontWeight:600, marginTop:4, marginBottom:4 }}>Description</div>
                          <div style={{ whiteSpace:'pre-wrap', background:'#f8fafc', padding:10, borderRadius:6 }}>{selected.data['description']}</div>
                        </div>
                      </>
                    ) : null}
                  </div>
                </section>
              )}

              {selected?.data && (selected.data['position'] || selected.data['supervisor'] || selected.data['requestFollowUp'] !== undefined) && (
                <section style={{ background:'#fff', padding:12, border:'1px solid #e5e7eb', borderRadius:8 }}>
                  <div style={{ fontWeight:600, marginBottom:8 }}>Informations du travail</div>
                  <div style={{ display:'grid', gridTemplateColumns: gridCols, gap:8 }}>
                    {['employeeId','position','supervisor','requestFollowUp'].map((k) => (
                      selected.data[k] != null && selected.data[k] !== '' ? (
                        <React.Fragment key={k}>
                          <div><strong>{pretty(k)}</strong></div>
                          <div>{formatVal(k, selected.data[k])}</div>
                        </React.Fragment>
                      ) : null
                    ))}
                  </div>
                </section>
              )}

              {selected?.data && selected.data['evidence'] ? (
                <section style={{ background:'#fff', padding:12, border:'1px solid #e5e7eb', borderRadius:8 }}>
                  <div style={{ fontWeight:600, marginBottom:8 }}>Pièces jointes</div>
                  <div>
                    {typeof selected.data['evidence'] === 'string' ? (
                      <div>{selected.data['evidence']}</div>
                    ) : selected.data['evidence']?.name ? (
                      <div>{selected.data['evidence'].name}</div>
                    ) : (
                      <div>(non disponible)</div>
                    )}
                  </div>
                </section>
              ) : null}

              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                <button className="btn btn-secondary" onClick={() => window.print()}>Imprimer</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
