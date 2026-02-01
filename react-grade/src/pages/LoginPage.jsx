import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, User, Mail, Lock, UserPlus, ArrowLeft, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../components/common/Toast';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, verifyMfa, user } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();

  // State for toggling between Login and Sign Up views
  const [isLogin, setIsLogin] = useState(true);
  const [showMfa, setShowMfa] = useState(false);
  const [mfaData, setMfaData] = useState({ email: '', role: '', code: '' });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  React.useEffect(() => {
    if (user) {
      if (user.permissions?.includes('manage_users')) {
        navigate('/admin');
      } else if (user.permissions?.includes('enter_grades')) {
        navigate('/teacher');
      } else if (user.permissions?.includes('view_child_grades')) {
        navigate('/parent');
      } else {
        navigate('/student');
      }
    }
  }, [user, navigate]);

  const handleLogin = async () => {
    if (!email || !password) {
      showToast(t('pleaseEnterAllFields'), 'warning');
      return;
    }

    setLoading(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        if (result.mfaRequired) {
          setMfaData({ email: result.email, role: result.role, code: '' });
          setShowMfa(true);
          showToast('Verification code sent to email', 'info');
        } else {
          showToast(t('loginSuccessful'), 'success');
        }
      } else {
        showToast(result.message || t('loginFailedMessage'), 'error');
      }
    } catch (error) {
      showToast(t('loginFailedMessage'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleMfaSubmit = async () => {
    if (!mfaData.code || mfaData.code.length !== 6) {
      showToast('Please enter the 6-digit code', 'warning');
      return;
    }

    setLoading(true);
    try {
      const result = await verifyMfa(mfaData);
      if (result.success) {
        showToast(t('loginSuccessful'), 'success');
      } else {
        showToast(result.message || 'Verification failed', 'error');
      }
    } catch (error) {
      showToast('Verification failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container fade-in">
      {/* Dynamic Background Blobs */}
      <div className="blob blob-1"></div>
      <div className="blob blob-2"></div>
      <div className="blob blob-3"></div>

      <div className="auth-card" style={{ maxWidth: '460px' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{
            width: '70px',
            height: '70px',
            background: showMfa ? 'linear-gradient(135deg, #4f46e5, #3b82f6)' : 'linear-gradient(135deg, #6366f1, #a855f7, #ec4899)',
            color: 'white',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px',
            margin: '0 auto 20px',
            boxShadow: '0 12px 24px rgba(99, 102, 241, 0.4)',
            animation: 'float 4s ease-in-out infinite'
          }}>
            {showMfa ? '🔐' : '🎓'}
          </div>
          <h1 className="auth-title" style={{
            fontSize: '1.8rem',
            marginBottom: '8px',
            background: 'linear-gradient(to bottom, #1e293b, #475569)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-1px'
          }}>
            {showMfa ? 'Verify Access' : isLogin ? t('universityGradePortal') : 'Create Your Account'}
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.95rem', fontWeight: '500' }}>
            {showMfa ? `Code sent to ${mfaData.email}` : isLogin ? 'Seamless Access to Academic Records' : 'Join thousands of students and educators'}
          </p>
        </div>

        {showMfa ? (
          /* ----- MFA OTP FORM ----- */
          <div className="fade-in">
            <div className="modern-input-group">
              <label className="modern-input-label">Verification Code</label>
              <div style={{ position: 'relative' }}>
                <ShieldCheck size={18} style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8',
                  zIndex: 2
                }} />
                <input
                  type="text"
                  maxLength="6"
                  value={mfaData.code}
                  onChange={(e) => setMfaData({ ...mfaData, code: e.target.value.replace(/\D/g, '') })}
                  className="modern-input"
                  placeholder="000000"
                  style={{
                    paddingLeft: '44px',
                    height: '54px',
                    fontSize: '24px',
                    letterSpacing: '8px',
                    textAlign: 'center',
                    fontWeight: '800'
                  }}
                />
              </div>
              <p style={{ fontSize: '13px', color: '#64748b', marginTop: '10px', textAlign: 'center' }}>
                Enter the 6-digit security code sent to your professional email.
              </p>
            </div>

            <button
              onClick={handleMfaSubmit}
              disabled={loading}
              className="modern-btn"
              style={{
                height: '54px',
                fontSize: '16px',
                marginBottom: '15px'
              }}
            >
              {loading ? 'Verifying...' : 'Complete Sign In'}
            </button>

            <button
              onClick={() => setShowMfa(false)}
              style={{
                width: '100%',
                background: 'none',
                border: 'none',
                color: '#6366f1',
                fontWeight: '700',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Cancel and go back
            </button>
          </div>
        ) : isLogin ? (
          /* ----- LOGIN FORM ----- */
          <div className="fade-in">
            <div className="modern-input-group">
              <label className="modern-input-label">{t('email')}</label>
              <div style={{ position: 'relative', transition: 'transform 0.2s' }}>
                <Mail size={18} style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8',
                  zIndex: 2
                }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="modern-input"
                  placeholder={t('enterYourEmail')}
                  style={{
                    paddingLeft: '44px',
                    height: '50px',
                    fontSize: '15px'
                  }}
                />
              </div>
            </div>

            <div className="modern-input-group">
              <label className="modern-input-label">{t('password')}</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8',
                  zIndex: 2
                }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="modern-input"
                  placeholder={t('enterYourPassword')}
                  style={{
                    paddingLeft: '44px',
                    paddingRight: '44px',
                    height: '50px',
                    fontSize: '15px'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px'
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '25px' }}>
              <Link to="/forgot-password" style={{
                fontSize: '14px',
                color: '#6366f1',
                fontWeight: '700',
                textDecoration: 'none',
                transition: 'color 0.2s'
              }}>
                Forgot your password?
              </Link>
            </div>

            <button
              onClick={handleLogin}
              disabled={loading}
              className="modern-btn"
              style={{
                height: '54px',
                fontSize: '16px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
            >
              {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                  <div className="loading-spinner-small" style={{ width: '20px', height: '20px' }}></div>
                  <span>Authenticating...</span>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <span>{t('login')}</span>
                  <ArrowLeft size={18} style={{ transform: 'rotate(180deg)' }} />
                </div>
              )}
            </button>

            <div style={{ marginTop: '30px', textAlign: 'center' }}>
              <p style={{ color: '#64748b', fontSize: '15px', fontWeight: '500' }}>
                Don't have an account yet?{' '}
                <button
                  onClick={() => setIsLogin(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#6366f1',
                    fontWeight: '800',
                    cursor: 'pointer',
                    fontSize: '15px',
                    padding: '2px 4px',
                    textDecoration: 'underline'
                  }}
                >
                  Join Us
                </button>
              </p>
            </div>
          </div>
        ) : (
          /* ----- SIGN UP ROLE SELECTION ----- */
          <div className="fade-in">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px' }}>
              <Link to="/student/register" className="role-selection-card">
                <div className="role-icon-box" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>👨‍🎓</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '800', color: '#1e293b' }}>The Student</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Access grades and course materials</div>
                </div>
                <ArrowLeft size={16} style={{ transform: 'rotate(180deg)', opacity: 0.5 }} />
              </Link>

              <Link to="/parent/register" className="role-selection-card">
                <div className="role-icon-box" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>👨‍👩‍👧‍👦</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '800', color: '#1e293b' }}>The Parent</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Monitor academic progress & attendance</div>
                </div>
                <ArrowLeft size={16} style={{ transform: 'rotate(180deg)', opacity: 0.5 }} />
              </Link>

              <Link to="/teacher/register" className="role-selection-card">
                <div className="role-icon-box" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>👨‍🏫</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '800', color: '#1e293b' }}>The Educator</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Manage grades and student analytics</div>
                </div>
                <ArrowLeft size={16} style={{ transform: 'rotate(180deg)', opacity: 0.5 }} />
              </Link>
            </div>

            <button
              onClick={() => setIsLogin(true)}
              style={{
                width: '100%',
                padding: '14px',
                background: '#f8fafc',
                color: '#64748b',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f1f5f9';
                e.currentTarget.style.color = '#1e293b';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#f8fafc';
                e.currentTarget.style.color = '#64748b';
              }}
            >
              <ArrowLeft size={18} /> Back to Sign In
            </button>
          </div>
        )}

        <div className="secure-badge" style={{ marginTop: '25px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8' }}>
            <ShieldCheck size={14} />
            <span>AES-256 Encrypted Academic Connection</span>
          </div>
          <Link to="/privacy-policy" style={{ fontSize: '12px', color: '#6366f1', textDecoration: 'none', fontWeight: '600', opacity: 0.8 }}>
            University Data Protection & Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;