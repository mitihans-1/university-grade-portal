import React, { useState } from 'react';
import { api } from '../utils/api';
import { useToast } from '../components/common/Toast';
import { Link } from 'react-router-dom';

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const { showToast } = useToast();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.forgotPassword(email);
            showToast(res.msg || 'If an account exists, a reset link has been sent.', 'success');
        } catch (err) {
            showToast('Error sending reset link', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page-container">
            {/* Floating Blobs match Login */}
            <div className="blob blob-1"></div>
            <div className="blob blob-2"></div>
            <div className="blob blob-3"></div>

            <div className="auth-card" style={{ maxWidth: '400px' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '10px', color: '#1e293b' }}>Reset Password</h2>
                <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '25px', fontSize: '0.95rem' }}>
                    Enter your email address and we'll send you a link to reset your password.
                </p>
                <form onSubmit={handleSubmit}>
                    <div className="modern-input-group" style={{ marginBottom: '20px' }}>
                        <label className="modern-input-label">Email Address</label>
                        <input
                            type="email"
                            className="modern-input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="Enter your email"
                        />
                    </div>
                    <button
                        type="submit"
                        className="modern-btn"
                        disabled={loading}
                    >
                        {loading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                    <div style={{ textAlign: 'center', marginTop: '15px' }}>
                        <Link to="/" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 500 }}>Back to Login</Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
