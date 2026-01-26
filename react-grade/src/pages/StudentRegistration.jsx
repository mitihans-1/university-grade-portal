import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../utils/api';
import React, { useState, useEffect } from 'react';

const StudentRegistration = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    fullName: '',
    studentId: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    agreeToTerms: false
  });

  // Handle pre-filling ID from scanner
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const idFromScan = params.get('studentId');
    if (idFromScan) {
      setFormData(prev => ({ ...prev, studentId: idFromScan }));
    }
  }, [location]);

  const [errors, setErrors] = useState({});
  // State for focused fields
  const [focused, setFocused] = useState({
    fullName: false,
    studentId: false,
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

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName) newErrors.fullName = t('fullNameRequired');
    if (!formData.studentId) newErrors.studentId = t('studentIdRequired');

    // Email validation
    if (!formData.email) {
      newErrors.email = t('emailRequired');
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) {
      newErrors.email = t('validEmailRequired');
    }

    // Password validation: at least 6 characters, 1 letter, 1 number, 1 special character
    if (formData.password.length < 6) newErrors.password = t('passwordLengthRequired');
    else {
      const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{6,}$/;
      if (!passwordRegex.test(formData.password)) {
        newErrors.password = 'Password must contain at least 1 letter, 1 number, and 1 special character.';
      }
    }
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = t('passwordsDoNotMatch');

    if (!formData.agreeToTerms) newErrors.agreeToTerms = t('agreeToTermsRequired');

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();

    if (Object.keys(validationErrors).length === 0) {
      try {
        // Prepare student data for API call
        const studentData = {
          studentId: formData.studentId,
          name: formData.fullName,
          email: formData.email,
          password: formData.password,
          phone: formData.phone
        };

        // Call the API to register the student
        const result = await api.registerStudent(studentData);

        if (result.msg) {
          // Registration submitted successfully (but pending approval)
          alert(result.msg + '\n\nYou can try logging in, or wait for admin approval.');
          navigate('/');
        } else if (result.token && result.user) {
          // Registration successful with immediate access (unlikely with current backend)
          alert(t('studentRegistrationSuccess'));
          navigate('/');
        } else {
          // Handle error from API
          alert(result.msg || t('studentRegistrationError'));
        }
      } catch (error) {
        console.error('Student registration error:', error);
        alert(t('studentRegistrationError'));
      }
    } else {
      setErrors(validationErrors);
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
            background: 'linear-gradient(135deg, #1976d2, #64b5f6)',
            color: 'white',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '30px',
            margin: '0 auto 15px',
            boxShadow: '0 4px 15px rgba(25, 118, 210, 0.3)'
          }}>
            👨‍🎓
          </div>
          <h2 className="auth-title" style={{ fontSize: '1.8rem' }}>{t('studentRegistration')}</h2>
          <p className="auth-subtitle">
            {t('registerAsStudentToAccessPortal')}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div className="modern-input-group">
              <label className="modern-input-label">
                {t('fullName')} *
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                onFocus={handleFocus}
                onBlur={handleBlur}
                className="modern-input"
                style={{
                  border: `1px solid ${errors.fullName ? '#f44336' : '#e2e8f0'}`,
                }}
                placeholder={t('fullNamePlaceholder')}
                autoComplete="off"
              />
              {focused.fullName && (
                <div style={{ fontSize: '12px', color: '#1976d2', marginTop: '5px' }}>
                  ℹ️ Enter your full legal name.
                </div>
              )}
              {errors.fullName && <small style={{ color: '#f44336' }}>{t('fullNameRequired')}</small>}
            </div>

            <div className="modern-input-group">
              <label className="modern-input-label">
                {t('studentId')} *
              </label>
              <input
                type="text"
                name="studentId"
                value={formData.studentId}
                onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                onFocus={handleFocus}
                onBlur={handleBlur}
                className="modern-input"
                style={{
                  border: `1px solid ${errors.studentId ? '#f44336' : '#e2e8f0'}`,
                }}
                placeholder={t('studentIdPlaceholder')}
                autoComplete="off"
              />
              {focused.studentId && (
                <div style={{ fontSize: '12px', color: '#1976d2', marginTop: '5px' }}>
                  ℹ️ Enter your university ID.
                </div>
              )}
              {errors.studentId && <small style={{ color: '#f44336' }}>{t('studentIdRequired')}</small>}
            </div>
          </div>



          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div className="modern-input-group">
              <label className="modern-input-label">
                {t('email')} *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                <div style={{ fontSize: '11px', color: '#1976d2', marginTop: '2px' }}>
                  ℹ️ Valid email required.
                </div>
              )}
              {errors.email && <small style={{ color: '#f44336' }}>{t('validEmailRequired')}</small>}
            </div>

            <div className="modern-input-group">
              <label className="modern-input-label">
                {t('phone')} *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                onFocus={handleFocus}
                onBlur={handleBlur}
                className="modern-input"
                style={{
                  border: `1px solid ${errors.phone ? '#f44336' : '#e2e8f0'}`,
                }}
                placeholder={t('phonePlaceholder')}
                autoComplete="tel"
              />
              {focused.phone && (
                <div style={{ fontSize: '11px', color: '#1976d2', marginTop: '2px' }}>
                  ℹ️ For SMS updates.
                </div>
              )}
              {errors.phone && <small style={{ color: '#f44336' }}>{t('phoneRequired')}</small>}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div className="modern-input-group">
              <label className="modern-input-label">{t('password')} *</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                onFocus={handleFocus}
                onBlur={handleBlur}
                className="modern-input"
                style={{ border: `1px solid ${errors.password ? '#f44336' : '#e2e8f0'}` }}
                placeholder={t('passwordPlaceholder')}
                autoComplete="new-password"
              />
              {errors.password && <small style={{ color: '#f44336' }}>{t('passwordLengthRequired')}</small>}
            </div>

            <div className="modern-input-group">
              <label className="modern-input-label">{t('confirmPassword')} *</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                onFocus={handleFocus}
                onBlur={handleBlur}
                className="modern-input"
                style={{ border: `1px solid ${errors.confirmPassword ? '#f44336' : '#e2e8f0'}` }}
                placeholder={t('confirmPasswordPlaceholder')}
                autoComplete="new-password"
              />
              {errors.confirmPassword && <small style={{ color: '#f44336' }}>{t('passwordsDoNotMatch')}</small>}
            </div>
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
                {t('agreeToShareAcademicInfo')}
              </span>
              {errors.agreeToTerms && <div style={{ color: '#f44336', fontSize: '12px', marginTop: '2px' }}>{t('agreeToTermsRequired')}</div>}
            </div>
          </div>

          <button
            type="submit"
            className="modern-btn"
          >
            {t('registerAsStudent')}
          </button>

          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <p style={{ color: '#64748b' }}>
              {t('alreadyHaveAccount')}{' '}
              <Link to="/" style={{ color: '#1976d2', textDecoration: 'none', fontWeight: '600' }}>
                {t('loginHere')}
              </Link>
            </p>
            <p style={{ color: '#64748b', fontSize: '14px', marginTop: '5px' }}>
              {t('parents')}: <Link to="/parent/register" style={{ color: '#1976d2', textDecoration: 'none', fontWeight: '500' }}>
                {t('registerAsParent')}
              </Link>
            </p>
          </div>
        </form>
      </div >
    </div >
  );
};

export default StudentRegistration;