import React, { useState } from 'react';
import { api } from '../utils/api';
import { useToast } from '../components/common/Toast';
import { Link, useNavigate } from 'react-router-dom';
import PasswordStrengthMeter from '../components/common/PasswordStrengthMeter';

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [password, setPassword] = useState('');
    const [step, setStep] = useState(1); // 1: Send Email, 2: Enter Code & New Password
    const [loading, setLoading] = useState(false);
    const { showToast } = useToast();
    const navigate = useNavigate();

    const handleSendCode = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.forgotPassword(email);
            showToast(res.msg, 'success');
            setStep(2);
        } catch (err) {
            showToast('Error sending reset code', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();

        if (password.length < 8) {
            showToast('Password must be at least 8 characters', 'error');
            return;
        }

        setLoading(true);
        try {
            const res = await api.resetPassword(email, code, password);
            if (res.msg.includes('successfully')) {
                showToast(res.msg, 'success');
                navigate('/'); // Redirect to login
            } else {
                showToast(res.msg || 'Invalid code', 'error');
            }
        } catch (err) {
            showToast('Error resetting password', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page-container">
            <div className="blob blob-1"></div>
            <div className="blob blob-2"></div>
            <div className="auth-card" style={{ maxWidth: '400px' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '10px' }}>Reset Password</h2>

                {step === 1 ? (
                    <form onSubmit={handleSendCode}>
                        <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '20px' }}>
                            Enter your email to receive a 6-digit reset code.
                        </p>
                        <div className="modern-input-group" style={{ marginBottom: '20px' }}>
                            <label className="modern-input-label">Email Address</label>
                            <input
                                type="email"
                                className="modern-input"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <button type="submit" className="modern-btn" disabled={loading}>
                            {loading ? 'Sending...' : 'Send Reset Code'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleResetPassword}>
                        <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '20px' }}>
                            Enter the 6-digit code sent to <b>{email}</b> and your new password.
                        </p>
                        <div className="modern-input-group" style={{ marginBottom: '15px' }}>
                            <label className="modern-input-label">6-Digit Code</label>
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
                            <label className="modern-input-label">New Password</label>
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
                            {loading ? 'Resetting...' : 'Change Password'}
                        </button>
                        <button type="button" onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: '#6366f1', marginTop: '10px', cursor: 'pointer', width: '100%' }}>
                            Resend Code
                        </button>
                    </form>
                )}

                <div style={{ textAlign: 'center', marginTop: '15px' }}>
                    <Link to="/" style={{ color: '#6366f1', textDecoration: 'none' }}>Back to Login</Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;