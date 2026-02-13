import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../utils/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Link } from 'react-router-dom';
import QRScanner from '../components/QRScanner';
import {
    Upload,
    QrCode,
    Calendar,
    FileText,
    CheckCircle2,
    Clock,
    Bell,
    ChevronRight,
    TrendingUp,
    BookOpen,
    Award
} from 'lucide-react';

const TeacherDashboard = () => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [showScanner, setShowScanner] = useState(false);
    const [stats, setStats] = useState({
        pending: 0,
        approved: 0,
        published: 0
    });
    const [myGrades, setMyGrades] = useState([]);
    const [systemSettings, setSystemSettings] = useState(null);
    const [schedules, setSchedules] = useState([]);
    const [announcements, setAnnouncements] = useState([]);

    useEffect(() => {
        fetchGradesAndSettings();
    }, [user]);

    const fetchGradesAndSettings = async () => {
        if (!user) return;
        try {
            setLoading(true);
            const [gradesData, settings, scheduleData, notificationData] = await Promise.all([
                api.getMyGrades(),
                api.getPublicSettings(),
                api.getTeacherSchedule(user.teacherId).catch(() => []),
                api.getNotifications().catch(() => [])
            ]);

            const grades = Array.isArray(gradesData) ? gradesData : [];
            setMyGrades(grades);

            setStats({
                pending: grades.filter(g => g.status === 'pending').length,
                approved: grades.filter(g => g.status === 'approved').length,
                published: grades.filter(g => g.status === 'published').length
            });

            setSystemSettings(settings);
            setSchedules(Array.isArray(scheduleData) ? scheduleData : []);
            setAnnouncements(Array.isArray(notificationData) ? notificationData.slice(0, 5) : []);
        } catch (error) {
            console.error('Error fetching teacher data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleScan = async (token) => {
        try {
            setShowScanner(false);
            const result = await api.scanQR({
                qrToken: token,
                userId: user.teacherId,
                userType: 'teacher'
            });
            if (result.success) {
                let msg = result.message || t('sessionActivated');
                if (result.accessCode) {
                    msg += `\n\n${t('accessCode')}: ${result.accessCode}\n\n${t('shareCodeWithStudents')}`;
                }
                alert(msg);
            } else {
                alert(result.message || t('errorRecordingAttendance'));
            }
        } catch (error) {
            console.error(error);
            alert(error.message);
        }
    };

    if (loading) return <LoadingSpinner fullScreen />;

    const statCards = [
        { label: t('pending'), value: stats.pending, icon: <Clock size={24} />, color: '#f59e0b', bg: '#fef3c7' },
        { label: t('approved'), value: stats.approved, icon: <CheckCircle2 size={24} />, color: '#3b82f6', bg: '#dbeafe' },
        { label: t('published'), value: stats.published, icon: <Award size={24} />, color: '#10b981', bg: '#dcfce7' }
    ];

    const facultyInfo = [
        { label: t('facultyDepartment'), value: user?.department || t('notAssigned'), icon: '🏢' },
        { label: t('primarySubject'), value: user?.subject || t('flexible'), icon: '📚' },
        { label: t('specialization'), value: user?.specialization || t('general'), icon: '🎯' },
        { label: t('hiredSince'), value: user?.year || '2025', icon: '📅' }
    ];

    return (
        <div className="dashboard-container fade-in">
            <div className="dashboard-background" />

            {/* Welcome Header */}
            <header style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '50px',
                flexWrap: 'wrap',
                gap: '30px',
                position: 'relative',
                zIndex: 1
            }}>
                <div className="stagger-item">
                    <h1 className="gradient-text" style={{ fontSize: '3rem', marginBottom: '12px', lineHeight: 1.1 }}>
                        {t('teacherDashboard')}
                    </h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div className="icon-glow" style={{ color: 'var(--primary)', width: '48px', height: '48px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>👨‍🏫</div>
                        <div>
                            <p style={{ margin: 0, fontWeight: '800', color: 'var(--foreground)', fontSize: '1.2rem' }}>
                                {t('welcomeBack')}, <span style={{ color: 'var(--primary)' }}>{user?.name}</span>
                            </p>
                            <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)', fontWeight: '700' }}>
                                {user?.teacherId} • <span style={{ color: 'var(--foreground)' }}>{user?.department}</span>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="stagger-item" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <button onClick={() => setShowScanner(!showScanner)} className="modern-btn" style={{
                        background: showScanner ? '#ef4444' : 'var(--foreground)',
                        display: 'flex', gap: '10px', alignItems: 'center', padding: '14px 28px', borderRadius: '20px',
                        boxShadow: showScanner ? '0 8px 20px rgba(239, 68, 68, 0.3)' : '0 8px 20px rgba(15, 23, 42, 0.2)'
                    }}>
                        <QrCode size={20} /> <span style={{ fontWeight: '800' }}>{showScanner ? t('cancel') : t('scanQRCode')}</span>
                    </button>
                    <Link to="/teacher/upload" className="modern-btn" style={{
                        textDecoration: 'none', display: 'flex', gap: '10px', alignItems: 'center', padding: '14px 28px', borderRadius: '20px',
                        background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                        boxShadow: '0 8px 20px rgba(99, 102, 241, 0.3)'
                    }}>
                        <Upload size={20} /> <span style={{ fontWeight: '800' }}>{t('uploadGrades')}</span>
                    </Link>
                </div>
            </header>

            {showScanner && (
                <section className="premium-card stagger-item" style={{ marginBottom: '40px', textAlign: 'center' }}>
                    <h3 style={{ marginBottom: '24px', fontWeight: '900', color: 'var(--foreground)', fontSize: '1.5rem' }}>{t('scanClassQRCode')}</h3>
                    <div style={{ maxWidth: '500px', margin: '0 auto', borderRadius: '24px', overflow: 'hidden', border: '2px solid var(--glass-border)' }}>
                        <QRScanner onScanSuccess={handleScan} />
                    </div>
                </section>
            )}

            {/* Grid Layout */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '40px', position: 'relative', zIndex: 1 }}>

                {/* Left Column: Stats & Faculty Info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                        {statCards.map((card, idx) => (
                            <div key={idx} className="stat-card hover-scale stagger-item" style={{ padding: '24px', alignItems: 'center', textAlign: 'center' }}>
                                <div className="stat-icon-wrapper icon-glow" style={{
                                    background: card.bg, color: card.color, marginBottom: '12px'
                                }}>
                                    {card.icon}
                                </div>
                                <div className="stat-value" style={{ color: card.color }}>{card.value}</div>
                                <div className="stat-label">{card.label}</div>
                            </div>
                        ))}
                    </div>

                    <section className="premium-card stagger-item">
                        <h3 style={{ fontSize: '0.9rem', fontWeight: '900', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '12px', letterSpacing: '0.1em' }}>
                            <BookOpen size={22} color="var(--primary)" /> {t('assignedFacultyRecords')}
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
                            {facultyInfo.map((info, idx) => (
                                <div key={idx} style={{ background: 'rgba(255,255,255,0.4)', padding: '20px', borderRadius: '20px', border: '1px solid var(--glass-border)', transition: 'all 0.3s ease' }} className="hover-scale">
                                    <div style={{ fontSize: '0.75rem', fontWeight: '900', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>{info.label}</div>
                                    <div style={{ fontWeight: '900', color: 'var(--foreground)', fontSize: '1.1rem' }}>{info.value}</div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <Link to="/teacher/exams/create" className="premium-card hover-scale stagger-item" style={{ textDecoration: 'none', background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', color: 'white', position: 'relative', overflow: 'hidden', padding: '30px' }}>
                        <div style={{ position: 'relative', zIndex: 1 }}>
                            <h3 style={{ margin: 0, fontWeight: '900', fontSize: '1.8rem', letterSpacing: '-1px' }}>{t('onlineExams')}</h3>
                            <p style={{ opacity: 0.9, fontSize: '15px', margin: '8px 0 25px 0', fontWeight: '500' }}>{t('createOnlineExam')}</p>
                            <div className="modern-btn" style={{ width: 'fit-content', background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.3)', padding: '12px 24px', borderRadius: '16px', fontWeight: '800' }}>
                                {t('startNow')} <ChevronRight size={18} />
                            </div>
                        </div>
                        <FileText size={140} style={{ position: 'absolute', right: '-30px', bottom: '-30px', opacity: 0.15, transform: 'rotate(-15deg)' }} />
                    </Link>
                </div>

                {/* Middle Column: Schedule */}
                <section className="premium-card stagger-item" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                        <h3 style={{ margin: 0, fontWeight: '900', fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '15px', color: 'var(--foreground)' }}>
                            <div className="icon-glow" style={{ color: 'var(--primary)' }}><Calendar size={26} /></div> {t('weeklySchedule')}
                        </h3>
                        <Link to="/schedule" style={{ fontSize: '14px', fontWeight: '800', color: 'var(--primary)', textDecoration: 'none', background: 'white', padding: '8px 16px', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>{t('viewFull')} →</Link>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day, idx) => {
                            const dayClasses = schedules.filter(s => s.dayOfWeek === day);
                            const isToday = new Date().toLocaleDateString('en-US', { weekday: 'long' }) === day;

                            return (
                                <div key={day} className="hover-scale" style={{
                                    padding: '20px', borderRadius: '24px', background: isToday ? 'white' : 'rgba(255,255,255,0.3)',
                                    border: isToday ? '2px solid var(--primary)' : '1px solid var(--glass-border)',
                                    boxShadow: isToday ? '0 10px 30px rgba(99, 102, 241, 0.15)' : 'none',
                                    transition: 'all 0.3s ease'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', alignItems: 'center' }}>
                                        <span style={{ fontWeight: '900', fontSize: '0.85rem', textTransform: 'uppercase', color: isToday ? 'var(--primary)' : 'var(--text-muted)', letterSpacing: '0.1em' }}>{t(day.toLowerCase())}</span>
                                        {isToday && <span style={{ background: 'var(--primary)', color: 'white', fontSize: '10px', padding: '4px 10px', borderRadius: '12px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.05rem' }}>{t('today')}</span>}
                                    </div>
                                    {dayClasses.length > 0 ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            {dayClasses.map(cls => (
                                                <div key={cls.id} style={{ background: isToday ? 'var(--background)' : 'white', padding: '14px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', borderLeft: '5px solid var(--primary)', transition: 'all 0.2s ease' }}>
                                                    <div style={{ fontWeight: '800', fontSize: '15px', color: 'var(--foreground)' }}>{cls.courseName}</div>
                                                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <Clock size={14} /> {cls.startTime} - {cls.endTime} • <span style={{ color: 'var(--foreground)' }}>{cls.room}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '10px', opacity: 0.6 }}>{t('noClasses')}</div>}
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Right Column: Notifications & Recent Activity */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                    <section className="premium-card stagger-item">
                        <h3 style={{ margin: 0, fontWeight: '900', fontSize: '1.4rem', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '15px', color: 'var(--foreground)' }}>
                            <div className="icon-glow" style={{ color: '#f59e0b' }}><Bell size={26} /></div> {t('notifications')}
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {announcements.length > 0 ? announcements.map(anno => (
                                <div key={anno.id} style={{ padding: '20px', background: 'rgba(255, 251, 235, 0.6)', borderRadius: '24px', border: '1px solid #fef3c7', transition: 'all 0.3s ease' }} className="hover-scale">
                                    <div style={{ fontWeight: '900', fontSize: '15px', color: '#92400e', marginBottom: '6px' }}>{anno.title}</div>
                                    <p style={{ margin: 0, fontSize: '13px', color: '#b45309', opacity: 0.9, lineHeight: 1.5, fontWeight: '600' }}>{anno.message}</p>
                                </div>
                            )) : <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', opacity: 0.6, fontWeight: '600' }}>{t('noNotifications')}</div>}
                        </div>
                        <Link to="/messages" className="modern-btn" style={{ marginTop: '25px', background: 'white', color: 'var(--primary)', textDecoration: 'none', justifyContent: 'center', borderRadius: '18px', padding: '14px', fontWeight: '800', border: '1px solid var(--glass-border)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                            {t('viewAllMessages')}
                        </Link>
                    </section>

                    <section className="premium-card stagger-item">
                        <h3 style={{ margin: 0, fontWeight: '900', fontSize: '1.4rem', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '15px', color: 'var(--foreground)' }}>
                            <div className="icon-glow" style={{ color: '#10b981' }}><TrendingUp size={26} /></div> {t('recentActivity')}
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            {myGrades.slice(0, 4).map((grade, idx) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'white', borderRadius: '20px', border: '1px solid rgba(0,0,0,0.02)', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }} className="hover-scale">
                                    <div>
                                        <div style={{ fontWeight: '900', fontSize: '14px', color: 'var(--foreground)' }}>{grade.studentName}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '700' }}>{grade.courseCode}</div>
                                    </div>
                                    <div className={`status-badge status-${grade.status}`} style={{ fontSize: '11px', padding: '6px 12px' }}>
                                        {grade.grade}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default TeacherDashboard;
