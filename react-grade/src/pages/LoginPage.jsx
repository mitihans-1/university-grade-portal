import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../components/common/Toast';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
        showToast(t('loginSuccessful'), 'success');
        // Navigation will be handled by the useEffect above
      } else {
        showToast(result.message || t('loginFailedMessage'), 'error');
      }
    } catch (error) {
      showToast(t('loginFailedMessage'), 'error');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="auth-page-container">
      {/* Floating Background Blobs - Keep these if you added them, otherwise this block is fine */}
      <div className="blob blob-1"></div>
      <div className="blob blob-2"></div>
      <div className="blob blob-3"></div>

      <div className="auth-card" style={{ maxWidth: '480px' }}> {/* Slightly wider to accommodate side-by-side */}
        <div style={{ textAlign: 'center', marginBottom: '20px', overflow: 'hidden' }}>
          <div style={{
            width: '50px', /* Reduced Size */
            height: '50px',
            background: 'linear-gradient(135deg, #1976d2, #64b5f6)',
            color: 'white',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            margin: '0 auto 10px',
            boxShadow: '0 4px 15px rgba(25, 118, 210, 0.3)'
          }}>
            🏫
          </div>
          <h1 className="auth-title loop-slide-right" style={{ fontSize: '1.4rem', marginBottom: '5px' }}>{t('universityGradePortal')}</h1>
          <div style={{ marginBottom: '15px' }}></div>
        </div>

        {/* Side-by-Side Email Input */}
        <div className="modern-input-group" style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <label className="modern-input-label" style={{ marginBottom: '0', minWidth: '80px', textAlign: 'right', fontWeight: '600' }}>
            {t('email')}
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="modern-input"
            placeholder={t('enterYourEmail')}
            autoComplete="username"
            style={{ flex: 1 }}
          />
        </div>

        {/* Side-by-Side Password Input */}
        <div className="modern-input-group" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <label className="modern-input-label" style={{ marginBottom: '0', minWidth: '80px', textAlign: 'right', fontWeight: '600' }}>
            {t('password')}
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="modern-input"
            placeholder={t('enterYourPassword')}
            autoComplete="current-password"
            style={{ flex: 1 }}
          />
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          className="modern-btn"
          style={{ opacity: loading ? 0.7 : 1, padding: '12px', marginBottom: '10px' }}
        >
          {loading ? '⏳ ' : t('login')}
        </button>

        {/* Compact Footer Section */}
        <div style={{
          marginTop: '15px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px'
        }}>
          {/* Trust Badge */}
          <div className="secure-badge" style={{ marginTop: '0', fontSize: '0.75rem' }}>
            🔒 {t('secureAccess') || 'Secure academic access'}
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '10px', /* Increased gap for better spacing */
            flexWrap: 'wrap',
            paddingTop: '15px',
            borderTop: '1px solid #e2e8f0',
            width: '100%'
          }}>
            <span className="register-label">Register as</span> {/* Removed colon within text if desired, CSS handles spacing */}

            <div style={{ display: 'flex', gap: '8px' }}>
              <Link to="/student/register" className="register-chip">Student</Link>
              <Link to="/parent/register" className="register-chip">Parent</Link>
              <Link to="/teacher/register" className="register-chip">Teacher</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;