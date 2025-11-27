import React from 'react';
import './css/Hero.css';

const Hero = ({
  title,
  subtitle,
  imageSrc,
  imageAlt = '',
  primaryCta,
  secondaryCta,
}) => {
  const hasImage = Boolean(imageSrc);
  return (
    <section className={`hero-section${hasImage ? '' : ' no-image'}`}>
      <div className="hero-content">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
        <div className="actions-row">
          {primaryCta && (
            <a className="btn btn-primary" href={primaryCta.href}>
              {primaryCta.label}
            </a>
          )}
          {secondaryCta && (
            <a className="btn btn-secondary" href={secondaryCta.href}>
              {secondaryCta.label}
            </a>
          )}
        </div>
      </div>

      {hasImage && (
        <div className="hero-graphic">
          <img src={imageSrc} alt={imageAlt} className="scales-img" />
        </div>
      )}
    </section>
  );
};

export default Hero;
