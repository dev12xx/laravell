import React, { useState } from 'react';
import './css/ReportForm.css';
import SuccessModal from './SuccessModal.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';

const EmployeeForm = ({ prefillEmail = '' }) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    employeeId: '',
    email: prefillEmail,
    department: '',
    position: '',
    supervisor: '',
    incidentDate: '',
    location: '',
    personsInvolved: '',
    description: '',
    evidence: null,
    requestFollowUp: false
  });

  const [successOpen, setSuccessOpen] = useState(false);
  const [submitted, setSubmitted] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'file' ? files[0] : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Employee Form Data:', formData);
    setSubmitted(formData);
    setSuccessOpen(true);

    setTimeout(() => {
      const total = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight
      );
      const middle = Math.max(0, (total - window.innerHeight) / 2);
      window.scrollTo({ top: middle, behavior: 'smooth' });
    }, 0);
  };

  const minIncidentDate = '2000-01-01T00:00';
  const maxIncidentDate = `${new Date().getFullYear()}-12-31T23:59`;

  return (
    <form className="report-form" onSubmit={handleSubmit}>
      <h2>{t('employee.title')}</h2>
      
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
      
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="employeeId">{t('employee.matricule')}</label>
          <input
            type="text"
            id="employeeId"
            name="employeeId"
            value={formData.employeeId}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="department">{t('employee.department')}</label>
          <select
            id="department"
            name="department"
            value={formData.department}
            onChange={handleChange}
            required
          >
            <option value="">{t('employee.department.opt')}</option>
            <option value="production">{t('dept.production')}</option>
            <option value="qualite">{t('dept.qualite')}</option>
            <option value="maintenance">{t('dept.maintenance')}</option>
            <option value="rh">{t('dept.rh')}</option>
            <option value="finance">{t('dept.finance')}</option>
            <option value="commercial">{t('dept.commercial')}</option>
            <option value="achat">{t('dept.achat')}</option>
            <option value="autre">{t('dept.autre')}</option>
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="position">{t('employee.position')}</label>
          <input
            type="text"
            id="position"
            name="position"
            value={formData.position}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="supervisor">{t('employee.supervisor')}</label>
          <input
            type="text"
            id="supervisor"
            name="supervisor"
            value={formData.supervisor}
            onChange={handleChange}
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
          <label htmlFor="location">{t('employee.location')}</label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="personsInvolved">{t('employee.persons')}</label>
        <input
          type="text"
          id="personsInvolved"
          name="personsInvolved"
          value={formData.personsInvolved}
          onChange={handleChange}
          placeholder={t('employee.persons.ph')}
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
          placeholder={t('employee.description.ph')}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="evidence">{t('employee.evidence')}</label>
        <input
          type="file"
          id="evidence"
          name="evidence"
          onChange={handleChange}
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
        />
      </div>

      <div className="form-checkboxes">
        <div className="checkbox-group">
          <input
            type="checkbox"
            id="requestFollowUp"
            name="requestFollowUp"
            checked={formData.requestFollowUp}
            onChange={handleChange}
          />
          <label htmlFor="requestFollowUp">{t('employee.followup')}</label>
        </div>
      </div>

      <button type="submit" className="submit-btn">{t('employee.submit')}</button>
      <SuccessModal open={successOpen} onClose={() => setSuccessOpen(false)} data={submitted || {}} reportType="employee" />
    </form>
  );
};

export default EmployeeForm;