import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../utils/api';

const StudentProfileSetup = () => {
    const { user, updateUser } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        department: '',
        year: '1',
        semester: '1'
    });
    const [error, setError] = useState('');

    const departments = [
        t('computerScience'),
        t('electricalEngineering'),
        t('mechanicalEngineering'),
        t('civilEngineering'),
        t('medicine'),
        t('businessAdministration'),
        t('law'),
        t('agriculture')
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.department) {
            setError(t('pleaseEnterAllFields'));
            return;
        }

        setLoading(true);

        try {
            const updatedUser = await api.updateProfile({
                department: formData.department,
                year: parseInt(formData.year),
                semester: parseInt(formData.semester)
            });

            updateUser(updatedUser);
            navigate('/student/dashboard');
        } catch (err) {
            console.error('Error updating profile:', err);
            setError(t('errorUpdatingProfile'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page-container fade-in">
            {/* Floating Blobs */}
            <div className="blob blob-1"></div>
            <div className="blob blob-2"></div>

            <div className="auth-card" style={{ maxWidth: '500px' }}>
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '15px' }}>🎓</div>
                    <h2 style={{ fontSize: '24px', color: '#1a237e', marginBottom: '10px' }}>
                        {t('completeYourProfile')}
                    </h2>
                    <p style={{ color: '#546e7a' }}>
                        {t('completeProfileDescription')}
                    </p>
                </div>

                {error && (
                    <div style={{
                        backgroundColor: '#ffebee',
                        color: '#c62828',
                        padding: '12px',
                        borderRadius: '8px',
                        marginBottom: '20px',
                        textAlign: 'center'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="modern-input-group">
                        <label className="modern-input-label">{t('department')} *</label>
                        <select
                            value={formData.department}
                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                            className="modern-input"
                            required
                        >
                            <option value="">{t('selectDepartment')}</option>
                            {departments.map(dept => (
                                <option key={dept} value={dept}>{dept}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div className="modern-input-group">
                            <label className="modern-input-label">{t('year')} *</label>
                            <select
                                value={formData.year}
                                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                                className="modern-input"
                            >
                                <option value="1">{t('year1')}</option>
                                <option value="2">{t('year2')}</option>
                                <option value="3">{t('year3')}</option>
                                <option value="4">{t('year4')}</option>
                                <option value="5">{t('year5')}</option>
                            </select>
                        </div>

                        <div className="modern-input-group">
                            <label className="modern-input-label">{t('semester')} *</label>
                            <select
                                value={formData.semester}
                                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                                className="modern-input"
                            >
                                <option value="1">1</option>
                                <option value="2">2</option>
                            </select>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="modern-btn"
                        style={{ marginTop: '20px' }}
                    >
                        {loading ? t('loading') : t('saveAndContinue')}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default StudentProfileSetup;
