import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { useToast } from '../components/common/Toast';
import { useLanguage } from '../context/LanguageContext';
import { Eye, EyeOff } from 'lucide-react';

const ResetPasswordPage = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { showToast } = useToast();
    const { t } = useLanguage();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            showToast(t('passwordsDoNotMatch'), 'error');
            return;
        }
        setLoading(true);
        try {
            const res = await api.resetPassword(token, password);
            if (res.msg === 'Password has been updated successfully.') {
                showToast(res.msg, 'success');
                setTimeout(() => navigate('/'), 2000);
            } else {
                showToast(res.msg || t('failedToResetPassword'), 'error');
            }

        } catch (err) {
            showToast(t('errorResettingPassword'), 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page-container">
            {/* Floating Blobs */}
            <div className="blob blob-1"></div>
            <div className="blob blob-2"></div>
            <div className="blob blob-3"></div>

            <div className="auth-card" style={{ maxWidth: '400px' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#1e293b' }}>{t('setNewPassword')}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="modern-input-group" style={{ marginBottom: '15px' }}>
                        <label className="modern-input-label">{t('newPasswordLabel')}</label>
                        <div style={{ position: 'relative', display: 'flex' }}>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                className="modern-input"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder={t('enterNewPassword')}
                                style={{ paddingRight: '40px', flex: 1 }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '10px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#64748b',
                                    zIndex: 10
                                }}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>
                    <div className="modern-input-group" style={{ marginBottom: '20px' }}>
                        <label className="modern-input-label">{t('confirmPassword')}</label>
                        <input
                            type="password"
                            className="modern-input"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            placeholder={t('confirmNewPassword')}
                            style={{ width: '100%' }}
                        />
                    </div>
                    <button
                        type="submit"
                        className="modern-btn"
                        disabled={loading}
                    >
                        {loading ? t('resetting') : t('resetPassword')}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResetPasswordPage;
