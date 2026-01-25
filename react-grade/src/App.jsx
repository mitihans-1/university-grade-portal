import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { ToastProvider } from './components/common/Toast';
import LanguageSelector from './components/common/LanguageSelector';
import {
  Home,
  LayoutDashboard,
  GraduationCap,
  BarChart2,
  CalendarCheck,
  Bell,
  BookOpen,
  MessageSquare,
  Calendar,
  FileText,
  CreditCard,
  IdCard,
  Clock,
  Library as LibraryIcon,
  Users,
  Upload,
  ShieldCheck,
  Megaphone,
  UserCheck,
  Star,
  Scale,
  User,
  Settings,
  HelpCircle,
  LogOut
} from 'lucide-react';

// Pages
import LoginPage from './pages/LoginPage';
import StudentDashboard from './pages/StudentDashboard';
import ParentDashboard from './pages/ParentDashboard';
import AdminUpload from './pages/AdminUpload';
import AdminDashboard from './pages/AdminDashboard';
import StudentRegistration from './pages/StudentRegistration';
import ParentRegistration from './pages/ParentRegistration';
import TeacherRegistration from './pages/TeacherRegistration';
import AdminLinkRequests from './pages/AdminLinkRequests';
import SettingsPage from './pages/SettingsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import AlertsPage from './pages/AlertsPage';
import ReportsPage from './pages/ReportsPage';
import AdminAnnouncements from './pages/AdminAnnouncements';
import AdminAnalytics from './pages/AdminAnalytics';
import AttendanceManagement from './pages/AttendanceManagement';
import StudentAttendance from './pages/StudentAttendance';
import TeacherDashboard from './pages/TeacherDashboard';
import EnhancedAnalyticsDashboard from './pages/EnhancedAnalyticsDashboard';
import AcademicCalendar from './pages/AcademicCalendar';
import AdminAppeals from './pages/AdminAppeals';
import CourseResources from './pages/CourseResources';
import FeeManagement from './pages/FeeManagement';
import IdentityCard from './pages/IdentityCard';
import Library from './pages/Library';
import ClassSchedule from './pages/ClassSchedule';

import AdminAuditLogs from './pages/AdminAuditLogs';
import StudentManagement from './pages/StudentManagement';
import AdminGradeApproval from './pages/AdminGradeApproval';
import AdminReportCard from './pages/AdminReportCard';
import MessagesPage from './pages/MessagesPage';
import CreateExam from './pages/CreateExam';
import AdminExamApproval from './pages/AdminExamApproval';

import ParentGrades from './pages/ParentGrades';
import ParentNotifications from './pages/ParentNotifications';
import LinkStudent from './pages/LinkStudent';
import StudentGrades from './pages/StudentGrades';
import StudentNotifications from './pages/StudentNotifications';
import TeacherAssignments from './pages/TeacherAssignments';
import StudentAssignments from './pages/StudentAssignments';
import StudentExams from './pages/StudentExams';
import StudentExamPlayer from './pages/StudentExamPlayer';
import StudentProfileSetup from './pages/StudentProfileSetup';
import SupportPage from './pages/SupportPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import VerifyEmail from './pages/VerifyEmail';
// Protected Route Component
const ProtectedRoute = ({ children, allowedPermissions }) => {
  const { user, hasAnyPermission } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!user) {
      navigate('/');
    } else if (allowedPermissions && !hasAnyPermission(allowedPermissions)) {
      navigate('/');
    }
  }, [user, allowedPermissions, navigate, hasAnyPermission]);

  if (!user) {
    return null;
  }

  if (!user) {
    return null;
  }

  // Check if student needs to complete profile
  if (user.role === 'student' && (!user.department || user.department === 'Undeclared')) {
    // Allow access to setup page, block others
    if (window.location.pathname !== '/student/setup') {
      return <Navigate to="/student/setup" />;
    }
  }

  return children;
};

