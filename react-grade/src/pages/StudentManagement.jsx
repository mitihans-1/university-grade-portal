import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../utils/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Search, Filter, Edit2, Trash2, MessageSquare, CheckCircle, XCircle, Shield, User, Mail, Phone, AlertCircle, Send, X } from 'lucide-react';
import '../admin-dashboard.css';

const StudentManagement = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [editingStudent, setEditingStudent] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    department: '',
    year: '',
    phone: ''
  });
  const [notifyingStudent, setNotifyingStudent] = useState(null);
  const [notificationForm, setNotificationForm] = useState({
    title: '',
    message: '',
    type: 'administrative'
  });
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState('all');
  const [error, setError] = useState(null);
  const searchInputRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    if (queryParams.get('focus') === 'search' && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [location]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      const studentsData = await api.getAllStudents();
      setStudents(studentsData || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      setError(error.message || 'Failed to fetch students');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (student) => {
    setEditingStudent(student.id);
    setEditForm({
      name: student.name,
      email: student.email,
      department: student.department || '',
      year: student.year || '1',
      phone: student.phone || ''
    });
  };

  const handleUpdate = async () => {
    try {
      const result = await api.updateStudent(editingStudent, editForm);
      if (result && !result.msg) {
        setStudents(students.map(s =>
          s.id === editingStudent ? { ...s, ...editForm } : s
        ));
        setEditingStudent(null);
      } else {
        alert(result.msg || t('errorUpdatingStudent'));
      }
    } catch (error) {
      console.error('Error updating student:', error);
      alert(t('errorUpdatingStudent'));
    }
  };

  const handleDelete = async (studentId) => {
    if (window.confirm(t('confirmDeleteStudent'))) {
      try {
        const result = await api.deleteStudent(studentId);
        if (result && !result.msg) {
          setStudents(students.filter(s => s.id !== studentId));
        } else {
          alert(result.msg || t('errorDeletingStudent'));
        }
      } catch (error) {
        console.error('Error deleting student:', error);
        alert(t('errorDeletingStudent'));
      }
    }
  };

  const handleToggleVerify = async (studentId, currentStatus) => {
    try {
      const result = await api.verifyStudent(studentId, !currentStatus);
      if (result.msg) {
        setStudents(prev => prev.map(s => s.id === studentId ? { ...s, isVerified: !currentStatus } : s));
      }
    } catch (error) {
      console.error('Error toggling verification:', error);
    }
  };

  const handleNotifyParentClick = (student) => {
    setNotifyingStudent(student);
    setNotificationForm({
      title: t('studentIssueReport') || 'Issue Report',
      message: '',
      type: 'administrative'
    });
  };

  const handleSendNotification = async () => {
    if (!notificationForm.message) {
      alert(t('pleaseEnterAllFields'));
      return;
    }
    try {
      setSending(true);
      const result = await api.sendDirectNotification({
        ...notificationForm,
        parentId: notifyingStudent.parentLink.parent.id,
        studentId: notifyingStudent.studentId
      });
      if (result.success) {
        setNotifyingStudent(null);
        alert('Notification sent successfully');
      } else {
        alert(result.msg || t('errorSendingNotification'));
      }
    } catch (error) {
      alert(t('errorSendingNotification'));
    } finally {
      setSending(false);
    }
  };

  const filteredStudents = students.filter(student => {
    if (selectedYear !== 'all' && student.year !== selectedYear.toString()) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        student.studentId?.toLowerCase().includes(search) ||
        student.name?.toLowerCase().includes(search)
      );
    }
    return true;
  });

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="admin-dashboard-container fade-in">
      <div className="admin-card" style={{ maxWidth: '1400px', margin: '20px auto' }}>
        <header className="admin-header">
          <div className="admin-title" style={{ textAlign: 'center' }}>
            {t('studentManagement')}
          </div>
          <p className="admin-subtitle" style={{ textAlign: 'center', marginBottom: '30px' }}>
            {t('manageStudentInformation')}
          </p>
        </header>

        <div className="admin-stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '30px' }}>
          <div className="stat-card-glass">
            <div className="stat-icon-box" style={{ color: '#3b82f6' }}>
              <User size={24} />
            </div>
            <div className="stat-value">{students.length}</div>
            <div className="stat-label">{t('totalStudentsLabel')}</div>
          </div>
        </div>

        <div className="admin-card" style={{ marginBottom: '30px', background: 'rgba(255,255,255,0.5)' }}>
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
              <Search size={20} color="#64748b" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder={t('searchByIdOrName')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input"
                style={{ flex: 1 }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Filter size={20} color="#64748b" />
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="form-input"
                style={{ width: '150px' }}
              >
                <option value="all">{t('referenceAllYears')}</option>
                {[1, 2, 3, 4, 5].map(y => <option key={y} value={y}>{t(`year${y}`) || `Year ${y}`}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="admin-card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="dash-table">
              <thead>
                <tr>
                  <th>{t('student')}</th>
                  <th>{t('contact')}</th>
                  <th>{t('department')}</th>
                  <th>{t('year')}</th>
                  <th>{t('parent')}</th>
                  <th>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <tr key={student.id}>
                      <td>
                        {editingStudent === student.id ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <input className="form-input" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} placeholder={t('name')} />
                            <div style={{ fontSize: '12px', color: '#64748b' }}>{student.studentId}</div>
                          </div>
                        ) : (
                          <div>
                            <div style={{ fontWeight: '600', color: '#1e293b' }}>{student.name}</div>
                            <div style={{ fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {student.studentId}
                              {student.isVerified ?
                                <CheckCircle size={14} color="#16a34a" fill="#dcfce7" /> :
                                <div onClick={() => handleToggleVerify(student.id, student.isVerified)} style={{ cursor: 'pointer' }}><Shield size={14} color="#ca8a04" /></div>
                              }
                            </div>
                          </div>
                        )}
                      </td>
                      <td>
                        {editingStudent === student.id ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <input className="form-input" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} placeholder={t('email')} />
                            <input className="form-input" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} placeholder={t('phone')} />
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#475569' }}>
                              <Mail size={14} /> {student.email}
                            </div>
                            {student.phone && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#475569' }}>
                                <Phone size={14} /> {student.phone}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td>
                        {editingStudent === student.id ? (
                          <select className="form-input" value={editForm.department} onChange={e => setEditForm({ ...editForm, department: e.target.value })}>
                            <option value="Computer Science">{t('computerScience') || 'Computer Science'}</option>
                            <option value="Electrical Engineering">{t('electricalEngineering') || 'Electrical Engineering'}</option>
                            <option value="Mechanical Engineering">{t('mechanicalEngineering') || 'Mechanical Engineering'}</option>
                            <option value="Civil Engineering">{t('civilEngineering') || 'Civil Engineering'}</option>
                            <option value="Medicine">{t('medicine') || 'Medicine'}</option>
                            <option value="Business Administration">{t('businessAdministration') || 'Business Administration'}</option>
                          </select>
                        ) : (
                          <span>{student.department || t('unassigned')}</span>
                        )}
                      </td>
                      <td>
                        {editingStudent === student.id ? (
                          <input type="number" className="form-input" value={editForm.year} onChange={e => setEditForm({ ...editForm, year: e.target.value })} />
                        ) : (
                          <span style={{ fontWeight: '600' }}>Yr {student.year}</span>
                        )}
                      </td>
                      <td>
                        {student.parentLink ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <User size={14} color="#64748b" />
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '13px', fontWeight: '500', color: '#334155' }}>{student.parentLink.parent.name}</span>
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '5px' }}>
                              <button
                                onClick={() => handleNotifyParentClick(student)}
                                title={t('notifyParent')}
                                style={{ padding: '6px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white', cursor: 'pointer', color: '#f59e0b' }}
                              >
                                <AlertCircle size={16} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <span style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic' }}>{t('noParentLinked')}</span>
                        )}
                      </td>
                      <td>
                        {editingStudent === student.id ? (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={handleUpdate} className="admin-btn" style={{ padding: '8px 12px', background: '#10b981' }}><CheckCircle size={16} /></button>
                            <button onClick={() => setEditingStudent(null)} className="admin-btn" style={{ padding: '8px 12px', background: '#64748b' }}><XCircle size={16} /></button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => handleEdit(student)} className="admin-btn" style={{ padding: '8px 12px', background: '#3b82f6' }}><Edit2 size={16} /></button>
                            <button onClick={() => handleDelete(student.id)} className="admin-btn" style={{ padding: '8px 12px', background: '#ef4444' }}><Trash2 size={16} /></button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                      <Search size={48} style={{ marginBottom: '15px', opacity: 0.5 }} />
                      <p>{t('noStudentsFound')}</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Notification Modal */}
      {notifyingStudent && (
        <div className="modal-overlay" onClick={() => setNotifyingStudent(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, color: '#1e293b' }}>{t('notifyParent')}</h2>
              <button onClick={() => setNotifyingStudent(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} color="#64748b" /></button>
            </div>

            <div className="form-group">
              <label className="form-label">{t('notificationTitle') || 'Title'}</label>
              <input
                type="text"
                value={notificationForm.title}
                onChange={(e) => setNotificationForm({ ...notificationForm, title: e.target.value })}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('messageToParent') || 'Message'}</label>
              <textarea
                value={notificationForm.message}
                onChange={(e) => setNotificationForm({ ...notificationForm, message: e.target.value })}
                rows="4"
                className="form-input"
                style={{ resize: 'vertical' }}
                placeholder={t('writeMessagePlaceholder')}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                onClick={() => setNotifyingStudent(null)}
                className="admin-btn"
                style={{ background: '#94a3b8', padding: '10px 20px' }}
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleSendNotification}
                disabled={sending}
                className="admin-btn"
                style={{ background: '#ea580c', padding: '10px 20px' }}
              >
                {sending ? t('sending') : <><Send size={18} /> {t('sendNotification')}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManagement;