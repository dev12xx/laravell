import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './css/Header.css';
import { useLanguage } from '../context/LanguageContext.jsx';

const Header = () => {
  const { lang, toggle, t } = useLanguage();
  const [open, setOpen] = useState(false);
  return (
    <header className="header">
      <div className="header-content">
        <a href="https://www.schb.dz/" target="_blank" rel="noopener noreferrer">
          <img 
            src="/Logo-Gica.png"  
            alt="SCHB Logo" 
            className="logo"
          />
        </a>
        <div className="header-text">
          <h1>{t('header.title')}</h1>
          <p>{t('header.subtitle')}</p>
        </div>
      </div>
      <div className="header-lang">
        <button type="button" className="lang-toggle" onClick={toggle}>
          {lang === 'fr' ? 'العربية' : 'Français'}
        </button>
      </div>
      <div className="header-actions">
        <Link className="header-link" to="/">{t('nav.home')}</Link>
        <Link className="header-link" to="/plainte" state={{ scrollTo: 'verification' }}>{t('nav.report')}</Link>
        <Link className="header-link" to="/suivi">{t('nav.track')}</Link>
        <Link className="header-link" to="/politique-anti-corruption">{t('nav.policy')}</Link>
        <Link className="header-link" to="/about">{t('nav.about')}</Link>
      </div>

      <button
        className={`hamburger ${open ? 'open' : ''}`}
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        onClick={() => setOpen(v => !v)}
      >
        <span />
        <span />
        <span />
      </button>

      {open && (
        <>
          <div className="mobile-overlay" onClick={() => setOpen(false)} />
          <nav className="mobile-menu" role="dialog" aria-modal="true">
            <div className="mobile-menu-header">
              <button aria-label="Close" className="mobile-close" onClick={() => setOpen(false)}>×</button>
            </div>
            <div className="mobile-links" onClick={() => setOpen(false)}>
              <Link className="mobile-link" to="/">
                <span className="mobile-link-icon" aria-hidden>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3 2 12h3v8h6v-5h2v5h6v-8h3L12 3Z"/></svg>
                </span>
                {t('nav.home')}
              </Link>
              <Link className="mobile-link" to="/plainte" state={{ scrollTo: 'verification' }}>
                <span className="mobile-link-icon" aria-hidden>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 2h12a2 2 0 0 1 2 2v14l-4-2-4 2-4-2-4 2V4a2 2 0 0 1 2-2Zm2 5h8v2H8V7Zm0 4h8v2H8v-2Z"/></svg>
                </span>
                {t('nav.report')}
              </Link>
              <Link className="mobile-link" to="/suivi">
                <span className="mobile-link-icon" aria-hidden>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M3 4h18v2H3V4Zm0 7h12v2H3v-2Zm0 7h18v2H3v-2Z"/></svg>
                </span>
                {t('nav.track')}
              </Link>
              <Link className="mobile-link" to="/politique-anti-corruption">
                <span className="mobile-link-icon" aria-hidden>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2 4 5v6c0 5 3.4 9.7 8 11 4.6-1.3 8-6 8-11V5l-8-3Zm0 18c-3.3-1.1-6-5-6-9.1V6.2l6-2.2 6 2.2v4.7C18 15 15.3 18.9 12 20Z"/></svg>
                </span>
                {t('nav.policy')}
              </Link>
              <Link className="mobile-link" to="/about">
                <span className="mobile-link-icon" aria-hidden>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm1 15h-2v-6h2Zm0-8h-2V7h2Z"/></svg>
                </span>
                {t('nav.about')}
              </Link>
            </div>
            <div className="mobile-lang">
              <button type="button" className="lang-toggle" onClick={() => { toggle(); }}>
                {lang === 'fr' ? 'العربية' : 'Français'}
              </button>
            </div>
          </nav>
        </>
      )}
    </header>
  );
};

export default Header;