// Navigation Links Component
const NavigationLinks = ({ user, t, setIsMenuOpen, logout }) => {
  const linkStyle = {
    color: '#cbd5e1', // Light gray for dark sidebar
    textDecoration: 'none',
    fontSize: '14px',
    padding: '10px 12px',
    borderRadius: '8px',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '4px'
  };

  const activeLinkStyle = {
    ...linkStyle,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: '#3b82f6'
  };

  const handleLinkClick = () => {
    if (setIsMenuOpen) setIsMenuOpen(false);
  };

  const getIconColor = (iconName) => {
    const colors = {
      home: '#10b981',        // Green
      dashboard: '#3b82f6',   // Blue
      grades: '#8b5cf6',      // Purple
      analytics: '#f59e0b',   // Orange
      attendance: '#06b6d4',  // Cyan
      notifications: '#ef4444', // Red
      assignments: '#ec4899', // Pink
      exams: '#6366f1',       // Indigo
      messages: '#14b8a6',    // Teal
      calendar: '#f97316',    // Orange
      fees: '#84cc16',        // Lime
      idcard: '#0ea5e9',      // Sky
      schedule: '#a855f7',    // Purple
      library: '#78716c',     // Stone
      users: '#22c55e',       // Green
      upload: '#0284c7',      // Blue
      audit: '#dc2626',       // Red
      announcements: '#f59e0b', // Amber
      appeals: '#eab308',     // Yellow
      reports: '#6366f1',     // Indigo
      settings: '#64748b',    // Slate
      profile: '#475569',     // Gray
      support: '#a855f7',     // Purple
      logout: '#ef4444'       // Red
    };
    return colors[iconName] || '#cbd5e1';
  };

  if (!user) return null;

  const dashboardPath = user.permissions?.includes('manage_users') ? '/admin' : user.permissions?.includes('enter_grades') ? '/teacher' : user.permissions?.includes('view_child_grades') ? '/parent' : '/student';

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '5px',
      minHeight: 'min-content'
    }}>
      <Link to={dashboardPath} onClick={handleLinkClick} style={{ ...linkStyle, fontSize: '15px' }} title={t('home')}>
        <Home size={18} color={getIconColor('home')} /> {t('home')}
      </Link>

      <Link
        to={dashboardPath}
        onClick={handleLinkClick}
        style={{ ...linkStyle, fontSize: '15px', fontWeight: 'bold' }}
      >
        <LayoutDashboard size={18} color={getIconColor('dashboard')} /> {t('dashboard')}
      </Link>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', margin: '8px 0' }}></div>

      {user.permissions?.includes('view_own_grades') && !user.permissions?.includes('view_child_grades') && (
        <>
          <Link to="/student/grades" onClick={handleLinkClick} style={linkStyle}><GraduationCap size={18} color={getIconColor('grades')} /> {t('grades')}</Link>
          <Link to="/analytics/enhanced" onClick={handleLinkClick} style={linkStyle}><BarChart2 size={18} color={getIconColor('analytics')} /> Enhanced Analytics</Link>
          <Link to="/student/attendance" onClick={handleLinkClick} style={linkStyle}><CalendarCheck size={18} color={getIconColor('attendance')} /> {t('attendance')}</Link>
          <Link to="/student/notifications" onClick={handleLinkClick} style={linkStyle}><Bell size={18} color={getIconColor('notifications')} /> {t('notifications')}</Link>
          <Link to="/student/assignments" onClick={handleLinkClick} style={linkStyle}><BookOpen size={18} color={getIconColor('assignments')} /> My Assignments</Link>
          <Link to="/student/exams" onClick={handleLinkClick} style={linkStyle}><FileText size={18} color={getIconColor('exams')} /> Online Exams</Link>
          <Link to="/messages" onClick={handleLinkClick} style={linkStyle}><MessageSquare size={18} color={getIconColor('messages')} /> Messages</Link>
          <Link to="/calendar" onClick={handleLinkClick} style={linkStyle}><Calendar size={18} color={getIconColor('calendar')} /> {t('calendar')}</Link>
          <Link to="/fees" onClick={handleLinkClick} style={linkStyle}><CreditCard size={18} color={getIconColor('fees')} /> {t('fees')}</Link>
          <Link to="/student/id-card" onClick={handleLinkClick} style={linkStyle}><IdCard size={18} color={getIconColor('idcard')} /> {t('idCard')}</Link>
          <Link to="/schedule" onClick={handleLinkClick} style={linkStyle}><Clock size={18} color={getIconColor('schedule')} /> {t('schedule')}</Link>

        </>
      )}

      {user.permissions?.includes('view_child_grades') && (
        <>
          <Link to="/parent/grades" onClick={handleLinkClick} style={linkStyle}><GraduationCap size={18} color={getIconColor('grades')} /> {t('grades')}</Link>
          <Link to="/analytics/enhanced" onClick={handleLinkClick} style={linkStyle}><BarChart2 size={18} color={getIconColor('analytics')} /> Enhanced Analytics</Link>
          <Link to="/parent/notifications" onClick={handleLinkClick} style={linkStyle}><Bell size={18} color={getIconColor('notifications')} /> {t('notifications')}</Link>
          <Link to="/student/attendance" onClick={handleLinkClick} style={linkStyle}><CalendarCheck size={18} color={getIconColor('attendance')} /> {t('attendance')}</Link>
          <Link to="/link-student" onClick={handleLinkClick} style={linkStyle}><Users size={18} color={getIconColor('users')} /> {t('linkNewStudent')}</Link>
          <Link to="/messages" onClick={handleLinkClick} style={linkStyle}><MessageSquare size={18} color={getIconColor('messages')} /> Messages</Link>
          <Link to="/calendar" onClick={handleLinkClick} style={linkStyle}><Calendar size={18} color={getIconColor('calendar')} /> {t('calendar')}</Link>
          <Link to="/fees" onClick={handleLinkClick} style={linkStyle}><CreditCard size={18} color={getIconColor('fees')} /> {t('fees')}</Link>
          <Link to="/schedule" onClick={handleLinkClick} style={linkStyle}><Clock size={18} color={getIconColor('schedule')} /> {t('schedule')}</Link>
        </>
      )}

      {user.permissions?.includes('manage_users') && (
        <>
          <Link to="/admin/students" onClick={handleLinkClick} style={linkStyle}><Users size={18} color={getIconColor('users')} /> {t('Manage Students')}</Link>
          <Link to="/admin/upload" onClick={handleLinkClick} style={linkStyle}><Upload size={18} color={getIconColor('upload')} /> {t('Upload Grades')}</Link>
          <Link to="/analytics/enhanced" onClick={handleLinkClick} style={linkStyle}><BarChart2 size={18} color={getIconColor('analytics')} /> Enhanced Analytics</Link>
          <Link to="/admin/attendance" onClick={handleLinkClick} style={linkStyle}><CalendarCheck size={18} color={getIconColor('attendance')} /> {t('attendance')}</Link>
          <Link to="/admin/analytics" onClick={handleLinkClick} style={linkStyle}><BarChart2 size={18} color={getIconColor('analytics')} /> {t('analytics')}</Link>
          <Link to="/admin/audit" onClick={handleLinkClick} style={linkStyle}><ShieldCheck size={18} color={getIconColor('audit')} /> {t('auditLogs')}</Link>
          <Link to="/admin/announcements" onClick={handleLinkClick} style={linkStyle}><Megaphone size={18} color={getIconColor('announcements')} /> {t('announcements')}</Link>
          <Link to="/admin/link-requests" onClick={handleLinkClick} style={linkStyle}><UserCheck size={18} color={getIconColor('users')} /> {t('linkRequests')}</Link>
          <Link to="/admin/grade-approval" onClick={handleLinkClick} style={linkStyle}><ShieldCheck size={18} color={getIconColor('grades')} /> Grade Approvals</Link>
          <Link to="/admin/exam-approval" onClick={handleLinkClick} style={linkStyle}><ShieldCheck size={18} color={getIconColor('exams')} /> Exam Approvals</Link>
          <Link to="/admin/report-card" onClick={handleLinkClick} style={linkStyle}><Star size={18} color={getIconColor('reports')} /> Report Card Gen</Link>
          <Link to="/messages" onClick={handleLinkClick} style={linkStyle}><MessageSquare size={18} color={getIconColor('messages')} /> Messages</Link>
          <Link to="/admin/appeals" onClick={handleLinkClick} style={linkStyle}><Scale size={18} color={getIconColor('appeals')} /> {t('gradeAppeals')}</Link>
          <Link to="/calendar" onClick={handleLinkClick} style={linkStyle}><Calendar size={18} color={getIconColor('calendar')} /> {t('calendar')}</Link>
          <Link to="/fees" onClick={handleLinkClick} style={linkStyle}><CreditCard size={18} color={getIconColor('fees')} /> {t('fees')}</Link>
          <Link to="/schedule" onClick={handleLinkClick} style={linkStyle}><Clock size={18} color={getIconColor('schedule')} /> {t('schedule')}</Link>
        </>
      )}

      {user.permissions?.includes('enter_grades') && !user.permissions?.includes('manage_users') && (
        <>
          <Link to="/teacher/assignments" onClick={handleLinkClick} style={linkStyle}><BookOpen size={18} color={getIconColor('assignments')} /> My Assignments</Link>
          <Link to="/messages" onClick={handleLinkClick} style={linkStyle}><MessageSquare size={18} color={getIconColor('messages')} /> Messages</Link>
          <Link to="/admin/attendance" onClick={handleLinkClick} style={linkStyle}><CalendarCheck size={18} color={getIconColor('attendance')} /> {t('attendance')}</Link>
          <Link to="/admin/appeals" onClick={handleLinkClick} style={linkStyle}><Scale size={18} color={getIconColor('appeals')} /> {t('gradeAppeals')}</Link>
          <Link to="/calendar" onClick={handleLinkClick} style={linkStyle}><Calendar size={18} color={getIconColor('calendar')} /> {t('calendar')}</Link>
          <Link to="/schedule" onClick={handleLinkClick} style={linkStyle}><Clock size={18} color={getIconColor('schedule')} /> {t('schedule')}</Link>
          <Link to="/teacher/upload" onClick={handleLinkClick} style={linkStyle}><Upload size={18} color={getIconColor('upload')} /> {t('uploadGrades')}</Link>
          <Link to="/teacher/exams/create" onClick={handleLinkClick} style={linkStyle}><FileText size={18} color={getIconColor('exams')} /> Create Online Exam</Link>
          <Link to="/analytics/enhanced" onClick={handleLinkClick} style={linkStyle}><BarChart2 size={18} color={getIconColor('analytics')} /> Enhanced Analytics</Link>
        </>
      )}

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.2)', margin: '10px 0' }}></div>

      <Link to="/settings" onClick={handleLinkClick} style={linkStyle}>
        <User size={18} color={getIconColor('profile')} /> {t('profile')}
      </Link>
      <Link to="/settings" onClick={handleLinkClick} style={linkStyle}>
        <Settings size={18} color={getIconColor('settings')} /> {t('settings')}
      </Link>
      <Link to="/support" onClick={handleLinkClick} style={linkStyle}>
        <HelpCircle size={18} color={getIconColor('support')} /> {t('support')}
      </Link>
      <button
        onClick={() => { logout(); if (setIsMenuOpen) setIsMenuOpen(false); }}
        style={{
          ...linkStyle,
          width: '100%',
          textAlign: 'left',
          background: 'none',
          border: 'none',
          cursor: 'pointer'
        }}
      >
        <LogOut size={18} color={getIconColor('logout')} /> {t('logout')}
      </button>
    </div>
  );
};

