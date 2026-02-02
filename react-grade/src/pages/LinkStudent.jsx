import React, { useState } from 'react';
import { api } from '../utils/api';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';

const LinkStudent = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [studentId, setStudentId] = useState('');
    const [studentFound, setStudentFound] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [checkLoading, setCheckLoading] = useState(false);

    // Function to verify student ID existence and availability
    const checkStudentId = async () => {
        if (!studentId.trim()) return;

        try {
            setCheckLoading(true);
            setError('');
            setStudentFound(null);

            const response = await api.getStudentById(studentId);

            if (response && response.studentId) {
                if (response.isLinked) {
                    setError(t('linkAlreadyExists'));
                } else {
                    setStudentFound(response);
                    setError('');
                }
            } else {
                setError(t('studentIdNotFound'));
            }
        } catch (err) {
            console.error('Error checking student:', err);
            setError(t('errorVerifyingStudent'));
        } finally {
            setCheckLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!studentFound) {
            setError(t('verifyStudentIdFirst'));
            return;
        }

        try {
            setLoading(true);
            setError('');
            setSuccess('');

            // Call the API endpoint using the utility function
            const result = await api.requestLink(studentFound.studentId);

            if (result.msg && result.msg.includes('successfully')) {
                setSuccess(t('linkRequestSent'));
                setStudentId('');
                setStudentFound(null);
            } else {
                setError(result.msg || t('linkRequestFailed'));
            }
        } catch (err) {
            console.error('Link request error:', err);
            setError(t('linkRequestError'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page-container fade-in">
            <div className="auth-card" style={{ maxWidth: '600px' }}>
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <div style={{
                        width: '60px',
                        height: '60px',
                        background: 'linear-gradient(135deg, #4caf50, #81c784)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '30px',
                        margin: '0 auto 15px',
                        boxShadow: '0 4px 15px rgba(76, 175, 80, 0.3)'
                    }}>
                        👨‍👩‍👧‍👦
                    </div>
                    <h2 className="auth-title" style={{ fontSize: '1.8rem', background: 'linear-gradient(45deg, #4caf50, #81c784)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{t('linkAnotherStudent')}</h2>
                    <p className="auth-subtitle">{t('linkStudentDescription')}</p>
                </div>

                {success && (
                    <div style={{
                        backgroundColor: '#e8f5e9',
                        color: '#2e7d32',
                        padding: '15px',
                        borderRadius: '8px',
                        marginBottom: '20px',
                        border: '1px solid #a5d6a7',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                    }}>
                        ✅ {success}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="modern-input-group">
                        <label className="modern-input-label">
                            {t('studentId')}
                        </label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input
                                type="text"
                                value={studentId}
                                onChange={(e) => {
                                    setStudentId(e.target.value);
                                    setStudentFound(null);
                                    setError('');
                                    setSuccess('');
                                }}
                                onBlur={() => {
                                    if (studentId && !studentFound) checkStudentId();
                                }}
                                placeholder={t('enterStudentId')}
                                className="modern-input"
                                style={{
                                    border: `1px solid ${error ? '#f44336' : studentFound ? '#4caf50' : '#e2e8f0'}`,
                                    marginBottom: 0
                                }}
                            />
                            <button
                                type="button"
                                onClick={checkStudentId}
                                disabled={checkLoading || !studentId}
                                style={{
                                    padding: '0 20px',
                                    background: 'linear-gradient(to right, #1976d2, #2196f3)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: (checkLoading || !studentId) ? 'not-allowed' : 'pointer',
                                    fontWeight: '600',
                                    opacity: (checkLoading || !studentId) ? 0.7 : 1,
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                {checkLoading ? '...' : t('verify')}
                            </button>
                        </div>

                        {error && (
                            <small style={{ color: '#f44336', marginTop: '5px', display: 'block' }}>
                                {error}
                            </small>
                        )}

                        {studentFound && (
                            <div style={{
                                marginTop: '15px',
                                padding: '15px',
                                backgroundColor: '#f0fdf4',
                                borderRadius: '8px',
                                border: '1px solid #4caf50'
                            }}>
                                <div style={{ fontWeight: 'bold', color: '#2e7d32', marginBottom: '5px' }}>
                                    ✅ {t('studentVerified')}
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={!studentFound || loading}
                        className="modern-btn"
                        style={{
                            background: (!studentFound || loading) ? '#ccc' : 'linear-gradient(to right, #4caf50, #66bb6a)',
                            cursor: (!studentFound || loading) ? 'not-allowed' : 'pointer',
                            marginTop: '10px'
                        }}
                    >
                        {loading ? t('submitting') : t('requestLink')}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LinkStudent;
