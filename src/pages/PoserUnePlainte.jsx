import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import UserTypeSelector from '../components/UserTypeSelector';
import ClientForm from '../components/ClientForm';
import EmployeeForm from '../components/EmployeeForm';
import ExternalForm from '../components/ExternalForm';
import VerificationSteps from '../components/VerificationSteps.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';

const PoserUnePlainte = () => {
  const { t } = useLanguage();
  const [activeForm, setActiveForm] = useState(null);
  const [verified, setVerified] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState('');
  const location = useLocation();

  useEffect(() => {
    if (location?.state && location.state.scrollTo === 'verification') {
      setTimeout(() => {
        const formSection = document.querySelector('.form-container');
        if (formSection) {
          const rect = formSection.getBoundingClientRect();
          const offsetTop = window.pageYOffset + rect.top - 100; // scroll a bit higher
          window.scrollTo({ top: offsetTop, behavior: 'smooth' });
        }
      }, 0);
    }
  }, [location]);

  const handleUserTypeSelect = (userType) => {
    setActiveForm(userType);
    setTimeout(() => {
      const formSection = document.querySelector('.form-container');
      if (formSection) {
        formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const renderForm = () => {
    switch (activeForm) {
      case 'client':
        return <ClientForm prefillEmail={verifiedEmail} />;
      case 'employee':
        return <EmployeeForm prefillEmail={verifiedEmail} />;
      case 'external':
        return <ExternalForm prefillEmail={verifiedEmail} />;
      default:
        return null;
    }
  };

  return (
    <div className="container">
      <div id="main-content">
      {verified && (
        <UserTypeSelector
          activeForm={activeForm}
          onUserTypeSelect={handleUserTypeSelect}
        />
      )}
      <div className="form-container">
        {verified ? (
          activeForm ? (
            renderForm()
          ) : null
        ) : (
          <VerificationSteps
            onDone={({ email }) => {
              setVerifiedEmail(email || '');
              setVerified(true);
              setTimeout(() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }, 0);
            }}
            onCancel={() => setVerified(false)}
          />
        )}
      </div>
      </div>
    </div>
  );
};

export default PoserUnePlainte;
