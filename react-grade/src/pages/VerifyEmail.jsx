import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { api } from '../utils/api';

const VerifyEmail = () => {
    const [status, setStatus] = useState('verifying'); // verifying, success, error
    const [message, setMessage] = useState('');
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const verifyToken = async () => {
            const params = new URLSearchParams(location.search);
            const token = params.get('token');
            const role = params.get('role');

            if (!token || !role) {
                setStatus('error');
                setMessage('Invalid verification link. Missing token or role.');
                return;
            }

            try {
                const result = await api.verifyEmail(token, role);
                if (result.msg && !result.error) {
                    setStatus('success');
                    setMessage(result.msg);
                } else {
                    setStatus('error');
                    setMessage(result.msg || 'Verification failed. The link may be invalid or expired.');
                }
            } catch (error) {
                setStatus('error');
                setMessage('An error occurred during verification. Please try again later.');
            }
        };

        verifyToken();
    }, [location]);

    return (
        <div className="auth-page-container fade-in">
            <div className="blob blob-1"></div>
            <div className="blob blob-2"></div>
            <div className="blob blob-3"></div>

            <div className="auth-card" style={{ maxWidth: '480px', textAlign: 'center' }}>
                <div style={{ marginBottom: '30px' }}>
                    {status === 'verifying' && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                            <Loader2 size={60} className="animate-spin" style={{ color: '#4f46e5' }} />
                            <h2 className="auth-title" style={{ fontSize: '1.8rem', marginBottom: '10px' }}>Verifying Your Email</h2>
                            <p style={{ color: '#64748b' }}>Please wait while we secure your account...</p>
                        </div>
                    )}

                    {status === 'success' && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                            <div style={{
                                width: '80px',
                                height: '80px',
                                backgroundColor: '#ecfdf5',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <CheckCircle size={50} style={{ color: '#10b981' }} />
                            </div>
                            <h2 className="auth-title" style={{ fontSize: '1.8rem', marginBottom: '10px', background: 'linear-gradient(45deg, #10b981, #34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Email Verified!</h2>
                            <p style={{ color: '#64748b', fontSize: '1.1rem' }}>{message}</p>
                            <Link to="/" className="modern-btn" style={{ marginTop: '20px', textDecoration: 'none', display: 'inline-block' }}>
                                Go to Login
                            </Link>
                        </div>
                    )}

                    {status === 'error' && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                            <div style={{
                                width: '80px',
                                height: '80px',
                                backgroundColor: '#fef2f2',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <XCircle size={50} style={{ color: '#ef4444' }} />
                            </div>
                            <h2 className="auth-title" style={{ fontSize: '1.8rem', marginBottom: '10px', background: 'linear-gradient(45deg, #ef4444, #f87171)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Verification Failed</h2>
                            <p style={{ color: '#64748b', fontSize: '1.1rem' }}>{message}</p>
                            <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
                                <Link to="/" className="modern-btn" style={{ textDecoration: 'none', background: 'white', color: '#4f46e5', border: '1px solid #4f46e5' }}>
                                    Back to Login
                                </Link>
                                <button onClick={() => window.location.reload()} className="modern-btn">
                                    Try Again
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="secure-badge" style={{ marginTop: '20px' }}>
                    🔒 Secure Academic Verification
                </div>
            </div>
        </div>
    );
};

export default VerifyEmail;
