import React from 'react';
import './css/PolitiqueAntiCorruption.css';
import { useLanguage } from '../context/LanguageContext.jsx';

const PolitiqueAntiCorruption = () => {
  const { t } = useLanguage();
  return (
    <div className="container">
      <div className="form-container">
        <h1 className="policy-main-title">{t('policy.title')}</h1>
        <p className="policy-intro">{t('policy.intro')}</p>

        <div className="policy-image-wrapper">
          <a href="/Anti-corruption-001.jpg">
            <img
              src="/Anti-corruption-001.jpg"
              alt={t('policy.title')}
              className="policy-image"
              style={{ cursor: 'pointer' }}
            />
          </a>
        </div>

        <div className="policy-section">
          <h2 className="section-title">{t('policy.sectionTitle')}</h2>
          <p className="policy-text">{t('policy.p1')}</p>
        </div>

        <div className="policy-section">
          <h3 className="section-subtitle">{t('policy.axesTitle')}</h3>
          <ul className="policy-list">
            <li>{t('policy.axes.li1')}</li>
            <li>{t('policy.axes.li2')}</li>
            <li>{t('policy.axes.li3')}</li>
          </ul>
        </div>

        <div className="policy-section">
          <h3 className="section-subtitle">{t('policy.commitmentsTitle')}</h3>
          <ul className="policy-list">
            <li>{t('policy.commitments.li1')}</li>
            <li>{t('policy.commitments.li2')}</li>
            <li>{t('policy.commitments.li3')}</li>
            <li>{t('policy.commitments.li4')}</li>
            <li>{t('policy.commitments.li5')}</li>
          </ul>
        </div>

        <div className="policy-section">
          <h3 className="section-subtitle">{t('policy.responsibilitiesTitle')}</h3>
          <ul className="policy-list">
            <li>{t('policy.responsibilities.li1')}</li>
            <li>{t('policy.responsibilities.li2')}</li>
            <li>{t('policy.responsibilities.li3')}</li>
            <li>{t('policy.responsibilities.li4')}</li>
          </ul>
        </div>

        <div className="signature-section">
          <p className="signature">{t('policy.signature')}</p>
          <p className="position">{t('policy.position')}</p>
        </div>
      </div>
    </div>
  );
};

export default PolitiqueAntiCorruption;

