import React, { useMemo, useState } from 'react';
import { useLanguage } from '../context/LanguageContext.jsx';
import './css/VerificationSteps.css';
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

const generateCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();

const VerificationSteps = ({ onDone, onCancel }) => {
  const { t } = useLanguage();
  const Icon = ({ name }) => {
    const common = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'currentColor', 'aria-hidden': true };
    if (name === 'privacy') {
      return (
        <svg {...common}><path d="M12 2 4 5v6c0 5 3.4 9.7 8 11 4.6-1.3 8-6 8-11V5l-8-3Zm0 18c-3.3-1.1-6-5-6-9.1V6.2l6-2.2 6 2.2v4.7C18 15 15.3 18.9 12 20Zm0-11a3 3 0 1 0 3 3 3 3 0 0 0-3-3Z"/></svg>
      );
    }
    if (name === 'email') {
      return (
        <svg {...common}><path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 4-8 5L4 8V6l8 5 8-5Z"/></svg>
      );
    }
    return (
      <svg {...common}><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm-1 15-4-4 1.4-1.4L11 13.2l4.6-4.6L17 10l-6 7Z"/></svg>
    );
  };
  const [step, setStep] = useState(0);
  const [confirmed, setConfirmed] = useState(false);
  const [email, setEmail] = useState('');
  const [sentCode, setSentCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const captcha = useMemo(() => generateCode(), []);
  const [captchaInput, setCaptchaInput] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [sending, setSending] = useState(false);

  const handleSendCode = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(t('verify.error.email'));
      return;
    }

    setSending(true);
    try {
      const res = await fetch(`${API_BASE}/verification/send-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json && json.code) {
        setSentCode(String(json.code).trim().toUpperCase());
      }
      setInfo(t('verify.info.sent'));
      setStep(2);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to send verification code', err);
      setError(t('verify.error.send') || 'تعذر إرسال رمز التحقق، حاول مرة أخرى لاحقًا.');
    } finally {
      setSending(false);
    }
  };

  const handleVerify = (e) => {
    e.preventDefault();
    setError('');
    if (inputCode.trim().toUpperCase() !== sentCode.trim().toUpperCase()) {
      setError(t('verify.error.code'));
      return;
    }
    if (captchaInput.trim().toUpperCase() !== captcha.trim().toUpperCase()) {
      setError(t('verify.error.captcha'));
      return;
    }
    onDone?.({ email });
  };

  return (
    <div className="report-form">
      <h2>{t('verify.title')}</h2>

      <div className="steps-indicator">
        <div className={`step-dot ${step >= 0 ? 'active' : ''}`} />
        <div className={`step-line ${step >= 1 ? 'active' : ''}`} />
        <div className={`step-dot ${step >= 1 ? 'active' : ''}`} />
        <div className={`step-line ${step >= 2 ? 'active' : ''}`} />
        <div className={`step-dot ${step >= 2 ? 'active' : ''}`} />
      </div>

      {step === 0 && (
        <div>
          <h3 className="step-title"><Icon name="privacy" />{t('verify.step0.title')}</h3>
          <div className="policy-box">
            <p>{t('verify.step0.p1')}</p>
            <p>{t('verify.step0.p2')}</p>
            <p>{t('verify.step0.p3')}</p>
          </div>
          <div className="form-group checkbox-group">
            <input
              type="checkbox"
              id="confirmPolicy"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            <label htmlFor="confirmPolicy">{t('verify.confirm')}</label>
          </div>
          <div className="actions-row">
            <button
              type="button"
              className="btn btn-primary"
              disabled={!confirmed}
              onClick={() => setStep(1)}
            >
              {t('verify.continue')}
            </button>
          </div>
        </div>
      )}

      {step === 1 && (
        <form onSubmit={handleSendCode}>
          <h3 className="step-title"><Icon name="email" />{t('verify.step1.title')}</h3>
          <p className="muted">{t('verify.step1.help')}</p>
          {error && <div className="alert error">{error}</div>}
          {info && <div className="alert info">{info}</div>}
          <div className="form-group">
            <label htmlFor="email">{t('verify.email.label')}</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="actions-row">
            <button type="submit" className="btn btn-primary" disabled={sending}>
              {sending ? (t('sending') || 'جارٍ إرسال الرمز...') : t('verify.send.code')}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => setStep(0)}>{t('verify.back')}</button>
          </div>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleVerify}>
          <h3 className="step-title"><Icon name="check" />{t('verify.step2.title')}</h3>
          {error && <div className="alert error">{error}</div>}
          <div className="form-group">
            <label htmlFor="code">{t('verify.code.label')}</label>
            <input
              id="code"
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              required
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>{t('verify.captcha.label')}</label>
              <div className="captcha-box">{captcha}</div>
            </div>
            <div className="form-group">
              <label htmlFor="captchaInput">{t('verify.captcha.input')}</label>
              <input
                id="captchaInput"
                type="text"
                value={captchaInput}
                onChange={(e) => setCaptchaInput(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="actions-row">
            <button type="submit" className="btn btn-primary">{t('verify.submit')}</button>
            <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>{t('verify.back')}</button>
          </div>
        </form>
      )}
    </div>
  );
};

export default VerificationSteps;
