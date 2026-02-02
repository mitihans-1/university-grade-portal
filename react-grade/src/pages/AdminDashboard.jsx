import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../utils/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Link } from 'react-router-dom';

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
    recentGrades: []
  });
  const [error, setError] = useState(null);
  const [selectedGrades, setSelectedGrades] = useState([]);
  const [hiddenGradeIds, setHiddenGradeIds] = useState([]);
  const [healthStats, setHealthStats] = useState({ studentsByDept: [], teachersByDept: [] });

  // Load hidden grades from database on mount
  useEffect(() => {
    const loadHiddenGrades = async () => {
      try {
        const result = await api.getAdminPreference('hidden_recent_grades');
        if (result.value) {
          setHiddenGradeIds(result.value);
        }
      } catch (error) {
        console.error('Error loading hidden grades:', error);
      }
    };
    loadHiddenGrades();
  }, []);

  const handleToggleGrade = (gradeId) => {
    setSelectedGrades(prev =>
      prev.includes(gradeId)
        ? prev.filter(id => id !== gradeId)
        : [...prev, gradeId]
    );
  };

  const handleToggleAll = () => {
    if (selectedGrades.length === stats.recentGrades.length) {
      setSelectedGrades([]);
    } else {
      setSelectedGrades(stats.recentGrades.map(g => g.id));
    }
  };

  const handleDeleteRecentGrades = async () => {
    const gradesToRemove = selectedGrades.length > 0
      ? stats.recentGrades.filter(g => selectedGrades.includes(g.id))
      : stats.recentGrades;

    if (gradesToRemove.length === 0) {
      alert(t('noGradesSelectedToRemove'));
      return;
    }

    const confirmMessage = selectedGrades.length > 0
      ? t('confirmRemoveGrades').replace('{count}', selectedGrades.length)
      : t('confirmRemoveAllGrades');

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      // Add grade IDs to hidden list
      const gradeIdsToHide = gradesToRemove.map(g => g.id);
      const updatedHiddenIds = [...new Set([...hiddenGradeIds, ...gradeIdsToHide])];

      // Save to database instead of localStorage
      await api.setAdminPreference('hidden_recent_grades', updatedHiddenIds);
      setHiddenGradeIds(updatedHiddenIds);

      // Clear selected grades
      setSelectedGrades([]);

      alert(t('successfullyRemoved').replace('{count}', gradesToRemove.length));
    } catch (error) {
      console.error('Error removing grades from display:', error);
      alert(t('failedToRemove'));
    }
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const [statsData, pendingTeachers, pendingParents, pendingGradeApprovals, healthData] = await Promise.all([
          api.getDashboardStats(),
          api.getPendingTeachers(),
          api.getPendingParents(),
          api.getPendingGradesForApproval(),
          api.getUniversityHealth()
        ]);

        if (statsData) {
          // Filter out hidden grades
          const visibleRecentGrades = (statsData.recentGrades || []).filter(
            grade => !hiddenGradeIds.includes(grade.id)
          );

          setStats({
            totalStudents: statsData.totalStudents || 0,
            totalParents: statsData.totalParents || 0,
            totalGrades: statsData.totalGrades || 0,
            pendingLinks: statsData.pendingLinks || 0,
            pendingTeachers: pendingTeachers || [],
            pendingParents: pendingParents || [],
            pendingGradeApprovals: pendingGradeApprovals || [],
            recentGrades: visibleRecentGrades
          });
        }

        if (healthData) {
          setHealthStats(healthData);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError(error.message || 'Failed to fetch dashboard statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [hiddenGradeIds]);

  const handleApprove = async (id, type) => {
    try {
      if (type === 'teacher') {
        await api.approveTeacher(id);
      } else if (type === 'parent') {
        await api.approveParent(id);
      }

      alert(`${type.charAt(0).toUpperCase() + type.slice(1)} approved successfully!`);
      // Refresh stats
      window.location.reload();
    } catch (error) {
      console.error(`Error approving ${type}:`, error);
      alert(`Failed to approve ${type}: ${error.message || 'Server error'}`);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (error) {
    return (
      <div className="dashboard-container fade-in">
        <div style={{
          padding: '20px',
          backgroundColor: '#ffebee',
          color: '#c62828',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #ef5350'
        }}>
          <h3>{t('errorLoadingDashboard')}</h3>
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '10px',
              padding: '8px 16px',
              backgroundColor: '#c62828',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {t('retry')}
          </button>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: t('totalStudents'),
      value: stats.totalStudents,
      icon: '👨‍🎓',
      color: '#1976d2',
      link: '/admin/students'
    },
    {
      title: t('totalParents'),
      value: stats.totalParents,
      icon: '👨‍👩‍👧‍👦',
      color: '#2e7d32',
      link: '/admin/link-requests?tab=approved'
    },
    {
      title: t('totalGrades'),
      value: stats.totalGrades,
      icon: '📊',
      color: '#ed6c02',
      link: '/admin/upload'
    },
    {
      title: 'Pending Grade Approvals',
      value: stats.pendingGradeApprovals?.length || 0,
      icon: '📋',
      color: '#d32f2f',
      link: '/admin/grade-approval'
    },
    {
      title: t('examApprovals'),
      value: '📝',
      icon: '🛡️',
      color: '#6366f1',
      link: '/admin/exam-approval'
    },
    {
      title: t('classSchedule'),
      value: '📅',
      icon: '⏰',
      color: '#a855f7',
      link: '/schedule'
    }
  ];

  return (
    <div className="dashboard-container fade-in">
      <div style={{ marginBottom: '30px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ marginBottom: '8px', fontSize: '2rem', fontWeight: '800', color: '#1a237e' }}>{t('adminDashboard')}</h1>
          <p style={{ color: '#64748b', fontSize: '1.1rem' }}>{t('welcomeBack')}, <span style={{ fontWeight: '600', color: '#0f172a' }}>{user?.name}</span></p>
        </div>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <div style={{
            display: 'flex',
            backgroundColor: '#fff',
            padding: '10px 15px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            gap: '20px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>Workflow Health</div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <div title="Pending Registrations" style={{ color: (stats.pendingTeachers.length + stats.pendingParents.length) > 0 ? '#f59e0b' : '#10b981', fontWeight: '800' }}>
                  👤 {stats.pendingTeachers.length + stats.pendingParents.length}
                </div>
                <div title="Pending Grades" style={{ color: (stats.pendingGradeApprovals?.length || 0) > 0 ? '#ef4444' : '#10b981', fontWeight: '800' }}>
                  📋 {stats.pendingGradeApprovals?.length || 0}
                </div>
                <div title="Link Requests" style={{ color: stats.pendingLinks > 0 ? '#3b82f6' : '#10b981', fontWeight: '800' }}>
                  🔗 {stats.pendingLinks}
                </div>
              </div>
            </div>
          </div>
          <Link
            to="/admin/add-admin"
            style={{
              backgroundColor: '#1a237e',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '12px',
              textDecoration: 'none',
              fontWeight: '700',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(26, 35, 126, 0.2)',
              transition: 'all 0.2s'
            }}
          >
            <span>➕</span> {t('addAdministrator')}
          </Link>
        </div>
      </div>

      <div className="grid-container" style={{
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        marginBottom: '25px'
      }}>
        {statCards.map((card, index) => (
          <Link
            key={index}
            to={card.link}
            className="stagger-item"
            style={{
              textDecoration: 'none',
              color: 'inherit',
              display: 'block'
            }}
          >
            <div style={{
              backgroundColor: 'white',
              padding: '24px',
              borderRadius: '16px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              cursor: 'pointer',
              height: '100%',
              border: '1px solid rgba(0,0,0,0.05)',
              position: 'relative',
              overflow: 'hidden'
            }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.05)';
              }}
            >
              <div style={{
                position: 'absolute',
                top: '-15px',
                right: '-15px',
                fontSize: '80px',
                opacity: 0.05,
                transform: 'rotate(15deg)',
                color: card.color
              }}>
                {card.icon}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', zIndex: 1 }}>
                <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    backgroundColor: `${card.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    color: card.color
                  }}>
                    {card.icon}
                  </div>
                  <h3 style={{ margin: 0, color: '#64748b', fontSize: '14px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{card.title}</h3>
                </div>
                <div style={{ marginTop: 'auto' }}>
                  <h2 style={{ margin: 0, fontSize: '32px', fontWeight: '700', color: '#1e293b' }}>{card.value}</h2>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div style={{ marginTop: '30px' }}>
        {/* University Health Snapshot */}
        <div className="stagger-item" style={{
          backgroundColor: 'white',
          padding: '25px',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
          border: '1px solid rgba(0,0,0,0.05)',
          marginBottom: '30px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', color: '#1e293b' }}>University Population by Department</h3>
            <div style={{ fontSize: '12px', color: '#64748b' }}>Operational Balance</div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '30px'
          }}>
            {/* Students Distribution */}
            <div>
              <h4 style={{ fontSize: '14px', color: '#64748b', marginBottom: '15px', textTransform: 'uppercase' }}>Student Distribution</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {healthStats.studentsByDept.length > 0 ? healthStats.studentsByDept.map(dept => (
                  <div key={dept.department}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: '600' }}>{dept.department}</span>
                      <span>{dept.count} students</span>
                    </div>
                    <div style={{ height: '6px', backgroundColor: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        backgroundColor: '#3b82f6',
                        width: `${(dept.count / stats.totalStudents) * 100}%`,
                        transition: 'width 1s ease-in-out'
                      }} />
                    </div>
                  </div>
                )) : <p style={{ fontSize: '13px', color: '#94a3b8' }}>No departmental data available</p>}
              </div>
            </div>

            {/* Teachers Distribution */}
            <div>
              <h4 style={{ fontSize: '14px', color: '#64748b', marginBottom: '15px', textTransform: 'uppercase' }}>Teacher Workload</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {healthStats.teachersByDept.length > 0 ? healthStats.teachersByDept.map(dept => (
                  <div key={dept.department}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: '600' }}>{dept.department}</span>
                      <span>{dept.count} teachers</span>
                    </div>
                    <div style={{ height: '6px', backgroundColor: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        backgroundColor: '#10b981',
                        width: `${(dept.count / (healthStats.teachersByDept.reduce((a, b) => a + parseInt(b.count), 0) || 1)) * 100}%`,
                        transition: 'width 1s ease-in-out'
                      }} />
                    </div>
                  </div>
                )) : <p style={{ fontSize: '13px', color: '#94a3b8' }}>No teacher data available</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Pending Approvals Section */}
        {(stats.pendingTeachers.length > 0 || stats.pendingParents.length > 0) && (
          <div className="stagger-item" style={{
            backgroundColor: '#fffbeb',
            padding: '25px',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            border: '1px solid #fde68a',
            marginBottom: '30px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <span style={{ fontSize: '24px' }}>🔔</span>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#92400e' }}>Pending Approval Notifications</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {stats.pendingTeachers.map((teacher) => (
                <div key={`pending-t-${teacher.id}`} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: 'white',
                  padding: '15px 20px',
                  borderRadius: '12px',
                  border: '1px solid #fef3c7'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ width: '40px', height: '40px', backgroundColor: '#ecfdf5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>👨‍🏫</div>
                    <div>
                      <p style={{ margin: 0, fontWeight: '700', color: '#1e293b' }}>{teacher.name}</p>
                      <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                        Teacher Registration • ID: {teacher.teacherId} • {teacher.department || 'General'}
                      </p>
                      <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>
                        Assigned: Year {teacher.year || 'N/A'} • Semester {teacher.semester || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleApprove(teacher.id, 'teacher')}
                    className="modern-btn"
                    style={{ padding: '8px 16px', fontSize: '13px', background: 'linear-gradient(45deg, #10b981, #34d399)' }}
                  >
                    Approve Teacher
                  </button>
                </div>
              ))}

              {stats.pendingParents.map((parent) => (
                <div key={`pending-p-${parent.id}`} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: 'white',
                  padding: '15px 20px',
                  borderRadius: '12px',
                  border: '1px solid #fef3c7'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ width: '40px', height: '40px', backgroundColor: '#eff6ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>👨‍👩‍👧</div>
                    <div>
                      <p style={{ margin: 0, fontWeight: '700', color: '#1e293b' }}>{parent.name}</p>
                      <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Parent Registration • Linking to Student {parent.studentId}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleApprove(parent.id, 'parent')}
                    className="modern-btn"
                    style={{ padding: '8px 16px', fontSize: '13px', background: 'linear-gradient(45deg, #3b82f6, #60a5fa)' }}
                  >
                    Approve Parent
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="stagger-item" style={{
          backgroundColor: 'white',
          padding: '25px',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
          border: '1px solid rgba(0,0,0,0.05)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '10px',
            borderBottom: '1px solid #f1f5f9',
            paddingBottom: '15px'
          }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#1e293b' }}>{t('recentGrades')}</h3>
              <p style={{ margin: '5px 0 0 0', color: '#64748b', fontSize: '13px' }}>{t('manageRecentGrades')}</p>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              {stats.recentGrades.length > 0 && (
                <>
                  <button
                    onClick={handleToggleAll}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: selectedGrades.length === stats.recentGrades.length ? '#fff' : '#f8fafc',
                      color: selectedGrades.length === stats.recentGrades.length ? '#ef4444' : '#64748b',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '600',
                      transition: 'all 0.2s'
                    }}
                  >
                    {selectedGrades.length === stats.recentGrades.length ? t('deselectAll') : t('selectAll')}
                  </button>
                  <button
                    onClick={handleDeleteRecentGrades}
                    disabled={selectedGrades.length === 0}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: selectedGrades.length === 0 ? '#f1f5f9' : '#fff0f0',
                      color: selectedGrades.length === 0 ? '#cbd5e1' : '#ef4444',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: selectedGrades.length === 0 ? 'not-allowed' : 'pointer',
                      fontSize: '13px',
                      fontWeight: '600',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    🗑️ {t('remove')} {selectedGrades.length > 0 ? `(${selectedGrades.length})` : ''}
                  </button>
                </>
              )}
            </div>
          </div>
          {stats.recentGrades.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {stats.recentGrades.map((grade, index) => (
                <div
                  key={index}
                  style={{
                    padding: '16px',
                    backgroundColor: selectedGrades.includes(grade.id) ? '#f0f9ff' : '#ffffff',
                    borderRadius: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    border: selectedGrades.includes(grade.id) ? '1px solid #3b82f6' : '1px solid #f1f5f9',
                    transition: 'all 0.2s',
                    boxShadow: 'sm'
                  }}
                  className="hover-scale-sm"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <input
                        type="checkbox"
                        checked={selectedGrades.includes(grade.id)}
                        onChange={() => handleToggleGrade(grade.id)}
                        style={{
                          width: '20px',
                          height: '20px',
                          cursor: 'pointer',
                          accentColor: '#3b82f6'
                        }}
                      />
                    </div>

                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: '#f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px'
                    }}>
                      👤
                    </div>

                    <div style={{ flex: 1 }}>
                      <strong style={{ color: '#0f172a', fontSize: '15px' }}>{grade.courseName || grade.courseCode}</strong>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                        <span style={{ fontSize: '13px', color: '#64748b' }}>{grade.studentName}</span>
                        <span style={{ fontSize: '13px', color: '#cbd5e1' }}>•</span>
                        <span style={{ fontSize: '13px', color: '#64748b' }}>{t('semester')} {grade.semester}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{
                    padding: '6px 16px',
                    backgroundColor: grade.grade === 'A' ? '#dcfce7' : grade.grade === 'B' ? '#dbeafe' : '#ffedd5',
                    color: grade.grade === 'A' ? '#166534' : grade.grade === 'B' ? '#1e40af' : '#9a3412',
                    borderRadius: '20px',
                    fontWeight: '700',
                    fontSize: '14px',
                    minWidth: '50px',
                    textAlign: 'center'
                  }}>
                    {grade.grade}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              padding: '40px',
              textAlign: 'center',
              backgroundColor: '#f8fafc',
              borderRadius: '12px',
              border: '2px dashed #e2e8f0'
            }}>
              <div style={{ fontSize: '40px', marginBottom: '10px', opacity: 0.5 }}>📊</div>
              <p style={{ color: '#64748b', margin: 0 }}>{t('noRecentGrades')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

