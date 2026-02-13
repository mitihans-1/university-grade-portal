import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../utils/api';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users, BookOpen, Bell, TrendingUp, Calendar, MessageSquare,
  FileText, Plus, Award, ShieldAlert, Clock, Layout, Zap, Star
} from 'lucide-react';
import '../premium-pages.css';

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
  const [linkedStudents, setLinkedStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(user?.studentId || '');
  const [showAddChildModal, setShowAddChildModal] = useState(false);
  const [newChildId, setNewChildId] = useState('');
  const [submittingLink, setSubmittingLink] = useState(false);
  const [familyOverview, setFamilyOverview] = useState([]);
  const [childSchedule, setChildSchedule] = useState([]);
  const [childExams, setChildExams] = useState([]);

  useEffect(() => {
    const fetchLinkedStudents = async () => {
      try {
        const data = await api.getLinkedStudents();
        let studentsList = [];
        if (Array.isArray(data) && data.length > 0) {
          studentsList = data;
          setLinkedStudents(data);
          if (!selectedStudentId) setSelectedStudentId(data[0].studentId);
        } else if (user?.studentId) {
          studentsList = [{
            studentId: user.studentId,
            name: user.name || 'Child',
            department: user.department || 'N/A',
            year: user.year || 'N/A'
          }];
          setLinkedStudents(studentsList);
          setSelectedStudentId(user.studentId);
        }

        // Fetch overview data (GPA) for all students in parallel
        if (studentsList.length > 0) {
          const overviewPromises = studentsList.map(async (s) => {
            try {
              const analytics = await api.getStudentAnalytics(s.studentId);
              return {
                ...s,
                gpa: analytics?.overallGPA || 0,
                attendance: 0 // Could fetch this too if needed
              };
            } catch (e) {
              return { ...s, gpa: 0 };
            }
          });
          const overviewData = await Promise.all(overviewPromises);
          setFamilyOverview(overviewData);
        }
      } catch (error) {
        console.error('Error fetching linked students:', error);
      }
    };

    if (user) fetchLinkedStudents();
  }, [user]);

  useEffect(() => {
    const fetchParentData = async () => {
      if (!selectedStudentId) return;

      try {
        setLoading(true);

        // Fetch notifications and alerts (these are parent-level, usually)
        try {
          const notificationsData = await api.getNotifications();
          setNotifications(Array.isArray(notificationsData) ? notificationsData : []);
          const unreadAlerts = await api.getUnreadAlerts();
          setUnreadAlertsCount(Array.isArray(unreadAlerts) ? unreadAlerts.length : 0);
        } catch (e) { console.error(e); }

        // Fetch grades for the selected student
        try {
          const gradesData = await api.getStudentGrades(selectedStudentId);
          setGrades(Array.isArray(gradesData) ? gradesData : []);
          const gpa = calculateGPA(gradesData || []);
          setStudentInfo(prev => ({ ...prev, gpa: gpa.toFixed(2) }));
        } catch (error) {
          console.error('Error fetching grades:', error);
          setGrades([]);
        }

        // Fetch student details
        try {
          const studentData = await api.getStudentById(selectedStudentId);
          if (studentData && studentData.msg !== 'Student not found') {
            setStudentInfo({
              name: studentData.name,
              id: studentData.studentId,
              department: studentData.department,
              year: studentData.year,
              email: studentData.email,
              phone: studentData.phone,
              advisor: studentData.advisor || 'Not Assigned',
              advisorEmail: studentData.advisorEmail || '',
              gpa: studentInfo.gpa // Keep previously calculated GPA
            });
          }
        } catch (error) {
          console.error('Error fetching student details:', error);
        }

        // Fetch attendance summary
        try {
          const attendanceData = await api.getAttendanceSummary(selectedStudentId);
          setAttendanceSummary(attendanceData);
        } catch (e) { console.error(e); }

        // Fetch Analytics
        try {
          const analyticsData = await api.getStudentAnalytics(selectedStudentId);
          if (analyticsData && analyticsData.semesterGPAs) {
            setPerformanceHistory(analyticsData.semesterGPAs.map(item => ({
              semester: item.semester,
              gpa: item.gpa
            })));
            setStudentInfo(prev => ({
              ...prev,
              gpa: analyticsData.overallGPA || prev.gpa
            }));
          }
        } catch (e) { console.error(e); }

        // Fetch Child Schedule Teaser
        try {
          const scheduleData = await api.getSchedules(studentData.department, studentData.year, '1'); // Assuming semester 1 for now
          setChildSchedule(Array.isArray(scheduleData) ? scheduleData : []);
        } catch (e) { console.error(e); }

        // Fetch Available Exams
        try {
          const examsData = await api.getAvailableExams(selectedStudentId);
          setChildExams(Array.isArray(examsData) ? examsData : []);
        } catch (e) { console.error(e); }

      } catch (error) {
        console.error('Error in fetchParentData:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user && selectedStudentId) {
      fetchParentData();
    }
  }, [user, selectedStudentId]);

  const handleAddChild = async (e) => {
    e.preventDefault();
    if (!newChildId.trim()) return;

    setSubmittingLink(true);
    try {
      const result = await api.addStudentLink(newChildId);
      alert(result.msg || 'Request sent');
      if (!result.error) {
        setNewChildId('');
        setShowAddChildModal(false);
      }
    } catch (error) {
      alert('Failed to request link: ' + error.message);
    } finally {
      setSubmittingLink(false);
    }
  };

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
      <div className="dashboard-background"></div>

      {/* Premium Header */}
      <div className="responsive-header stagger-item" style={{ marginBottom: '40px' }}>
        <div>
          <h1 className="gradient-text" style={{ fontSize: '2.5rem', marginBottom: '8px' }}>
            {t('parentDashboard') || 'Parent Observer Portal'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontWeight: '600' }}>
            Monitoring academic excellence for your family
          </p>
        </div>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button onClick={() => setShowAddChildModal(true)} className="premium-btn" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} /> Link Child
          </button>
        </div>
      </div>
      {/* Main Content */}
      <div className="fade-in">
        <div>
          {/* Family Academic Overview - Only show if multiple children */}
          {familyOverview.length > 1 && (
            <div className="stagger-item" style={{ marginBottom: '40px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '900', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Users className="icon-glow" style={{ color: 'var(--primary)' }} /> Family Overview
                </h2>
                <div className="status-badge" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                  {familyOverview.length} Students
                </div>
              </div>
              <div className="responsive-grid">
                {familyOverview.map(child => (
                  <div
                    key={child.studentId}
                    onClick={() => setSelectedStudentId(child.studentId)}
                    className="premium-card"
                    style={{
                      padding: '24px',
                      cursor: 'pointer',
                      border: selectedStudentId === child.studentId ? '2px solid var(--primary)' : '1px solid var(--glass-border)',
                      background: selectedStudentId === child.studentId ? 'rgba(99, 102, 241, 0.05)' : 'var(--glass-bg)',
                      position: 'relative'
                    }}
                  >
                    {selectedStudentId === child.studentId && (
                      <div style={{
                        position: 'absolute',
                        top: '15px',
                        right: '15px',
                        color: 'var(--primary)',
                      }}>
                        <Star size={18} fill="currentColor" />
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                      <div className="stat-icon-wrapper" style={{
                        background: child.gpa >= 3.5 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(99, 102, 241, 0.1)',
                        color: child.gpa >= 3.5 ? '#10b981' : 'var(--primary)'
                      }}>
                        <Star size={24} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800' }}>{child.name}</h3>
                        <p style={{ margin: 0, fontSize: '0.813rem', color: 'var(--text-muted)', fontWeight: '600' }}>{child.department}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div className="stat-label" style={{ fontSize: '0.7rem' }}>GPA</div>
                        <div className="stat-value" style={{ fontSize: '1.5rem', color: child.gpa >= 3.0 ? '#10b981' : '#ef4444' }}>
                          {child.gpa ? child.gpa.toFixed(2) : '0.00'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Student Info Card */}
          <div className="stagger-item premium-card" style={{
            padding: '35px',
            marginBottom: '40px',
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.8))',
            border: '1px solid rgba(255, 255, 255, 0.5)'
          }}>
            <div className="responsive-header" style={{ alignItems: 'flex-start', marginBottom: '30px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '25px' }}>
                  <div className="stat-icon-wrapper" style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '24px',
                    background: 'var(--primary)',
                    color: 'white',
                    fontSize: '2rem'
                  }}>
                    {loading ? <Clock className="animate-spin" /> : <GraduationCap size={40} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
                      <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: '900', color: '#0f172a' }}>
                        {loading ? 'Fetching...' : studentInfo.name}
                      </h2>
                      {linkedStudents.length > 1 && (
                        <div style={{ position: 'relative' }}>
                          <select
                            value={selectedStudentId}
                            onChange={(e) => setSelectedStudentId(e.target.value)}
                            className="premium-btn"
                            style={{
                              padding: '6px 35px 6px 15px',
                              borderRadius: '14px',
                              fontSize: '0.85rem',
                              background: 'rgba(99, 102, 241, 0.1)',
                              color: 'var(--primary)',
                              border: '1px solid rgba(99, 102, 241, 0.2)',
                              appearance: 'none',
                              fontWeight: '800'
                            }}
                          >
                            {linkedStudents.map(s => (
                              <option key={s.studentId} value={s.studentId}>{s.name}</option>
                            ))}
                          </select>
                          <Layout size={14} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--primary)' }} />
                        </div>
                      )}
                    </div>
                    <p style={{ margin: '5px 0 0', color: 'var(--text-muted)', fontWeight: '600', fontSize: '1rem' }}>
                      {user?.relationship || t('parent')} • Student ID: {loading ? '...' : studentInfo.id}
                    </p>
                  </div>
                </div>

                <div className="responsive-grid" style={{ gap: '20px' }}>
                  <div className="stat-card" style={{ padding: '20px', background: 'rgba(255,255,255,0.4)' }}>
                    <span className="stat-label">{t('department')}</span>
                    <span style={{ fontWeight: '800', color: '#1e293b' }}>{loading ? '...' : studentInfo.department}</span>
                  </div>
                  <div className="stat-card" style={{ padding: '20px', background: 'rgba(255,255,255,0.4)' }}>
                    <span className="stat-label">{t('year')}</span>
                    <span style={{ fontWeight: '800', color: '#1e293b' }}>{loading ? '...' : studentInfo.year}</span>
                  </div>
                  <div className="stat-card" style={{ padding: '20px', background: 'rgba(255,255,255,0.4)' }}>
                    <span className="stat-label">Performance</span>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                      <span className="stat-value" style={{ color: 'var(--primary)' }}>{loading ? '0.00' : studentInfo.gpa}</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: '800', opacity: 0.5 }}>GPA</span>
                    </div>
                  </div>
                  <div className="stat-card" style={{ padding: '20px', background: 'rgba(255,255,255,0.4)' }}>
                    <span className="stat-label">Attendance</span>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                      <span className="stat-value" style={{ color: attendanceSummary?.percentage < 75 ? '#ef4444' : '#10b981' }}>
                        {loading ? '0' : (attendanceSummary ? attendanceSummary.percentage : '0')}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '220px' }}>
                <button onClick={() => navigate('/messages')} className="premium-btn" style={{ width: '100%', background: 'var(--primary)', border: 'none', color: 'white', padding: '14px' }}>
                  <MessageSquare size={18} style={{ marginRight: '10px' }} /> {t('contactAdvisor')}
                </button>
                <button onClick={handleDownloadReport} className="premium-btn" style={{ width: '100%', padding: '14px' }}>
                  <FileText size={18} style={{ marginRight: '10px' }} /> {t('downloadReport')}
                </button>
              </div>
            </div>
          </div>

          {/* Academic Warning Banner */}
          {(parseFloat(studentInfo.gpa) < 2.5 && grades.some(g => ['F', 'D'].includes(g.grade))) && (
            <div className="stagger-item premium-card" style={{
              background: 'rgba(239, 68, 68, 0.05)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              marginBottom: '35px',
              padding: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              borderRadius: '24px'
            }}>
              <div className="icon-glow" style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', width: '50px', height: '50px', borderRadius: '15px' }}>
                <ShieldAlert size={28} />
              </div>
              <div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', fontWeight: '900', color: '#ef4444' }}>{t('academicAdvisory')}</h4>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#7f1d1d', fontWeight: '600' }}>
                  {t('lowGpaWarning').replace('{gpa}', studentInfo.gpa)}
                </p>
              </div>
            </div>
          )}

          {/* Widgets Grid */}
          <div className="responsive-grid" style={{ marginBottom: '40px' }}>
            {/* Child's Schedule Widget */}
            <div className="stagger-item premium-card" style={{ padding: '25px', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Clock className="icon-glow" style={{ color: 'var(--secondary)' }} /> {t('classSchedule')}
                </h3>
                <div className="status-badge" style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)', color: 'var(--secondary)', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
                  {t('today')}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {childSchedule.filter(s => s.dayOfWeek === new Date().toLocaleDateString('en-US', { weekday: 'long' })).length > 0 ? (
                  childSchedule.filter(s => s.dayOfWeek === new Date().toLocaleDateString('en-US', { weekday: 'long' })).slice(0, 3).map(cls => (
                    <div key={cls.id} style={{ padding: '15px', background: 'rgba(168, 85, 247, 0.03)', borderRadius: '18px', borderLeft: '4px solid var(--secondary)' }}>
                      <div style={{ fontWeight: '800', fontSize: '0.95rem', color: '#1e293b' }}>{cls.courseName}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '4px' }}>
                        <Clock size={12} /> {cls.startTime} - {cls.endTime} • Room {cls.room}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '30px', opacity: 0.5 }}>
                    <Calendar size={32} style={{ marginBottom: '10px' }} />
                    <p style={{ fontSize: '0.9rem', fontStyle: 'italic' }}>{t('noClassesToday') || 'No classes today'}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Upcoming Exams Widget */}
            <div className="stagger-item premium-card" style={{ padding: '25px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: '0', fontSize: '1.2rem', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Award className="icon-glow" style={{ color: 'var(--primary)' }} /> {t('onlineExams')}
                </h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {childExams.length > 0 ? (
                  childExams.slice(0, 2).map(exam => (
                    <div key={exam.id} style={{ padding: '15px', background: 'rgba(99, 102, 241, 0.03)', borderRadius: '18px', borderLeft: '4px solid var(--primary)' }}>
                      <div style={{ fontWeight: '800', fontSize: '0.95rem', color: '#1e293b' }}>{exam.title}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                        <Zap size={12} /> {exam.duration}m • {exam.courseCode}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '30px', opacity: 0.5 }}>
                    <Zap size={32} style={{ marginBottom: '10px' }} />
                    <p style={{ fontSize: '0.9rem', fontStyle: 'italic' }}>No upcoming exams</p>
                  </div>
                )}
              </div>
            </div>
          </div>



          <div className="grid-container" style={{ gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)' }}>
            {/* Grades Table */}
            <div className="stagger-item premium-card" style={{ padding: '30px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '900' }}>{t('academicPerformance')}</h2>
                <div className="status-badge status-published">{t('autoUpdated')}</div>
              </div>

              {loading ? (
                <div style={{ textAlign: 'center', padding: '60px' }}>
                  <Clock className="animate-spin" size={40} style={{ margin: '0 auto 15px', opacity: 0.5 }} />
                  <p>{t('loading')}...</p>
                </div>
              ) : grades.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', opacity: 0.6 }}>
                  <BookOpen size={60} style={{ margin: '0 auto 20px' }} />
                  <h3 style={{ margin: '0 0 10px 0' }}>{t('noGradesAvailable')}</h3>
                  <p style={{ margin: 0 }}>{t('gradesWillAppearHere')}</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="premium-table">
                    <thead>
                      <tr>
                        <th>{t('courseName')}</th>
                        <th>Lecturer</th>
                        <th style={{ textAlign: 'center' }}>{t('grade')}</th>
                        <th>{t('score')}</th>
                        <th>{t('status')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {grades.map((item, index) => (
                        <tr key={item.id || index}>
                          <td style={{ fontWeight: '800' }}>{item.courseName || 'N/A'}</td>
                          <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                            {item.Teacher ? item.Teacher.name : 'University Faculty'}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '4px 12px',
                              borderRadius: '50px',
                              backgroundColor: 'rgba(255,255,255,0.1)',
                              border: `1px solid ${getGradeColor(item.grade)}`,
                              color: getGradeColor(item.grade),
                              fontWeight: '900',
                              minWidth: '45px',
                              fontSize: '0.9rem'
                            }}>
                              {item.grade || 'N/A'}
                            </span>
                          </td>
                          <td style={{ fontWeight: '800' }}>{item.score || 0}%</td>
                          <td>
                            <div className="status-badge" style={{
                              background: getGradeStatus(item.grade) === 'Excellent' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(99, 102, 241, 0.1)',
                              color: getGradeStatus(item.grade) === 'Excellent' ? '#10b981' : 'var(--primary)',
                              border: 'none'
                            }}>
                              {getGradeStatus(item.grade)}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Side Column: Notifications & GPA Trend */}
            <div className="responsive-stack stagger-item">
              {/* Notifications Card */}
              <div className="premium-card" style={{ padding: '25px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                  <div className="icon-glow" style={{ color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)', width: '40px', height: '40px', borderRadius: '12px' }}>
                    <Bell size={20} />
                  </div>
                  <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '900' }}>{t('alertsNotifications')}</h2>
                </div>

                {notifications.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', opacity: 0.5 }}>
                    <p style={{ margin: 0, fontSize: '0.9rem' }}>{t('noNotifications')}</p>
                  </div>
                ) : (
                  <div className="responsive-stack" style={{ gap: '12px' }}>
                    {notifications.slice(0, 4).map((notification) => (
                      <div
                        key={notification.id}
                        style={{
                          padding: '15px',
                          borderLeft: `4px solid ${notification.type === 'warning' ? '#f59e0b' :
                            notification.type === 'grade_update' ? '#10b981' : '#3b82f6'
                            }`,
                          background: 'rgba(0, 0, 0, 0.02)',
                          borderRadius: '12px'
                        }}
                      >
                        <p style={{ margin: '0 0 4px 0', fontSize: '0.9rem', fontWeight: '800', color: '#1e293b' }}>
                          {notification.message || notification.title}
                        </p>
                        <small style={{ color: 'var(--text-muted)', fontWeight: '600' }}>
                          {new Date(notification.date || notification.createdAt).toLocaleDateString()}
                        </small>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* GPA Trend Card */}
              <div className="premium-card" style={{ padding: '25px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                  <div className="icon-glow" style={{ color: 'var(--primary)', background: 'rgba(99, 102, 241, 0.1)', width: '40px', height: '40px', borderRadius: '12px' }}>
                    <TrendingUp size={20} />
                  </div>
                  <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '900' }}>Academic Progress</h2>
                </div>

                <div className="responsive-stack" style={{ gap: '20px' }}>
                  {performanceHistory.length > 0 ? performanceHistory.map((item, index) => (
                    <div key={index}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                        <span style={{ color: 'var(--text-muted)', fontWeight: '700', fontSize: '0.85rem' }}>{item.semester}</span>
                        <span style={{ fontWeight: '900', color: '#1e293b', fontSize: '0.9rem' }}>{item.gpa.toFixed(2)}</span>
                      </div>
                      <div className="health-bar-container" style={{ height: '8px' }}>
                        <div className="health-bar-fill" style={{
                          width: `${(item.gpa / 4) * 100}%`,
                          background: item.gpa >= 3.5 ? 'linear-gradient(90deg, #10b981, #34d399)' :
                            item.gpa >= 3.0 ? 'linear-gradient(90deg, #3b82f6, #60a5fa)' :
                              'linear-gradient(90deg, #f59e0b, #fbbf24)'
                        }}></div>
                      </div>
                    </div>
                  )) : (
                    <p style={{ textAlign: 'center', opacity: 0.5, fontSize: '0.9rem' }}>No trend data yet</p>
                  )}
                </div>
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

      {/* Add Child Modal */}
      {showAddChildModal && (
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
            borderRadius: '12px',
            maxWidth: '400px',
            width: '100%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '1.25rem', color: '#1f2937' }}>Link Another Child</h3>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '20px' }}>
              Enter your child's official university ID to request an academic link.
            </p>

            <form onSubmit={handleAddChild}>
              <div className="modern-input-group">
                <label className="modern-input-label">Student ID *</label>
                <input
                  type="text"
                  value={newChildId}
                  onChange={(e) => setNewChildId(e.target.value)}
                  className="modern-input"
                  placeholder="e.g. UGR/1234/14"
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddChildModal(false)}
                  className="modern-btn"
                  style={{ flex: 1, backgroundColor: '#94a3b8' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="modern-btn"
                  disabled={submittingLink}
                  style={{ flex: 1, backgroundColor: '#2e7d32' }}
                >
                  {submittingLink ? 'Sending...' : 'Request Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentDashboard;