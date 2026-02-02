import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../utils/api';
import React, { useState, useEffect } from 'react';
import PasswordStrengthMeter from '../components/common/PasswordStrengthMeter';

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
    department: '',
    year: '1',
    semester: '1',
    nationalId: '',
    agreeToTerms: false,
    captchaAnswer: ''
  });

  const [captcha, setCaptcha] = useState({ question: '', answer: '' });

  // Handle pre-filling ID from scanner
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const idFromScan = params.get('studentId');
    if (idFromScan) {
      setFormData(prev => ({ ...prev, studentId: idFromScan }));
      handleCheckId(idFromScan);
    }
  }, [location]);

  const [idChecking, setIdChecking] = useState(false);
  const [idVerifiedStatus, setIdVerifiedStatus] = useState(null); // 'valid', 'invalid', 'used'

  const [errors, setErrors] = useState({});
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(true);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [systemSettings, setSystemSettings] = useState(null);
  const [checkingSettings, setCheckingSettings] = useState(true);

  // State for focused fields
  const [focused, setFocused] = useState({
    fullName: false,
    studentId: false,
    email: false,
    phone: false,
    password: false,
    confirmPassword: false,
    nationalId: false
  });

  // Handle pre-filling ID from scanner and check registration status
  useEffect(() => {
    const checkStatus = async () => {
      try {
        setCheckingSettings(true);
        const settings = await api.getPublicSettings();
        setSystemSettings(settings);
        if (settings && settings.registration_open === 'false') {
          setIsRegistrationOpen(false);
        }
      } catch (err) {
        console.error('Error checking registration status:', err);
      } finally {
        setCheckingSettings(false);
      }
    };

    checkStatus();
    loadCaptcha();

    const params = new URLSearchParams(location.search);
    const idFromScan = params.get('studentId');
    if (idFromScan) {
      setFormData(prev => ({ ...prev, studentId: idFromScan }));
    }
  }, [location]);

  const loadCaptcha = async () => {
    try {
      const puzzle = await api.getCaptcha();
      setCaptcha(puzzle);
    } catch (err) {
      console.error('Error loading captcha:', err);
    }
  };

  const handleFocus = (e) => {
    setFocused({ ...focused, [e.target.name]: true });
  };

  const handleBlur = (e) => {
    setFocused({ ...focused, [e.target.name]: false });
    if (e.target.name === 'studentId' && formData.studentId) {
      handleCheckId(formData.studentId);
    }
  };

  const handleCheckId = async (id) => {
    if (!id || id.length < 3) return;

    setIdChecking(true);
    setIdVerifiedStatus(null);
    try {
      const result = await api.checkStudentId(id);
      if (result.valid) {
        setIdVerifiedStatus('valid');
      } else {
        setIdVerifiedStatus('invalid');
      }
    } catch (err) {
      setIdVerifiedStatus('invalid');
      console.warn('ID check failed:', err.message);
    } finally {
      setIdChecking(false);
    }
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

    // Password validation: at least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
    if (formData.password.length < 8) newErrors.password = t('passwordLengthRequired') || 'Password must be at least 8 characters long.';
    else {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
      if (!passwordRegex.test(formData.password)) {
        newErrors.password = 'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.';
      }
    }
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = t('passwordsDoNotMatch');

    if (!formData.nationalId) newErrors.nationalId = 'National ID / Passport is required';

    if (!formData.agreeToTerms) newErrors.agreeToTerms = t('mustAgreeToTerms');
    if (!formData.captchaAnswer) newErrors.captchaAnswer = 'Please answer the human verification question.';
    else if (parseInt(formData.captchaAnswer) !== captcha.answer) newErrors.captchaAnswer = 'Incorrect human verification answer. Please try again.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // Return true if no errors, false otherwise
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isRegistrationOpen) {
      alert('Registration is currently closed. Please contact administrator.');
      return;
    }

    const isValid = validateForm(); // Now validateForm sets errors and returns boolean

    if (isValid) {
      try {
        // Prepare student data for API call
        const studentData = {
          studentId: formData.studentId,
          name: formData.fullName,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          department: formData.department,
          year: formData.year,
          semester: formData.semester || '1',
          nationalId: formData.nationalId,
          captchaAnswer: formData.captchaAnswer,
          expectedCaptcha: captcha.answer
        };

        // Call the API to register the student
        const result = await api.registerStudent(studentData);

        if (result && (result.msg || result.token)) {
          if (result.msg?.includes('already registered')) {
            alert(result.msg);
          } else {
            setRegistrationSuccess(true);
          }
        } else {
          // Handle error from API
          alert(result.msg || t('studentRegistrationError'));
        }
      } catch (error) {
        console.error('Student registration error:', error);
        alert(error.message || t('studentRegistrationError') || 'Registration failed. Please try again.');
      }
    }
  };

  if (checkingSettings) {
    return (
      <div className="auth-page-container fade-in">
        <div className="auth-card" style={{ textAlign: 'center', padding: '50px' }}>
          <div className="loading-spinner"></div>
          <p style={{ marginTop: '20px', color: '#64748b' }}>Checking registration status...</p>
        </div>
      </div>
    );
  }

  if (!isRegistrationOpen) {
    return (
      <div className="auth-page-container fade-in">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="auth-card" style={{ maxWidth: '400px', textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '60px', marginBottom: '20px' }}>🔐</div>
          <h2 style={{ color: '#1e293b', marginBottom: '10px' }}>Registration Closed</h2>
          <p style={{ color: '#64748b', lineHeight: '1.6', marginBottom: '25px' }}>
            We're sorry, but student registration is currently closed for the
            <strong> {systemSettings?.current_year} {systemSettings?.current_semester}</strong> academic period.
          </p>
          <Link to="/" className="modern-btn" style={{ textDecoration: 'none', display: 'inline-block' }}>
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  if (registrationSuccess) {
    return (
      <div className="auth-page-container fade-in">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="auth-card" style={{ maxWidth: '450px', textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '60px', marginBottom: '20px' }}>🎉</div>
          <h2 style={{ color: '#1e293b', marginBottom: '10px' }}>{t('registrationSuccessful') || 'Registration Successful!'}</h2>
          <p style={{ color: '#64748b', lineHeight: '1.6', marginBottom: '25px' }}>
            Your student account has been verified and activated for <strong>{formData.email}</strong>.
            You can now log in to the portal.
          </p>
          <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '12px', marginBottom: '25px', border: '1px solid #e2e8f0' }}>
            <p style={{ fontWeight: '600', color: '#1a237e', margin: '5px 0' }}>Account Active</p>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>A <strong>Welcome Email</strong> has been sent to your inbox.</p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="modern-btn"
            style={{ background: 'linear-gradient(45deg, #1a237e, #3949ab)', width: '100%', marginBottom: '15px' }}
          >
            Log In Now
          </button>
        </div>
      </div>
    );
  }

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
                  border: `1px solid ${errors.studentId ? '#f44336' : idVerifiedStatus === 'valid' ? '#4caf50' : '#e2e8f0'}`,
                  paddingRight: '40px'
                }}
                placeholder={t('studentIdPlaceholder')}
                autoComplete="off"
              />
              <div style={{ position: 'absolute', right: '10px', bottom: '15px' }}>
                {idChecking ? (
                  <div className="loading-spinner-small"></div>
                ) : idVerifiedStatus === 'valid' ? (
                  <span title="Verified with official records" style={{ color: '#4caf50', fontSize: '20px' }}>✅</span>
                ) : idVerifiedStatus === 'invalid' ? (
                  <span title="Invalid ID format or not found" style={{ color: '#f44336', fontSize: '20px' }}>❌</span>
                ) : null}
              </div>
              {focused.studentId && (
                <div style={{ fontSize: '11px', color: '#1976d2', marginTop: '5px' }}>
                  ℹ️ {t('studentIdHint') || 'Enter your official university ID.'}
                </div>
              )}
              {errors.studentId && <small style={{ color: '#f44336' }}>{t('studentIdRequired')}</small>}
              {idVerifiedStatus === 'valid' && (
                <div style={{ fontSize: '11px', color: '#4caf50', marginTop: '2px', fontWeight: 'bold' }}>
                  ✅ Official Record Found! Verified.
                </div>
              )}
            </div>
          </div>


          <div className="modern-input-group">
            <label className="modern-input-label">National ID (FIN)</label>
            <input
              type="text"
              name="nationalId"
              value={formData.nationalId}
              onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
              onFocus={handleFocus}
              onBlur={handleBlur}
              className="modern-input"
              placeholder="e.g. FIN-1234567"
              autoComplete="off"
            />
            {focused.nationalId && (
              <div style={{ fontSize: '12px', color: '#1976d2', marginTop: '5px' }}>
                ℹ️ Required for identity verification.
              </div>
            )}
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
              {focused.password && (
                <div style={{ fontSize: '11px', color: '#1976d2', marginTop: '5px' }}>
                  ℹ️ Min 8 chars, 1 letter, 1 number, 1 special char
                </div>
              )}
              <PasswordStrengthMeter password={formData.password} />
              {errors.password && <small style={{ color: '#f44336' }}>{errors.password}</small>}
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



          <div style={{
            background: '#f8fafc',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <label className="modern-input-label" style={{ marginBottom: 0 }}>Human Verification</label>
              <span style={{ fontSize: '12px', background: '#3b82f6', color: 'white', padding: '2px 8px', borderRadius: '4px' }}>ROBOT CHECK</span>
            </div>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '15px' }}>
              Solve this simple math puzzle to prove you are human:
            </p>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
              <div style={{
                background: '#ffffff',
                padding: '12px 20px',
                borderRadius: '8px',
                fontSize: '20px',
                fontWeight: '800',
                color: '#1e293b',
                border: '1px solid #cbd5e1',
                flex: 1,
                textAlign: 'center',
                letterSpacing: '2px'
              }}>
                {captcha.question || '...'}
              </div>
              <div style={{ flex: 1 }}>
                <input
                  type="text"
                  name="captchaAnswer"
                  value={formData.captchaAnswer}
                  onChange={(e) => setFormData({ ...formData, captchaAnswer: e.target.value })}
                  className="modern-input"
                  placeholder="Answer?"
                  style={{
                    height: '50px',
                    textAlign: 'center',
                    fontSize: '18px',
                    border: `1px solid ${errors.captchaAnswer ? '#f44336' : '#e2e8f0'}`
                  }}
                />
              </div>
            </div>
            {errors.captchaAnswer && <small style={{ color: '#f44336', display: 'block', marginTop: '5px' }}>{errors.captchaAnswer}</small>}
          </div>

          <div style={{ marginBottom: '25px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <input
                type="checkbox"
                checked={formData.agreeToTerms}
                onChange={(e) => setFormData({ ...formData, agreeToTerms: e.target.checked })}
                style={{ width: '18px', height: '18px', cursor: 'pointer', marginTop: '3px' }}
              />
              <div>
                <span style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.4' }}>
                  {t('agreeToShareAcademicInfo')} By registering, you also agree to our <Link to="/privacy-policy" target="_blank" style={{ color: '#3b82f6', fontWeight: '600' }}>Privacy Policy</Link>.
                </span>
                {errors.agreeToTerms && <div style={{ color: '#f44336', fontSize: '12px', marginTop: '2px' }}>{t('agreeToTermsRequired')}</div>}
              </div>
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