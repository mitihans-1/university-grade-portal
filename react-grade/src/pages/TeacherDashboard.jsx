import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../utils/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Link } from 'react-router-dom';
import { Upload } from 'lucide-react';

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
    const [schedules, setSchedules] = useState([]);
    const [systemSettings, setSystemSettings] = useState(null);
    const [announcements, setAnnouncements] = useState([]);

    useEffect(() => {
        const fetchGradesAndSettings = async () => {
            try {
                setLoading(true);
                // Fetch public settings
                const settings = await api.getPublicSettings();
                setSystemSettings(settings);

                const allGrades = await api.getGrades(); // Teachers can reuse this or I can create a specific one

                // Filter grades uploaded by this teacher AND matching current year/semester
                const filteredGrades = allGrades.filter(g => {
                    const isMyGrade = g.uploadedBy === user?.teacherId;
                    const matchesYear = settings ? g.academicYear === settings.current_year : true;
                    const matchesSemester = settings ? g.semester === settings.current_semester : true;
                    return isMyGrade && matchesYear && matchesSemester;
                });

                setMyGrades(filteredGrades);

                // Calculate stats
                const counts = filteredGrades.reduce((acc, g) => {
                    const status = g.status?.toLowerCase() || 'pending';
                    acc[status] = (acc[status] || 0) + 1;
                    return acc;
                }, { pending: 0, approved: 0, published: 0 });

                setStats(counts);

                // Fetch schedules
                const scheduleData = await api.getSchedules({
                    department: user.department,
                    semester: settings ? settings.current_semester : '1'
                });
                setSchedules(scheduleData || []);

                // Fetch Announcements
                try {
                    const notifyData = await api.getNotifications();
                    setAnnouncements(Array.isArray(notifyData) ? notifyData.filter(n => ['broadcast', 'exam_code'].includes(n.type)).slice(0, 3) : []);
                } catch (e) {
                    console.error('Error fetching teacher announcements:', e);
                }

            } catch (error) {
                console.error('Error fetching teacher data:', error);
            } finally {
                setLoading(false);
            }
        };

        if (user?.teacherId) {
            fetchGradesAndSettings();
        } else {
            setLoading(false);
        }
    }, [user]);

    if (loading) {
        return <LoadingSpinner fullScreen />;
    }

    return (
        <div className="dashboard-container">
            <div className="responsive-header" style={{ marginBottom: '20px' }}>
                <div>
                    <h1 style={{ marginBottom: '5px', fontSize: '1.8rem' }}>{t('teacherDashboard') || 'Teacher Dashboard'}</h1>
                    <p style={{ color: '#666' }}>{t('welcomeBack')}, {user?.name}</p>
                    <p style={{ color: '#888', fontSize: '14px' }}>
                        {user?.department} • {user?.teacherId} • Year {user?.year || 'N/A'} • Semester {user?.semester || 'N/A'}
                    </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
                    {systemSettings && (
                        <div style={{
                            backgroundColor: '#f5f5f5',
                            padding: '8px 15px',
                            borderRadius: '8px',
                            fontSize: '14px',
                            border: '1px solid #ddd',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontWeight: 'bold',
                            color: '#444'
                        }}>
                            📅 {systemSettings.current_year} {systemSettings.current_semester}
                        </div>
                    )}
                    <Link
                        to="/teacher/upload"
                        style={{
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            padding: '10px 20px',
                            borderRadius: '8px',
                            textDecoration: 'none',
                            fontWeight: 'bold',
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: '0 4px 6px rgba(59, 130, 246, 0.2)',
                            transition: 'all 0.2s',
                            justifyContent: 'center',
                            flex: '1',
                            minWidth: 'fit-content'
                        }}
                    >
                        <Upload size={18} /> {t('uploadGrades')}
                    </Link>
                </div>
            </div>

            <div style={{
                background: 'linear-gradient(135deg, #fdf4ff 0%, #f5d0fe 100%)',
                padding: '24px',
                borderRadius: '16px',
                border: '1px solid #f0abfc',
                marginBottom: '30px',
                display: 'flex',
                flexDirection: 'column',
                gap: '15px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#701a75' }}>
                    <div style={{ fontSize: '24px' }}>🏫</div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        {t('assignedFacultyRecords')}
                    </h3>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '20px' }}>
                    <div style={{ backgroundColor: 'rgba(255,255,255,0.6)', padding: '15px', borderRadius: '12px' }}>
                        <div style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px', fontWeight: '700' }}>{t('facultyDepartment')}</div>
                        <div style={{ fontWeight: '800', color: '#1f2937', fontSize: '15px' }}>{user?.department || t('notAssigned')}</div>
                    </div>
                    <div style={{ backgroundColor: 'rgba(255,255,255,0.6)', padding: '15px', borderRadius: '12px' }}>
                        <div style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px', fontWeight: '700' }}>{t('primarySubject')}</div>
                        <div style={{ fontWeight: '800', color: '#1f2937', fontSize: '15px' }}>{user?.subject || t('flexible')}</div>
                    </div>
                    <div style={{ backgroundColor: 'rgba(255,255,255,0.6)', padding: '15px', borderRadius: '12px' }}>
                        <div style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px', fontWeight: '700' }}>{t('specialization')}</div>
                        <div style={{ fontWeight: '800', color: '#1f2937', fontSize: '15px' }}>{user?.specialization || t('general')}</div>
                    </div>
                    <div style={{ backgroundColor: 'rgba(255,255,255,0.6)', padding: '15px', borderRadius: '12px' }}>
                        <div style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px', fontWeight: '700' }}>{t('hiredSince')}</div>
                        <div style={{ fontWeight: '800', color: '#1f2937', fontSize: '15px' }}>{user?.year || '2025'}</div>
                    </div>
                </div>
            </div>

            <div className="responsive-grid" style={{
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
                    <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#888' }}>{t('waitingForAdminReview')}</p>
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
                    <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#888' }}>{t('readyToBePublished')}</p>
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
                    <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#888' }}>{t('visibleToStudentsParents')}</p>
                </div>
                <Link to="/teacher/exams/create" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '20px',
                        borderRadius: '10px',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                        borderLeft: '4px solid #6366f1',
                        height: '100%',
                        transition: 'transform 0.2s',
                        cursor: 'pointer'
                    }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                        <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '14px' }}>{t('onlineExams')}</p>
                        <h2 style={{ margin: 0, color: '#6366f1' }}>📝</h2>
                        <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#888' }}>{t('createOnlineExam')}</p>
                    </div>
                </Link>
                <Link to="/schedule" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '20px',
                        borderRadius: '10px',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                        borderLeft: '4px solid #a855f7',
                        height: '100%',
                        transition: 'transform 0.2s',
                        cursor: 'pointer'
                    }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                        <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '14px' }}>{t('classSchedule')}</p>
                        <h2 style={{ margin: 0, color: '#a855f7' }}>📅</h2>
                        <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#888' }}>{t('viewTeachingTimetable')}</p>
                    </div>
                </Link>
            </div>



            {/* Class Schedule Section */}
            <div style={{
                backgroundColor: 'white',
                padding: '25px',
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                marginBottom: '30px',
                border: '1px solid #f1f5f9'
            }}>
                <div className="responsive-header" style={{ marginBottom: '20px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '24px' }}>📅</span> {t('weeklySchedule')}
                    </h3>
                    <Link to="/schedule" style={{ fontSize: '14px', color: '#3b82f6', fontWeight: 'bold', textDecoration: 'none' }}>
                        {t('viewFullSchedule')} →
                    </Link>
                </div>

                {schedules.length > 0 ? (
                    <div className="responsive-grid" style={{ gap: '15px' }}>
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => {
                            const dayClasses = schedules.filter(s => s.dayOfWeek === day);
                            const isToday = new Date().toLocaleDateString('en-US', { weekday: 'long' }) === day;

                            return (
                                <div key={day} style={{
                                    backgroundColor: isToday ? '#f0f9ff' : '#f8fafc',
                                    padding: '15px',
                                    borderRadius: '12px',
                                    border: isToday ? '1px solid #bae6fd' : '1px solid #e2e8f0',
                                    transition: 'all 0.2s'
                                }}>
                                    <div style={{
                                        fontWeight: '800',
                                        fontSize: '12px',
                                        color: isToday ? '#0369a1' : '#64748b',
                                        marginBottom: '10px',
                                        textTransform: 'uppercase',
                                        display: 'flex',
                                        justifyContent: 'space-between'
                                    }}>
                                        {t(day.toLowerCase())}
                                        {isToday && <span style={{ fontSize: '10px', backgroundColor: '#3b82f6', color: 'white', padding: '1px 6px', borderRadius: '4px' }}>{t('today').toUpperCase()}</span>}
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {dayClasses.length > 0 ? dayClasses.map(cls => (
                                            <div key={cls.id} style={{
                                                backgroundColor: 'white',
                                                padding: '10px',
                                                borderRadius: '8px',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
                                                borderLeft: `4px solid ${cls.type === 'lecture' ? '#3b82f6' : cls.type === 'lab' ? '#8b5cf6' : '#f43f5e'}`
                                            }}>
                                                <div style={{ fontWeight: '700', fontSize: '14px', color: '#0f172a' }}>{cls.courseName}</div>
                                                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                                                    {cls.startTime} - {cls.endTime} • {cls.room || 'TBA'}
                                                </div>
                                            </div>
                                        )) : (
                                            <div style={{ fontSize: '12px', color: '#cbd5e1', fontStyle: 'italic', padding: '10px' }}>
                                                {t('noClasses')}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                        <p>{t('noScheduleAvailableForDept')}</p>
                    </div>
                )}
            </div>

            {/* Announcements Section */}
            <div style={{
                backgroundColor: 'white',
                padding: '25px',
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                marginBottom: '30px',
                borderLeft: '6px solid #f59e0b'
            }}>
                <div className="responsive-header" style={{ marginBottom: '20px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '24px' }}>📢</span> {t('notifications') || 'Announcements'}
                    </h3>
                    <Link to="/messages" style={{ fontSize: '14px', color: '#3b82f6', fontWeight: 'bold', textDecoration: 'none' }}>
                        {t('viewAll') || 'View All'} →
                    </Link>
                </div>

                {announcements.length > 0 ? (
                    <div className="responsive-stack" style={{ gap: '12px' }}>
                        {announcements.map(anno => (
                            <div key={anno.id} style={{
                                padding: '15px',
                                backgroundColor: '#fffbeb',
                                borderRadius: '12px',
                                border: '1px solid #fef3c7',
                                display: 'flex',
                                gap: '15px',
                                alignItems: 'flex-start'
                            }}>
                                <div style={{ fontSize: '24px', opacity: 0.7 }}>🔔</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                        <span style={{ fontWeight: '700', fontSize: '15px', color: '#92400e' }}>{anno.title}</span>
                                        <span style={{ fontSize: '12px', color: '#b45309' }}>{new Date(anno.date || anno.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '13px', color: '#b45309', lineHeight: '1.5' }}>{anno.message}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                        <p>{t('noNotifications') || 'No announcements yet'}</p>
                    </div>
                )}
            </div>

            <div style={{
                backgroundColor: 'white',
                padding: '25px',
                borderRadius: '10px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
            }}>
                <h3 style={{ marginBottom: '20px' }}>{t('recentUploads')}</h3>
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
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <span style={{
                                                    padding: '4px 10px',
                                                    borderRadius: '20px',
                                                    fontSize: '12px',
                                                    fontWeight: 'bold',
                                                    width: 'fit-content',
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
                                                {grade.status === 'rejected' && grade.rejectionReason && (
                                                    <div style={{
                                                        fontSize: '11px',
                                                        color: '#c62828',
                                                        fontStyle: 'italic',
                                                        maxWidth: '200px',
                                                        lineHeight: '1.2'
                                                    }}>
                                                        <strong>{t('note')}:</strong> {grade.rejectionReason}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p style={{ textAlign: 'center', color: '#666', padding: '40px' }}>
                        {t('noGradesUploadedYet')}
                    </p>
                )}
            </div>
        </div>
    );
};

export default TeacherDashboard;
