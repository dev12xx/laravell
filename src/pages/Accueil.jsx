import React from 'react';
import './css/Accueil.css';
import { useLanguage } from '../context/LanguageContext.jsx';
import Hero from '../components/Hero.jsx';

const Accueil = () => {
  const { t } = useLanguage();
  return (
    <div className="container">
      <Hero
        title={t('home.title')}
        subtitle={t('home.welcome')}
        imageSrc="/anticorruption.png"
        imageAlt="Anti-Corruption"
      />

      <div className="form-container">
        <div className="policy-box">
          <p>
            {t('home.goal')}
          </p>
        </div>

        <h3 className="step-title">{t('home.when.title')}</h3>
        <ul className="list-default">
          <li>{t('home.when.li1')}</li>
          <li>{t('home.when.li2')}</li>
          <li>{t('home.when.li3')}</li>
        </ul>

        <h3 className="step-title">{t('home.guarantees.title')}</h3>
        <ul className="list-default-lg">
          <li>{t('home.guarantees.li1')}</li>
          <li>{t('home.guarantees.li2')}</li>
          <li>{t('home.guarantees.li3')}</li>
        </ul>
      </div>
    </div>
  );
};

export default Accueil;