// Main App Layout Component (Consumers of Context)
function AppLayout() {
  const { user, logout, loading } = useAuth();
  const { t } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [window.location.pathname]);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      // Save current scroll position
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
    } else {
      // Restore scroll position
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }

    // Cleanup on unmount
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  // Pages where Header/Sidebar/Footer should be hidden
  const isFullScreenPage = [
    '/',
    '/login',
    '/student/register',
    '/parent/register',
    '/teacher/register',
    '/student/setup',
    '/forgot-password',
    '/verify-email'
  ].includes(window.location.pathname) || window.location.pathname.startsWith('/reset-password/');

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f5f5f5'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h3>Loading University Grade Portal...</h3>
          <p>Please wait</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#f5f5f5'
    }}>
      {!isFullScreenPage && (
        <header style={{
          backgroundColor: '#ffffff',
          color: '#1e293b',
          padding: '0 20px',
          height: '56px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #e2e8f0',
          position: 'sticky',
          top: 0,
          zIndex: 1100
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {user && (
              <button
                className="hamburger-btn"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '24px', cursor: 'pointer', padding: '5px' }}
              >
                {isMenuOpen ? '✕' : '☰'}
              </button>
            )}
            <div style={{
              width: '32px',
              height: '32px',
              backgroundColor: '#3b82f6',
              color: 'white',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '16px',
              boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)'
            }}>
              🏫
            </div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>{t('universityGradePortal')}</h2>
          </div>

          {user && (
            <nav className="desktop-nav" style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 12px', backgroundColor: '#f1f5f9', borderRadius: '20px' }}>
                <div style={{ width: '8px', height: '8px', backgroundColor: '#10b981', borderRadius: '50%' }}></div>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>{user.name}</span>
              </div>
              <div style={{ height: '24px', width: '1px', backgroundColor: '#e2e8f0' }}></div>
              <LanguageSelector />
            </nav>
          )}
        </header>
      )}

      <div className="main-content-wrapper" style={{ display: isFullScreenPage ? 'block' : 'flex' }}>
        {/* Desktop Sidebar */}
        {!isFullScreenPage && user && (
          <aside className="desktop-sidebar">
            <NavigationLinks user={user} t={t} logout={logout} />
          </aside>
        )}

        {/* Mobile Menu Overlay */}
        {!isFullScreenPage && isMenuOpen && user && (
          <div
            className="mobile-menu-overlay"
            style={{
              position: 'fixed',
              top: '56px',
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              zIndex: 1000,
              animation: 'fadeIn 0.2s ease-in-out'
            }}
            onClick={() => setIsMenuOpen(false)}
          >
            <div
              className="mobile-menu-container"
              style={{
                backgroundColor: '#0f172a',
                width: '260px',
                maxWidth: '85vw',
                height: '100%',
                maxHeight: 'calc(100vh - 56px)',
                overflowY: 'auto',
                overflowX: 'hidden',
                padding: '15px',
                boxShadow: '4px 0 20px rgba(0,0,0,0.2)',
                animation: 'slideInLeft 0.3s ease-out'
              }}
              onClick={e => e.stopPropagation()}
            >
              <NavigationLinks user={user} t={t} setIsMenuOpen={setIsMenuOpen} logout={logout} />
            </div>
          </div>
        )}

        <main style={{
          flex: 1,
          padding: isFullScreenPage ? '0' : '24px',
          overflowX: 'hidden',
          overflowY: 'auto',
          height: isFullScreenPage ? '100vh' : 'calc(100vh - 56px)',
          backgroundColor: '#f8fafc'
        }}>
          <Routes>
            <Route path="/" element={user ? <Navigate to={user.permissions?.includes('manage_users') ? '/admin' : user.permissions?.includes('enter_grades') ? '/teacher' : user.permissions?.includes('view_child_grades') ? '/parent' : '/student'} /> : <LoginPage />} />
            <Route path="/student/register" element={<StudentRegistration />} />
            <Route path="/parent/register" element={<ParentRegistration />} />
            <Route path="/teacher/register" element={<TeacherRegistration />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="/support" element={<ProtectedRoute><SupportPage /></ProtectedRoute>} />
            <Route path="/student/setup" element={<ProtectedRoute><StudentProfileSetup /></ProtectedRoute>} />

            {/* Student Routes */}
            <Route path="/student" element={<ProtectedRoute allowedPermissions={['view_own_grades']}><StudentDashboard /></ProtectedRoute>} />
            <Route path="/student/grades" element={<ProtectedRoute allowedPermissions={['view_own_grades']}><StudentGrades /></ProtectedRoute>} />
            <Route path="/student/attendance" element={<ProtectedRoute allowedPermissions={['view_own_attendance', 'view_child_attendance']}><StudentAttendance /></ProtectedRoute>} />
            <Route path="/student/notifications" element={<ProtectedRoute allowedPermissions={['receive_notifications']}><StudentNotifications /></ProtectedRoute>} />
            <Route path="/student/assignments" element={<ProtectedRoute allowedPermissions={['view_own_grades']}><StudentAssignments /></ProtectedRoute>} />
            <Route path="/student/exams" element={<ProtectedRoute allowedPermissions={['view_own_grades']}><StudentExams /></ProtectedRoute>} />
            <Route path="/student/exam/:id" element={<ProtectedRoute allowedPermissions={['view_own_grades']}><StudentExamPlayer /></ProtectedRoute>} />
            <Route path="/student/id-card" element={<ProtectedRoute allowedPermissions={['view_own_grades']}><IdentityCard /></ProtectedRoute>} />

            {/* Parent Routes */}
            <Route path="/parent" element={<ProtectedRoute allowedPermissions={['view_child_grades']}><ParentDashboard /></ProtectedRoute>} />
            <Route path="/parent/grades" element={<ProtectedRoute allowedPermissions={['view_child_grades']}><ParentGrades /></ProtectedRoute>} />
            <Route path="/parent/notifications" element={<ProtectedRoute allowedPermissions={['receive_notifications']}><ParentNotifications /></ProtectedRoute>} />
            <Route path="/link-student" element={<ProtectedRoute allowedPermissions={['view_child_grades']}><LinkStudent /></ProtectedRoute>} />
            <Route path="/parent/link-student" element={<ProtectedRoute allowedPermissions={['view_child_grades']}><LinkStudent /></ProtectedRoute>} />

            {/* Admin Routes */}
            <Route path="/admin" element={<ProtectedRoute allowedPermissions={['manage_users']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/students" element={<ProtectedRoute allowedPermissions={['manage_users']}><StudentManagement /></ProtectedRoute>} />
            <Route path="/admin/upload" element={<ProtectedRoute allowedPermissions={['manage_grades']}><AdminUpload /></ProtectedRoute>} />
            <Route path="/admin/attendance" element={<ProtectedRoute allowedPermissions={['manage_attendance']}><AttendanceManagement /></ProtectedRoute>} />
            <Route path="/admin/analytics" element={<ProtectedRoute allowedPermissions={['view_analytics']}><AdminAnalytics /></ProtectedRoute>} />
            <Route path="/admin/appeals" element={<ProtectedRoute allowedPermissions={['manage_grades']}><AdminAppeals /></ProtectedRoute>} />
            <Route path="/admin/audit" element={<ProtectedRoute allowedPermissions={['manage_system']}><AdminAuditLogs /></ProtectedRoute>} />
            <Route path="/admin/announcements" element={<ProtectedRoute allowedPermissions={['manage_system']}><AdminAnnouncements /></ProtectedRoute>} />
            <Route path="/admin/link-requests" element={<ProtectedRoute allowedPermissions={['manage_users']}><AdminLinkRequests /></ProtectedRoute>} />
            <Route path="/admin/grade-approval" element={<ProtectedRoute allowedPermissions={['manage_grades']}><AdminGradeApproval /></ProtectedRoute>} />
            <Route path="/admin/exam-approval" element={<ProtectedRoute allowedPermissions={['manage_grades']}><AdminExamApproval /></ProtectedRoute>} />
            <Route path="/admin/report-card" element={<ProtectedRoute allowedPermissions={['manage_grades']}><AdminReportCard /></ProtectedRoute>} />
            <Route path="/admin/reports" element={<ProtectedRoute allowedPermissions={['view_analytics']}><ReportsPage /></ProtectedRoute>} />
            <Route path="/messages" element={<ProtectedRoute allowedPermissions={['view_own_grades', 'view_child_grades', 'enter_grades', 'manage_users']}><MessagesPage /></ProtectedRoute>} />
            <Route path="/calendar" element={<ProtectedRoute allowedPermissions={['view_own_grades', 'view_child_grades', 'enter_grades', 'manage_users']}><AcademicCalendar /></ProtectedRoute>} />
            <Route path="/fees" element={<ProtectedRoute allowedPermissions={['view_own_grades', 'view_child_grades', 'manage_fees']}><FeeManagement /></ProtectedRoute>} />

            <Route path="/schedule" element={<ProtectedRoute allowedPermissions={['view_own_grades', 'view_child_grades', 'enter_grades', 'manage_users']}><ClassSchedule /></ProtectedRoute>} />

            {/* Teacher Routes */}
            <Route path="/teacher" element={<ProtectedRoute allowedPermissions={['enter_grades']}><TeacherDashboard /></ProtectedRoute>} />
            <Route path="/teacher/upload" element={<ProtectedRoute allowedPermissions={['enter_grades']}><AdminUpload /></ProtectedRoute>} />
            <Route path="/teacher/exams/create" element={<ProtectedRoute allowedPermissions={['enter_grades']}><CreateExam /></ProtectedRoute>} />
            <Route path="/teacher/assignments" element={<ProtectedRoute allowedPermissions={['enter_grades']}><TeacherAssignments /></ProtectedRoute>} />

            {/* Enhanced Analytics - Available to all roles */}
            <Route path="/analytics/enhanced" element={<ProtectedRoute><EnhancedAnalyticsDashboard /></ProtectedRoute>} />

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>

      {!isFullScreenPage && (
        <footer style={{
          backgroundColor: '#333',
          color: 'white',
          padding: '20px',
          textAlign: 'center'
        }}>
          <p>&copy; 2025 University Grade Portal</p>
        </footer>
      )}
    </div >
  );
}

import { SocketProvider } from './context/SocketContext';

// Root App Component
function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <ToastProvider>
          <SocketProvider>
            <Router>
              <AppLayout />
            </Router>
          </SocketProvider>
        </ToastProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;