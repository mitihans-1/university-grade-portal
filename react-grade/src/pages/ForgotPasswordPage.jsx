import React, { useState } from 'react';
import { api } from '../utils/api';
import { useToast } from '../components/common/Toast';
import { Link, useNavigate } from 'react-router-dom';
import PasswordStrengthMeter from '../components/common/PasswordStrengthMeter';
import { useLanguage } from '../context/LanguageContext';

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [password, setPassword] = useState('');
    const [step, setStep] = useState(1); // 1: Send Email, 2: Enter Code & New Password
    const [loading, setLoading] = useState(false);
    const { showToast } = useToast();
    const { t } = useLanguage();
    const navigate = useNavigate();

    const handleSendCode = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.forgotPassword(email);
            showToast(res.msg, 'success');
            setStep(2);
        } catch (err) {
            showToast(t('errorSendingCode'), 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();

        if (password.length < 8) {
            showToast(t('passwordLengthRequired'), 'error');
            return;
        }

        setLoading(true);
        try {
            const res = await api.resetPassword(email, code, password);
            if (res.msg.includes('successfully')) {
                showToast(res.msg, 'success');
                navigate('/'); // Redirect to login
            } else {
                showToast(res.msg || t('invalidCode'), 'error');
            }
        } catch (err) {
            showToast(t('errorResettingPassword'), 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page-container">
            <div className="blob blob-1"></div>
            <div className="blob blob-2"></div>
            <div className="auth-card" style={{ maxWidth: '400px' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '10px' }}>{t('resetPassword')}</h2>

                {step === 1 ? (
                    <form onSubmit={handleSendCode}>
                        <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '20px' }}>
                            {t('enterEmailForCode')}
                        </p>
                        <div className="modern-input-group" style={{ marginBottom: '20px' }}>
                            <label className="modern-input-label">{t('emailAddress')}</label>
                            <input
                                type="email"
                                className="modern-input"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <button type="submit" className="modern-btn" disabled={loading}>
                            {loading ? t('sendingCode') : t('sendResetCode')}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleResetPassword}>
                        <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '20px' }}>
                            {t('enterCodeSentTo', { email })} {t('andNewPassword')}
                        </p>
                        <div className="modern-input-group" style={{ marginBottom: '15px' }}>
                            <label className="modern-input-label">{t('sixDigitCode')}</label>
                            <input
                                type="text"
                                className="modern-input"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                maxLength="6"
                                placeholder="123456"
                                required
                            />
                        </div>
                        <div className="modern-input-group" style={{ marginBottom: '20px' }}>
                            <label className="modern-input-label">{t('newPasswordLabel')}</label>
                            <input
                                type="password"
                                className="modern-input"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <PasswordStrengthMeter password={password} />
                        </div>
                        <button type="submit" className="modern-btn" disabled={loading}>
                            {loading ? t('resetting') : t('changePasswordAction')}
                        </button>
                        <button type="button" onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: '#6366f1', marginTop: '10px', cursor: 'pointer', width: '100%' }}>
                            {t('resendCode')}
                        </button>
                    </form>
                )}

                <div style={{ textAlign: 'center', marginTop: '15px' }}>
                    <Link to="/" style={{ color: '#6366f1', textDecoration: 'none' }}>{t('backToLogin')}</Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;