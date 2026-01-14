import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './css/Admin.css';

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
  const [tab, setTab] = useState('dashboard');
  const [isMobile, setIsMobile] = useState(() => window.matchMedia && window.matchMedia('(max-width: 768px)').matches);
  const gridCols = isMobile ? '1fr' : '180px 1fr';
  const [editingId, setEditingId] = useState(null);
  const [stageEdits, setStageEdits] = useState({});
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

  const buildPrintableDoc = (report) => {
    const safe = (s) => String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

    const stageIdx = Number(report?.stage ?? 0);
    const stageLabel = Number.isFinite(stageIdx) ? (STAGES_AR[stageIdx] || '') : '';

    const excludedKeys = new Set([
      'stage',
      'stageTimes',
      'appeal',
      'appealDecision',
      'appealDecisionAt',
      'appealBanner',
      'updatedAt',
      'createdAt',
      'createdAtDZ',
      'type',
      'data',
      'status',
      'id',
    ]);

    const data = (report?.data && typeof report.data === 'object')
      ? report.data
      : (report && typeof report === 'object')
        ? Object.fromEntries(Object.entries(report).filter(([k]) => !excludedKeys.has(k)))
        : {};

    const formatValue = (v) => {
      if (v == null) return '';
      if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return String(v);
      try { return JSON.stringify(v, null, 2); } catch { return String(v); }
    };

    const isEvidenceKey = (k) => {
      const kk = String(k || '').toLowerCase();
      return kk === 'evidence' || kk.includes('evidence');
    };

    const rowsHtml = Object.entries(data)
      .filter(([k]) => k)
      .map(([k, v]) => {
        const value = isEvidenceKey(k)
          ? (v ? 'نعم يوجد دليل' : 'لا يوجد')
          : formatValue(v);
        const isMultiline = value.includes('\n') || value.length > 80;
        return `
          <div class="row">
            <div class="key">${safe(pretty(k))}</div>
            <div class="value ${isMultiline ? 'multiline' : ''}">${safe(value)}</div>
          </div>`;
      })
      .join('');

    const printCSS = `
      :root { color-scheme: light; }
      body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; margin: 0; color: #0f172a; background: #f1f5f9; }
      .page { max-width: 820px; margin: 24px auto; background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 22px 24px; }
      .logo-wrap { display: flex; justify-content: center; align-items: center; margin-bottom: 12px; }
      .logo-wrap img { height: 72px; width: auto; object-fit: contain; }
      .title { text-align: center; font-size: 18px; font-weight: 800; margin: 0 0 14px; }
      .meta { display: grid; grid-template-columns: 1fr; gap: 8px; margin-bottom: 14px; }
      .meta .meta-row { display: flex; justify-content: space-between; gap: 14px; border-bottom: 1px solid #e5e7eb; padding: 7px 0; }
      .meta .label { color: #334155; font-weight: 700; }
      .meta .val { color: #0f172a; font-weight: 600; text-align: end; }
      .section-title { font-size: 14px; font-weight: 800; margin: 14px 0 8px; color: #0f172a; }
      .grid { border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden; }
      .row { display: grid; grid-template-columns: 220px 1fr; border-bottom: 1px solid #e5e7eb; }
      .row:last-child { border-bottom: none; }
      .key { padding: 10px 12px; background: #f8fafc; font-weight: 800; color: #0f172a; }
      .value { padding: 10px 12px; white-space: pre-wrap; word-break: break-word; font-weight: 600; color: #0f172a; }
      .value.multiline { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; font-weight: 500; font-size: 12px; }
      .hint { margin-top: 10px; color: #64748b; font-size: 12px; text-align: center; }
      @media print {
        body { background: #fff; }
        .page { margin: 0; border: none; border-radius: 0; padding: 14mm; max-width: none; }
        .hint { display: none; }
      }
    `;

    return `<!doctype html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${safe(report?.id || '')}</title>
        <style>${printCSS}</style>
      </head>
      <body>
        <div class="page">
          <div class="logo-wrap"><img src="/Logo-Gica.png" alt="Logo" /></div>
          <div class="title">ملف البلاغ</div>
          <div class="meta">
            <div class="meta-row"><div class="label">رقم التتبع</div><div class="val">${safe(report?.id || '')}</div></div>
            <div class="meta-row"><div class="label">الحالة</div><div class="val">${safe(stageLabel || report?.status || '')}</div></div>
            <div class="meta-row"><div class="label">آخر تحديث</div><div class="val">${safe(report?.createdAtDZ || report?.updatedAt || report?.createdAt || '')}</div></div>
          </div>
          <div class="section-title">معلومات المستخدم</div>
          <div class="grid">${rowsHtml || '<div class="row"><div class="key">—</div><div class="value">—</div></div>'}</div>
          <div class="hint">يمكنك حفظها PDF من نافذة الطباعة.</div>
        </div>
        <script>window.onload = () => { setTimeout(() => { window.print(); }, 200); };</script>
      </body>
      </html>`;
  };

  const handleAdminPrint = (report) => {
    if (!report) return;
    const w = window.open('', '_blank');
    if (!w) return;
    const doc = w.document;
    const html = buildPrintableDoc(report);
    doc.open();
    doc.write(html);
    doc.close();
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

  const stats = useMemo(() => {
    const safeDate = (r) => {
      const raw = r?.createdAt || r?.updatedAt;
      if (!raw) return null;
      const d = new Date(raw);
      return Number.isNaN(d.getTime()) ? null : d;
    };

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dayOfWeek = (now.getDay() + 6) % 7; // Monday=0
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const between = (from, to) => {
      let c = 0;
      for (const r of reports) {
        const d = safeDate(r);
        if (!d) continue;
        if (d >= from && d < to) c++;
      }
      return c;
    };

    const dayCount = between(startOfDay, new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000));
    const weekCount = between(startOfWeek, new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000));
    const monthCount = between(startOfMonth, new Date(now.getFullYear(), now.getMonth() + 1, 1));
    const yearCount = between(startOfYear, new Date(now.getFullYear() + 1, 0, 1));

    const last7Days = Array.from({ length: 7 }).map((_, idx) => {
      const d0 = new Date(startOfDay);
      d0.setDate(d0.getDate() - (6 - idx));
      const d1 = new Date(d0);
      d1.setDate(d1.getDate() + 1);
      const value = between(d0, d1);
      const label = d0.toLocaleDateString('ar-DZ', { weekday: 'short' });
      return { label, value };
    });

    const statusParts = [
      { key: 'not_started', label: 'قيد المتابعة', color: '#0f766e', value: [...groups.not_started, ...groups.in_progress].length },
      { key: 'appeal_wait', label: 'جلسة الطعن', color: '#f59e0b', value: groups.appeal_wait.length },
      { key: 'studied', label: 'مدروسة', color: '#10b981', value: groups.studied.length },
      { key: 'rejected', label: 'مرفوضة', color: '#ef4444', value: groups.rejected.length },
    ];

    const total = statusParts.reduce((s, p) => s + p.value, 0) || 1;
    const withPct = statusParts.map((p) => ({
      ...p,
      pct: Math.round((p.value / total) * 100),
    }));

    return {
      dayCount,
      weekCount,
      monthCount,
      yearCount,
      last7Days,
      statusParts: withPct,
      total,
    };
  }, [reports, groups]);

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

  const tabs = [
    { key: 'dashboard', title: 'لوحة التحكم', list: [] },
    { key: 'stats', title: 'إحصائيات', list: [] },
    { key: 'not_started', title: 'قيد المتابعة', list: [...groups.not_started, ...groups.in_progress] },
    { key: 'appeal_wait', title: 'ملفات تنتظر جلسة الطعن', list: groups.appeal_wait },
    { key: 'studied', title: 'ملفات مدروسة', list: groups.studied },
    { key: 'rejected', title: 'ملفات مرفوضة', list: groups.rejected },
  ];
  const active = tabs.find(t => t.key === tab) || tabs[0];
  const list = (active.key === 'dashboard') ? tabs.find(t => t.key === 'not_started')?.list || [] : active.list;

  return (
    <div className="admin-page">
      <aside className="admin-sidebar">
        <nav className="admin-nav" aria-label="Admin navigation">
          <div className="admin-nav-main">
            {tabs.map((t) => (
              <button
                key={t.key}
                type="button"
                className={`admin-nav-item ${tab === t.key ? 'active' : ''}`}
                onClick={() => setTab(t.key)}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                  <span className="icon" aria-hidden>
                    {t.key === 'dashboard' ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M3 13h8V3H3v10Zm0 8h8v-6H3v6Zm10 0h8V11h-8v10Zm0-18v6h8V3h-8Z"/></svg>
                    ) : t.key === 'stats' ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M3 3h2v18H3V3Zm16 6h2v12h-2V9ZM11 13h2v8h-2v-8Zm4-8h2v16h-2V5ZM7 11h2v10H7V11Z"/></svg>
                    ) : t.key === 'not_started' ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 6V3L8 7l4 4V8c2.8 0 5 2.2 5 5 0 1-.3 2-1 2.8l1.4 1.4C18.4 16.1 19 14.6 19 13c0-3.9-3.1-7-7-7Zm-5 5c0-1 .3-2 1-2.8L6.6 6.8C5.6 7.9 5 9.4 5 11c0 3.9 3.1 7 7 7v3l4-4-4-4v3c-2.8 0-5-2.2-5-5Z"/></svg>
                    ) : t.key === 'appeal_wait' ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 22a10 10 0 1 0-10-10 10 10 0 0 0 10 10Zm1-10V7h-2v6h6v-2Z"/></svg>
                    ) : t.key === 'studied' ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="m9 16.2-3.5-3.5L4 14.2l5 5 11-11-1.5-1.5L9 16.2Z"/></svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm5 13.6L15.6 17 12 13.4 8.4 17 7 15.6 10.6 12 7 8.4 8.4 7 12 10.6 15.6 7 17 8.4 13.4 12Z"/></svg>
                    )}
                  </span>
                  <span>{t.title}</span>
                </span>
                <span className="count" aria-label="count">
                  {t.key === 'dashboard' ? reports.length : t.key === 'stats' ? reports.length : t.list.length}
                </span>
              </button>
            ))}
          </div>

          <button type="button" className="admin-nav-item admin-nav-logout" onClick={handleLogout}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              <span className="icon" aria-hidden>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M10 17v-2h4v2h-4Zm0-4v-2h7v2h-7Zm0-4V7h7v2h-7Zm-6 1h8V3h10v18H12v-7H4v-4Z"/></svg>
              </span>
              <span>تسجيل الخروج</span>
            </span>
            <span className="count">↩</span>
          </button>
        </nav>
      </aside>

      <main className="admin-main">
        <section className="admin-top">
          <div className="admin-top-row">
            <div className="admin-heading">
              <h2>لوحة التحكم</h2>
              <p>
                {reportsLoading
                  ? '...جاري تحميل الملفات'
                  : reportsError
                    ? reportsError
                    : `عدد الملفات: ${reports.length}`}
              </p>
            </div>

            <div className="admin-tools">
              <div className="admin-search">
                <input
                  type="search"
                  placeholder="ابحث في الشكاوى والمستندات..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>
              <button className="btn btn-secondary" type="button" onClick={loadBackendReports} disabled={reportsLoading}>تحديث</button>
            </div>
          </div>

          <div className="admin-stats">
            <div className="admin-card">
              <div className="label">قيد المتابعة</div>
              <div className="value">{tabs[1].list.length}</div>
            </div>
            <div className="admin-card">
              <div className="label">ملفات تنتظر جلسة الطعن</div>
              <div className="value">{tabs[2].list.length}</div>
            </div>
            <div className="admin-card">
              <div className="label">ملفات مدروسة</div>
              <div className="value">{tabs[3].list.length}</div>
            </div>
            <div className="admin-card">
              <div className="label">ملفات مرفوضة</div>
              <div className="value">{tabs[4].list.length}</div>
            </div>
          </div>
        </section>

        <section className="admin-content">
          <div className="admin-panel">
            <div className="admin-panel-header">
              <strong>{active.key === 'dashboard' ? 'قيد المتابعة' : active.title}</strong>
            </div>

            <div className="admin-mobile-tabs" style={{ padding: '10px 12px', gap: 8, overflowX: 'auto' }}>
              {tabs.filter(t => t.key !== 'dashboard').map((t) => (
                <button
                  key={t.key}
                  type="button"
                  className={`admin-nav-item ${tab === t.key ? 'active' : ''}`}
                  style={{ flex: '0 0 auto' }}
                  onClick={() => setTab(t.key)}
                >
                  <span>{t.title}</span>
                  <span className="count">{t.list.length}</span>
                </button>
              ))}
            </div>

            <div style={{ padding: 12 }}>
              {active.key === 'stats' ? (
                <div className="admin-stats-page">
                  <div className="admin-stats-grid">
                    <div className="admin-card">
                      <div className="label">شكاوى اليوم</div>
                      <div className="value">{stats.dayCount}</div>
                    </div>
                    <div className="admin-card">
                      <div className="label">هذا الأسبوع</div>
                      <div className="value">{stats.weekCount}</div>
                    </div>
                    <div className="admin-card">
                      <div className="label">هذا الشهر</div>
                      <div className="value">{stats.monthCount}</div>
                    </div>
                    <div className="admin-card">
                      <div className="label">هذه السنة</div>
                      <div className="value">{stats.yearCount}</div>
                    </div>
                  </div>

                  <div className="admin-charts">
                    <div className="admin-chart-card">
                      <div className="admin-chart-title">عدد الشكاوى خلال 7 أيام</div>
                      {(() => {
                        const values = stats.last7Days.map(d => d.value);
                        const max = Math.max(1, ...values);
                        const w = 520;
                        const h = 180;
                        const pad = 16;
                        const barW = Math.floor((w - pad * 2) / 7) - 10;
                        const baseY = h - 34;
                        return (
                          <svg viewBox={`0 0 ${w} ${h}`} className="admin-bar-svg" role="img" aria-label="bar chart">
                            <line x1={pad} y1={baseY} x2={w - pad} y2={baseY} stroke="#e5e7eb" />
                            {stats.last7Days.map((d, i) => {
                              const x = pad + i * (barW + 10) + 6;
                              const bh = Math.round((d.value / max) * (h - 70));
                              const y = baseY - bh;
                              return (
                                <g key={i}>
                                  <rect x={x} y={y} width={barW} height={bh} rx={8} fill="#0f766e" opacity="0.92" />
                                  <text x={x + barW / 2} y={baseY + 18} textAnchor="middle" fontSize="12" fill="#64748b">{d.label}</text>
                                  <text x={x + barW / 2} y={y - 6} textAnchor="middle" fontSize="12" fill="#0f172a">{d.value}</text>
                                </g>
                              );
                            })}
                          </svg>
                        );
                      })()}
                    </div>

                    <div className="admin-chart-card">
                      <div className="admin-chart-title">توزيع الحالات</div>
                      {(() => {
                        const size = 180;
                        const r = 62;
                        const cx = size / 2;
                        const cy = size / 2;
                        const circ = 2 * Math.PI * r;
                        let offset = 0;
                        return (
                          <div className="admin-donut-wrap">
                            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="admin-donut" role="img" aria-label="donut chart">
                              <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e5e7eb" strokeWidth="16" />
                              {stats.statusParts.map((p) => {
                                const seg = (p.value / stats.total) * circ;
                                const el = (
                                  <circle
                                    key={p.key}
                                    cx={cx}
                                    cy={cy}
                                    r={r}
                                    fill="none"
                                    stroke={p.color}
                                    strokeWidth="16"
                                    strokeDasharray={`${seg} ${circ - seg}`}
                                    strokeDashoffset={-offset}
                                    strokeLinecap="round"
                                    transform={`rotate(-90 ${cx} ${cy})`}
                                  />
                                );
                                offset += seg;
                                return el;
                              })}
                              <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize="18" fontWeight="800" fill="#0f172a">{stats.total}</text>
                              <text x={cx} y={cy + 22} textAnchor="middle" dominantBaseline="middle" fontSize="12" fill="#64748b">ملف</text>
                            </svg>

                            <div className="admin-legend">
                              {stats.statusParts.map((p) => (
                                <div key={p.key} className="admin-legend-item">
                                  <span className="dot" style={{ background: p.color }} />
                                  <span className="name">{p.label}</span>
                                  <span className="pct">{p.pct}%</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              ) : isMobile ? (
                <div style={{ display: 'grid', gap: 8 }}>
                  {list.length === 0 ? (
                    <div style={{ padding: '12px', color: '#6b7280' }}>لا توجد بيانات</div>
                  ) : (
                    list.map((r) => (
                      <div
                        key={r.id}
                        style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 12, background: '#fff' }}
                        onClick={() => setSelected(r)}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <div style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace', fontWeight: 700 }}>{r.id}</div>
                          <span style={{ width: 10, height: 10, borderRadius: 9999, background: (r.status === 'rejected' ? (r.appeal && !r.appealDecision ? '#f59e0b' : '#ef4444') : (r.status === 'accepted' || Number(r.stage || 0) >= 4 ? '#10b981' : '#9ca3af')) }} />
                        </div>
                        {editingId === r.id && (
                          <div
                            style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <select
                              value={stageEdits[r.id] ?? Number(r.stage || 0)}
                              onChange={(e) => setStageEdits(prev => ({ ...prev, [r.id]: Number(e.target.value) }))}
                              style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff' }}
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
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', padding: '8px' }}>ID</th>
                        <th style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', padding: '8px' }}>Type</th>
                        <th style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', padding: '8px' }}>Statut</th>
                        <th style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', padding: '8px' }}>Enregistré</th>
                        <th style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', padding: '8px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ padding: '12px', color: '#6b7280' }}>Aucun enregistrement</td>
                        </tr>
                      ) : (
                        list.map((r) => (
                          <tr key={r.id} style={{ cursor: 'pointer' }}>
                            <td style={{ padding: '8px', borderBottom: '1px solid #f3f4f6', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace' }}>{r.id}</td>
                            <td style={{ padding: '8px', borderBottom: '1px solid #f3f4f6' }}>{r.type}</td>
                            <td style={{ padding: '8px', borderBottom: '1px solid #f3f4f6', textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ width: 10, height: 10, borderRadius: 9999, background: (r.status === 'rejected' ? (r.appeal ? '#f59e0b' : '#ef4444') : (r.status === 'accepted' || Number(r.stage || 0) >= 4 ? '#10b981' : '#9ca3af')) }} />
                              {r.status}
                            </td>
                            <td style={{ padding: '8px', borderBottom: '1px solid #f3f4f6' }}>{r.createdAtDZ}</td>
                            <td style={{ padding: '8px', borderBottom: '1px solid #f3f4f6' }}>
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
        </section>

      </main>

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
                    <div>نعم يوجد دليل</div>
                  </div>
                </section>
              ) : null}

              {selected?.data && !selected.data['evidence'] ? (
                <section style={{ background:'#fff', padding:12, border:'1px solid #e5e7eb', borderRadius:8 }}>
                  <div style={{ fontWeight:600, marginBottom:8 }}>Pièces jointes</div>
                  <div>
                    <div>لا يوجد</div>
                  </div>
                </section>
              ) : null}

              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                <button className="btn btn-secondary" onClick={() => handleAdminPrint(selected)}>Imprimer</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
