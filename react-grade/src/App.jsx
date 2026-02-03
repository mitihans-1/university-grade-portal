import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { ToastProvider, useToast } from './components/common/Toast';
import LanguageSelector from './components/common/LanguageSelector';
import {
  Home,
  LayoutDashboard,
  GraduationCap,
  BarChart2,
  CalendarCheck,
  Bell,
  Camera,
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
import AdminAddAdmin from './pages/AdminAddAdmin';
import AdminSettings from './pages/AdminSettings';
import StudentManagement from './pages/StudentManagement';
import AdminIdManagement from './pages/AdminIdManagement';
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
import SupportPage from './pages/supportpage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import VerifyEmail from './pages/VerifyEmail';
import ProfileImageEditor from './components/common/ProfileImageEditor';
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
const NavigationLinks = ({ user, t, setIsMenuOpen, logout, onEditImage }) => {
  const { updateUser, updateProfile } = useAuth();
  const { showToast } = useToast();
  const fileInputRef = React.useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (2MB limit)
      if (file.size > 2 * 1024 * 1024) {
        showToast(t('imageTooLarge'), 'error');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        onEditImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveImage = async (croppedImage) => {
    try {
      const result = await updateProfile({ profileImage: croppedImage });
      if (result.success) {
        onEditImage(null);
        showToast(t('profilePictureUpdated'), 'success');
      } else {
        showToast(result.message || t('failedToUpdateProfilePicture'), 'error');
      }
    } catch (error) {
      showToast(t('errorSavingProfilePicture'), 'error');
    }
  };

  const location = useLocation();

  const getLinkStyle = (path) => {
    const isActive = location.pathname === path;
    return {
      color: isActive ? '#fff' : '#cbd5e1',
      textDecoration: 'none',
      fontSize: '14px',
      padding: '12px 16px',
      borderRadius: '12px',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '6px',
      backgroundColor: isActive ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
      borderLeft: isActive ? '4px solid #3b82f6' : '4px solid transparent',
      fontWeight: isActive ? '700' : '500'
    };
  };

  const sectionLabelStyle = {
    color: '#64748b',
    fontSize: '11px',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    margin: '20px 0 10px 16px'
  };

  const handleLinkClick = () => {
    if (setIsMenuOpen) setIsMenuOpen(false);
  };

  const getIconColor = (iconName, path) => {
    const isActive = location.pathname === path;
    if (isActive) return '#3b82f6';
    const colors = {
      home: '#10b981', dashboard: '#3b82f6', admin: '#3b82f6', grades: '#8b5cf6',
      analytics: '#f59e0b', attendance: '#06b6d4', notifications: '#ef4444',
      assignments: '#ec4899', exams: '#6366f1', messages: '#14b8a6',
      calendar: '#f97316', fees: '#84cc16', idcard: '#0ea5e9',
      schedule: '#a855f7', library: '#78716c', users: '#22c55e',
      upload: '#0284c7', audit: '#dc2626', announcements: '#f59e0b',
      appeals: '#eab308', reports: '#6366f1', settings: '#64748b',
      profile: '#475569', support: '#a855f7', logout: '#ef4444'
    };
    return colors[iconName] || '#cbd5e1';
  };

  if (!user) return null;

  const dashboardPath = user.permissions?.includes('manage_users') ? '/admin' : user.permissions?.includes('enter_grades') ? '/teacher' : user.permissions?.includes('view_child_grades') ? '/parent' : '/student';

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '2px',
      minHeight: 'min-content',
      paddingBottom: '20px'
    }}>
      <div style={{
        padding: '20px 16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 100%)',
        borderRadius: '16px',
        margin: '0 8px 15px 8px',
        border: '1px solid rgba(255,255,255,0.05)'
      }}>
        <div style={{ position: 'relative', marginBottom: '12px' }}>
          <div style={{
            width: '72px',
            height: '72px',
            borderRadius: '22px',
            backgroundColor: 'rgba(255,255,255,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid rgba(59, 130, 246, 0.3)',
            fontSize: '24px',
            color: 'white',
            overflow: 'hidden',
            boxShadow: '0 8px 16px rgba(0,0,0,0.2)'
          }}>
            {user.profileImage ? (
              <img src={user.profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <User size={36} color="#cbd5e1" />
            )}
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              position: 'absolute',
              bottom: '-4px',
              right: '-4px',
              width: '28px',
              height: '28px',
              borderRadius: '10px',
              backgroundColor: '#3b82f6',
              border: '2px solid #0f172a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'white',
              boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
            }}
            title={t('uploadProfilePicture')}
          >
            <Camera size={14} />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            style={{ display: 'none' }}
            accept="image/*"
          />
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: 'white', fontWeight: '800', fontSize: '16px', marginBottom: '2px' }}>{user.name}</div>
          <div style={{
            color: '#3b82f6',
            fontSize: '11px',
            textTransform: 'uppercase',
            fontWeight: '900',
            letterSpacing: '0.5px',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            padding: '2px 8px',
            borderRadius: '6px',
            display: 'inline-block'
          }}>
            {t(user.role)}
          </div>
        </div>
      </div>
      <div style={sectionLabelStyle}>{t('mainMenu')}</div>

      <Link to={dashboardPath} onClick={handleLinkClick} style={getLinkStyle(dashboardPath)}>
        <LayoutDashboard size={20} color={getIconColor('dashboard', dashboardPath)} /> {t('dashboard')}
      </Link>

      <Link to="/schedule" onClick={handleLinkClick} style={getLinkStyle('/schedule')}>
        <Clock size={20} color={getIconColor('schedule', '/schedule')} /> {t('classSchedule')}
      </Link>

      {user.permissions?.includes('view_own_grades') && !user.permissions?.includes('view_child_grades') && (
        <>
          <Link to="/student/attendance" onClick={handleLinkClick} style={getLinkStyle('/student/attendance')}><CalendarCheck size={20} color={getIconColor('attendance', '/student/attendance')} /> {t('attendance')}</Link>
          <Link to="/student/grades" onClick={handleLinkClick} style={getLinkStyle('/student/grades')}><GraduationCap size={20} color={getIconColor('grades', '/student/grades')} /> {t('myGrades')}</Link>
          <Link to="/student/assignments" onClick={handleLinkClick} style={getLinkStyle('/student/assignments')}><BookOpen size={20} color={getIconColor('assignments', '/student/assignments')} /> {t('myAssignments')}</Link>
          <Link to="/student/exams" onClick={handleLinkClick} style={getLinkStyle('/student/exams')}><ShieldCheck size={20} color={getIconColor('exams', '/student/exams')} /> {t('onlineExams')}</Link>
          <Link to="/messages" onClick={handleLinkClick} style={getLinkStyle('/messages')}><MessageSquare size={20} color={getIconColor('messages', '/messages')} /> {t('messages')}</Link>
          <Link to="/student/id-card" onClick={handleLinkClick} style={getLinkStyle('/student/id-card')}><IdCard size={20} color={getIconColor('idcard', '/student/id-card')} /> {t('idCard')}</Link>
        </>
      )}

      {user.permissions?.includes('view_child_grades') && (
        <>
          <Link to="/parent/grades" onClick={handleLinkClick} style={getLinkStyle('/parent/grades')}><GraduationCap size={20} color={getIconColor('grades', '/parent/grades')} /> {t('childGrades')}</Link>
          <Link to="/student/attendance" onClick={handleLinkClick} style={getLinkStyle('/student/attendance')}><CalendarCheck size={20} color={getIconColor('attendance', '/student/attendance')} /> {t('attendance')}</Link>
          <Link to="/link-student" onClick={handleLinkClick} style={getLinkStyle('/link-student')}><Users size={20} color={getIconColor('users', '/link-student')} /> {t('linkNewStudent')}</Link>
          <Link to="/messages" onClick={handleLinkClick} style={getLinkStyle('/messages')}><MessageSquare size={20} color={getIconColor('messages', '/messages')} /> {t('messages')}</Link>
        </>
      )}

      {user.permissions?.includes('manage_users') && (
        <>
          <div style={sectionLabelStyle}>{t('administrative')}</div>
          <Link to="/admin/students" onClick={handleLinkClick} style={getLinkStyle('/admin/students')}><Users size={20} color={getIconColor('users', '/admin/students')} /> {t('manageStudents')}</Link>
          <Link to="/admin/ids" onClick={handleLinkClick} style={getLinkStyle('/admin/ids')}><IdCard size={20} color={getIconColor('idcard', '/admin/ids')} /> {t('idManagement')}</Link>
          <Link to="/admin/upload" onClick={handleLinkClick} style={getLinkStyle('/admin/upload')}><GraduationCap size={20} color={getIconColor('upload', '/admin/upload')} /> {t('uploadGrades')}</Link>
          <Link to="/admin/grade-approval" onClick={handleLinkClick} style={getLinkStyle('/admin/grade-approval')}><ShieldCheck size={20} color={getIconColor('grades', '/admin/grade-approval')} /> {t('gradeApprovals')}</Link>
          <Link to="/admin/report-card" onClick={handleLinkClick} style={getLinkStyle('/admin/report-card')}><Star size={20} color={getIconColor('reports', '/admin/report-card')} /> {t('reportCardGen')}</Link>
          <Link to="/admin/exam-approval" onClick={handleLinkClick} style={getLinkStyle('/admin/exam-approval')}><ShieldCheck size={20} color={getIconColor('exams', '/admin/exam-approval')} /> {t('onlineExamsAdmin')}</Link>
          <Link to="/admin/link-requests" onClick={handleLinkClick} style={getLinkStyle('/admin/link-requests')}><UserCheck size={20} color={getIconColor('users', '/admin/link-requests')} /> {t('linkRequests')}</Link>

          <div style={sectionLabelStyle}>{t('system')}</div>
          <Link to="/admin/analytics" onClick={handleLinkClick} style={getLinkStyle('/admin/analytics')}><BarChart2 size={20} color={getIconColor('analytics', '/admin/analytics')} /> {t('analytics')}</Link>
          <Link to="/admin/audit" onClick={handleLinkClick} style={getLinkStyle('/admin/audit')}><ShieldCheck size={20} color={getIconColor('audit', '/admin/audit')} /> {t('auditLogs')}</Link>
          <Link to="/admin/settings" onClick={handleLinkClick} style={getLinkStyle('/admin/settings')}><Settings size={20} color={getIconColor('settings', '/admin/settings')} /> {t('systemSettings')}</Link>
        </>
      )}

      {user.permissions?.includes('enter_grades') && !user.permissions?.includes('manage_users') && (
        <>
          <Link to="/teacher/upload" onClick={handleLinkClick} style={getLinkStyle('/teacher/upload')}><GraduationCap size={20} color={getIconColor('upload', '/teacher/upload')} /> {t('uploadGrades')}</Link>
          <Link to="/teacher/assignments" onClick={handleLinkClick} style={getLinkStyle('/teacher/assignments')}><BookOpen size={20} color={getIconColor('assignments', '/teacher/assignments')} /> {t('myAssignments')}</Link>
          <Link to="/teacher/exams/create" onClick={handleLinkClick} style={getLinkStyle('/teacher/exams/create')}><ShieldCheck size={20} color={getIconColor('exams', '/teacher/exams/create')} /> {t('onlineExams')}</Link>
          <Link to="/messages" onClick={handleLinkClick} style={getLinkStyle('/messages')}><MessageSquare size={20} color={getIconColor('messages', '/messages')} /> {t('messages')}</Link>
          <Link to="/admin/attendance" onClick={handleLinkClick} style={getLinkStyle('/admin/attendance')}><CalendarCheck size={20} color={getIconColor('attendance', '/admin/attendance')} /> {t('attendance')}</Link>
        </>
      )}

      <div style={sectionLabelStyle}>{t('personal')}</div>
      <Link to="/settings" onClick={handleLinkClick} style={getLinkStyle('/settings')}>
        <Settings size={20} color={getIconColor('settings', '/settings')} /> {t('editProfile')}
      </Link>
      <Link to="/support" onClick={handleLinkClick} style={getLinkStyle('/support')}>
        <HelpCircle size={20} color={getIconColor('support', '/support')} /> {t('support')}
      </Link>

      <button
        onClick={() => { logout(); if (setIsMenuOpen) setIsMenuOpen(false); }}
        style={{
          ...getLinkStyle('logout'),
          width: 'calc(100% - 32px)',
          margin: '10px 16px',
          background: 'rgba(239, 68, 68, 0.1)',
          color: '#ef4444',
          border: 'none',
          cursor: 'pointer'
        }}
      >
        <LogOut size={20} color="#ef4444" /> {t('logout')}
      </button>
    </div >
  );
};

