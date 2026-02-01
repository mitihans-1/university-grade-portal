import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../utils/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Search, Filter, Edit2, Trash2, MessageSquare, CheckCircle, XCircle, Shield, User, Mail, Phone, BookOpen, AlertCircle, Send } from 'lucide-react';

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
      title: t('studentIssueReport'),
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
    <div className="fade-in" style={{ maxWidth: '1400px', margin: '0 auto', padding: '30px' }}>
      <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ color: '#1e293b', fontSize: '28px', marginBottom: '8px' }}>{t('studentManagement')}</h1>
          <p style={{ color: '#64748b' }}>{t('manageStudentInformation')}</p>
        </div>
        <div style={{ padding: '10px 20px', backgroundColor: '#e2e8f0', borderRadius: '20px', color: '#475569', fontWeight: '600' }}>
          Total Students: {students.length}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '25px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, position: 'relative', minWidth: '300px' }}>
          <Search size={20} color="#94a3b8" style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            ref={searchInputRef}
            type="text"
            placeholder={t('searchByIdOrName')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="modern-input"
            style={{ paddingLeft: '45px', width: '100%' }}
          />
        </div>
        <div style={{ position: 'relative', minWidth: '200px' }}>
          <Filter size={20} color="#94a3b8" style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)' }} />
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="modern-input"
            style={{ paddingLeft: '45px', width: '100%', appearance: 'none' }}
          >
            <option value="all">{t('referenceAllYears')}</option>
            {[1, 2, 3, 4, 5].map(y => <option key={y} value={y}>{t(`year${y}`)}</option>)}
          </select>
        </div>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '15px 20px', textAlign: 'left', color: '#475569', fontWeight: '600' }}>{t('student')}</th>
                <th style={{ padding: '15px 20px', textAlign: 'left', color: '#475569', fontWeight: '600' }}>Contact</th>
                <th style={{ padding: '15px 20px', textAlign: 'left', color: '#475569', fontWeight: '600' }}>{t('department')}</th>
                <th style={{ padding: '15px 20px', textAlign: 'left', color: '#475569', fontWeight: '600' }}>{t('year')}</th>
                <th style={{ padding: '15px 20px', textAlign: 'left', color: '#475569', fontWeight: '600' }}>{t('parent')}</th>
                <th style={{ padding: '15px 20px', textAlign: 'left', color: '#475569', fontWeight: '600' }}>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => (
                <tr key={student.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.2s' }} className="hover-bg-slate-50">
                  <td style={{ padding: '15px 20px' }}>
                    {editingStudent === student.id ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <input className="modern-input" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} placeholder="Name" />
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
                  <td style={{ padding: '15px 20px' }}>
                    {editingStudent === student.id ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <input className="modern-input" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} placeholder="Email" />
                        <input className="modern-input" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} placeholder="Phone" />
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
                  <td style={{ padding: '15px 20px' }}>
                    {editingStudent === student.id ? (
                      <select className="modern-input" value={editForm.department} onChange={e => setEditForm({ ...editForm, department: e.target.value })}>
                        <option value="Computer Science">Computer Science</option>
                        <option value="Electrical Engineering">Electrical Engineering</option>
                        <option value="Mechanical Engineering">Mechanical Engineering</option>
                        <option value="Civil Engineering">Civil Engineering</option>
                        <option value="Medicine">Medicine</option>
                        <option value="Business Administration">Business Administration</option>
                      </select>
                    ) : (
                      <span style={{ padding: '6px 12px', backgroundColor: '#eff6ff', color: '#2563eb', borderRadius: '20px', fontSize: '13px', fontWeight: '500' }}>
                        {student.department || 'Unassigned'}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '15px 20px' }}>
                    {editingStudent === student.id ? (
                      <input type="number" className="modern-input" style={{ width: '60px' }} value={editForm.year} onChange={e => setEditForm({ ...editForm, year: e.target.value })} />
                    ) : (
                      <span style={{ fontWeight: '600', color: '#475569' }}>Year {student.year}</span>
                    )}
                  </td>
                  <td style={{ padding: '15px 20px' }}>
                    {student.parentLink ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <User size={16} color="#64748b" />
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '13px', fontWeight: '500', color: '#334155' }}>{student.parentLink.parent.name}</span>
                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>Linked</span>
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
                          <button
                            onClick={() => {
                              const parent = student.parentLink.parent;
                              window.location.href = `/messages?userId=${parent.id}&userRole=parent&userName=${encodeURIComponent(parent.name)}`;
                            }}
                            title={t('directChat')}
                            style={{ padding: '6px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white', cursor: 'pointer', color: '#3b82f6' }}
                          >
                            <MessageSquare size={16} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <span style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic' }}>No Parent Linked</span>
                    )}
                  </td>
                  <td style={{ padding: '15px 20px' }}>
                    {editingStudent === student.id ? (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={handleUpdate} className="modern-btn" style={{ backgroundColor: '#22c55e', padding: '8px 12px' }}><CheckCircle size={16} /></button>
                        <button onClick={() => setEditingStudent(null)} className="modern-btn" style={{ backgroundColor: '#94a3b8', padding: '8px 12px' }}><XCircle size={16} /></button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => handleEdit(student)} className="modern-btn" style={{ padding: '8px', backgroundColor: '#e2e8f0', color: '#475569' }}><Edit2 size={16} /></button>
                        <button onClick={() => handleDelete(student.id)} className="modern-btn" style={{ padding: '8px', backgroundColor: '#fee2e2', color: '#ef4444' }}><Trash2 size={16} /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredStudents.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
              <Search size={48} style={{ opacity: 0.2, marginBottom: '10px' }} />
              <p>{t('noStudentsFound')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Notification Modal */}
      {notifyingStudent && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', width: '100%', maxWidth: '500px', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }}>
            <h2 style={{ marginBottom: '20px', color: '#1e293b' }}>{t('notifyParent')}</h2>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#475569' }}>{t('notificationTitle')}</label>
              <input
                type="text"
                value={notificationForm.title}
                onChange={(e) => setNotificationForm({ ...notificationForm, title: e.target.value })}
                className="modern-input"
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#475569' }}>{t('messageToParent')}</label>
              <textarea
                value={notificationForm.message}
                onChange={(e) => setNotificationForm({ ...notificationForm, message: e.target.value })}
                rows="4"
                className="modern-input"
                style={{ resize: 'vertical' }}
                placeholder={t('writeMessagePlaceholder')}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleSendNotification}
                disabled={sending}
                className="modern-btn"
                style={{ flex: 1, backgroundColor: '#ea580c' }}
              >
                {sending ? 'Sending...' : <><Send size={18} /> Send Notification</>}
              </button>
              <button
                onClick={() => setNotifyingStudent(null)}
                className="modern-btn"
                style={{ flex: 1, backgroundColor: '#94a3b8' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManagement;