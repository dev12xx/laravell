import React from 'react';
import { useLanguage } from '../context/LanguageContext.jsx';
import Hero from '../components/Hero.jsx';

const About = () => {
  const { t, lang } = useLanguage();
  const tr = (key, fallback) => {
    const v = t(key);
    return v === key ? fallback : v;
  };
  // TEMP debug: verify that Arabic keys resolve
  console.debug('[About] lang=', lang, {
    channelsTitle: t('about.channels.title'),
    channels1: t('about.channels.li1'),
    channels2: t('about.channels.li2'),
    channels3: t('about.channels.li3'),
    systemTitle: t('about.system.title'),
  });
  return (
    <div className="container">
      <Hero
        title={t('about.title')}
        subtitle={t('about.subtitle')}
        imageSrc="/anticorruption.png"
        imageAlt={t('about.title')}
      />

      <div className="form-container">
        <h3 className="step-title">{t('about.definition.title')}</h3>
        <p>{t('about.definition.p1')}</p>

        <h3 className="step-title">{t('about.forms.title')}</h3>
        <ul className="list-default">
          <li>{t('about.forms.li1')}</li>
          <li>{t('about.forms.li2')}</li>
          <li>{t('about.forms.li3')}</li>
          <li>{t('about.forms.li4')}</li>
        </ul>

        <h3 className="step-title">{tr('about.channels.title', lang === 'ar' ? 'قنوات التبليغ' : 'Canaux de signalement')}</h3>
        <ul className="list-default">
          <li>{tr('about.channels.li1', lang === 'ar' ? 'البوابة الإلكترونية الآمنة (مفضلة).' : 'Portail en ligne sécurisé (recommandé).')}</li>
          <li>{tr('about.channels.li2', lang === 'ar' ? 'قنوات داخلية مخصصة حسب السياسة.' : 'Canaux internes dédiés (selon la politique).')}</li>
          <li>{tr('about.channels.li3', lang === 'ar' ? 'قنوات إضافية حسب المتطلبات التنظيمية.' : 'Voies supplémentaires selon la réglementation.')}</li>
        </ul>

        <h3 className="step-title">{t('about.impacts.title')}</h3>
        <ul className="list-default">
          <li>{t('about.impacts.li1')}</li>
          <li>{t('about.impacts.li2')}</li>
          <li>{t('about.impacts.li3')}</li>
        </ul>

        <h2>{tr('about.system.title', lang === 'ar' ? 'ما هو هذا النظام؟' : "Qu'est-ce que ce système ?")}</h2>
        <p>{t('about.system.p1')}</p>
        <p>{t('about.system.p2')}</p>

        <h3 className="step-title">{t('about.un_day.title')}</h3>
        <p className="muted">{t('about.un_day.date')}</p>
        <p>{t('about.un_day.p1')}</p>
      </div>
    </div>
  );
};

export default About;
