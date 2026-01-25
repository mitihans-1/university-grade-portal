import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, User, Mail, Lock, UserPlus, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../components/common/Toast';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();

  // State for toggling between Login and Sign Up views
  const [isLogin, setIsLogin] = useState(true);
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
        showToast(t('loginSuccessful'), 'success');
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
    <div className="auth-page-container fade-in">
      {/* Dynamic Background Blobs */}
      <div className="blob blob-1"></div>
      <div className="blob blob-2"></div>
      <div className="blob blob-3"></div>

      <div className="auth-card" style={{ maxWidth: '440px' }}>
        <div style={{ textAlign: 'center', marginBottom: '25px' }}>
          <div style={{
            width: '60px',
            height: '60px',
            background: 'linear-gradient(135deg, #4f46e5, #ec4899)',
            color: 'white',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            margin: '0 auto 15px',
            boxShadow: '0 8px 20px rgba(79, 70, 229, 0.3)',
            animation: 'float 3s ease-in-out infinite'
          }}>
            🏫
          </div>
          <h1 className="auth-title" style={{ fontSize: '1.6rem', marginBottom: '5px' }}>
            {isLogin ? t('universityGradePortal') : 'Join Our Community'}
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            {isLogin ? 'Welcome back! Please enter your details.' : 'Choose your role to get started.'}
          </p>
        </div>

        {isLogin ? (
          /* ----- LOGIN FORM ----- */
          <div className="fade-in">
            <div className="modern-input-group">
              <label className="modern-input-label">{t('email')}</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="modern-input"
                  placeholder={t('enterYourEmail')}
                  style={{ paddingLeft: '40px' }}
                />
              </div>
            </div>

            <div className="modern-input-group">
              <label className="modern-input-label">{t('password')}</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="modern-input"
                  placeholder={t('enterYourPassword')}
                  style={{ paddingLeft: '40px', paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div style={{ textAlign: 'right', marginBottom: '20px' }}>
              <Link to="/forgot-password" style={{ fontSize: '13px', color: '#4f46e5', fontWeight: '600', textDecoration: 'none' }}>
                Forgot Password?
              </Link>
            </div>

            <button onClick={handleLogin} disabled={loading} className="modern-btn">
              {loading ? 'Authenticating...' : t('login')}
            </button>

            <div style={{ marginTop: '25px', textAlign: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
              <p style={{ color: '#64748b', fontSize: '14px' }}>
                Don't have an account?{' '}
                <button
                  onClick={() => setIsLogin(false)}
                  style={{ background: 'none', border: 'none', color: '#4f46e5', fontWeight: '700', cursor: 'pointer', fontSize: '14px' }}
                >
                  Sign Up Now
                </button>
              </p>
            </div>
          </div>
        ) : (
          /* ----- SIGN UP ROLE SELECTION ----- */
          <div className="fade-in">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '25px' }}>
              <Link to="/student/register" className="register-chip" style={{ justifyContent: 'flex-start', padding: '15px 20px', borderRadius: '12px', width: '100%', fontSize: '1rem' }}>
                <span style={{ fontSize: '20px', marginRight: '15px' }}>👨‍🎓</span>
                <span>Register as Student</span>
              </Link>
              <Link to="/parent/register" className="register-chip" style={{ justifyContent: 'flex-start', padding: '15px 20px', borderRadius: '12px', width: '100%', fontSize: '1rem' }}>
                <span style={{ fontSize: '20px', marginRight: '15px' }}>👨‍👩‍👧</span>
                <span>Register as Parent</span>
              </Link>
              <Link to="/teacher/register" className="register-chip" style={{ justifyContent: 'flex-start', padding: '15px 20px', borderRadius: '12px', width: '100%', fontSize: '1rem' }}>
                <span style={{ fontSize: '20px', marginRight: '15px' }}>👨‍🏫</span>
                <span>Register as Teacher</span>
              </Link>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px dashed #cbd5e1', marginBottom: '20px' }}>
              <p style={{ fontSize: '13px', color: '#64748b', textAlign: 'center', margin: 0 }}>
                ℹ️ Selecting a role will take you to the secure registration field where you can complete your profile.
              </p>
            </div>

            <button
              onClick={() => setIsLogin(true)}
              className="modern-btn"
              style={{ background: 'white', color: '#4f46e5', border: '1px solid #4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <ArrowLeft size={18} /> Back to Login
            </button>
          </div>
        )}

        <div className="secure-badge" style={{ marginTop: '20px', fontSize: '0.75rem' }}>
          🔒 {t('secureAccess') || 'Secure encrypted academic access'}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;