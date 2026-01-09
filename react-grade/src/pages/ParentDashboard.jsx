import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../utils/api';
import { Link, useNavigate } from 'react-router-dom';
import LanguageSelector from '../components/common/LanguageSelector';

const ParentDashboard = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactMessage, setContactMessage] = useState('');
  const [studentInfo, setStudentInfo] = useState({
    name: '',
    id: '',
    department: '',
    year: '',
    email: '',
    phone: '',
    advisor: '',
    advisorEmail: '',
    gpa: 0
  });
  const [grades, setGrades] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [performanceHistory, setPerformanceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadAlertsCount, setUnreadAlertsCount] = useState(0);
  const [attendanceSummary, setAttendanceSummary] = useState(null);

  useEffect(() => {
    const fetchParentData = async () => {
      try {
        setLoading(true);

        // Initialize student info with user data first
        if (user) {
          setStudentInfo(prev => ({
            ...prev,
            name: user.name || prev.name,
            id: user.studentId || prev.id,
            email: user.email || prev.email
          }));
        }

        // Fetch notifications for the parent
        try {
          const notificationsData = await api.getNotifications();
          setNotifications(Array.isArray(notificationsData) ? notificationsData : []);
        } catch (error) {
          console.error('Error fetching notifications:', error);
          setNotifications([]);
        }

        // Fetch unread alerts count
        try {
          const unreadAlerts = await api.getUnreadAlerts();
          setUnreadAlertsCount(Array.isArray(unreadAlerts) ? unreadAlerts.length : 0);
        } catch (error) {
          console.error('Error fetching alerts:', error);
          setUnreadAlertsCount(0);
        }

        // Get linked student information
        // In a real implementation, we would fetch student details based on the link
        // For now, we'll use the user's linked studentId to get grades
        if (user && user.studentId) {
          // Fetch grades for the linked student
          try {
            const gradesData = await api.getStudentGrades(user.studentId);
            setGrades(Array.isArray(gradesData) ? gradesData : []);
          } catch (error) {
            console.error('Error fetching grades:', error);
            setGrades([]);
          }

          // Fetch student details
          try {
            const studentData = await api.getStudentById(user.studentId);
            if (studentData && studentData.msg !== 'Student not found') {
              setStudentInfo(prev => ({
                ...prev,
                name: studentData.name || prev.name,
                id: studentData.studentId || prev.id,
                department: studentData.department || prev.department,
                year: studentData.year || prev.year,
                email: studentData.email || prev.email,
                phone: studentData.phone || prev.phone,
                advisor: studentData.advisor || prev.advisor,
                advisorEmail: studentData.advisorEmail || prev.advisorEmail
              }));
            }
          } catch (error) {
            console.error('Error fetching student details:', error);
          }

          // Calculate GPA based on grades
          const gpa = calculateGPA(gradesData || []);
          setStudentInfo(prev => ({ ...prev, gpa: gpa.toFixed(2) }));

          // Fetch attendance summary
          try {
            const attendanceData = await api.getAttendanceSummary(user.studentId);
            setAttendanceSummary(attendanceData);
          } catch (error) {
            console.error('Error fetching attendance summary:', error);
          }

          // Fetch Analytics for Performance History (GPA Trend)
          try {
            const analyticsData = await api.getStudentAnalytics(user.studentId);
            if (analyticsData && analyticsData.semesterGPAs) {
              setPerformanceHistory(analyticsData.semesterGPAs.map(item => ({
                semester: item.semester,
                gpa: item.gpa
              })));

              // Update student info with GPA from analytics if available
              setStudentInfo(prev => ({
                ...prev,
                gpa: analyticsData.overallGPA || prev.gpa,
                totalCredits: analyticsData.totalCredits,
                totalCourses: analyticsData.totalCourses
              }));
            }
          } catch (error) {
            console.error('Error fetching analytics:', error);
          }
        }
      } catch (error) {
        console.error('Error fetching parent data:', error);
        // Set empty arrays in case of error
        setGrades([]);
        setNotifications([]);
        setPerformanceHistory([]);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchParentData();
    }
  }, [user]);

  const calculateGPA = (gradesList) => {
    const gradePoints = {
      'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7,
      'C+': 2.3, 'C': 2.0, 'C-': 1.7, 'D': 1.0, 'F': 0.0
    };

    let totalPoints = 0;
    let totalCredits = 0;

    gradesList.forEach(g => {
      totalPoints += (gradePoints[g.grade] || 0) * (g.creditHours || 3);
      totalCredits += (g.creditHours || 3);
    });

    return totalCredits > 0 ? (totalPoints / totalCredits) : 0;
  };

  const getGradeColor = (grade) => {
    if (grade.includes('A')) return '#2e7d32';
    if (grade.includes('B')) return '#1976d2';
    if (grade.includes('C')) return '#ed6c02';
    return '#d32f2f';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Excellent': return '#2e7d32';
      case 'Good': return '#1976d2';
      case 'Satisfactory': return '#ed6c02';
      case 'Needs Improvement': return '#d32f2f';
      case 'Failing': return '#c62828';
      default: return '#666';
    }
  };

  const getGradeStatus = (grade) => {
    if (!grade) return 'N/A';
    if (grade.startsWith('A')) return 'Excellent';
    if (grade.startsWith('B')) return 'Good';
    if (grade.startsWith('C')) return 'Satisfactory';
    if (grade.startsWith('D')) return 'Needs Improvement';
    if (grade === 'F') return 'Failing';
    return 'N/A';
  };

  const handleContactAdvisor = () => {
    if (contactMessage.trim()) {
      alert(t('messageSentToAdvisor').replace('{advisor}', studentInfo.advisor) + `\n\n` + t('subject') + `: ` + t('regardingAcademicProgress').replace('{studentName}', studentInfo.name) + `\n` + t('yourMessage') + `: ${contactMessage}`);
      setContactMessage('');
      setShowContactForm(false);
    }
  };

  const handleDownloadReport = () => {
    navigate('/parent/reports');
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
        <div>

          {/* Student Info Card */}
          <div className="stagger-item" style={{
            backgroundColor: 'white',
            borderRadius: '10px',
            padding: '25px',
            marginBottom: '25px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            background: 'linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%)',
            borderLeft: '5px solid #2e7d32'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    backgroundColor: '#2e7d32',
                    color: 'white',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '30px'
                  }}>
                    👨‍🎓
                  </div>
                  <div>
                    <h1 style={{ margin: '0 0 5px 0', color: '#333' }}>{loading ? t('loading') : studentInfo.name}</h1>
                    <p style={{ margin: 0, color: '#666' }}>
                      {user?.relationship || t('parent')} • ID: {loading ? t('loading') : studentInfo.id}
                    </p>
                  </div>
                </div>

                <div className="grid-container" style={{
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                  gap: '15px'
                }}>
                  <div className="card" style={{ padding: '10px 15px', border: 'none', background: 'rgba(255,255,255,0.5)' }}>
                    <div style={{ fontSize: '13px', color: '#666', marginBottom: '3px' }}>{t('department')}</div>
                    <div style={{ fontWeight: 'bold', color: '#333' }}>{loading ? t('loading') : studentInfo.department}</div>
                  </div>
                  <div className="card" style={{ padding: '10px 15px', border: 'none', background: 'rgba(255,255,255,0.5)' }}>
                    <div style={{ fontSize: '13px', color: '#666', marginBottom: '3px' }}>{t('year')}</div>
                    <div style={{ fontWeight: 'bold', color: '#333' }}>{loading ? t('loading') : studentInfo.year}</div>
                  </div>
                  <div className="card" style={{ padding: '10px 15px', border: 'none', background: 'rgba(255,255,255,0.5)' }}>
                    <div style={{ fontSize: '13px', color: '#666', marginBottom: '3px' }}>{t('currentGPA')}</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#2e7d32' }}>
                      {loading ? t('loading') : studentInfo.gpa}
                    </div>
                  </div>
                  <div className="card" style={{ padding: '10px 15px', border: 'none', background: 'rgba(255,255,255,0.5)' }}>
                    <div style={{ fontSize: '13px', color: '#666', marginBottom: '3px' }}>{t('attendance')}</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: attendanceSummary?.percentage < 75 ? '#d32f2f' : '#2e7d32' }}>
                      {loading ? t('loading') : (attendanceSummary ? `${attendanceSummary.percentage}%` : 'N/A')}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  onClick={() => navigate('/messages')}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#1976d2',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '16px'
                  }}
                >
                  <span>💬</span>
                  {t('contactAdvisor')}
                </button>
                <button
                  onClick={handleDownloadReport}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: 'white',
                    color: '#1976d2',
                    border: '2px solid #1976d2',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '16px'
                  }}
                >
                  <span>📄</span>
                  {t('downloadReport')}
                </button>
              </div>
            </div>
          </div>

          {/* Academic Warning Banner for Parent */}
          {(parseFloat(studentInfo.gpa) < 2.5 && grades.some(g => ['F', 'D'].includes(g.grade))) && (
            <div className="stagger-item" style={{
              backgroundColor: '#fff4e5',
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
                  {t('lowGpaWarning').replace('{gpa}', studentInfo.gpa)}
                </p>
              </div>
            </div>
          )}

          {/* Quick Actions Card */}
          <div className="stagger-item" style={{
            backgroundColor: 'white',
            borderRadius: '10px',
            padding: '25px',
            marginBottom: '25px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>⚡</span> {t('quickActions')}
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '15px'
            }}>
              <Link
                to="/parent/grades"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '15px',
                  backgroundColor: '#f1f8e9',
                  color: '#2e7d32',
                  textDecoration: 'none',
                  borderRadius: '10px',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                  transition: 'transform 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <span style={{ fontSize: '20px' }}>📚</span> {t('viewChildGrades')}
              </Link>
              <Link
                to="/parent/notifications"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '15px',
                  backgroundColor: '#fff3e0',
                  color: '#ef6c00',
                  textDecoration: 'none',
                  borderRadius: '10px',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                  transition: 'transform 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <span style={{ fontSize: '20px' }}>🔔</span> {t('notifications')}
              </Link>
              <Link
                to="/parent/link-student"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '15px',
                  backgroundColor: '#e3f2fd',
                  color: '#1565c0',
                  textDecoration: 'none',
                  borderRadius: '10px',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                  transition: 'transform 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <span style={{ fontSize: '20px' }}>🔗</span> {t('linkNewStudent')}
              </Link>
              <Link
                to="/student/attendance"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '15px',
                  backgroundColor: '#e8f5e9',
                  color: '#2e7d32',
                  textDecoration: 'none',
                  borderRadius: '10px',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                  transition: 'transform 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <span style={{ fontSize: '20px' }}>📅</span> {t('attendance')}
              </Link>
              <Link
                to="/messages"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '15px',
                  backgroundColor: '#e3f2fd',
                  color: '#1976d2',
                  textDecoration: 'none',
                  borderRadius: '10px',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                  transition: 'transform 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <span style={{ fontSize: '20px' }}>💬</span> Messages
              </Link>
              <Link
                to="/settings"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '15px',
                  backgroundColor: '#f5f5f5',
                  color: '#424242',
                  textDecoration: 'none',
                  borderRadius: '10px',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                  transition: 'transform 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <span style={{ fontSize: '20px' }}>⚙️</span> {t('settings')}
              </Link>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '25px'
          }}>
            {/* Grades Table */}
            <div className="stagger-item">
              <div style={{
                backgroundColor: 'white',
                borderRadius: '10px',
                padding: '25px',
                height: '100%',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h2 style={{ margin: 0, color: '#333' }}>{t('academicPerformance')}</h2>
                  <div style={{
                    backgroundColor: '#e3f2fd',
                    color: '#1976d2',
                    padding: '5px 15px',
                    borderRadius: '15px',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}>
                    {t('autoUpdated')}
                  </div>
                </div>

                {loading ? (
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    <div style={{ fontSize: '24px', marginBottom: '10px' }}>⏳</div>
                    <p>{t('loading')}...</p>
                  </div>
                ) : grades.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '20px' }}>📚</div>
                    <h3 style={{ color: '#666' }}>{t('noGradesAvailable')}</h3>
                    <p style={{ color: '#999' }}>{t('gradesWillAppearHere')}</p>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f5f5f5' }}>
                          <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>{t('courseName')}</th>
                          <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>{t('grade')}</th>
                          <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>{t('score')}</th>
                          <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>{t('status')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {grades.map((item, index) => (
                          <tr key={item.id || index} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '12px', fontWeight: 'bold' }}>{item.courseName || 'N/A'}</td>
                            <td style={{ padding: '12px' }}>
                              <span style={{
                                backgroundColor: getGradeColor(item.grade),
                                color: 'white',
                                padding: '6px 12px',
                                borderRadius: '20px',
                                fontWeight: 'bold',
                                display: 'inline-block',
                                minWidth: '45px',
                                textAlign: 'center'
                              }}>
                                {item.grade || 'N/A'}
                              </span>
                            </td>
                            <td style={{ padding: '12px', fontWeight: 'bold' }}>{item.score || 0}%</td>
                            <td style={{ padding: '12px' }}>
                              <span style={{
                                color: getStatusColor(getGradeStatus(item.grade)),
                                fontWeight: 'bold'
                              }}>
                                {getGradeStatus(item.grade)}
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

            {/* Notifications and Performance */}
            <div className="stagger-item" style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
              {/* Notifications */}
              <div style={{
                backgroundColor: 'white',
                borderRadius: '10px',
                padding: '25px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    backgroundColor: '#ff9800',
                    color: 'white',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px'
                  }}>
                    🔔
                  </div>
                  <h2 style={{ margin: 0, color: '#333' }}>{t('alertsNotifications')}</h2>
                </div>

                {notifications.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <div style={{ fontSize: '32px', marginBottom: '10px' }}>🔔</div>
                    <p style={{ color: '#999' }}>{t('noNotifications')}</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        style={{
                          padding: '15px',
                          borderLeft: `4px solid ${notification.type === 'warning' ? '#ff9800' :
                            notification.type === 'grade_update' ? '#4caf50' : '#2196f3'
                            }`,
                          backgroundColor: '#f8f9fa',
                          borderRadius: '5px'
                        }}
                      >
                        <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>
                          {notification.message || notification.title}
                        </p>
                        <small style={{ color: '#666' }}>{new Date(notification.date || notification.createdAt).toLocaleDateString()}</small>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* GPA Trend */}
              <div style={{
                backgroundColor: 'white',
                borderRadius: '10px',
                padding: '25px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
              }}>
                <h2 style={{ margin: '0 0 20px 0', color: '#333' }}>{t('academicProgress')}</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {performanceHistory.map((item, index) => (
                    <div key={index}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <span style={{ color: '#666' }}>{item.semester}</span>
                        <span style={{ fontWeight: 'bold', color: '#333' }}>{t('gpa')}: {item.gpa}</span>
                      </div>
                      <div style={{
                        height: '10px',
                        backgroundColor: '#f0f0f0',
                        borderRadius: '5px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${(item.gpa / 4) * 100}%`,
                          height: '100%',
                          backgroundColor: item.gpa >= 3.0 ? '#4caf50' : item.gpa >= 2.0 ? '#ff9800' : '#f44336',
                          borderRadius: '5px'
                        }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form Modal */}
        {showContactForm && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '30px',
              borderRadius: '10px',
              maxWidth: '500px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, color: '#333' }}>{t('contactAdvisor')}</h3>
                <button
                  onClick={() => setShowContactForm(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '24px',
                    color: '#666',
                    cursor: 'pointer'
                  }}
                >
                  ×
                </button>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <p><strong>{t('advisor')}:</strong> {loading ? t('loading') : studentInfo.advisor}</p>
                <p><strong>{t('email')}:</strong> {loading ? t('loading') : studentInfo.advisorEmail}</p>
                <p><strong>{t('student')}:</strong> {loading ? t('loading') : studentInfo.name} ({loading ? t('loading') : studentInfo.id})</p>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#555' }}>
                  {t('subject')}
                </label>
                <input
                  type="text"
                  defaultValue={t('regardingAcademicProgress').replace('{studentName}', loading ? t('loading') : studentInfo.name)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    fontSize: '16px',
                    marginBottom: '15px'
                  }}
                />

                <label style={{ display: 'block', marginBottom: '8px', color: '#555' }}>
                  {t('yourMessage')}
                </label>
                <textarea
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    fontSize: '16px',
                    minHeight: '150px',
                    fontFamily: 'inherit'
                  }}
                  placeholder={t('writeMessagePlaceholder')}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowContactForm(false)}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#f5f5f5',
                    color: '#333',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer'
                  }}
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleContactAdvisor}
                  disabled={!contactMessage.trim()}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: contactMessage.trim() ? '#1976d2' : '#ccc',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: contactMessage.trim() ? 'pointer' : 'not-allowed'
                  }}
                >
                  {t('sendMessage')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParentDashboard;