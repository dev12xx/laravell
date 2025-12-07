import React, { useState } from 'react';
import './css/SuiviSignalements.css';
import { useLanguage } from '../context/LanguageContext.jsx';
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';
const STAGES_AR = [
  'تم إرسال الإبلاغ',
  'قيد المعالجة',
  'مرفوض',
  'مقبول',
  'لقد تم دراسة الملف',
  'لقد تم إرسال الرد في إيميلك',
]

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

const SuiviSignalements = () => {
  const { t, lang } = useLanguage();
  const [trackingId, setTrackingId] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [showAppeal, setShowAppeal] = useState(false);
  const [appealMsg, setAppealMsg] = useState('');
  const [appealFiles, setAppealFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [appealSubmitting, setAppealSubmitting] = useState(false);
  const fileInputRef = React.useRef(null);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setResult(null);

    if (!trackingId.trim()) {
      setError(t('track.error.empty'));
      return;
    }

    setLoading(true);

    const id = trackingId.trim().toUpperCase();

    const buildResult = (rec) => ({
      id,
      status: t('track.status.received'),
      updatedAt: rec.createdAtDZ || new Date(rec.updatedAt || rec.createdAt || Date.now()).toLocaleString(lang === 'ar' ? 'ar-DZ' : 'fr-DZ'),
      type: rec.type,
      data: rec.data,
      raw: rec,
    });

    try {
      const res = await fetch(`${API_BASE}/reports/${encodeURIComponent(id)}`);
      if (res.ok) {
        const json = await res.json();
        const rec = json?.payload || {};
        setResult(buildResult(rec));
        try {
          const map = JSON.parse(localStorage.getItem('reports') || '{}');
          map[id] = rec;
          localStorage.setItem('reports', JSON.stringify(map));
        } catch {}
        return;
      }

      const map = JSON.parse(localStorage.getItem('reports') || '{}');
      const rec = map[id];
      if (!rec) {
        setError(t('track.error.notFound'));
        return;
      }
      setResult(buildResult(rec));
    } catch (err) {
      console.error('Failed to fetch or resolve report', err);
      const map = JSON.parse(localStorage.getItem('reports') || '{}');
      const rec = map[id];
      if (!rec) {
        setError(t('track.error.notFound'));
      } else {
        setResult(buildResult(rec));
      }
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id) {
      setTrackingId(id);
      setTimeout(() => handleSearch(), 0);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (!result?.id) return;
    let prev = localStorage.getItem('reports');
    const sync = () => {
      try {
        const cur = localStorage.getItem('reports');
        if (cur === prev) return;
        prev = cur;
        const map = JSON.parse(cur || '{}');
        const rec = map[result.id];
        if (rec) {
          setResult(r => r ? ({
            ...r,
            updatedAt: rec.createdAtDZ || new Date(rec.updatedAt || rec.createdAt || Date.now()).toLocaleString(lang === 'ar' ? 'ar-DZ' : 'fr-DZ'),
            raw: rec,
          }) : r);
        }
      } catch {}
    };
    const onStorage = (e) => { if (e.key === 'reports') sync(); };
    window.addEventListener('storage', onStorage);
    const iv = setInterval(sync, 1500);
    return () => { window.removeEventListener('storage', onStorage); clearInterval(iv); };
  }, [result?.id, lang]);

  const handleDownload = () => {
    if (!result) return;
    const w = window.open('', '_blank');
    if (!w) return;
    const doc = w.document;
    const safe = (s) => String(s).replace(/[&<>]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
    const formatPhone = (p) => {
      const raw = String(p || '').replace(/\D/g, '');
      if (!raw) return String(p || '');

      let ccLen = 3;

      if (raw.startsWith('213')) {
        // Algeria: +213 + local
        ccLen = 3;
      } else if (raw.length === 11 && raw.startsWith('1')) {
        // North America: +1 + 10 digits
        ccLen = 1;
      } else if (raw.length === 10) {
        // e.g. 2-digit country code + 8 local digits
        ccLen = 2;
      } else if (raw.length <= 9) {
        ccLen = 1;
      } else if (raw.length >= 12) {
        ccLen = 3;
      }

      const cc = raw.slice(0, ccLen);
      const local = raw.slice(ccLen);
      if (!local) return `+${cc}`;
      return `+${cc} ${local}`;
    };
    const printCSS = `
      body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; margin: 24px; color: #0f172a; }
      h1 { font-size: 20px; margin: 0 0 8px; }
      h2 { font-size: 16px; margin: 16px 0 8px; }
      .muted { color: #475569; }
      .row { display: flex; justify-content: space-between; border-bottom: 1px solid #e5e7eb; padding: 6px 0; }
      .timeline { margin-top: 12px; }
      .timeline-item { margin: 6px 0; }
      .card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; margin-top: 16px; background: #ffffff; }
      .logo-wrapper { display:flex; justify-content:center; margin-bottom:16px; }
      .logo-wrapper img { max-width:140px; height:auto; object-fit:contain; }
    `;
    const data = result.data || result.raw?.data || {};
    const type = result.type || result.raw?.type || '';
    const userRows = [];
    if (type === 'client') {
      if (data.fullName) userRows.push(`<div class="row"><strong>${safe(t('client.fullName'))}</strong><span>${safe(data.fullName)}</span></div>`);
      if (data.company) userRows.push(`<div class="row"><strong>${safe(t('client.company'))}</strong><span>${safe(data.company)}</span></div>`);
      if (data.relationType) userRows.push(`<div class="row"><strong>${safe(t('client.relation'))}</strong><span>${safe(data.relationType)}</span></div>`);
      if (data.email) userRows.push(`<div class="row"><strong>${safe(t('common.email'))}</strong><span>${safe(data.email)}</span></div>`);
      if (data.phone) userRows.push(`<div class="row"><strong>${safe(t('common.phone'))}</strong><span>${safe(formatPhone(data.phone))}</span></div>`);
      if (data.department) userRows.push(`<div class="row"><strong>${safe(t('client.department'))}</strong><span>${safe(data.department)}</span></div>`);
      if (data.orderNumber) userRows.push(`<div class="row"><strong>${safe(t('client.orderNumber'))}</strong><span>${safe(data.orderNumber)}</span></div>`);
      if (data.incidentDate) userRows.push(`<div class="row"><strong>${safe(t('common.incidentDateTime'))}</strong><span>${safe(data.incidentDate)}</span></div>`);
      if (data.description) userRows.push(`<div class="row"><strong>${safe(t('common.description'))}</strong><span>${safe(data.description)}</span></div>`);
    } else if (type === 'employee') {
      if (data.employeeId) userRows.push(`<div class="row"><strong>${safe(t('employee.matricule'))}</strong><span>${safe(data.employeeId)}</span></div>`);
      if (data.email) userRows.push(`<div class="row"><strong>${safe(t('common.email'))}</strong><span>${safe(data.email)}</span></div>`);
      if (data.department) userRows.push(`<div class="row"><strong>${safe(t('employee.department'))}</strong><span>${safe(data.department)}</span></div>`);
      if (data.position) userRows.push(`<div class="row"><strong>${safe(t('employee.position'))}</strong><span>${safe(data.position)}</span></div>`);
      if (data.supervisor) userRows.push(`<div class="row"><strong>${safe(t('employee.supervisor'))}</strong><span>${safe(data.supervisor)}</span></div>`);
      if (data.incidentDate) userRows.push(`<div class="row"><strong>${safe(t('common.incidentDateTime'))}</strong><span>${safe(data.incidentDate)}</span></div>`);
      if (data.location) userRows.push(`<div class="row"><strong>${safe(t('employee.location'))}</strong><span>${safe(data.location)}</span></div>`);
      if (data.personsInvolved) userRows.push(`<div class="row"><strong>${safe(t('employee.persons'))}</strong><span>${safe(data.personsInvolved)}</span></div>`);
      if (data.description) userRows.push(`<div class="row"><strong>${safe(t('common.description'))}</strong><span>${safe(data.description)}</span></div>`);
      if (data.requestFollowUp != null) userRows.push(`<div class="row"><strong>${safe(t('employee.followup'))}</strong><span>${safe(data.requestFollowUp ? 'Oui' : 'Non')}</span></div>`);
    } else if (type === 'external') {
      if (data.fullName) userRows.push(`<div class="row"><strong>${safe(t('external.fullName'))}</strong><span>${safe(data.fullName)}</span></div>`);
      if (data.email) userRows.push(`<div class="row"><strong>${safe(t('common.email'))}</strong><span>${safe(data.email)}</span></div>`);
      if (data.phone) userRows.push(`<div class="row"><strong>${safe(t('common.phone'))}</strong><span>${safe(formatPhone(data.phone))}</span></div>`);
      if (data.incidentDate) userRows.push(`<div class="row"><strong>${safe(t('common.incidentDateTime'))}</strong><span>${safe(data.incidentDate)}</span></div>`);
      if (data.schbDepartment) userRows.push(`<div class="row"><strong>${safe(t('external.incidentDept'))}</strong><span>${safe(data.schbDepartment)}</span></div>`);
      if (data.personsInvolved) userRows.push(`<div class="row"><strong>${safe(t('external.persons'))}</strong><span>${safe(data.personsInvolved)}</span></div>`);
      if (data.description) userRows.push(`<div class="row"><strong>${safe(t('common.description'))}</strong><span>${safe(data.description)}</span></div>`);
    } else {
      if (data.fullName) userRows.push(`<div class="row"><strong>${safe('Nom')}</strong><span>${safe(data.fullName)}</span></div>`);
      if (data.email) userRows.push(`<div class="row"><strong>${safe('Email')}</strong><span>${safe(data.email)}</span></div>`);
      if (data.phone) userRows.push(`<div class="row"><strong>${safe('Téléphone')}</strong><span>${safe(formatPhone(data.phone))}</span></div>`);
      if (data.description) userRows.push(`<div class="row"><strong>${safe(t('common.description'))}</strong><span>${safe(data.description)}</span></div>`);
    }
    const userInfoHtml = userRows.join('');
    const timelineHtml = STAGES_AR.map((label, idx) => {
      const v = result.raw?.stageTimes?.[String(idx)];
      if (!v) return '';
      let dateStr = '';
      try { dateStr = new Date(v).toLocaleString(lang === 'ar' ? 'ar-DZ' : 'fr-DZ'); } catch { dateStr = v; }
      return `<div class="timeline-item">${safe(label)} — <span class="muted">${safe(dateStr)}</span></div>`;
    }).filter(Boolean).join('');
    const html = `<!doctype html>
      <html dir="${lang === 'ar' ? 'rtl' : 'ltr'}" lang="${lang}">
      <head><meta charset="utf-8"><title>${safe(result.id)}</title><style>${printCSS}</style></head>
      <body>
        <div class="logo-wrapper"><img src="/Logo-Gica.png" alt="Logo" /></div>
        <h1>${safe(t('track.title'))}</h1>
        <div class="card">
          <div class="row"><strong>${safe(t('track.result.id'))}</strong><span>${safe(result.id)}</span></div>
          <div class="row"><strong>${safe(t('track.result.status'))}</strong><span>${safe(result.status)}</span></div>
          <div class="row"><strong>${safe(t('track.result.updated'))}</strong><span>${safe(result.updatedAt)}</span></div>
        </div>
        ${userInfoHtml ? `<div class="card"><h2>${safe(t('userType.title'))}</h2>${userInfoHtml}</div>` : ''}
        <div class="card timeline">
          <h2>${safe(t('track.detail.title'))}</h2>
          <div>${timelineHtml}</div>
        </div>
        <script>window.onload = () => { setTimeout(() => { window.print(); }, 200); };</script>
      </body></html>`;
    doc.open();
    doc.write(html);
    doc.close();
  };

  const formatDZ = (d) => {
    try {
      return new Intl.DateTimeFormat('ar-DZ', {
        timeZone: 'Africa/Algiers', year: 'numeric', month: 'long', day: 'numeric'
      }).format(d);
    } catch {
      return d.toLocaleDateString();
    }
  };

  const timeline = React.useMemo(() => STAGES_AR, []);

  const currentStage = React.useMemo(() => {
    const v = Number(result?.raw?.stage ?? 0);
    return Number.isFinite(v) ? v : 0;
  }, [result]);

  const isRejected = currentStage === 2; // index of 'مرفوض'
  const appealRejected = result?.raw?.appealDecision === 'rejected';

  const handleFiles = async (files) => {
    const arr = Array.from(files || []);
    const toDataUrl = (file) => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve({ name: file.name, type: file.type, size: file.size, dataUrl: reader.result });
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    const list = await Promise.all(arr.map(toDataUrl));
    setAppealFiles(list);
    if (!showAppeal) setShowAppeal(true);
  };

  const submitAppeal = async (e) => {
    e?.preventDefault?.();
    if (!result?.id) return;
    setAppealSubmitting(true);
    try {
      const map = JSON.parse(localStorage.getItem('reports') || '{}');
      const rec = map[result.id];
      if (!rec) return;
      rec.appeal = {
        submittedAt: new Date().toISOString(),
        message: appealMsg || '',
        files: appealFiles || [],
      };
      rec.updatedAt = new Date().toISOString();
      localStorage.setItem('reports', JSON.stringify(map));
      await syncReportToBackend(result.id, rec);
      setResult({ ...result, raw: { ...rec } });
      setShowAppeal(false);
      setAppealMsg('');
      setAppealFiles([]);
      alert('تم إرسال طلب الطعن بنجاح');
    } catch (err) {
      console.error('Failed to submit appeal', err);
      alert(lang === 'ar' ? 'فشل إرسال طلب الطعن، حاول مرة أخرى لاحقًا.' : "Échec de l'envoi du recours, réessayez plus tard.");
    } finally {
      setAppealSubmitting(false);
    }
  };

  return (
    <div className="suivi-page">
      <div className="hero">
        <h1 className="title">{t('track.title')}</h1>
        <p className="subtitle">{t('track.subtitle')}</p>
      </div>

      <div className="card search-card">
        <form className="search-form" onSubmit={handleSearch}>
          <label className="label" htmlFor="trackingId">{t('track.search.label')}</label>
          <div className="search-row">
            <input
              id="trackingId"
              type="text"
              className="input"
              placeholder={t('track.search.placeholder')}
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
              dir="ltr"
            />
            <button type="submit" className="btn">{t('track.search.button')}</button>
          </div>
          {error && <div className="alert error">{error}</div>}
          {loading && !error && (
            <div className="alert info">{t('track.search.loading') || 'جاري البحث عن ملفك...'}</div>
          )}
        </form>

        {result && (
          <div className="result">
            <div className="result-row"><strong>{t('track.result.id')}</strong><span>{result.id}</span></div>
            <div className="result-row"><strong>{t('track.result.updated')}</strong><span>{result.updatedAt}</span></div>
          </div>
        )}
      </div>

      <div className="card info-card">
        <h3 className="info-title">{t('track.how.title')}</h3>
        <p className="info-text">{t('track.how.p1')}</p>
        <ul className="info-list">
          <li>{t('track.how.li1')}</li>
          <li>{t('track.how.li2')}</li>
          <li>{t('track.how.li3')}</li>
        </ul>
        <div className="sample">
          <span>{t('track.sample')}</span>
          <code dir="ltr">RPT-2024-001</code>
        </div>
      </div>

      {result && !appealRejected && (
        <div className="card info-card">
          <h3 className="info-title">Suivi des signalements</h3>
          <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:'12px', paddingInline:'6px' }}>
            {timeline.map((label, i) => (
              <div key={i} style={{ display:'grid', gridTemplateColumns:'28px 1fr', gap:12 }}>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
                  <div style={{ width:24, height:24, borderRadius:'9999px', background: i <= currentStage ? (label === 'مرفوض' ? '#ef4444' : '#10b981') : '#e5e7eb', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, color: i <= currentStage ? '#fff' : '#6b7280' }}>
                    {i <= currentStage ? '✓' : ''}
                  </div>
                  {i < timeline.length - 1 && <div style={{ width:2, flex:1, background:'#e5e7eb', marginTop:4, marginBottom:4 }} />}
                </div>
                <div style={{ paddingBottom:12 }}>
                  <div style={{ fontWeight: i === currentStage ? 700 : 600, color: i === currentStage ? '#0ea5e9' : 'inherit', marginBottom:0 }}>
                    {label === 'مرفوض' && i === currentStage ? 'مرفوض (يمكنك الطعن)' : label}
                  </div>
                  {(() => {
                    try {
                      const tVal = result?.raw?.stageTimes?.[String(i)];
                      if (!tVal) return null;
                      const d = new Date(tVal).toLocaleDateString(lang === 'ar' ? 'ar-DZ' : 'fr-DZ', { year: 'numeric', month: 'long', day: 'numeric' });
                      return <div style={{ marginTop:4, fontSize:12, color:'#64748b' }}>{d}</div>;
                    } catch {
                      return null;
                    }
                  })()}
                  {i === 2 && i === currentStage && (
                    <div style={{ marginTop:8 }}>
                      <button type="button" className="btn" onClick={() => setShowAppeal(true)}>طلب الطعن (رسالة + أدلة)</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="search-row" style={{ marginTop: '0.5rem' }}>
            <button type="button" className="btn" onClick={handleDownload}>{t('track.detail.print')}</button>
            <button type="button" className="btn" onClick={handleDownload}>{t('track.detail.download')}</button>
          </div>
        </div>
      )}

      {appealRejected && (
        <div className="card info-card">
          <div style={{ fontSize:20, fontWeight:700, marginBottom:8 }}>لم يتم قبول الطعن</div>
          <div style={{ marginBottom:12 }}>يرجى إعادة تقديم البلاغ من جديد مع معلومات أو أدلة إضافية.</div>
          <a href="/plainte" className="btn" style={{ textDecoration:'none' }}>الذهاب إلى واجهة التحقق (Verification)</a>
        </div>
      )}

      {showAppeal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'#fff', width:'min(720px, 92vw)', maxHeight:'90vh', overflow:'auto', borderRadius:10, padding:16 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <h3 style={{ margin:0 }}>طلب الطعن</h3>
              <button onClick={() => setShowAppeal(false)} aria-label="Close" style={{ width:32, height:32, borderRadius:9999, background:'#111827', color:'#fff', border:'none', cursor:'pointer' }}>×</button>
            </div>
            <form onSubmit={submitAppeal} style={{ marginTop:12, display:'grid', gap:12 }}>
              <div>
                <label style={{ display:'block', marginBottom:6 }}>رسالتك التوضيحية</label>
                <textarea value={appealMsg} onChange={e => setAppealMsg(e.target.value)} rows={5} style={{ width:'100%', padding:10, border:'1px solid #cbd5e1', borderRadius:8 }} placeholder="اكتب مبرراتك وشرحك للملف..."></textarea>
              </div>
              <div>
                <label style={{ display:'block', marginBottom:6 }}>إرفاق ملفات داعمة (صور أو PDF)</label>
                <input type="file" accept="image/*,application/pdf" multiple onChange={(e) => handleFiles(e.target.files)} />
                {appealFiles?.length > 0 && (
                  <ul style={{ marginTop:8 }}>
                    {appealFiles.map((f, i) => (
                      <li key={i} style={{ fontSize:13, color:'#334155' }}>{f.name}</li>
                    ))}
                  </ul>
                )}
              </div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                <button type="submit" className="btn" disabled={appealSubmitting}>
                  {appealSubmitting ? 'جارٍ إرسال الطعن...' : 'إرسال الطعن'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAppeal(false)}>إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuiviSignalements;
