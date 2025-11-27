import React, { useEffect, useMemo, useRef, useState } from 'react';
import './css/SuccessModal.css';
import { useLanguage } from '../context/LanguageContext.jsx';
import { QRCodeCanvas } from 'qrcode.react';
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

function generateTrackingId() {
  const now = new Date();
  const year = now.getFullYear();
  const storeKey = `rpt-seq-${year}`;
  const current = Number(localStorage.getItem(storeKey) || '0') + 1;
  localStorage.setItem(storeKey, String(current));
  return `RPT-${year}-${String(current).padStart(3, '0')}`;
}

function formatDZ(date) {
  try {
    return new Intl.DateTimeFormat('fr-DZ', {
      timeZone: 'Africa/Algiers',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    }).format(date);
  } catch {
    return date.toLocaleString();
  }
}

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

const SuccessModal = ({ open, onClose, data = {}, reportType = 'unknown' }) => {
  const { t } = useLanguage();
  const [trackingId, setTrackingId] = useState('');
  const [savedAt, setSavedAt] = useState('');
  const qrRef = useRef(null);

  const qrValue = useMemo(() => {
    const base = window.location.origin;
    return `${base}/suivi?id=${encodeURIComponent(trackingId)}`;
  }, [trackingId]);

  useEffect(() => {
    if (!open) return;
    const id = generateTrackingId();
    const now = new Date();
    const saved = formatDZ(now);

    const existing = JSON.parse(localStorage.getItem('reports') || '{}');
    existing[id] = {
      id,
      type: reportType,
      createdAt: now.toISOString(),
      createdAtDZ: saved,
      data,
      status: 'submitted'
    };
    localStorage.setItem('reports', JSON.stringify(existing));

    syncReportToBackend(id, existing[id]);

    setTrackingId(id);
    setSavedAt(saved);
  }, [open, reportType, data]);

  if (!open) return null;

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(trackingId); } catch {}
  };

  const goToTracking = () => {
    window.location.href = `/suivi?id=${encodeURIComponent(trackingId)}`;
  };

  const downloadQR = () => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `${trackingId}.png`;
    link.click();
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal">
        <h3 className="step-title">{t('success.title')}</h3>
        <div className="policy-box">
          <p>{t('success.p1')}</p>
          <p>{t('success.p2')}</p>
        </div>

        <div className="policy-box" style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '0.5rem', fontWeight: 600 }}>{t('success.trackCode')}</div>
          <div style={{ fontSize: '1.25rem', letterSpacing: '0.5px' }}>{trackingId}</div>
          <div style={{ color: '#64748b', marginTop: '0.25rem' }}>{t('success.savedAt')} {savedAt}</div>
          <div ref={qrRef} style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center' }}>
            {trackingId && <QRCodeCanvas value={qrValue} size={160} includeMargin />}
          </div>
          <div className="actions-row" style={{ marginTop: '0.75rem', justifyContent: 'center' }}>
            <button className="btn btn-secondary" type="button" onClick={handleCopy}>{t('success.copyCode')}</button>
            <button className="btn btn-secondary" type="button" onClick={downloadQR}>{t('success.downloadQR')}</button>
            <button className="btn btn-primary" type="button" onClick={goToTracking}>{t('success.openTracking')}</button>
          </div>
        </div>

        <div className="actions-row">
          <button
            type="button"
            className="btn btn-primary"
            onClick={goToTracking}
          >
            {t('success.backHome')}
          </button>
          <button className="btn btn-secondary" onClick={onClose}>{t('success.close')}</button>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;
