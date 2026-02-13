import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../utils/api';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
  BookOpen, GraduationCap, CheckCircle2, Calendar, Clock,
  Bell, ChevronRight, TrendingUp, Award, ShieldAlert,
  MapPin, Trophy, Layout, Zap, Megaphone, Activity,
  FileText, User, Star
} from 'lucide-react';
import '../admin-dashboard.css';

const StudentDashboard = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [systemSettings, setSystemSettings] = useState(null);
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    const fetchStudentData = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const [settings, gradesData] = await Promise.all([
          api.getPublicSettings(),
          api.getMyGrades()
        ]);

        setSystemSettings(settings);
        setGrades(Array.isArray(gradesData) ? gradesData : []);

        api.getAttendanceSummary(user.studentId).then(setAttendanceSummary).catch(() => null);
        api.getNotifications().then(data => {
          const filtered = Array.isArray(data) ? data.filter(n => ['broadcast', 'exam_code'].includes(n.type)).slice(0, 5) : [];
          setAnnouncements(filtered);
        }).catch(() => []);
      } catch (error) {
        console.error('Error fetching student data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStudentData();
  }, [user]);

  const calculateGPA = () => {
    if (!Array.isArray(grades) || grades.length === 0) return '0.00';
    const gradePoints = { 'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7, 'C+': 2.3, 'C': 2.0, 'C-': 1.7, 'D': 1.0, 'F': 0.0 };
    let totalPoints = 0, totalCredits = 0;
    grades.forEach(g => {
      const credits = g.creditHours || g.credits || 3;
      totalPoints += (gradePoints[g.grade] || 0) * credits;
      totalCredits += credits;
    });
    return (totalPoints / (totalCredits || 1)).toFixed(2);
  };

  const calculateTotalCredits = () => {
    if (!Array.isArray(grades)) return 0;
    return grades.reduce((acc, curr) => acc + (curr.creditHours || curr.credits || 0), 0);
  };

  if (loading) return <LoadingSpinner fullScreen />;

  if (!user) return (
    <div className="admin-dashboard-container fade-in">
      <div className="admin-card" style={{ textAlign: 'center', padding: '100px 20px', maxWidth: '600px', margin: '40px auto' }}>
        <ShieldAlert size={80} color="#ef4444" style={{ marginBottom: '30px' }} />
        <h2 style={{ fontSize: '2rem', fontWeight: '900', marginBottom: '20px', color: '#1e293b' }}>{t('pleaseLogin')}</h2>
        <Link to="/login" className="admin-btn primary" style={{ maxWidth: '200px', margin: '0 auto' }}>{t('login')}</Link>
      </div>
    </div>
  );

  const gpa = parseFloat(calculateGPA());
  const totalCredits = calculateTotalCredits();
  const attendancePercent = attendanceSummary ? Math.round((attendanceSummary.present / (attendanceSummary.total || 1)) * 100) : 0;

  const statsCards = [
    {
      title: t('cumulativeGPA'),
      value: gpa.toFixed(2),
      icon: <TrendingUp size={24} />,
      color: '#3b82f6',
      desc: 'Scaled on 4.0',
      link: '/student/grades'
    },
    {
      title: t('creditsEarned'),
      value: totalCredits,
      icon: <Award size={24} />,
      color: '#8b5cf6',
      desc: 'Total Units',
      link: '/student/grades'
    },
    {
      title: t('attendance'),
      value: `${attendancePercent}%`,
      icon: <CheckCircle2 size={24} />,
      color: '#10b981',
      desc: 'Overall Presence',
      link: '/student/attendance'
    },
    {
      title: t('academicStatus'),
      value: gpa >= 3.0 ? 'Good' : (gpa >= 2.0 ? 'Average' : 'Warning'),
      icon: <Activity size={24} />,
      color: gpa >= 3.0 ? '#0ea5e9' : (gpa >= 2.0 ? '#f59e0b' : '#ef4444'),
      desc: 'Current Standing',
      link: '#'
    }
  ];

  const quickActions = [
    { label: t('viewGrades'), path: '/student/grades', icon: <FileText size={20} />, color: '#3b82f6' },
    { label: t('classSchedule'), path: '/schedule', icon: <Calendar size={20} />, color: '#8b5cf6' },
    { label: t('myAssignments'), path: '/student/assignments', icon: <BookOpen size={20} />, color: '#ec4899' },
    { label: t('onlineExams'), path: '/student/exams', icon: <Zap size={20} />, color: '#f59e0b' }
  ];

  return (
    <div className="admin-dashboard-container fade-in">
      {/* Background Animations */}
      <div className="floating-shapes">
        <div style={{ top: '15%', left: '5%', width: '100px', height: '100px', animationDelay: '0s', opacity: 0.5 }}></div>
        <div style={{ top: '60%', left: '85%', width: '150px', height: '150px', animationDelay: '2s', opacity: 0.3 }}></div>
        <div style={{ top: '30%', left: '60%', width: '80px', height: '80px', animationDelay: '4s', opacity: 0.4 }}></div>
      </div>

      <div className="admin-card" style={{ maxWidth: '1200px', margin: '0 auto', background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(20px)' }}>

        <header className="admin-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6366f1', marginBottom: '5px', fontWeight: '700', fontSize: '0.8rem', letterSpacing: '1px', textTransform: 'uppercase' }}>
              <GraduationCap size={16} /> Student Portal
            </div>
            <h1 className="admin-title" style={{ textAlign: 'left', marginBottom: '5px' }}>
              {t('welcomeBack')}, <span className="gradient-text">{user.name.split(' ')[0]}</span>
            </h1>
            <p className="admin-subtitle">
              {user.department} • Year {user.year}
            </p>
          </div>

          <div className="year-badge">
            <span style={{ fontSize: '1.2rem', fontWeight: '900', color: '#1e293b' }}>SEM {systemSettings?.current_semester}</span>
            <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#64748b', marginTop: '2px' }}>ACADEMIC CYCLE</div>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="admin-stats-grid">
          {statsCards.map((card, idx) => (
            <Link key={idx} to={card.link} className="stat-card-glass" style={{ textDecoration: 'none' }}>
              <div className="stat-icon-box" style={{ color: card.color, background: `${card.color}15` }}>
                {card.icon}
              </div>
              <div>
                <div className="stat-value" style={{ background: `linear-gradient(135deg, ${card.color}, #1e293b)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {card.value}
                </div>
                <div className="stat-label">{card.title}</div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>{card.desc}</div>
              </div>
            </Link>
          ))}
        </div>

        {/* Main Content Layout */}
        <div className="admin-content-grid">

          {/* Left Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>

            {/* Recent Academic Performance */}
            <div className="admin-card" style={{ padding: '25px', boxShadow: '0 4px 20px -5px rgba(0,0,0,0.05)' }}>
              <div className="section-title">
                <Award size={20} color="#f59e0b" />
                {t('coursePerformance')}
              </div>
              {grades.length > 0 ? (
                <div className="table-container" style={{ border: 'none', boxShadow: 'none' }}>
                  <table className="dash-table">
                    <thead>
                      <tr>
                        <th style={{ paddingLeft: '10px' }}>Course</th>
                        <th>Credit</th>
                        <th>Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {grades.slice(0, 5).map((g, i) => (
                        <tr key={i}>
                          <td style={{ paddingLeft: '10px', fontWeight: '600' }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span>{g.courseName}</span>
                              <span style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: '400' }}>{g.code}</span>
                            </div>
                          </td>
                          <td>{g.creditHours || g.credits || 3}</td>
                          <td>
                            <span style={{
                              padding: '4px 10px', borderRadius: '8px', fontWeight: '800', fontSize: '0.85rem',
                              background: ['A', 'A-'].includes(g.grade) ? '#dcfce7' : ['B+', 'B', 'B-'].includes(g.grade) ? '#dbeafe' : '#fef3c7',
                              color: ['A', 'A-'].includes(g.grade) ? '#166534' : ['B+', 'B', 'B-'].includes(g.grade) ? '#1e40af' : '#92400e'
                            }}>
                              {g.grade}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon-box">
                    <FileText size={28} color="#94a3b8" />
                  </div>
                  <h4 style={{ margin: '0 0 5px 0', color: '#475569', fontSize: '0.95rem' }}>No Academic Records</h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>
                    Grades for this semester haven't been published yet.
                  </p>
                </div>
              )}
              <Link to="/student/grades" className="btn-view-all">
                <span>View Full Transcript</span>
                <ChevronRight size={16} />
              </Link>
            </div>

          </div>

          {/* Right Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>

            {/* Quick Actions */}
            <div className="quick-actions-grid">
              {quickActions.map((action, idx) => (
                <Link
                  key={idx}
                  to={action.path}
                  className="quick-action-card"
                  style={{
                    '--accent-color': action.color,
                    '--bg-color-light': `${action.color}15`
                  }}
                >
                  <div className="quick-action-icon">
                    {action.icon}
                  </div>
                  <span className="quick-action-label">{action.label}</span>
                </Link>
              ))}
            </div>

            {/* Announcements */}
            <div className="admin-card" style={{ padding: '25px', borderTop: '4px solid #6366f1' }}>
              <div className="section-title" style={{ marginBottom: '20px' }}>
                <Megaphone size={20} color="#6366f1" />
                {t('announcements')}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {announcements.length > 0 ? announcements.map(anno => (
                  <div key={anno.id} className="activity-item" style={{ alignItems: 'flex-start', background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: '800', color: anno.type === 'exam_code' ? '#ea580c' : '#3b82f6', textTransform: 'uppercase' }}>
                          {anno.type === 'exam_code' ? 'EXAM' : 'NOTICE'}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{new Date(anno.createdAt).toLocaleDateString()}</span>
                      </div>
                      <h4 style={{ fontSize: '0.9rem', marginBottom: '5px', color: '#1f2937' }}>{anno.title}</h4>
                      <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: 0, lineHeight: '1.4' }}>{anno.message}</p>
                    </div>
                  </div>
                )) : (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
                    <Bell size={24} style={{ opacity: 0.5, marginBottom: '5px' }} />
                    <p style={{ fontSize: '0.85rem' }}>No new announcements</p>
                  </div>
                )}
              </div>
              <Link to="/student/notifications" style={{ display: 'block', textAlign: 'center', marginTop: '15px', fontSize: '0.85rem', color: '#6366f1', fontWeight: '700', textDecoration: 'none' }}>
                View All
              </Link>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default StudentDashboard;
