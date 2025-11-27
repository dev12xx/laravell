import React, { useRef, useState } from 'react';
import './css/ReportForm.css';
import SuccessModal from './SuccessModal.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';

const ExternalForm = ({ prefillEmail = '' }) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    fullName: '',
    email: prefillEmail,
    phone: '',
    incidentDate: '',
    schbDepartment: '',
    personsInvolved: '',
    description: '',
    evidence: null
  });

  const [successOpen, setSuccessOpen] = useState(false);
  const [submitted, setSubmitted] = useState(null);
  const formRef = useRef(null);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'file' ? files[0] : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('External Form Data:', formData);
    setSubmitted(formData);
    setSuccessOpen(true);

    setTimeout(() => {
      if (formRef.current) {
        const rect = formRef.current.getBoundingClientRect();
        const target = window.scrollY + rect.top + (rect.height / 2) - (window.innerHeight / 2);
        window.scrollTo({ top: Math.max(0, target), behavior: 'smooth' });
      }
    }, 0);
  };

  const minIncidentDate = '2000-01-01T00:00';
  const maxIncidentDate = `${new Date().getFullYear()}-12-31T23:59`;

  return (
    <form ref={formRef} className="report-form" onSubmit={handleSubmit}>
      <h2>{t('external.title')}</h2>
      
      <div className="form-group">
        <label htmlFor="fullName">{t('external.fullName')}</label>
        <input
          type="text"
          id="fullName"
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="email">{t('common.email')}</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            readOnly
            className="non-interactive-email"
            style={{
              cursor: 'default',
              backgroundColor: '#f5f5f5',
              border: '1px solid #ddd',
              color: '#666'
            }}
            onClick={(e) => e.preventDefault()}
            onFocus={(e) => e.target.blur()}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="phone">{t('common.phone')}</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={10}
            onChange={(e) => {
              e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
              handleChange(e);
            }}
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="incidentDate">{t('common.incidentDateTime')}</label>
          <input
            type="datetime-local"
            id="incidentDate"
            name="incidentDate"
            value={formData.incidentDate}
            onChange={handleChange}
            min={minIncidentDate}
            max={maxIncidentDate}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="schbDepartment">{t('external.incidentDept')}</label>
          <select
            id="schbDepartment"
            name="schbDepartment"
            value={formData.schbDepartment}
            onChange={handleChange}
            required
          >
            <option value="">{t('external.incidentDept.opt')}</option>
            <option value="achat">{t('dept.achat')}</option>
            <option value="commercial">{t('dept.commercial')}</option>
            <option value="logistique">{t('dept.logistique')}</option>
            <option value="technique">{t('dept.technique')}</option>
            <option value="rh">{t('dept.rh')}</option>
            <option value="direction">{t('dept.direction')}</option>
            <option value="autre">{t('dept.autre')}</option>
          </select>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="personsInvolved">{t('external.persons')}</label>
        <input
          type="text"
          id="personsInvolved"
          name="personsInvolved"
          value={formData.personsInvolved}
          onChange={handleChange}
          placeholder={t('external.persons.ph')}
        />
      </div>

      <div className="form-group">
        <label htmlFor="description">{t('common.description')}</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows="5"
          placeholder={t('external.description.ph')}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="evidence">{t('external.evidence')}</label>
        <input
          type="file"
          id="evidence"
          name="evidence"
          onChange={handleChange}
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.mp3,.wav"
        />
      </div>

      

      <button type="submit" className="submit-btn">{t('external.submit')}</button>
      <SuccessModal open={successOpen} onClose={() => setSuccessOpen(false)} data={submitted || {}} reportType="external" />
    </form>
  );
};

export default ExternalForm;