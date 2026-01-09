import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../utils/api';
import LoadingSpinner from '../components/common/LoadingSpinner';

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
    // Auto-focus search if redirected from dashboard
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
      department: student.department,
      year: student.year,
      phone: student.phone || ''
    });
  };

  const handleUpdate = async () => {
    try {
      const result = await api.updateStudent(editingStudent, editForm);
      if (result && !result.msg) {
        // Update the student in the list
        setStudents(students.map(s =>
          s.id === editingStudent ? { ...s, ...editForm } : s
        ));
        setEditingStudent(null);
        alert(t('studentUpdatedSuccessfully'));
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
          alert(t('studentDeletedSuccessfully'));
        } else {
          alert(result.msg || t('errorDeletingStudent'));
        }
      } catch (error) {
        console.error('Error deleting student:', error);
        alert(t('errorDeletingStudent'));
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingStudent(null);
  };

  const handleInputChange = (e) => {
    setEditForm({
      ...editForm,
      [e.target.name]: e.target.value
    });
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
        alert(t('notificationSentSuccessfully'));
        setNotifyingStudent(null);
      } else {
        alert(result.msg || t('errorSendingNotification'));
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      alert(t('errorSendingNotification'));
    } finally {
      setSending(false);
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
      alert('Failed to update verification status');
    }
  };

  // Filter students based on generic search or filter
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

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (error) {
    return (
      <div style={{ padding: '20px', color: '#d32f2f', textAlign: 'center' }}>
        <h3>Error Loading Students</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} style={{ padding: '8px 16px', cursor: 'pointer' }}>Retry</button>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ marginBottom: '10px' }}>{t('studentManagement')}</h1>
        <p style={{ color: '#666' }}>{t('manageStudentInformation')}</p>
      </div>

      {/* Filters */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '300px' }}>
          <input
            ref={searchInputRef}
            type="text"
            placeholder={t('searchByIdOrName')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 15px',
              borderRadius: '5px',
              border: '1px solid #ddd',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
          />
        </div>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          style={{
            padding: '10px',
            borderRadius: '5px',
            border: '1px solid #ddd',
            minWidth: '200px'
          }}
        >
          <option value="all">{t('referenceAllYears')}</option>
          <option value="1">{t('year1')}</option>
          <option value="2">{t('year2')}</option>
          <option value="3">{t('year3')}</option>
          <option value="4">{t('year4')}</option>
          <option value="5">{t('year5')}</option>
        </select>
      </div>

      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        overflowX: 'auto'
      }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse'
        }}>
          <thead>
            <tr style={{
              borderBottom: '2px solid #eee'
            }}>
              <th style={{ padding: '12px', textAlign: 'left' }}>{t('studentId')}</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>{t('nationalId')}</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>{t('name')}</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>{t('email')}</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>{t('department')}</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>{t('year')}</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>{t('phone')}</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>{t('parent')}</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((student) => (
              <tr key={student.id} className="table-row-animate" style={{
                borderBottom: '1px solid #eee'
              }}>
                <td style={{ padding: '12px' }}>{student.studentId}</td>
                <td style={{ padding: '12px' }}>
                  <div style={{ fontSize: '0.85rem', color: '#666' }}>{student.nationalId || '---'}</div>
                  {student.isVerified ? (
                    <span style={{ fontSize: '10px', color: '#2e7d32', backgroundColor: '#e8f5e9', padding: '2px 6px', borderRadius: '10px' }}>
                      {t('idVerified')}
                    </span>
                  ) : (
                    <span style={{ fontSize: '10px', color: '#d32f2f', backgroundColor: '#ffebee', padding: '2px 6px', borderRadius: '10px' }}>
                      {t('idPending')}
                    </span>
                  )}
                </td>
                <td style={{ padding: '12px' }}>
                  {editingStudent === student.id ? (
                    <input
                      type="text"
                      name="name"
                      value={editForm.name}
                      onChange={handleInputChange}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #ddd',
                        borderRadius: '4px'
                      }}
                    />
                  ) : (
                    student.name
                  )}
                </td>
                <td style={{ padding: '12px' }}>
                  {editingStudent === student.id ? (
                    <input
                      type="email"
                      name="email"
                      value={editForm.email}
                      onChange={handleInputChange}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #ddd',
                        borderRadius: '4px'
                      }}
                    />
                  ) : (
                    student.email
                  )}
                </td>
                <td style={{ padding: '12px' }}>
                  {editingStudent === student.id ? (
                    <select
                      name="department"
                      value={editForm.department}
                      onChange={handleInputChange}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #ddd',
                        borderRadius: '4px'
                      }}
                    >
                      <option value="Computer Science">{t('computerScience')}</option>
                      <option value="Electrical Engineering">{t('electricalEngineering')}</option>
                      <option value="Mechanical Engineering">{t('mechanicalEngineering')}</option>
                      <option value="Civil Engineering">{t('civilEngineering')}</option>
                      <option value="Medicine">{t('medicine')}</option>
                      <option value="Business Administration">{t('businessAdministration')}</option>
                      <option value="Law">{t('law')}</option>
                      <option value="Agriculture">{t('agriculture')}</option>
                    </select>
                  ) : (
                    student.department
                  )}
                </td>
                <td style={{ padding: '12px' }}>
                  {editingStudent === student.id ? (
                    <select
                      name="year"
                      value={editForm.year}
                      onChange={handleInputChange}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #ddd',
                        borderRadius: '4px'
                      }}
                    >
                      <option value="1">{t('year1')}</option>
                      <option value="2">{t('year2')}</option>
                      <option value="3">{t('year3')}</option>
                      <option value="4">{t('year4')}</option>
                      <option value="5">{t('year5')}</option>
                    </select>
                  ) : (
                    t(`year${student.year}`)
                  )}
                </td>
                <td style={{ padding: '12px' }}>
                  {editingStudent === student.id ? (
                    <input
                      type="text"
                      name="phone"
                      value={editForm.phone}
                      onChange={handleInputChange}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #ddd',
                        borderRadius: '4px'
                      }}
                    />
                  ) : (
                    student.phone || '-'
                  )}
                </td>
                <td style={{ padding: '12px' }}>
                  {student.parentLink ? (
                    <div>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 8px',
                        backgroundColor: '#e8f5e9',
                        color: '#2e7d32',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        marginBottom: '5px'
                      }}>
                        {t('linkedToParent', { name: student.parentLink.parent.name }).replace('{name}', student.parentLink.parent.name)}
                      </span>
                      <button
                        onClick={() => handleNotifyParentClick(student)}
                        style={{
                          display: 'block',
                          padding: '4px 8px',
                          backgroundColor: '#fb8c00',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          marginBottom: '3px',
                          width: '100%'
                        }}
                      >
                        {t('notifyParent')}
                      </button>
                      <button
                        onClick={() => {
                          const parent = student.parentLink.parent;
                          window.location.href = `/messages?userId=${parent.id}&userRole=parent&userName=${encodeURIComponent(parent.name)}`;
                        }}
                        style={{
                          display: 'block',
                          padding: '4px 8px',
                          backgroundColor: '#1976d2',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          width: '100%'
                        }}
                      >
                        💬 {t('directChat')}
                      </button>
                    </div>
                  ) : (
                    <span style={{
                      padding: '4px 8px',
                      backgroundColor: '#f5f5f5',
                      color: '#757575',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}>
                      {t('notLinkedToParent')}
                    </span>
                  )}
                </td>
                <td style={{ padding: '12px' }}>
                  {editingStudent === student.id ? (
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button
                        onClick={handleUpdate}
                        style={{
                          padding: '8px 12px',
                          backgroundColor: '#2e7d32',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        {t('save')}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        style={{
                          padding: '8px 12px',
                          backgroundColor: '#9e9e9e',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        {t('cancel')}
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button
                        onClick={() => handleToggleVerify(student.id, student.isVerified)}
                        style={{
                          padding: '8px 12px',
                          backgroundColor: student.isVerified ? '#f57c00' : '#4caf50',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        {student.isVerified ? 'Unverify ID' : 'Verify ID'}
                      </button>
                      <button
                        onClick={() => handleEdit(student)}
                        style={{
                          padding: '8px 12px',
                          backgroundColor: '#1976d2',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        {t('edit')}
                      </button>
                      <button
                        onClick={() => handleDelete(student.id)}
                        style={{
                          padding: '8px 12px',
                          backgroundColor: '#d32f2f',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        {t('delete')}
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredStudents.length === 0 && (
          <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
            {t('noStudentsFound')}
          </p>
        )}
      </div>

      {/* Notification Modal */}
      {notifyingStudent && (
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
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '10px',
            width: '100%',
            maxWidth: '500px',
            boxShadow: '0 5px 20px rgba(0,0,0,0.2)'
          }}>
            <h2 style={{ marginBottom: '20px' }}>{t('notifyParent')}</h2>
            <p style={{ marginBottom: '10px', color: '#666' }}>
              {t('regardingAcademicProgress', { studentName: notifyingStudent.name }).replace('{studentName}', notifyingStudent.name)}
            </p>
            <div style={{
              padding: '8px 12px',
              backgroundColor: '#e3f2fd',
              borderRadius: '5px',
              marginBottom: '20px',
              fontSize: '13px',
              color: '#1976d2',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              🔔 {t('notificationPreference')}: <strong>{notifyingStudent.parentLink.parent.notificationPreference === 'both' ? t('bothEmailAndSms') : notifyingStudent.parentLink.parent.notificationPreference === 'email' ? t('emailOnly') : t('smsOnly')}</strong>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>{t('notificationTitle')}</label>
              <input
                type="text"
                value={notificationForm.title}
                onChange={(e) => setNotificationForm({ ...notificationForm, title: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '5px'
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>{t('type')}</label>
              <select
                value={notificationForm.type}
                onChange={(e) => setNotificationForm({ ...notificationForm, type: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '5px'
                }}
              >
                <option value="administrative">{t('administrativeAction')}</option>
                <option value="regulation">{t('regulationProblem')}</option>
                <option value="problem">{t('unregulatedAction')}</option>
                <option value="academic">{t('academicProgress')}</option>
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>{t('messageToParent')}</label>
              <textarea
                value={notificationForm.message}
                onChange={(e) => setNotificationForm({ ...notificationForm, message: e.target.value })}
                rows="4"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  resize: 'none'
                }}
                placeholder={t('writeMessagePlaceholder')}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleSendNotification}
                disabled={sending}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#2e7d32',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  fontWeight: 'bold',
                  cursor: sending ? 'not-allowed' : 'pointer'
                }}
              >
                {sending ? t('sending') : t('sendNotification')}
              </button>
              <button
                onClick={() => setNotifyingStudent(null)}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#9e9e9e',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManagement;