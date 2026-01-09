import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../utils/api';
import { useToast } from '../components/common/Toast';

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
        agreeToTerms: false
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [focused, setFocused] = useState({});

    // Two-step verification
    const [isCodeVerified, setIsCodeVerified] = useState(false);
    const [secretCode, setSecretCode] = useState('');
    const [codeError, setCodeError] = useState('');

    const departments = [
        'Computer Science',
        'Information Technology',
        'Software Engineering',
        'Electrical Engineering',
        'Mechanical Engineering',
        'Civil Engineering',
        'Business & Economics',
        'Social Sciences & Humanities'
    ];

    const handleFocus = (e) => setFocused({ ...focused, [e.target.name]: true });
    const handleBlur = (e) => setFocused({ ...focused, [e.target.name]: false });

    const handleVerifyCode = (e) => {
        e.preventDefault();
        const CORRECT_CODE = 'TEACH-2025-X';

        if (secretCode === CORRECT_CODE) {
            setIsCodeVerified(true);
            setCodeError('');
        } else {
            setCodeError('Invalid secret code. Please contact the Administrator to obtain the correct code.');
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.fullName) newErrors.fullName = 'Full name is required';
        if (!formData.teacherId) newErrors.teacherId = 'Teacher ID is required';

        // Email validation
        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        // Password validation: at least 6 characters, 1 letter, 1 number, 1 special character
        if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        } else {
            const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{6,}$/;
            if (!passwordRegex.test(formData.password)) {
                newErrors.password = 'Password must contain at least 1 letter, 1 number, and 1 special character (@$!%*#?&)';
            }
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        if (!formData.department) newErrors.department = 'Department is required';
        if (!formData.phone) newErrors.phone = 'Phone number is required';
        if (!formData.agreeToTerms) newErrors.agreeToTerms = 'You must agree to the terms';

        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationErrors = validateForm();

        if (Object.keys(validationErrors).length === 0) {
            setLoading(true);
            try {
                const teacherData = {
                    teacherId: formData.teacherId,
                    name: formData.fullName,
                    email: formData.email,
                    password: formData.password,
                    department: formData.department,
                    phone: formData.phone,
                    secretCode: secretCode // Use the verified secret code
                };

                const result = await api.registerTeacher(teacherData);
                if (result.token && result.user) {
                    showToast('Teacher registration successful!', 'success');
                    setTimeout(() => navigate('/'), 1500);
                } else {
                    showToast(result.msg || 'Registration failed', 'error');
                }
            } catch (error) {
                showToast('An error occurred during registration', 'error');
            } finally {
                setLoading(false);
            }
        } else {
            setErrors(validationErrors);
        }
    };

    // Step 1: Secret Code Verification Screen
    if (!isCodeVerified) {
        return (
            <div style={{ maxWidth: '500px', margin: '80px auto', padding: '40px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <div style={{ width: '80px', height: '80px', backgroundColor: '#9c27b0', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', margin: '0 auto 20px' }}>
                        �
                    </div>
                    <h2 style={{ margin: '0 0 10px 0', color: '#9c27b0' }}>Teacher Registration</h2>
                    <p style={{ color: '#666', fontSize: '14px' }}>Enter the secret code provided by the Administrator</p>
                </div>

                <form onSubmit={handleVerifyCode}>
                    <div style={{ marginBottom: '25px' }}>
                        <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', color: '#333' }}>
                            Admin Secret Code *
                        </label>
                        <input
                            type="text"
                            value={secretCode}
                            onChange={(e) => { setSecretCode(e.target.value); setCodeError(''); }}
                            style={{
                                width: '100%',
                                padding: '15px',
                                border: `2px solid ${codeError ? '#f44336' : '#9c27b0'}`,
                                borderRadius: '8px',
                                fontSize: '16px',
                                textAlign: 'center',
                                letterSpacing: '2px',
                                fontWeight: 'bold'
                            }}
                            placeholder="XXXX-XXXX-X"
                            autoFocus
                        />
                        {codeError && (
                            <div style={{ marginTop: '10px', padding: '12px', backgroundColor: '#ffebee', borderLeft: '4px solid #f44336', borderRadius: '4px' }}>
                                <small style={{ color: '#c62828', fontSize: '13px' }}>❌ {codeError}</small>
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        style={{
                            width: '100%',
                            padding: '15px',
                            backgroundColor: '#9c27b0',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            transition: 'background-color 0.3s'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#7b1fa2'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#9c27b0'}
                    >
                        Verify Code & Continue
                    </button>

                    <div style={{ textAlign: 'center', marginTop: '25px' }}>
                        <p style={{ fontSize: '13px', color: '#999', marginBottom: '10px' }}>
                            Don't have a code? Contact your Administrator
                        </p>
                        <Link to="/" style={{ color: '#9c27b0', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>
                            ← Back to Login
                        </Link>
                    </div>
                </form>
            </div>
        );
    }

    // Step 2: Registration Form (shown after code verification)
    return (
        <div className="auth-page-container fade-in">
            {/* Floating Background Blobs */}
            <div className="blob blob-1"></div>
            <div className="blob blob-2"></div>
            <div className="blob blob-3"></div>

            <div className="auth-card" style={{ maxWidth: '600px' }}>
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <div style={{ width: '60px', height: '60px', background: 'linear-gradient(135deg, #9c27b0, #ba68c8)', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', margin: '0 auto 15px', boxShadow: '0 4px 15px rgba(156, 39, 176, 0.3)' }}>
                        👨‍🏫
                    </div>
                    <h2 className="auth-title" style={{ fontSize: '1.8rem', background: 'linear-gradient(45deg, #9c27b0, #ba68c8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Teacher Registration</h2>
                    <p className="auth-subtitle">Complete your teacher account registration</p>
                    <div style={{ display: 'inline-block', padding: '8px 16px', backgroundColor: '#f3e5f5', borderRadius: '20px', marginTop: '10px' }}>
                        <span style={{ color: '#7b1fa2', fontSize: '13px', fontWeight: 'bold' }}>✓ Code Verified</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div className="modern-input-group">
                            <label className="modern-input-label">Full Name *</label>
                            <input
                                type="text"
                                name="fullName"
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                className="modern-input"
                                style={{ border: `1px solid ${errors.fullName ? '#f44336' : '#e2e8f0'}` }}
                            />
                            {errors.fullName && <small style={{ color: '#f44336' }}>{errors.fullName}</small>}
                        </div>
                        <div className="modern-input-group">
                            <label className="modern-input-label">Teacher ID *</label>
                            <input
                                type="text"
                                name="teacherId"
                                value={formData.teacherId}
                                onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                                className="modern-input"
                                style={{ border: `1px solid ${errors.teacherId ? '#f44336' : '#e2e8f0'}` }}
                                placeholder="e.g. T1001"
                            />
                            {errors.teacherId && <small style={{ color: '#f44336' }}>{errors.teacherId}</small>}
                        </div>
                    </div>

                    <div className="modern-input-group">
                        <label className="modern-input-label">Email Address *</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="modern-input"
                            style={{ border: `1px solid ${errors.email ? '#f44336' : '#e2e8f0'}` }}
                        />
                        {errors.email && <small style={{ color: '#f44336' }}>{errors.email}</small>}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div className="modern-input-group">
                            <label className="modern-input-label">Password *</label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                onFocus={handleFocus}
                                onBlur={handleBlur}
                                className="modern-input"
                                style={{ border: `1px solid ${errors.password ? '#f44336' : '#e2e8f0'}` }}
                                placeholder="Enter password"
                                autoComplete="new-password"
                            />
                            {focused.password && (
                                <div style={{ fontSize: '11px', color: '#9c27b0', marginTop: '5px' }}>
                                    ℹ️ Min 6 chars, 1 letter, 1 number, 1 special char
                                </div>
                            )}
                            {errors.password && <small style={{ color: '#f44336' }}>{errors.password}</small>}
                        </div>
                        <div className="modern-input-group">
                            <label className="modern-input-label">Confirm Password *</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                onFocus={handleFocus}
                                onBlur={handleBlur}
                                className="modern-input"
                                style={{ border: `1px solid ${errors.confirmPassword ? '#f44336' : '#e2e8f0'}` }}
                                placeholder="Re-enter password"
                                autoComplete="new-password"
                            />
                            {errors.confirmPassword && <small style={{ color: '#f44336' }}>{errors.confirmPassword}</small>}
                        </div>
                    </div>

                    <div className="modern-input-group">
                        <label className="modern-input-label">Department *</label>
                        <select
                            value={formData.department}
                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                            className="modern-input"
                            style={{ border: `1px solid ${errors.department ? '#f44336' : '#e2e8f0'}` }}
                        >
                            <option value="">Select Department</option>
                            {departments.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                        {errors.department && <small style={{ color: '#f44336' }}>{errors.department}</small>}
                    </div>

                    <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input
                            type="checkbox"
                            checked={formData.agreeToTerms}
                            onChange={(e) => setFormData({ ...formData, agreeToTerms: e.target.checked })}
                            style={{ marginTop: '3px', width: '18px', height: '18px', cursor: 'pointer', margin: 0 }}
                        />
                        <div>
                            <span style={{ fontSize: '14px', color: '#64748b' }}>I agree to share my academic information with the university administration and accept the Teacher Terms of Service</span>
                            {errors.agreeToTerms && <small style={{ color: '#f44336', display: 'block' }}>{errors.agreeToTerms}</small>}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="modern-btn"
                        style={{ background: 'linear-gradient(to right, #9c27b0, #ba68c8)', cursor: loading ? 'not-allowed' : 'pointer' }}
                    >
                        {loading ? 'Registering...' : 'Register as Teacher'}
                    </button>

                    <div style={{ textAlign: 'center', marginTop: '20px' }}>
                        <p style={{ color: '#64748b' }}>Already have an account? <Link to="/" style={{ color: '#9c27b0', textDecoration: 'none', fontWeight: '600' }}>Login</Link></p>
                    </div>
                </form>
            </div>
        </div>);
};

export default TeacherRegistration;
