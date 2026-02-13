import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { BookOpen, GraduationCap, Award, Calendar, CheckCircle, TrendingUp, ChevronRight, FileText } from 'lucide-react';
import '../premium-pages.css';

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
        if (!grade) return '#64748b';
        if (grade.includes('A')) return '#10b981';
        if (grade.includes('B')) return '#3b82f6';
        if (grade.includes('C')) return '#f59e0b';
        return '#ef4444';
    };

    if (loading) return <LoadingSpinner fullScreen />;

    return (
        <div className="premium-page-container fade-in">
            <div className="premium-glass-card">
                <header style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <h1 className="premium-title">{t('academicPerformance')}</h1>
                    <div className="year-badge" style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', background: 'transparent', boxShadow: 'none', animation: 'none' }}>
                        <span style={{ fontSize: '1rem', fontWeight: '700', opacity: 0.9 }}>MONITORING</span>
                        <span style={{ opacity: 0.4 }}>|</span>
                        <span style={{ fontSize: '1.4rem', fontWeight: '900', color: '#fff', textShadow: '0 2px 10px rgba(0,201,255,0.4)', background: 'rgba(255,255,255,0.1)', padding: '2px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)' }}>
                            {user.name}
                        </span>
                    </div>
                </header>

                <div style={{ overflowX: 'auto' }}>
                    <table className="premium-table">
                        <thead>
                            <tr>
                                <th><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><BookOpen size={16} /> {t('courseName')}</div></th>
                                <th><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Calendar size={16} /> {t('academicYear')}</div></th>
                                <th><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FileText size={16} /> {t('semester')}</div></th>
                                <th style={{ textAlign: 'center' }}><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><Award size={16} /> {t('grade')}</div></th>
                                <th><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><TrendingUp size={16} /> {t('score')}</div></th>
                                <th>{t('status')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {grades.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ padding: '60px', textAlign: 'center', opacity: 0.5 }}>
                                        {t('noGradesFound')}
                                    </td>
                                </tr>
                            ) : (
                                grades.map((item, index) => (
                                    <tr key={index} className="stagger-item">
                                        <td style={{ fontWeight: '700' }}>{item.courseName}</td>
                                        <td style={{ opacity: 0.7 }}>{item.academicYear || '2023/24'}</td>
                                        <td style={{ opacity: 0.7 }}>{item.semester || '1'}</td>
                                        <td style={{ textAlign: 'center' }}>
                                            <span style={{
                                                display: 'inline-block',
                                                padding: '4px 15px',
                                                borderRadius: '50px',
                                                backgroundColor: 'rgba(255,255,255,0.1)',
                                                border: `1px solid ${getGradeColor(item.grade)}`,
                                                color: getGradeColor(item.grade),
                                                fontWeight: '900',
                                                minWidth: '50px',
                                                fontSize: '1rem'
                                            }}>
                                                {item.grade || 'N/A'}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '120px' }}>
                                                <div style={{ flex: 1, height: '6px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '10px', overflow: 'hidden' }}>
                                                    <div style={{ width: `${Math.min(item.score || 0, 100)}%`, height: '100%', background: `linear-gradient(90deg, #3b82f6, ${getGradeColor(item.grade)})` }}></div>
                                                </div>
                                                <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>{item.score || 0}%</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span style={{
                                                backgroundColor: (item.status === 'published' || item.published) ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                                color: (item.status === 'published' || item.published) ? '#10b981' : '#f59e0b',
                                                padding: '4px 12px',
                                                borderRadius: '50px',
                                                fontSize: '10px',
                                                fontWeight: '900',
                                                textTransform: 'uppercase',
                                                border: `1px solid ${(item.status === 'published' || item.published) ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`
                                            }}>
                                                {(item.status === 'published' || item.published) ? t('published') : t('pending')}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ParentGrades;