// Main App Layout Component (Consumers of Context)
function AppLayout() {
  const { user, logout, loading, updateUser, updateProfile } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingImage, setEditingImage] = useState(null);
  const navigate = useNavigate();

  const handleSaveImage = async (croppedImage) => {
    setIsSaving(true);
    try {
      const result = await updateProfile({ profileImage: croppedImage });
      if (result.success) {
        setEditingImage(null);
        showToast(t('profilePictureUpdated'), 'success');
      } else {
        showToast(result.message || t('failedToUpdateProfilePicture'), 'error');
      }
    } catch (error) {
      showToast(t('errorSavingProfilePicture'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

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
              width: '40px',
              height: '40px',
              backgroundColor: '#3b82f6',
              color: 'white',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '20px',
              boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)'
            }}>
              🏫
            </div>
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.5px' }}>{t('universityGradePortal')}</h2>
          </div>

          {user && (
            <nav className="desktop-nav" style={{ display: 'flex', gap: '28px', alignItems: 'center' }}>
              <Link to={user.role === 'admin' ? '/admin' : user.role === 'teacher' ? '/teacher' : user.role === 'parent' ? '/parent' : '/student'} style={{ color: '#475569', textDecoration: 'none', fontSize: '16px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <LayoutDashboard size={20} color="#3b82f6" /> {t('dashboard')}
              </Link>
              <Link to={user.role === 'student' ? '/student/grades' : user.role === 'parent' ? '/parent/grades' : user.role === 'teacher' ? '/teacher/upload' : '/admin/upload'} style={{ color: '#475569', textDecoration: 'none', fontSize: '16px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <GraduationCap size={20} color="#8b5cf6" /> {t('grades')}
              </Link>
              <Link to={user.role === 'student' ? '/student/notifications' : user.role === 'parent' ? '/parent/notifications' : user.role === 'teacher' ? '/messages' : '/admin/announcements'} style={{ color: '#475569', textDecoration: 'none', fontSize: '16px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bell size={20} color="#ef4444" /> {t('notifications')}
              </Link>
              <div style={{ height: '28px', width: '1px', backgroundColor: '#e2e8f0', margin: '0 10px' }}></div>
              <LanguageSelector />
            </nav>
          )}
        </header>
      )}

      <div className="main-content-wrapper" style={{ display: isFullScreenPage ? 'block' : 'flex' }}>
        {/* Desktop Sidebar */}
        {!isFullScreenPage && user && (
          <aside className="desktop-sidebar">
            <NavigationLinks user={user} t={t} logout={logout} onEditImage={setEditingImage} />
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
              backgroundColor: 'rgba(0,0,0,0.4)',
              backdropFilter: 'blur(4px)',
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
              <NavigationLinks user={user} t={t} setIsMenuOpen={setIsMenuOpen} logout={logout} onEditImage={setEditingImage} />
            </div>
          </div>
        )}

        <main style={{
          flex: 1,
          padding: isFullScreenPage ? '0' : 'clamp(1rem, 3vw, 24px)',
          overflowX: 'hidden',
          overflowY: 'auto',
          height: isFullScreenPage ? '100vh' : 'calc(100vh - 56px)',
          backgroundColor: '#f8fafc'
        }}>
          {editingImage && (
            <ProfileImageEditor
              image={editingImage}
              onSave={handleSaveImage}
              onCancel={() => setEditingImage(null)}
            />
          )}
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
            <Route path="/student/exam/:id" element={<ProtectedRoute allowedPermissions={['view_own_grades', 'manage_users', 'enter_grades']}><StudentExamPlayer /></ProtectedRoute>} />
            <Route path="/student/id-card" element={<ProtectedRoute allowedPermissions={['view_own_grades']}><IdentityCard /></ProtectedRoute>} />

            {/* Parent Routes */}
            <Route path="/parent" element={<ProtectedRoute allowedPermissions={['view_child_grades']}><ParentDashboard /></ProtectedRoute>} />
            <Route path="/parent/grades" element={<ProtectedRoute allowedPermissions={['view_child_grades']}><ParentGrades /></ProtectedRoute>} />
            <Route path="/parent/notifications" element={<ProtectedRoute allowedPermissions={['receive_notifications']}><ParentNotifications /></ProtectedRoute>} />
            <Route path="/link-student" element={<ProtectedRoute allowedPermissions={['view_child_grades']}><LinkStudent /></ProtectedRoute>} />
            <Route path="/parent/link-student" element={<ProtectedRoute allowedPermissions={['view_child_grades']}><LinkStudent /></ProtectedRoute>} />

            {/* Admin Routes */}
            <Route path="/admin" element={<ProtectedRoute allowedPermissions={['manage_users']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/add-admin" element={<ProtectedRoute allowedPermissions={['manage_users']}><AdminAddAdmin /></ProtectedRoute>} />
            <Route path="/admin/students" element={<ProtectedRoute allowedPermissions={['manage_users']}><StudentManagement /></ProtectedRoute>} />
            <Route path="/admin/ids" element={<ProtectedRoute allowedPermissions={['manage_users']}><AdminIdManagement /></ProtectedRoute>} />
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
            <Route path="/admin/settings" element={<ProtectedRoute allowedPermissions={['manage_users']}><AdminSettings /></ProtectedRoute>} />
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