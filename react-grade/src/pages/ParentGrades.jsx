import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const ParentGrades = () => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [grades, setGrades] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGrades = async () => {
            try {
                setLoading(true);
                if (user && user.studentId) {
                    const gradesData = await api.getStudentGrades(user.studentId);
                    setGrades(gradesData || []);
                }
            } catch (error) {
                console.error('Error fetching grades:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchGrades();
    }, [user]);

    const getGradeColor = (grade) => {
        if (grade.includes('A')) return '#2e7d32';
        if (grade.includes('B')) return '#1976d2';
        if (grade.includes('C')) return '#ed6c02';
        return '#d32f2f';
    };

    const getStatusColor = (status) => {
        return (status === 'published' || status) ? '#2e7d32' : '#ed6c02';
    };

    return (
        <div className="fade-in" style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 20px' }}>
            <div style={{
                backgroundColor: 'white',
                padding: '30px',
                borderRadius: '10px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px' }}>
                    <div style={{
                        width: '50px',
                        height: '50px',
                        backgroundColor: '#1976d2',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '24px',
                        marginRight: '20px'
                    }}>
                        📚
                    </div>
                    <div>
                        <h2 style={{ margin: 0 }}>{t('academicPerformance')}</h2>
                        <p style={{ margin: '5px 0 0', color: '#666' }}>{t('detailedGradeView')}</p>
                    </div>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                        <p>{t('loadingGrades')}</p>
                    </div>
                ) : grades.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                        <h3>{t('noGradesFound')}</h3>
                        <p>{t('noGradesRecordedMessage')}</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f5f5f5' }}>
                                    <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>{t('courseName')}</th>
                                    <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>{t('academicYear')}</th>
                                    <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>{t('semester')}</th>
                                    <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>{t('grade')}</th>
                                    <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>{t('score')}</th>
                                    <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>{t('creditHours')}</th>
                                    <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>{t('status')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {grades.map((item, index) => (
                                    <tr key={index} className="table-row-animate" style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '15px', fontWeight: 'bold' }}>{item.courseName}</td>
                                        <td style={{ padding: '15px' }}>{item.academicYear || 'N/A'}</td>
                                        <td style={{ padding: '15px' }}>{item.semester || 'N/A'}</td>
                                        <td style={{ padding: '15px' }}>
                                            <span style={{
                                                backgroundColor: getGradeColor(item.grade),
                                                color: 'white',
                                                padding: '6px 12px',
                                                borderRadius: '20px',
                                                fontWeight: 'bold',
                                                display: 'inline-block',
                                                minWidth: '40px',
                                                textAlign: 'center'
                                            }}>
                                                {item.grade}
                                            </span>
                                        </td>
                                        <td style={{ padding: '15px', fontWeight: 'bold' }}>{item.score}%</td>
                                        <td style={{ padding: '15px' }}>{item.creditHours || 3}</td>
                                        <td style={{ padding: '15px' }}>
                                            <span style={{ color: getStatusColor(item.status), fontWeight: 'bold' }}>
                                                {item.status === 'published' ? t('excellent') : item.status || t('active')}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ParentGrades;
