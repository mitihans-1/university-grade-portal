import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../utils/api';

const ParentRegistration = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    studentId: '',
    relationship: '',
    agreeToTerms: false
  });
  const [errors, setErrors] = useState({});
  const [studentFound, setStudentFound] = useState(null);
  const [checking, setChecking] = useState(false);
  // State for focused fields
  const [focused, setFocused] = useState({
    fullName: false,
    email: false,
    phone: false,
    password: false,
    confirmPassword: false
  });

  const handleFocus = (e) => {
    setFocused({ ...focused, [e.target.name]: true });
  };

  const handleBlur = (e) => {
    setFocused({ ...focused, [e.target.name]: false });
  };

  const handleChange = (e) => {
    // If name is fullName, update both state properties to keep them in sync if needed, or just update form data
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const checkStudentId = async () => {
    if (!formData.studentId) return;

    setChecking(true);
    setErrors(prev => ({ ...prev, studentId: null }));

    try {
      const result = await api.getStudentById(formData.studentId);
      if (result && !result.msg) {
        setStudentFound(result);
      } else {
        setStudentFound(null);
        setErrors(prev => ({ ...prev, studentId: t('studentNotFound') }));
      }
    } catch (error) {
      console.error('Error verifying student:', error);
      setErrors(prev => ({ ...prev, studentId: t('verificationError') }));
    } finally {
      setChecking(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName) newErrors.fullName = t('fullNameRequired');

    if (formData.email) {
      if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email.trim().toLowerCase())) {
        newErrors.email = t('validEmailRequired');
      }
    }

    if (!formData.password) {
      newErrors.password = t('passwordRequired');
    } else {
      // Password validation: at least 6 characters, 1 letter, 1 number, 1 special character
      if (formData.password.length < 6) {
        newErrors.password = t('passwordLengthRequired');
      } else {
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{6,}$/;
        if (!passwordRegex.test(formData.password)) {
          newErrors.password = 'Password must contain at least 1 letter, 1 number, and 1 special character.';
        }
      }
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('passwordsDoNotMatch');
    }

    if (!formData.studentId) newErrors.studentId = t('studentIdRequired');
    if (!formData.relationship) newErrors.relationship = t('relationshipRequired');
    if (!formData.agreeToTerms) newErrors.agreeToTerms = t('agreeToTermsRequired');

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();

    // Client-side Password Validation
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{6,}$/;
    if (!passwordRegex.test(formData.password)) {
      if (!validationErrors.password) {
        validationErrors.password = 'Password must contain at least 1 letter, 1 number, and 1 special character.';
        setErrors(validationErrors);
        alert('Password validation failed: ' + validationErrors.password); // Add user visible feedback
        return;
      }
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      // Construct a readable error message for the user
      const errorMsg = Object.values(validationErrors).join('\n');
      alert('Please correct the following errors:\n' + errorMsg);
      return;
    }

    try {
      const parentData = {
        name: formData.fullName,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        studentId: formData.studentId,
        relationship: formData.relationship
      };

      const result = await api.registerParent(parentData);

      if (result.msg && !result.error) {
        alert(result.msg + (result.generatedEmail ? '\n\nYour login email: ' + result.generatedEmail : ''));
        navigate('/');
      } else if (result.token && result.user) {
        if (result.generatedEmail) {
          alert(
            t('parentRegistrationSuccessWithoutEmail') + '\n\n' +
            'Your login email: ' + result.generatedEmail + '\n' +
            'Please save this email for future logins!'
          );
        } else if (formData.email) {
          alert(t('parentRegistrationSuccessWithEmail'));
        } else {
          alert(t('parentRegistrationSuccessWithoutEmail'));
        }
        navigate('/');
      } else {
        alert(result.msg || t('parentRegistrationError'));
      }
    } catch (error) {
      console.error('Parent registration error:', error);
      alert(t('parentRegistrationError'));
    }
  };

  return (
    <div className="auth-page-container fade-in">
      {/* Floating Background Blobs */}
      <div className="blob blob-1"></div>
      <div className="blob blob-2"></div>
      <div className="blob blob-3"></div>

      <div className="auth-card" style={{ maxWidth: '600px' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{
            width: '60px',
            height: '60px',
            background: 'linear-gradient(135deg, #2e7d32, #66bb6a)',
            color: 'white',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '30px',
            margin: '0 auto 15px',
            boxShadow: '0 4px 15px rgba(46, 125, 50, 0.3)'
          }}>
            👨‍👩‍👧‍👦
          </div>
          <h2 className="auth-title" style={{ fontSize: '1.8rem', background: 'linear-gradient(45deg, #2e7d32, #66bb6a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{t('parentRegistration')}</h2>
          <p className="auth-subtitle">
            {t('registerAsParentToMonitorAcademicProgress')}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modern-input-group">
            <label className="modern-input-label">
              {t('yourFullName')} *
            </label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              className="modern-input"
              style={{
                border: `1px solid ${errors.fullName ? '#f44336' : '#e2e8f0'}`,
              }}
              placeholder={t('fullNamePlaceholder')}
              autoComplete="off"
            />
            {errors.fullName && <small style={{ color: '#f44336' }}>{t('fullNameRequired')}</small>}
          </div>


          <div className="modern-input-group">
            <label className="modern-input-label">
              {t('yourEmailOptional')}
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              className="modern-input"
              style={{
                border: `1px solid ${errors.email ? '#f44336' : '#e2e8f0'}`,
              }}
              placeholder={t('emailPlaceholder')}
              autoComplete="off"
            />
            {focused.email && (
              <div style={{ fontSize: '12px', color: '#2e7d32', marginTop: '5px' }}>
                ℹ️ Must be unique if provided. Leave blank to auto-generate.
              </div>
            )}
            {errors.email && <small style={{ color: '#f44336' }}>{t('validEmailRequiredOrLeaveEmpty')}</small>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div className="modern-input-group">
              <label className="modern-input-label">
                {t('password')} *
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                className="modern-input"
                style={{
                  border: `1px solid ${errors.password ? '#f44336' : '#e2e8f0'}`,
                }}
                placeholder={t('passwordPlaceholder')}
                autoComplete="new-password"
              />
              {focused.password && (
                <div style={{ fontSize: '11px', color: '#2e7d32', marginTop: '5px' }}>
                  ℹ️ Min 6 chars, 1 letter, 1 number, 1 special char.
                </div>
              )}
              {errors.password && <small style={{ color: '#f44336' }}>{t('passwordLengthRequired')}</small>}
            </div>

            <div className="modern-input-group">
              <label className="modern-input-label">
                {t('confirmPassword')} *
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                className="modern-input"
                style={{
                  border: `1px solid ${errors.confirmPassword ? '#f44336' : '#e2e8f0'}`,
                }}
                placeholder={t('confirmPasswordPlaceholder')}
                autoComplete="new-password"
              />
              {errors.confirmPassword && <small style={{ color: '#f44336' }}>{t('passwordsDoNotMatch')}</small>}
            </div>
          </div>



          <div className="modern-input-group">
            <label className="modern-input-label">
              {t('childStudentId')} *
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                value={formData.studentId}
                onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                onBlur={checkStudentId}
                className="modern-input"
                style={{
                  border: `1px solid ${errors.studentId ? '#f44336' : studentFound ? '#4caf50' : '#e2e8f0'}`,
                  marginBottom: 0
                }}
                placeholder={t('studentIdPlaceholder')}
                autoComplete="off"
              />
              <button
                type="button"
                onClick={checkStudentId}
                disabled={checking}
                style={{
                  padding: '10px 15px',
                  backgroundColor: checking ? '#ccc' : '#1976d2',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: checking ? 'not-allowed' : 'pointer',
                  fontWeight: '600'
                }}
              >
                {checking ? '⏳...' : t('verify')}
              </button>
            </div>
            {errors.studentId && <small style={{ color: '#f44336', display: 'block', marginTop: '5px' }}>{errors.studentId}</small>}

            {studentFound && (
              <div style={{
                marginTop: '10px',
                padding: '12px',
                backgroundColor: '#f0fdf4',
                borderRadius: '8px',
                border: '1px solid #4caf50'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ color: '#2e7d32' }}>✅ {t('studentVerified')}</strong>
                    <p style={{ margin: '5px 0 0 0', color: '#334155', fontSize: '0.9rem' }}>
                      {studentFound.name} • {studentFound.department} • {t('year')} {studentFound.year}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="modern-input-group">
            <label className="modern-input-label">
              {t('relationshipToStudent')} *
            </label>
            <select
              value={formData.relationship}
              onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
              className="modern-input"
              style={{
                border: `1px solid ${errors.relationship ? '#f44336' : '#e2e8f0'}`,
              }}
            >
              <option value="">{t('selectRelationship')}</option>
              <option value={t('father')}>{t('father')}</option>
              <option value={t('mother')}>{t('mother')}</option>
              <option value={t('guardian')}>{t('guardian')}</option>
              <option value={t('otherRelative')}>{t('otherRelative')}</option>
            </select>
            {errors.relationship && <small style={{ color: '#f44336' }}>{errors.relationship}</small>}
          </div>

          <div style={{ marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="checkbox"
              checked={formData.agreeToTerms}
              onChange={(e) => setFormData({ ...formData, agreeToTerms: e.target.checked })}
              style={{ width: '18px', height: '18px', cursor: 'pointer', margin: 0 }}
            />
            <div>
              <span style={{ fontSize: '14px', color: '#64748b' }}>
                {t('parentConfirmationMessage')}
              </span>
              {errors.agreeToTerms && <div style={{ color: '#f44336', fontSize: '12px', marginTop: '2px' }}>{t('agreeToTermsRequired')}</div>}
            </div>
          </div>

          <button
            type="submit"
            className="modern-btn"
            style={{
              background: 'linear-gradient(to right, #2e7d32, #43a047)',
              cursor: 'pointer',
              padding: '15px'
            }}
          >
            {t('registerAsParent')}
          </button>

          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <p style={{ color: '#64748b' }}>
              {t('alreadyHaveAccount')}{' '}
              <Link to="/" style={{ color: '#1976d2', textDecoration: 'none', fontWeight: '600' }}>
                {t('loginHere')}
              </Link>
            </p>
            <p style={{ color: '#64748b', fontSize: '14px', marginTop: '5px' }}>
              {t('students')}: <Link to="/student/register" style={{ color: '#1976d2', textDecoration: 'none', fontWeight: '500' }}>
                {t('registerAsStudent')}
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ParentRegistration;
