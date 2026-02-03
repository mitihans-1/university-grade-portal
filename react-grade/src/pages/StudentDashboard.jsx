import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../utils/api';
import { Link } from 'react-router-dom';
import LanguageSelector from '../components/common/LanguageSelector';

const SummaryCard = ({ to, icon, value, label, color }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link
      to={to}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        textDecoration: 'none',
        color: 'inherit',
        display: 'block',
        height: '100%'
      }}
    >
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '25px',
        textAlign: 'center',
        boxShadow: isHovered ? '0 10px 20px rgba(0,0,0,0.12)' : '0 4px 12px rgba(0,0,0,0.06)',
        borderBottom: `5px solid ${color}`,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isHovered ? 'translateY(-8px)' : 'translateY(0)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ fontSize: '40px', marginBottom: '10px' }}>{icon}</div>
        <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#333' }}>{value}</div>
        <div style={{ color: '#666', fontSize: '13px', fontWeight: '500', marginTop: '5px' }}>{label}</div>
      </div>
    </Link>
  );
};

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
      try {
        setLoading(true);
        // Fetch current system settings
        const settings = await api.getPublicSettings();
        setSystemSettings(settings);

        // Fetch student's grades
        const gradesData = await api.getMyGrades();
        const allGrades = Array.isArray(gradesData) ? gradesData : [];

        // You could filter here for current semester if desired, 
        // but often students want to see cumulative stats.
        // For now, we'll keep allGrades for cumulative GPA, 
        // but we might want a filtered list for "Current Semester" display.
        setGrades(allGrades);

        // Fetch attendance summary
        try {
          const attendanceData = await api.getAttendanceSummary(user.studentId);
          setAttendanceSummary(attendanceData);
        } catch (error) {
          console.error('Error fetching attendance summary:', error);
        }

        // Fetch announcements
        try {
          const notificationData = await api.getNotifications();
          setAnnouncements(Array.isArray(notificationData) ? notificationData.filter(n => ['broadcast', 'exam_code'].includes(n.type)).slice(0, 5) : []);
        } catch (error) {
          console.error('Error fetching announcements:', error);
        }
      } catch (error) {
        console.error('Error fetching student data:', error);
        setGrades([]);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchStudentData();
    }
  }, [user]);

  const calculateGPA = () => {
    if (!Array.isArray(grades)) {
      return '0.00';
    }

    const gradePoints = {
      'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7,
      'C+': 2.3, 'C': 2.0, 'C-': 1.7, 'D': 1.0, 'F': 0.0
    };

    let totalPoints = 0;
    let totalCredits = 0;

    grades.forEach(g => {
      const credits = g.creditHours || g.credits || 3;
      totalPoints += (gradePoints[g.grade] || 0) * credits;
      totalCredits += credits;
    });

    return totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';
  };

  if (!user) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '100px 20px',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{ fontSize: '48px' }}>🔒</div>
        <h2>Please log in to access your dashboard</h2>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Main Content */}
      <div className="fade-in">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
            <p style={{ color: '#666' }}>{t('loadingDashboard')}</p>
          </div>
        ) : (
          <div>


            {/* Welcome Section */}
            <div className="stagger-item" style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '30px',
              marginBottom: '30px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              borderLeft: '6px solid #1976d2',
              background: 'linear-gradient(to right, #ffffff, #f8faff)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {systemSettings && (
                <div style={{
                  position: 'absolute',
                  top: '15px',
                  right: '15px',
                  backgroundColor: '#e3f2fd',
                  color: '#1565c0',
                  padding: '5px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  border: '1px solid #bbdefb'
                }}>
                  📅 {systemSettings.current_year} {systemSettings.current_semester}
                </div>
              )}
              <div className="responsive-header" style={{ gap: '20px' }}>
                <div>
                  <h1 style={{ margin: '0 0 10px 0', color: '#1a237e', fontSize: 'clamp(1.5rem, 5vw, 2.2rem)' }}>
                    {t('welcomeMessage').replace('{name}', user?.name || 'Student')}
                  </h1>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{
                      backgroundColor: '#f1f5f9',
                      padding: '4px 12px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: '#475569',
                      fontWeight: '600',
                      border: '1px solid #e2e8f0'
                    }}>
                      🆔 {user?.studentId}
                    </div>
                    <div style={{
                      backgroundColor: '#e0f2fe',
                      padding: '4px 12px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: '#0369a1',
                      fontWeight: '600',
                      border: '1px solid #bae6fd'
                    }}>
                      🏢 {user?.department || 'General Science'}
                    </div>
                    <div style={{
                      backgroundColor: '#fef3c7',
                      padding: '4px 12px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: '#b45309',
                      fontWeight: '600',
                      border: '1px solid #fde68a'
                    }}>
                      🎓 {t('yearNumber').replace('{year}', user?.year || '1')}
                    </div>
                    <div style={{
                      backgroundColor: '#f3e8ff',
                      padding: '4px 12px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: '#7e22ce',
                      fontWeight: '600',
                      border: '1px solid #e9d5ff'
                    }}>
                      📚 {t('semester')} {user?.semester || '1'}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'center', minWidth: '140px', padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '12px', flex: '1 1 auto' }}>
                  <div style={{ fontSize: '14px', color: '#1565c0', marginBottom: '5px', fontWeight: 'bold' }}>{t('currentGPA')}</div>
                  <div style={{ fontSize: '36px', fontWeight: '900', color: '#0d47a1' }}>
                    {calculateGPA()}
                    <span style={{ fontSize: '18px', color: '#546e7a', fontWeight: 'normal' }}>/4.0</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Official Placement Record Card */}
            <div className="stagger-item" style={{
              background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
              padding: '24px',
              borderRadius: '16px',
              border: '1px solid #bae6fd',
              marginBottom: '30px',
              display: 'flex',
              flexDirection: 'column',
              gap: '15px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#0369a1' }}>
                <div style={{ fontSize: '24px' }}>📋</div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Official Academic Placement
                </h3>
              </div>

              <div className="responsive-grid" style={{ gap: '20px' }}>
                <div style={{ backgroundColor: 'rgba(255,255,255,0.6)', padding: '15px', borderRadius: '12px' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px', fontWeight: '700' }}>Faculty / Department</div>
                  <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '15px' }}>{user?.department || 'General Science'}</div>
                </div>
                <div style={{ backgroundColor: 'rgba(255,255,255,0.6)', padding: '15px', borderRadius: '12px' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px', fontWeight: '700' }}>Academic Level</div>
                  <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '15px' }}>{t('yearNumber').replace('{year}', user?.year || '1')}</div>
                </div>
                <div style={{ backgroundColor: 'rgba(255,255,255,0.6)', padding: '15px', borderRadius: '12px' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px', fontWeight: '700' }}>Current Term</div>
                  <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '15px' }}>{t('semester')} {user?.semester || '1'}</div>
                </div>
                <div style={{ backgroundColor: 'rgba(255,255,255,0.6)', padding: '15px', borderRadius: '12px' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px', fontWeight: '700' }}>ID Status</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }}></span>
                    <span style={{ fontWeight: '800', color: '#059669', fontSize: '13px' }}>Verified Record</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Academic Warning Banner */}
            {(Array.isArray(grades) && parseFloat(calculateGPA()) < 2.5 && grades.some(g => ['F', 'D'].includes(g.grade))) && (
              <div className="stagger-item" style={{
                backgroundColor: 'fff4e5',
                color: '#663c00',
                padding: '20px',
                borderRadius: '12px',
                marginBottom: '30px',
                borderLeft: '6px solid #ffa117',
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                boxShadow: '0 4px 12px rgba(255, 161, 23, 0.15)'
              }}>
                <div style={{ fontSize: '32px' }}>⚠️</div>
                <div>
                  <h4 style={{ margin: '0 0 5px 0', color: '#663c00' }}>{t('academicAdvisory')}</h4>
                  <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5' }}>
                    {t('academicAdvisoryMessage')}
                  </p>
                </div>
              </div>
            )}

            <div className="responsive-grid" style={{
              gap: '20px'
            }}>
              <div className="stagger-item">
                <SummaryCard
                  to="/student/grades"
                  icon="📖"
                  value={Array.isArray(grades) ? grades.length : 0}
                  label={t('coursesTaken')}
                  color="#1976d2"
                />
              </div>
              <div className="stagger-item">
                <SummaryCard
                  to="/student/grades"
                  icon="🎓"
                  value={Array.isArray(grades) ? grades.reduce((sum, g) => sum + (g.creditHours || 3), 0) : 0}
                  label={t('totalCredits')}
                  color="#2e7d32"
                />
              </div>
              <div className="stagger-item">
                <SummaryCard
                  to="/student/grades"
                  icon="✅"
                  value={Array.isArray(grades) ? grades.filter(g => (g.score || 0) >= 50).length : 0}
                  label={t('passedCourses')}
                  color="#ed6c02"
                />
              </div>
              <div className="stagger-item">
                <SummaryCard
                  to="/student/attendance"
                  icon="📅"
                  value={attendanceSummary ? `${attendanceSummary.percentage}%` : 'N/A'}
                  label={t('attendanceRecord')}
                  color="#9c27b0"
                />
              </div>
              <div className="stagger-item">
                <SummaryCard
                  to="/student/exams"
                  icon="📝"
                  value={t('start')}
                  label={t('onlineExams')}
                  color="#6366f1"
                />
              </div>
              <div className="stagger-item">
                <SummaryCard
                  to="/schedule"
                  icon="⏰"
                  value={t('view')}
                  label={t('classSchedule')}
                  color="#a855f7"
                />
              </div>
            </div>

            {/* Announcements Section */}
            <div className="stagger-item" style={{
              marginTop: '30px',
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '25px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
              border: '1px solid #f1f5f9'
            }}>
              <div className="responsive-header" style={{ marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '24px' }}>📢</span> {t('notifications')}
                </h3>
                <Link to="/student/notifications" style={{ fontSize: '14px', color: '#3b82f6', fontWeight: 'bold', textDecoration: 'none' }}>
                  {t('viewAll')} →
                </Link>
              </div>

              {announcements.length > 0 ? (
                <div className="responsive-stack" style={{ gap: '12px' }}>
                  {announcements.map(anno => (
                    <div key={anno.id} style={{
                      padding: '15px',
                      backgroundColor: anno.type === 'exam_code' ? '#fff7ed' : '#f8fafc',
                      borderRadius: '12px',
                      borderLeft: `4px solid ${anno.type === 'exam_code' ? '#f97316' : '#3b82f6'}`,
                      display: 'flex',
                      gap: '15px',
                      alignItems: 'flex-start',
                      boxShadow: anno.type === 'exam_code' ? '0 4px 12px rgba(249, 115, 22, 0.1)' : 'none'
                    }}>
                      <div style={{
                        fontSize: '24px',
                        backgroundColor: 'white',
                        padding: '10px',
                        borderRadius: '10px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {anno.type === 'exam_code' ? '🔓' : '🔔'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{
                            fontWeight: '700',
                            fontSize: '15px',
                            color: anno.type === 'exam_code' ? '#9a3412' : '#0f172a'
                          }}>
                            {anno.title}
                          </span>
                          <span style={{ fontSize: '12px', color: '#64748b' }}>
                            {new Date(anno.date || anno.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p style={{
                          margin: 0,
                          fontSize: '13px',
                          color: anno.type === 'exam_code' ? '#9a3412' : '#475569',
                          lineHeight: '1.5',
                          fontWeight: anno.type === 'exam_code' ? '600' : 'normal'
                        }}>
                          {anno.message}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                  <p>{t('noNotifications')}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const QuickActionLink = ({ to, icon, label }) => {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <Link
      to={to}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        padding: '15px 20px',
        backgroundColor: isHovered ? '#e8eaf6' : '#f8f9fa',
        color: '#1a237e',
        textDecoration: 'none',
        borderRadius: '12px',
        fontWeight: 'bold',
        transition: 'all 0.2s ease',
        transform: isHovered ? 'translateX(5px)' : 'translateX(0)',
        borderLeft: isHovered ? '4px solid #1a237e' : '4px solid transparent'
      }}
    >
      <span style={{ fontSize: '20px' }}>{icon}</span> {label}
    </Link>
  );
};

export default StudentDashboard;