import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../utils/api';

const StudentAttendance = () => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [attendance, setAttendance] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAttendance = async () => {
            if (!user?.studentId) return;
            try {
                setLoading(true);
                const [attendanceData, summaryData] = await Promise.all([
                    api.getStudentAttendance(user.studentId),
                    api.getAttendanceSummary(user.studentId)
                ]);
                setAttendance(Array.isArray(attendanceData) ? attendanceData : []);
                setSummary(summaryData);
            } catch (error) {
                console.error('Error fetching attendance:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAttendance();
    }, [user]);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <div style={{ fontSize: '24px', color: '#1a237e' }}>⏳ {t('loading')}...</div>
            </div>
        );
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'present': return '#2e7d32';
            case 'absent': return '#d32f2f';
            case 'late': return '#ed6c02';
            case 'excused': return '#0288d1';
            default: return '#666';
        }
    };

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '30px 20px' }}>
            <div style={{ marginBottom: '40px' }}>
                <h1 style={{ color: '#1a237e', margin: '0 0 10px 0' }}>{t('attendanceHistory')}</h1>
                <p style={{ color: '#546e7a', fontSize: '1.1rem' }}>{t('viewPresenceRecords')}</p>
            </div>

            {summary && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '20px',
                    marginBottom: '40px'
                }}>
                    <div style={cardStyle('#2e7d32')}>
                        <span style={{ fontSize: '14px', color: '#546e7a', fontWeight: 'bold' }}>{t('attendanceRate')}</span>
                        <h2 style={{ margin: '15px 0', fontSize: '36px', color: '#1a237e' }}>{summary.percentage}%</h2>
                        <div style={{ height: '10px', backgroundColor: '#e0e0e0', borderRadius: '5px', overflow: 'hidden' }}>
                            <div style={{ width: `${summary.percentage}%`, height: '100%', backgroundColor: '#2e7d32', transition: 'width 1s ease-in-out' }}></div>
                        </div>
                    </div>
                    <div style={cardStyle('#1976d2')}>
                        <span style={{ fontSize: '14px', color: '#546e7a', fontWeight: 'bold' }}>{t('totalSessions')}</span>
                        <h2 style={{ margin: '15px 0', fontSize: '36px', color: '#1a237e' }}>{summary.total}</h2>
                    </div>
                    <div style={cardStyle('#4caf50')}>
                        <span style={{ fontSize: '14px', color: '#546e7a', fontWeight: 'bold' }}>{t('present')}</span>
                        <h2 style={{ margin: '15px 0', fontSize: '36px', color: '#1a237e' }}>{summary.present}</h2>
                    </div>
                    <div style={cardStyle('#f44336')}>
                        <span style={{ fontSize: '14px', color: '#546e7a', fontWeight: 'bold' }}>{t('absent')}</span>
                        <h2 style={{ margin: '15px 0', fontSize: '36px', color: '#1a237e' }}>{summary.absent}</h2>
                    </div>
                </div>
            )}

            <div style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                padding: '25px',
                overflowX: 'auto'
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '2px solid #e8eaf6' }}>
                            <th style={{ padding: '15px', color: '#1a237e' }}>{t('date')}</th>
                            <th style={{ padding: '15px', color: '#1a237e' }}>{t('courses')}</th>
                            <th style={{ padding: '15px', color: '#1a237e' }}>{t('status')}</th>
                            <th style={{ padding: '15px', color: '#1a237e' }}>{t('remarks')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {attendance.length > 0 ? (
                            attendance.map((record) => (
                                <tr key={record.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                                    <td style={{ padding: '15px', whiteSpace: 'nowrap' }}>{new Date(record.date).toLocaleDateString()}</td>
                                    <td style={{ padding: '15px' }}>
                                        <div style={{ fontWeight: 'bold', color: '#333' }}>{record.courseCode}</div>
                                        <div style={{ fontSize: '13px', color: '#666' }}>{record.courseName}</div>
                                    </td>
                                    <td style={{ padding: '15px' }}>
                                        <span style={{
                                            padding: '6px 12px',
                                            borderRadius: '20px',
                                            fontSize: '12px',
                                            fontWeight: 'bold',
                                            backgroundColor: `${getStatusColor(record.status)}15`,
                                            color: getStatusColor(record.status),
                                            textTransform: 'capitalize',
                                            border: `1px solid ${getStatusColor(record.status)}30`
                                        }}>
                                            {t(record.status)}
                                        </span>
                                    </td>
                                    <td style={{ padding: '15px', color: '#546e7a', fontSize: '14px' }}>{record.remarks || '-'}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: '#90a4ae' }}>
                                    <div style={{ fontSize: '48px', marginBottom: '10px' }}>📄</div>
                                    {t('noAttendanceRecords')}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const cardStyle = (borderColor) => ({
    backgroundColor: 'white',
    padding: '25px',
    borderRadius: '16px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
    borderTop: `6px solid ${borderColor}`,
    display: 'flex',
    flexDirection: 'column'
});

export default StudentAttendance;
