import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { useToast } from '../components/common/Toast';
import { Eye, EyeOff } from 'lucide-react';

const ResetPasswordPage = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { showToast } = useToast();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            showToast('Passwords do not match', 'error');
            return;
        }
        setLoading(true);
        try {
            const res = await api.resetPassword(token, password);
            if (res.msg === 'Password has been updated successfully.') {
                showToast(res.msg, 'success');
                setTimeout(() => navigate('/'), 2000);
            } else {
                showToast(res.msg || 'Failed to reset password', 'error');
            }

        } catch (err) {
            showToast('Error resetting password', 'error');
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
                <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#1e293b' }}>Set New Password</h2>
                <form onSubmit={handleSubmit}>
                    <div className="modern-input-group" style={{ marginBottom: '15px' }}>
                        <label className="modern-input-label">New Password</label>
                        <div style={{ position: 'relative', display: 'flex' }}>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                className="modern-input"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="Enter new password"
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
                        <label className="modern-input-label">Confirm Password</label>
                        <input
                            type="password"
                            className="modern-input"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            placeholder="Confirm new password"
                            style={{ width: '100%' }}
                        />
                    </div>
                    <button
                        type="submit"
                        className="modern-btn"
                        disabled={loading}
                    >
                        {loading ? 'Resetting...' : 'Reset Password'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResetPasswordPage;
