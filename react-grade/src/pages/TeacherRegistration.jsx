import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../utils/api';
import { useToast } from '../components/common/Toast';
import PasswordStrengthMeter from '../components/common/PasswordStrengthMeter';

const TeacherRegistration = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const { showToast } = useToast();

    const [formData, setFormData] = useState({
        fullName: '',
        teacherId: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        department: '',
        year: '',
        semester: '',
        nationalId: '',
        agreeToTerms: false
    });

    const [focused, setFocused] = useState({
        fullName: false,
        teacherId: false,
        email: false,
        phone: false,
        password: false,
        confirmPassword: false,
        nationalId: false
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const [isRegistrationOpen, setIsRegistrationOpen] = useState(true);
    const [registrationSuccess, setRegistrationSuccess] = useState(false);
    const [registeredData, setRegisteredData] = useState(null);
    const [systemSettings, setSystemSettings] = useState(null);
    const [checkingSettings, setCheckingSettings] = useState(true);

    const [idChecking, setIdChecking] = useState(false);
    const [idVerifiedStatus, setIdVerifiedStatus] = useState(null); // 'valid', 'invalid'

    React.useEffect(() => {
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
    }, []);

    const handleFocus = (e) => {
        setFocused({ ...focused, [e.target.name]: true });
    };

    const handleBlur = (e) => {
        setFocused({ ...focused, [e.target.name]: false });
        if (e.target.name === 'teacherId' && formData.teacherId) {
            handleCheckId(formData.teacherId);
        }
    };

    const handleCheckId = async (id) => {
        if (!id || id.length < 3) return;

        setIdChecking(true);
        setIdVerifiedStatus(null);
        try {
            const result = await api.checkTeacherId(id);
            if (result.valid) {
                setIdVerifiedStatus('valid');
                setFormData(prev => ({
                    ...prev,
                    department: result.department || prev.department,
                    subject: result.subject || prev.subject,
                    specialization: result.specialization || prev.specialization
                }));
            } else {
                setIdVerifiedStatus('invalid');
            }
        } catch (err) {
            setIdVerifiedStatus('invalid');
            console.warn('Teacher ID check failed:', err.message);
        } finally {
            setIdChecking(false);
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.fullName) newErrors.fullName = t('fullNameRequired') || 'Full name is required';
        if (!formData.teacherId) newErrors.teacherId = t('teacherIdRequired') || 'Teacher ID is required';

        // Email validation
        if (!formData.email) {
            newErrors.email = t('emailRequired') || 'Email is required';
        } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) {
            newErrors.email = t('validEmailRequired') || 'Valid email required';
        }

        // Password validation: at least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
        if (formData.password.length < 8) {
            newErrors.password = t('passwordLengthRequired') || 'Password must be at least 8 characters';
        } else {
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
            if (!passwordRegex.test(formData.password)) {
                newErrors.password = 'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.';
            }
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = t('passwordsDoNotMatch') || 'Passwords do not match';
        }

        if (!formData.phone) newErrors.phone = t('phoneRequired') || 'Phone number is required';
        if (!formData.agreeToTerms) newErrors.agreeToTerms = t('agreeToTermsRequired') || 'You must agree to the terms';

        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isRegistrationOpen) {
            showToast('Registration is currently closed.', 'error');
            return;
        }

        const validationErrors = validateForm();

        if (Object.keys(validationErrors).length === 0) {
            setLoading(true);
            try {
                const teacherData = {
                    teacherId: formData.teacherId,
                    name: formData.fullName,
                    email: formData.email,
                    password: formData.password,
                    phone: formData.phone,
                    department: formData.department,
                    year: formData.year,
                    semester: formData.semester,
                    nationalId: formData.nationalId
                };

                const result = await api.registerTeacher(teacherData);
                if (result && !result.error) {
                    setRegisteredData(result.user);
                    setRegistrationSuccess(true);
                } else {
                    showToast(result.msg || 'Registration failed', 'error');
                }
            } catch (error) {
                console.error('Teacher registration error:', error);
                showToast(t('teacherRegistrationError') || 'An error occurred during registration', 'error');
            } finally {
                setLoading(false);
            }
        } else {
            setErrors(validationErrors);
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
                    <h2 style={{ color: '#1e293b', marginBottom: '10px' }}>Teacher Registration Closed</h2>
                    <p style={{ color: '#64748b', lineHeight: '1.6', marginBottom: '25px' }}>
                        We're sorry, but teacher registration is currently closed for
                        <strong> {systemSettings?.current_year} {systemSettings?.current_semester}</strong>.
                    </p>
                    <Link to="/" className="modern-btn" style={{ textDecoration: 'none', display: 'inline-block', background: 'linear-gradient(45deg, #9c27b0, #ba68c8)' }}>
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
                        Your teacher account has been verified and activated for <strong>{formData.email}</strong>.
                        You can now log in to the portal.
                    </p>
                    {registeredData && (
                        <div style={{
                            backgroundColor: '#f1f5f9',
                            padding: '15px',
                            borderRadius: '12px',
                            marginBottom: '25px',
                            textAlign: 'left',
                            fontSize: '14px',
                            border: '1px solid #e2e8f0'
                        }}>
                            <p style={{ margin: '0 0 5px 0', color: '#475569' }}><strong>Assigned Department:</strong> {registeredData.department || 'General'}</p>
                            <p style={{ margin: '0 0 5px 0', color: '#475569' }}><strong>Academic Year:</strong> Year {registeredData.year || 'N/A'}</p>
                            <p style={{ margin: '0', color: '#475569' }}><strong>Semester:</strong> Semester {registeredData.semester || 'N/A'}</p>
                        </div>
                    )}
                    <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '12px', marginBottom: '25px', border: '1px solid #e2e8f0' }}>
                        <p style={{ fontWeight: '600', color: '#9c27b0', margin: '5px 0' }}>Account Active</p>
                        <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>A <strong>Welcome Email</strong> has been sent to your inbox.</p>
                    </div>
                    <button
                        onClick={() => navigate('/')}
                        className="modern-btn"
                        style={{ background: 'linear-gradient(45deg, #9c27b0, #ba68c8)', width: '100%', marginBottom: '15px' }}
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
                        background: 'linear-gradient(135deg, #9c27b0, #ba68c8)',
                        color: 'white',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '30px',
                        margin: '0 auto 15px',
                        boxShadow: '0 4px 15px rgba(156, 39, 176, 0.3)'
                    }}>
                        👨‍🏫
                    </div>
                    <h2 className="auth-title" style={{ fontSize: '1.8rem' }}>{t('teacherRegistration')}</h2>
                    <p className="auth-subtitle">
                        {t('registerAsTeacherToAccessPortal')}
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
                                <div style={{ fontSize: '12px', color: '#9c27b0', marginTop: '5px' }}>
                                    ℹ️ Enter your full legal name.
                                </div>
                            )}
                            {errors.fullName && <small style={{ color: '#f44336' }}>{t('fullNameRequired')}</small>}
                        </div>

                        <div className="modern-input-group">
                            <label className="modern-input-label">
                                {t('teacherId') || 'Teacher ID'} *
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="text"
                                    name="teacherId"
                                    value={formData.teacherId}
                                    onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                                    onFocus={handleFocus}
                                    onBlur={handleBlur}
                                    className="modern-input"
                                    style={{
                                        border: `1px solid ${errors.teacherId ? '#f44336' : idVerifiedStatus === 'valid' ? '#4caf50' : '#e2e8f0'}`,
                                        paddingRight: '40px'
                                    }}
                                    placeholder={t('teacherIdPlaceholder')}
                                    autoComplete="off"
                                />
                                <div style={{ position: 'absolute', right: '10px', bottom: '12px' }}>
                                    {idChecking ? (
                                        <div className="loading-spinner-small"></div>
                                    ) : idVerifiedStatus === 'valid' ? (
                                        <span title="Verified with official records" style={{ color: '#4caf50', fontSize: '20px' }}>✅</span>
                                    ) : idVerifiedStatus === 'invalid' ? (
                                        <span title="Invalid ID or not found" style={{ color: '#f44336', fontSize: '20px' }}>❌</span>
                                    ) : null}
                                </div>
                            </div>
                            {focused.teacherId && (
                                <div style={{ fontSize: '11px', color: '#9c27b0', marginTop: '5px' }}>
                                    ℹ️ Enter your official teacher ID.
                                </div>
                            )}
                            {errors.teacherId && <small style={{ color: '#f44336' }}>{t('teacherIdRequired')}</small>}
                            {idVerifiedStatus === 'valid' && (
                                <div style={{ fontSize: '11px', color: '#4caf50', marginTop: '2px', fontWeight: 'bold' }}>
                                    Official Record Found! Pre-filling department & details.
                                </div>
                            )}
                        </div>
                    </div>

                    {idVerifiedStatus === 'valid' && (
                        <div style={{
                            background: '#fdf4ff',
                            padding: '20px',
                            borderRadius: '12px',
                            border: '1px solid #f5d0fe',
                            marginBottom: '25px',
                            animation: 'slideDown 0.3s ease-out'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#701a75', marginBottom: '12px' }}>
                                <span style={{ fontSize: '18px' }}>👨‍🏫</span>
                                <span style={{ fontWeight: '700', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Assigned Faculty Records</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                                <div>
                                    <div style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px' }}>Department</div>
                                    <div style={{ fontWeight: '700', color: '#1f2937' }}>{formData.department || 'Not Assigned'}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px' }}>Major Subject</div>
                                    <div style={{ fontWeight: '700', color: '#1f2937' }}>{formData.subject || 'Flexible'}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px' }}>Specialization</div>
                                    <div style={{ fontWeight: '700', color: '#1f2937' }}>{formData.specialization || 'General'}</div>
                                </div>
                            </div>
                        </div>
                    )}

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
                                <div style={{ fontSize: '11px', color: '#9c27b0', marginTop: '2px' }}>
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
                                <div style={{ fontSize: '11px', color: '#9c27b0', marginTop: '2px' }}>
                                    ℹ️ Used for system notifications.
                                </div>
                            )}
                            {errors.phone && <small style={{ color: '#f44336' }}>{t('phoneRequired')}</small>}
                        </div>
                    </div>

                    <div className="modern-input-group" style={{ marginBottom: '15px' }}>
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
                            <div style={{ fontSize: '11px', color: '#9c27b0', marginTop: '2px' }}>
                                ℹ️ Official ID required for verification.
                            </div>
                        )}
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
                                style={{ border: `1px solid ${errors.password ? '#f44336' : '#e0e0e0'}` }}
                                placeholder={t('passwordPlaceholder')}
                                autoComplete="new-password"
                            />
                            {focused.password && (
                                <div style={{ fontSize: '11px', color: '#9c27b0', marginTop: '5px' }}>
                                    ℹ️ Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
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
                                style={{ border: `1px solid ${errors.confirmPassword ? '#f44336' : '#e0e0e0'}` }}
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
                                I agree to the Teacher Terms of Service and share academic information with the university administration.
                            </span>
                            {errors.agreeToTerms && <div style={{ color: '#f44336', fontSize: '12px', marginTop: '2px' }}>{t('agreeToTermsRequired')}</div>}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="modern-btn"
                        style={{ background: 'linear-gradient(45deg, #9c27b0, #ba68c8)' }}
                    >
                        {loading ? 'Registering...' : t('registerAsTeacher')}
                    </button>

                    <div style={{ textAlign: 'center', marginTop: '20px' }}>
                        <p style={{ color: '#64748b' }}>
                            {t('alreadyHaveAccount')}{' '}
                            <Link to="/" style={{ color: '#9c27b0', textDecoration: 'none', fontWeight: '600' }}>
                                {t('loginHere')}
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>);
};

export default TeacherRegistration;
