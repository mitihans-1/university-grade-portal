import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../utils/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Link } from 'react-router-dom';

const TeacherDashboard = () => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [myGrades, setMyGrades] = useState([]);
    const [stats, setStats] = useState({
        pending: 0,
        approved: 0,
        published: 0
    });

    useEffect(() => {
        const fetchGrades = async () => {
            try {
                setLoading(true);
                const allGrades = await api.getGrades(); // Teachers can reuse this or I can create a specific one

                // Filter grades uploaded by this teacher
                const filteredGrades = allGrades.filter(g => g.uploadedBy === user?.teacherId);
                setMyGrades(filteredGrades);

                // Calculate stats
                const counts = filteredGrades.reduce((acc, g) => {
                    const status = g.status?.toLowerCase() || 'pending';
                    acc[status] = (acc[status] || 0) + 1;
                    return acc;
                }, { pending: 0, approved: 0, published: 0 });

                setStats(counts);
            } catch (error) {
                console.error('Error fetching teacher grades:', error);
            } finally {
                setLoading(false);
            }
        };

        if (user?.teacherId) {
            fetchGrades();
        } else {
            setLoading(false);
        }
    }, [user]);

    if (loading) {
        return <LoadingSpinner fullScreen />;
    }

    return (
        <div className="dashboard-container">
            <div style={{ marginBottom: '20px' }}>
                <h1 style={{ marginBottom: '5px', fontSize: '1.8rem' }}>{t('teacherDashboard') || 'Teacher Dashboard'}</h1>
                <p style={{ color: '#666' }}>{t('welcomeBack')}, {user?.name}</p>
                <p style={{ color: '#888', fontSize: '14px' }}>{user?.department} • {user?.teacherId}</p>
            </div>

            <div className="grid-container" style={{
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                marginBottom: '25px'
            }}>
                <div style={{
                    backgroundColor: 'white',
                    padding: '20px',
                    borderRadius: '10px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                    borderLeft: '4px solid #ed6c02'
                }}>
                    <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '14px' }}>{t('pending')}</p>
                    <h2 style={{ margin: 0, color: '#ed6c02' }}>{stats.pending}</h2>
                    <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#888' }}>Waiting for admin review</p>
                </div>
                <div style={{
                    backgroundColor: 'white',
                    padding: '20px',
                    borderRadius: '10px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                    borderLeft: '4px solid #1976d2'
                }}>
                    <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '14px' }}>{t('approved')}</p>
                    <h2 style={{ margin: 0, color: '#1976d2' }}>{stats.approved}</h2>
                    <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#888' }}>Ready to be published</p>
                </div>
                <div style={{
                    backgroundColor: 'white',
                    padding: '20px',
                    borderRadius: '10px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                    borderLeft: '4px solid #4caf50'
                }}>
                    <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '14px' }}>{t('published')}</p>
                    <h2 style={{ margin: 0, color: '#4caf50' }}>{stats.published}</h2>
                    <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#888' }}>Visible to students & parents</p>
                </div>
            </div>

            <div style={{
                backgroundColor: 'white',
                padding: '25px',
                borderRadius: '10px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                marginBottom: '20px'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ margin: 0 }}>{t('quickActions')}</h3>
                </div>
                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                    <Link
                        to="/teacher/upload"
                        style={{
                            padding: '15px 25px',
                            backgroundColor: '#9c27b0',
                            color: 'white',
                            textDecoration: 'none',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            fontWeight: 'bold',
                            boxShadow: '0 4px 12px rgba(156, 39, 176, 0.3)'
                        }}
                    >
                        <span>📤</span> {t('uploadGradesByYearAndSemester')}
                    </Link>
                    <Link
                        to="/teacher/assignments"
                        style={{
                            padding: '15px 25px',
                            backgroundColor: '#673ab7',
                            color: 'white',
                            textDecoration: 'none',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            fontWeight: 'bold',
                            boxShadow: '0 4px 12px rgba(103, 58, 183, 0.3)'
                        }}
                    >
                        <span>📚</span> My Assignments
                    </Link>
                    <Link
                        to="/messages"
                        style={{
                            padding: '15px 25px',
                            backgroundColor: '#2196f3',
                            color: 'white',
                            textDecoration: 'none',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            fontWeight: 'bold',
                            boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)'
                        }}
                    >
                        <span>💬</span> Messages
                    </Link>
                </div>
            </div>

            <div style={{
                backgroundColor: 'white',
                padding: '25px',
                borderRadius: '10px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
            }}>
                <h3 style={{ marginBottom: '20px' }}>{t('recentUploads') || 'My Recent Uploads'}</h3>
                {myGrades.length > 0 ? (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '2px solid #f5f5f5' }}>
                                    <th style={{ padding: '12px' }}>{t('courseName')}</th>
                                    <th style={{ padding: '12px' }}>{t('student')}</th>
                                    <th style={{ padding: '12px' }}>{t('academicYear')}</th>
                                    <th style={{ padding: '12px' }}>{t('semester')}</th>
                                    <th style={{ padding: '12px' }}>{t('grade')}</th>
                                    <th style={{ padding: '12px' }}>{t('status')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {myGrades.slice(0, 10).map((grade, index) => (
                                    <tr key={index} style={{ borderBottom: '1px solid #f5f5f5' }}>
                                        <td style={{ padding: '12px' }}>
                                            <div style={{ fontWeight: 'bold' }}>{grade.courseName}</div>
                                            <div style={{ fontSize: '12px', color: '#888' }}>{grade.courseCode}</div>
                                        </td>
                                        <td style={{ padding: '12px' }}>
                                            <div>{grade.studentName}</div>
                                            <div style={{ fontSize: '12px', color: '#888' }}>{grade.studentId}</div>
                                        </td>
                                        <td style={{ padding: '12px' }}>{grade.academicYear}</td>
                                        <td style={{ padding: '12px' }}>{grade.semester}</td>
                                        <td style={{ padding: '12px' }}>
                                            <span style={{
                                                padding: '4px 8px',
                                                backgroundColor: '#f0f0f0',
                                                borderRadius: '4px',
                                                fontWeight: 'bold'
                                            }}>{grade.grade}</span>
                                        </td>
                                        <td style={{ padding: '12px' }}>
                                            <span style={{
                                                padding: '4px 10px',
                                                borderRadius: '20px',
                                                fontSize: '12px',
                                                fontWeight: 'bold',
                                                backgroundColor:
                                                    grade.status === 'published' ? '#e8f5e9' :
                                                        grade.status === 'approved' ? '#e3f2fd' :
                                                            grade.status === 'rejected' ? '#ffebee' : '#fff3e0',
                                                color:
                                                    grade.status === 'published' ? '#2e7d32' :
                                                        grade.status === 'approved' ? '#1976d2' :
                                                            grade.status === 'rejected' ? '#c62828' : '#ef6c00',
                                            }}>
                                                {t(grade.status?.toLowerCase()) || grade.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p style={{ textAlign: 'center', color: '#666', padding: '40px' }}>
                        No grades uploaded yet. Start by clicking "Upload Grades".
                    </p>
                )}
            </div>
        </div>
    );
};

export default TeacherDashboard;
