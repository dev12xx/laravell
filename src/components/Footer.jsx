import React from 'react';
import './css/Footer.css';
import { useLanguage } from '../context/LanguageContext.jsx';

function Footer() {
  const { t, dir } = useLanguage();
  return (
    <footer className="footer">
      <div className="footer-container">
        <a
          href="https://www.facebook.com/CIMENTERIE.HAMMA.BOUZIANE/"
          target="_blank"
          rel="noreferrer"
          className={`footer-facebook-button ${dir === 'rtl' ? 'footer-facebook-button-rtl' : 'footer-facebook-button-ltr'}`}
        >
          f
        </a>
        <h3 className="footer-heading">{t('footer.contacts')}</h3>

        <div className="contact-row">
          <div className="contact-name">{t('footer.dg')}</div>
          <div className="contact-values">
            <div className="contact-line">
              <span className="contact-label">{t('footer.tel')}</span>
              <span className="contact-value">213 31 60 65 43</span>
              <span className="contact-sep" />
              <span className="contact-label">{t('footer.fax')}</span>
              <span className="contact-value">213 31 60 65 39</span>
            </div>
          </div>
        </div>
        <div className="contact-divider" />

        <div className="contact-row">
          <div className="contact-name">{t('footer.up')}</div>
          <div className="contact-values">
            <div className="contact-line">
              <span className="contact-label">{t('footer.tel')}</span>
              <span className="contact-value">213 31 90 68 45</span>
              <span className="contact-sep" />
              <span className="contact-label">{t('footer.fax')}</span>
              <span className="contact-value">213 31 90 66 23</span>
            </div>
          </div>
        </div>
        <div className="contact-divider" />

        <div className="contact-row">
          <div className="contact-name">{t('footer.ucc')}</div>
          <div className="contact-values">
            <div className="contact-line">
              <span className="contact-label">{t('footer.tel')}</span>
              <span className="contact-value">213 31 86 40 40</span>
              <span className="contact-sep" />
              <span className="contact-label">{t('footer.fax')}</span>
              <span className="contact-value">213 31 86 40 03</span>
            </div>
          </div>
        </div>
        <div className="contact-divider" />

        <div className="contact-row">
          <div className="contact-name">{t('footer.uca')}</div>
          <div className="contact-values">
            <div className="contact-line">
              <span className="contact-label">{t('footer.tel')}</span>
              <span className="contact-value">213 31 82 24 10</span>
              <span className="contact-sep" />
              <span className="contact-label">{t('footer.fax')}</span>
              <span className="contact-value">213 31 82 24 10</span>
            </div>
          </div>
        </div>
        <div className="contact-divider" />

        <div className="contact-row">
          <div className="contact-name">{t('footer.ucs')}</div>
          <div className="contact-values">
            <div className="contact-line">
              <span className="contact-label">{t('footer.tel')}</span>
              <span className="contact-value">213 31 75 26 63</span>
              <span className="contact-sep" />
              <span className="contact-label">{t('footer.fax')}</span>
              <span className="contact-value">213 31 75 26 63</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
