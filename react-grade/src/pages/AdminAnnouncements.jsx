import React, { useState } from 'react';
import { api } from '../utils/api';
import { useLanguage } from '../context/LanguageContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

const AdminAnnouncements = () => {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        message: '',
        targetGroup: 'all', // all, all_students, all_parents
        year: 'all', // all, 1, 2, 3, 4, 5
        semester: 'all', // all, 1, 2
        attachment: null
    });
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const handleChange = (e) => {
        if (e.target.name === 'attachment') {
            setFormData({
                ...formData,
                attachment: e.target.files[0]
            });
        } else {
            setFormData({
                ...formData,
                [e.target.name]: e.target.value
            });
        }
        // Clear status messages
        setSuccess('');
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title || (!formData.message && !formData.attachment)) {
            setError(t('fillTitleMessage'));
            return;
        }

        try {
            setLoading(true);
            setError('');

            const data = new FormData();
            data.append('title', formData.title);
            data.append('message', formData.message);
            data.append('targetGroup', formData.targetGroup);
            data.append('year', formData.year);
            data.append('semester', formData.semester);

            if (formData.attachment) {
                data.append('attachment', formData.attachment);
            }

            const result = await api.sendBroadcast(data);

            if (result && !result.msg) {
                setSuccess(t('announcementSentSuccess'));
                setFormData({
                    title: '',
                    message: '',
                    targetGroup: 'all',
                    year: 'all',
                    semester: 'all',
                    attachment: null
                });
                // Reset file input manually if needed
                const fileInput = document.querySelector('input[type="file"]');
                if (fileInput) fileInput.value = '';
            } else {
                setError(result.msg || t('failedToSendAnnouncement'));
            }
        } catch (err) {
            console.error('Error sending announcement:', err);
            setError('An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <LoadingSpinner fullScreen />;
    }

    return (
        <div style={{ maxWidth: '800px', margin: '40px auto', padding: '20px' }}>
            <div style={{
                backgroundColor: 'white',
                padding: '40px',
                borderRadius: '20px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                border: '1px solid #f0f0f0'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <div style={{
                        fontSize: '40px',
                        marginBottom: '15px',
                        display: 'inline-block',
                        padding: '15px',
                        backgroundColor: '#e3f2fd',
                        borderRadius: '50%',
                        color: '#1976d2'
                    }}>
                        📢
                    </div>
                    <h1 style={{ marginBottom: '10px', color: '#1a237e', fontWeight: '800', fontSize: '2.2rem' }}>{t('sendAnnouncement')}</h1>
                    <p style={{ color: '#64748b', fontSize: '1.1rem', maxWidth: '500px', margin: '0 auto' }}>
                        {t('broadcastNotification')}
                    </p>
                </div>

                {success && (
                    <div style={{
                        backgroundColor: '#dcfce7',
                        color: '#166534',
                        padding: '16px',
                        borderRadius: '12px',
                        marginBottom: '30px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        border: '1px solid #bbf7d0'
                    }}>
                        <span>✅</span> {success}
                    </div>
                )}

                {error && (
                    <div style={{
                        backgroundColor: '#fee2e2',
                        color: '#991b1b',
                        padding: '16px',
                        borderRadius: '12px',
                        marginBottom: '30px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        border: '1px solid #fecaca'
                    }}>
                        <span>⚠️</span> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#334155' }}>
                            {t('announcementTitle')}
                        </label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder={t('announcementPlaceholderTitle')}
                            style={inputStyle}
                        />
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#334155' }}>
                            {t('message')}
                        </label>
                        <textarea
                            name="message"
                            value={formData.message}
                            onChange={handleChange}
                            placeholder={t('announcementPlaceholderMessage')}
                            rows="6"
                            style={{
                                ...inputStyle,
                                resize: 'vertical',
                                minHeight: '120px'
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#334155' }}>
                            Attachment
                        </label>
                        <div style={{
                            border: '2px dashed #e2e8f0',
                            borderRadius: '12px',
                            padding: '20px',
                            textAlign: 'center',
                            backgroundColor: '#f8fafc',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                            onMouseEnter={(e) => e.currentTarget.style.borderColor = '#94a3b8'}
                            onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                        >
                            <input
                                type="file"
                                name="attachment"
                                onChange={handleChange}
                                style={{ width: '100%' }}
                                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                            />
                            {formData.attachment && (
                                <div style={{ marginTop: '10px', fontSize: '14px', color: '#166534', fontWeight: '600' }}>
                                    Selected: {formData.attachment.name}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="responsive-grid" style={{ marginBottom: '35px' }}>
                        <div style={{ flex: 1, minWidth: '200px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#334155' }}>
                                {t('targetAudience')}
                            </label>
                            <select
                                name="targetGroup"
                                value={formData.targetGroup}
                                onChange={handleChange}
                                style={inputStyle}
                            >
                                <option value="all">{t('everyone')}</option>
                                <option value="all_students">{t('allStudents')}</option>
                                <option value="all_parents">{t('allParents')}</option>
                            </select>
                        </div>

                        {(formData.targetGroup === 'all' || formData.targetGroup === 'all_students') && (
                            <>
                                <div style={{ flex: 1, minWidth: '150px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#334155' }}>
                                        {t('filterByYear')}
                                    </label>
                                    <select
                                        name="year"
                                        value={formData.year}
                                        onChange={handleChange}
                                        style={inputStyle}
                                    >
                                        <option value="all">{t('allYears')}</option>
                                        <option value="1">{t('year1')}</option>
                                        <option value="2">{t('year2')}</option>
                                        <option value="3">{t('year3')}</option>
                                        <option value="4">{t('year4')}</option>
                                        <option value="5">{t('year5')}</option>
                                    </select>
                                </div>
                                <div style={{ flex: 1, minWidth: '150px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#334155' }}>
                                        {t('semester')}
                                    </label>
                                    <select
                                        name="semester"
                                        value={formData.semester}
                                        onChange={handleChange}
                                        style={inputStyle}
                                    >
                                        <option value="all">All Semesters</option>
                                        <option value="1">Semester 1</option>
                                        <option value="2">Semester 2</option>
                                        <option value="3">Semester 3</option>
                                    </select>
                                </div>
                            </>
                        )}
                    </div>

                    <button
                        type="submit"
                        style={{
                            width: '100%',
                            padding: '16px',
                            backgroundColor: '#2563eb',
                            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '16px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '10px',
                            boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.3), 0 2px 4px -1px rgba(37, 99, 235, 0.2)'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(37, 99, 235, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(37, 99, 235, 0.3)';
                        }}
                    >
                        <span>🚀</span> {t('sendAnnouncement')}
                    </button>
                </form>
            </div>
        </div>
    );
};

const inputStyle = {
    width: '100%',
    padding: '14px',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    fontSize: '15px',
    color: '#1e293b',
    backgroundColor: '#f8fafc',
    transition: 'all 0.2s',
    outline: 'none'
};

export default AdminAnnouncements;
