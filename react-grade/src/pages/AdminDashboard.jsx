import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import '../admin-dashboard.css';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../utils/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Link } from 'react-router-dom';
import {
  Users,
  UserCheck,
  GraduationCap,
  ClipboardCheck,
  ShieldCheck,
  Camera,
  Clock,
  PlusCircle,
  AlertCircle,
  Settings
} from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalParents: 0,
    totalGrades: 0,
    pendingLinks: 0,
    pendingTeachers: [],
    pendingParents: [],
    pendingGradeApprovals: []
  });
  const [error, setError] = useState(null);



  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const [statsData, pendingTeachers, pendingParents, pendingGradeApprovals] = await Promise.all([
          api.getDashboardStats(),
          api.getPendingTeachers().catch(() => []),
          api.getPendingParents().catch(() => []),
          api.getPendingGradesForApproval().catch(() => [])
        ]);

        if (statsData) {
          setStats({
            totalStudents: statsData.totalStudents || 0,
            totalParents: statsData.totalParents || 0,
            totalGrades: statsData.totalGrades || 0,
            pendingLinks: statsData.pendingLinks || 0,
            pendingTeachers: pendingTeachers || [],
            pendingParents: pendingParents || [],
            pendingGradeApprovals: pendingGradeApprovals || []
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError(error.message || 'Failed to fetch dashboard statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);



  const handleApprove = async (id, type) => {
    try {
      if (type === 'teacher') await api.approveTeacher(id);
      else if (type === 'parent') await api.approveParent(id);
      window.location.reload();
    } catch (error) {
      alert(`${t('failedToApprove').replace('{type}', type)}: ${error.message}`);
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  const dashboardCards = [
    {
      title: t('totalStudents'),
      value: stats.totalStudents,
      icon: <Users size={24} />,
      color: '#3b82f6',
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      link: '/admin/students'
    },
    {
      title: t('totalParents'),
      value: stats.totalParents,
      icon: <UserCheck size={24} />,
      color: '#10b981',
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      link: '/admin/link-requests?tab=approved'
    },
    {
      title: t('totalGrades'),
      value: stats.totalGrades,
      icon: <GraduationCap size={24} />,
      color: '#f59e0b',
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      link: '/admin/upload'
    },
    {
      title: t('pendingApprovals'),
      value: stats.pendingGradeApprovals.length,
      icon: <ClipboardCheck size={24} />,
      color: '#ef4444',
      gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      link: '/admin/grade-approval'
    }
  ];

  const quickLinks = [
    { label: t('examApprovals'), path: '/admin/exam-approval', icon: <ShieldCheck size={18} />, color: '#6366f1' },
    { label: t('attendance'), path: '/admin/attendance', icon: <Camera size={18} />, color: '#0ea5e9' },
    { label: t('classSchedule'), path: '/schedule', icon: <Clock size={18} />, color: '#a855f7' }
  ];

  return (
    <div className="admin-dashboard-container fade-in">
      {/* Background Floating Elements */}
      <div className="floating-shapes">
        <div style={{ top: '10%', left: '10%', width: '80px', height: '80px', animationDelay: '0s' }}></div>
        <div style={{ top: '70%', left: '80%', width: '120px', height: '120px', animationDelay: '2s' }}></div>
        <div style={{ top: '40%', left: '50%', width: '60px', height: '60px', animationDelay: '4s' }}></div>
      </div>

      <div className="admin-card" style={{ maxWidth: '1100px', margin: '20px auto' }}>
        <header className="admin-header">
          <div className="admin-title">{t('adminDashboard')}</div>
          <div className="year-badge" style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', background: 'transparent', boxShadow: 'none', animation: 'none' }}>
            <span style={{
              fontSize: '1.1rem',
              fontWeight: '700',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '1.5px',
              textTransform: 'uppercase'
            }}>ADMIN</span>
            <span style={{
              fontSize: '1.1rem',
              fontWeight: '700',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '1.5px',
              textTransform: 'uppercase'
            }}>
              {user?.name}
            </span>
            <span style={{
              fontSize: '1.1rem',
              fontWeight: '700',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '1.5px',
              textTransform: 'uppercase'
            }}>SYSTEM CONTROL</span>
          </div>
        </header>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '40px', flexWrap: 'wrap' }}>
          <Link to="/admin/add-admin" className="admin-btn">
            <PlusCircle size={18} /> {t('addAdministrator')}
          </Link>
          <Link to="/admin/settings" className="admin-btn">
            <Settings size={18} /> {t('systemSettings')}
          </Link>

          {/* Quick Links with specific Class Schedule styling */}
          <Link to="/schedule" className="admin-btn" style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
            border: 'none'
          }}>
            <Clock size={18} />
            <span style={{ letterSpacing: '0.5px', textTransform: 'uppercase', fontSize: '0.9rem' }}>{t('classSchedule')}</span>
          </Link>

          <Link to="/admin/attendance" className="admin-btn" style={{ background: 'white', color: '#0ea5e9', border: '2px solid #0ea5e9', boxShadow: 'none' }}>
            <Camera size={18} /> {t('attendance')}
          </Link>
        </div>

        {/* Top Stats Row */}
        <div className="admin-stats-grid">
          {dashboardCards.map((card, idx) => (
            <Link key={idx} to={card.link} className="stat-card-glass" style={{ textDecoration: 'none' }}>
              <div className="stat-icon-box" style={{ color: card.color }}>
                {card.icon}
              </div>
              <div>
                <div className="stat-value">{card.value}</div>
                <div className="stat-label">{card.title}</div>
              </div>
            </Link>
          ))}
        </div>

        <div className="admin-content-grid">
          {/* Pending Approvals Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>

            {/* Pending Approvals Alert Box */}
            {(stats.pendingTeachers.length > 0 || stats.pendingParents.length > 0) && (
              <div className="admin-card pulse-alert" style={{ borderColor: 'rgba(220, 38, 38, 0.5)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px' }}>
                  <AlertCircle size={24} color="#ef4444" />
                  <h3 style={{ margin: 0, color: '#dc2626', fontSize: '1.3rem', fontWeight: '800' }}>{t('criticalReviewRequired')}</h3>
                </div>
                <p style={{ fontSize: '0.95rem', marginBottom: '20px', color: '#6b7280', lineHeight: '1.6' }}>
                  {t('pendingRegistrationNotice')}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[...stats.pendingTeachers, ...stats.pendingParents].slice(0, 3).map((item, idx) => (
                    <div key={idx} style={{ background: '#f9fafb', padding: '12px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #e5e7eb' }}>
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '0.95rem', color: '#1f2937' }}>{item.name}</div>
                        <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '2px' }}>{item.teacherId ? 'Teacher' : 'Parent'}</div>
                      </div>
                      <button onClick={() => handleApprove(item.id, item.teacherId ? 'teacher' : 'parent')} className="admin-btn" style={{ padding: '8px 16px', fontSize: '0.85rem', background: '#dc2626', border: 'none', fontWeight: '600' }}>
                        Approve
                      </button>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '15px' }}>
                  <Link to="/admin/link-requests" style={{ color: '#667eea', fontSize: '0.95rem', fontWeight: '600', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    View all pending requests →
                  </Link>
                </div>
              </div>
            )}


          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

