import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../utils/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Link } from 'react-router-dom';

const AdminAnalytics = () => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                setLoading(true);
                const data = await api.getAdminAnalytics();
                setAnalytics(data);
            } catch (error) {
                console.error('Error fetching admin analytics:', error);
                // Set analytics to an empty object to prevent undefined errors
                setAnalytics({
                    averageUniversityGPA: 0,
                    totalStudents: 0,
                    totalGrades: 0,
                    atRiskStudents: [],
                    departmentBreakdown: [],
                    gradeDistribution: { A: 0, B: 0, C: 0, D: 0, F: 0 }
                });
            } finally {
                setLoading(false);
            }
        };

        if (user && user.permissions?.includes('view_analytics')) {
            fetchAnalytics();
        }
    }, [user]);

    if (loading) {
        return <LoadingSpinner fullScreen />;
    }

    if (!analytics) {
        return (
            <div style={{ textAlign: 'center', padding: '40px' }}>
                <h2>{t('noAnalyticsData')}</h2>
                <p>{t('ensureGradesUploaded')}</p>
            </div>
        );
    }

    if (!analytics) {
        return (
            <div style={{ textAlign: 'center', padding: '40px' }}>
                <h2>{t('noAnalyticsData')}</h2>
                <p>{t('ensureGradesUploaded')}</p>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px' }}>
            <div className="responsive-header" style={{ marginBottom: '30px' }}>
                <div>
                    <h1>{t('academicAnalytics')}</h1>
                    <p style={{ color: '#666' }}>{t('analyticsDescription')}</p>
                </div>
            </div>
            {/* Top Level Stats */}
            <div className="responsive-grid" style={{
                marginBottom: '30px'
            }}>
                <div style={statCardStyle('#1976d2')}>
                    <h3>{analytics.averageUniversityGPA || 0}</h3>
                    <p>{t('universityAvgGPA')}</p>
                </div>
                <div style={statCardStyle('#2e7d32')}>
                    <h3>{analytics.totalStudents || 0}</h3>
                    <p>{t('enrolledStudents')}</p>
                </div>
                <div style={statCardStyle('#ed6c02')}>
                    <h3>{analytics.totalGrades || 0}</h3>
                    <p>{t('totalGradesRecorded')}</p>
                </div>
                <div style={statCardStyle('#d32f2f')}>
                    <h3>{analytics.atRiskStudents?.length || 0}</h3>
                    <p>{t('studentsAtRisk')}</p>
                </div>
            </div>

            <div className="responsive-grid" style={{ gap: '30px', marginBottom: '30px' }}>
                {/* Department Breakdown Heatmap-like Table */}
                <div style={containerCardStyle}>
                    <h3 style={{ marginBottom: '20px' }}>{t('performanceByDepartment')}</h3>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '2px solid #eee' }}>
                                    <th style={{ padding: '12px' }}>{t('department')}</th>
                                    <th style={{ padding: '12px' }}>{t('avgGPA')}</th>
                                    <th style={{ padding: '12px' }}>{t('students')}</th>
                                    <th style={{ padding: '12px' }}>{t('status')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {analytics.departmentBreakdown?.map((dept, index) => (
                                    <tr key={index} style={{ borderBottom: '1px solid #f5f5f5' }}>
                                        <td style={{ padding: '12px', fontWeight: 'bold' }}>{t(dept.department.replace(/\s+/g, '').charAt(0).toLowerCase() + dept.department.replace(/\s+/g, '').slice(1)) || dept.department}</td>
                                        <td style={{ padding: '12px' }}>
                                            <span style={{
                                                padding: '4px 8px',
                                                backgroundColor: parseFloat(dept.avgGPA) >= 3.0 ? '#e8f5e9' : parseFloat(dept.avgGPA) >= 2.0 ? '#fff3e0' : '#ffebee',
                                                color: parseFloat(dept.avgGPA) >= 3.0 ? '#2e7d32' : parseFloat(dept.avgGPA) >= 2.0 ? '#ed6c02' : '#c62828',
                                                borderRadius: '4px',
                                                fontWeight: 'bold'
                                            }}>
                                                {dept.avgGPA}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px' }}>{dept.studentCount}</td>
                                        <td style={{ padding: '12px' }}>
                                            {parseFloat(dept.avgGPA) >= 3.0 ? `🌟 ${t('excellent')}` : parseFloat(dept.avgGPA) >= 2.5 ? `👍 ${t('good')}` : `⚠️ ${t('attention')}`}
                                        </td>
                                    </tr>
                                )) || []}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Grade Distribution */}
                <div style={containerCardStyle}>
                    <h3 style={{ marginBottom: '20px' }}>{t('generalGradeDistribution')}</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {['A', 'B', 'C', 'D', 'F'].map(grade => {
                            const count = analytics.gradeDistribution?.[grade] || 0;
                            const percentage = (count / (analytics.totalGrades || 1) * 100) || 0;
                            return (
                                <div key={grade}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '14px' }}>
                                        <span>{t('grade')} {grade}</span>
                                        <span>{count} ({percentage.toFixed(1)}%)</span>
                                    </div>
                                    <div style={{ height: '10px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
                                        <div style={{
                                            width: `${percentage}%`,
                                            height: '100%',
                                            backgroundColor: grade === 'A' ? '#4caf50' : grade === 'B' ? '#2196f3' : grade === 'C' ? '#ff9800' : '#ff5722',
                                            borderRadius: '5px'
                                        }}></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* At-Risk Students List */}
            <div style={containerCardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ color: '#c62828' }}>{t('atRiskStudentsTitle')}</h3>
                    <span style={{ fontSize: '14px', color: '#666' }}>{analytics.atRiskStudents?.length || 0} {t('studentsFlagged')}</span>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '2px solid #eee' }}>
                                <th style={{ padding: '12px' }}>{t('studentId')}</th>
                                <th style={{ padding: '12px' }}>{t('name')}</th>
                                <th style={{ padding: '12px' }}>{t('department')}</th>
                                <th style={{ padding: '12px' }}>{t('gpa')}</th>
                                <th style={{ padding: '12px' }}>{t('issue')}</th>
                                <th style={{ padding: '12px' }}>{t('action')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {analytics.atRiskStudents?.map((student) => (
                                <tr key={student.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                                    <td style={{ padding: '12px' }}>{student.studentId}</td>
                                    <td style={{ padding: '12px', fontWeight: 'bold' }}>{student.name}</td>
                                    <td style={{ padding: '12px' }}>{student.department}</td>
                                    <td style={{ padding: '12px' }}>
                                        <span style={{ color: parseFloat(student.gpa) < 2.0 ? '#c62828' : 'inherit', fontWeight: 'bold' }}>
                                            {student.gpa}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        {student.hasFailing ? <span style={{ color: '#c62828', fontSize: '12px' }}>{t('hasFailedCourses')}</span> : <span style={{ color: '#ed6c02', fontSize: '12px' }}>{t('lowAcademicStanding')}</span>}
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        <Link
                                            to={`/admin/students?focus=search&search=${student.studentId}`}
                                            style={{
                                                padding: '6px 12px',
                                                backgroundColor: '#1976d2',
                                                color: 'white',
                                                textDecoration: 'none',
                                                borderRadius: '4px',
                                                fontSize: '12px'
                                            }}
                                        >
                                            {t('notifyParent')}
                                        </Link>
                                    </td>
                                </tr>
                            )) || []}
                        </tbody>
                    </table>
                    {(analytics.atRiskStudents?.length || 0) === 0 && (
                        <p style={{ textAlign: 'center', padding: '20px', color: '#666' }}>{t('noAtRiskStudents')}</p>
                    )}
                </div>
            </div>
        </div>
    );
};

const statCardStyle = (color) => ({
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '10px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    borderTop: `4px solid ${color}`,
    textAlign: 'center'
});

const containerCardStyle = {
    backgroundColor: 'white',
    padding: '25px',
    borderRadius: '10px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
};

export default AdminAnalytics;
