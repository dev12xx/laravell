import React from 'react';
import './css/UserTypeSelector.css';
import { useLanguage } from '../context/LanguageContext.jsx';

const UserTypeSelector = ({ activeForm, onUserTypeSelect }) => {
  const { t } = useLanguage();
  const userTypes = [
    { id: 'client', label: t('userType.client'), description: t('userType.client.desc') },
    { id: 'employee', label: t('userType.employee'), description: t('userType.employee.desc') },
    { id: 'external', label: t('userType.external'), description: t('userType.external.desc') }
  ];

  const Icon = ({ type }) => {
    const common = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'currentColor', 'aria-hidden': true };
    if (type === 'client') {
      return (
        <svg {...common}>
          <path d="M10 4h4a2 2 0 0 1 2 2v2h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2h2V6a2 2 0 0 1 2-2Zm4 4V6h-4v2h4Z"/>
        </svg>
      );
    }
    if (type === 'employee') {
      return (
        <svg {...common}>
          <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm-7 7a7 7 0 0 1 14 0v1H5Z"/>
        </svg>
      );
    }
    return (
      <svg {...common}>
        <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm6.92 6h-3.24a14.6 14.6 0 0 0-1.11-3.33A8.02 8.02 0 0 1 18.92 8ZM12 4c.7 1.02 1.24 2.6 1.55 4H10.45C10.76 6.6 11.3 5.02 12 4ZM5.08 8h3.24a14.6 14.6 0 0 1 1.11-3.33A8.02 8.02 0 0 0 5.08 8Zm0 8a8.02 8.02 0 0 0 4.35 3.33A14.6 14.6 0 0 1 8.32 16H5.08Zm5.37 0h3.1c-.31 1.4-.85 2.98-1.55 4-.7-1.02-1.24-2.6-1.55-4Zm5.55 0h3.24A8.02 8.02 0 0 1 14.95 19.33 14.6 14.6 0 0 0 16 16Zm1.84-4a13.9 13.9 0 0 1-.19 2H6.35a13.9 13.9 0 0 1-.19-2 13.9 13.9 0 0 1 .19-2h11.3c.12.65.19 1.32.19 2Z"/>
      </svg>
    );
  };

  return (
    <div className="user-type-selector">
      <h2>{t('userType.title')}</h2>
      <div className="selector-buttons">
        {userTypes.map((type) => (
          <button
            key={type.id}
            className={`selector-btn ${activeForm === type.id ? 'active' : ''}`}
            onClick={() => onUserTypeSelect(type.id)}
          >
          <span className="btn-icon" aria-hidden>
            <Icon type={type.id} />
          </span>
          <span className="btn-label">{type.label}</span>
            <span className="btn-description">{type.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default UserTypeSelector;