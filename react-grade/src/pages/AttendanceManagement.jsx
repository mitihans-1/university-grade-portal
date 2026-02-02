import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../utils/api';
import LoadingSpinner from '../components/common/LoadingSpinner';

const AttendanceManagement = () => {
    const { t } = useLanguage();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [students, setStudents] = useState([]);

    // Admin defaults to 'view', others (Teacher) to 'record'
    const [viewMode, setViewMode] = useState(user?.role === 'admin' ? 'view' : 'record');
    const [attendanceRecords, setAttendanceRecords] = useState([]);
    const [attendanceForm, setAttendanceForm] = useState({
        studentId: '',
        courseCode: '',
        courseName: '',
        date: new Date().toISOString().split('T')[0],
        status: 'present',
        remarks: ''
    });

    useEffect(() => {
        // Update view mode if user changes (e.g. login/logout or initial load)
        if (user?.role === 'admin') {
            setViewMode('view');
            fetchAttendanceRecords();
        } else {
            setViewMode('record');
        }
    }, [user]);

    const fetchAttendanceRecords = async () => {
        try {
            setLoading(true);
            const data = await api.getAllAttendance();
            setAttendanceRecords(data || []);
        } catch (error) {
            console.error('Error fetching attendance:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const studentData = await api.getAllStudents();
                setStudents(studentData || []);
            } catch (error) {
                console.error('Error fetching students:', error);
            }
        };
        fetchStudents();
    }, []);

    const handleInputChange = (e) => {
        setAttendanceForm({
            ...attendanceForm,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!attendanceForm.studentId || !attendanceForm.courseCode || !attendanceForm.date) {
            alert(t('pleaseEnterAllFields'));
            return;
        }

        try {
            setLoading(true);
            const result = await api.uploadAttendance(attendanceForm);
            if (result && !result.msg) {
                alert(t('attendanceRecordedSuccess'));
                setAttendanceForm({
                    ...attendanceForm,
                    remarks: ''
                });
            } else {
                alert(result.msg || t('errorRecordingAttendance'));
            }
        } catch (error) {
            console.error('Error uploading attendance:', error);
            alert(t('errorRecordingAttendance'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
            <div style={{
                backgroundColor: 'white',
                padding: '30px',
                borderRadius: '10px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                    <h2 style={{ margin: 0 }}>
                        {user?.role === 'admin' ? t('attendanceRecords') : t('attendanceManagementTitle')}
                    </h2>
                </div>

                {viewMode === 'view' ? (
                    <div>
                        {loading ? (
                            <LoadingSpinner />
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                                    <thead>
                                        <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                                            <th style={thStyle}>{t('date')}</th>
                                            <th style={thStyle}>{t('student')}</th>
                                            <th style={thStyle}>{t('courses')}</th>
                                            <th style={thStyle}>{t('status')}</th>
                                            <th style={thStyle}>{t('remarks')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {attendanceRecords.length > 0 ? (
                                            attendanceRecords.map(record => (
                                                <tr key={record.id} style={{ borderBottom: '1px solid #eee' }}>
                                                    <td style={tdStyle}>{new Date(record.date).toLocaleDateString()}</td>
                                                    <td style={tdStyle}>
                                                        <div style={{ fontWeight: '500' }}>{record.Student?.name}</div>
                                                        <div style={{ fontSize: '12px', color: '#666' }}>{record.studentId}</div>
                                                    </td>
                                                    <td style={tdStyle}>
                                                        <div>{record.courseCode}</div>
                                                        <div style={{ fontSize: '12px', color: '#666' }}>{record.courseName}</div>
                                                    </td>
                                                    <td style={tdStyle}>
                                                        <span style={{
                                                            padding: '4px 8px',
                                                            borderRadius: '12px',
                                                            fontSize: '12px',
                                                            fontWeight: 'bold',
                                                            backgroundColor:
                                                                record.status === 'present' ? '#e8f5e9' :
                                                                    record.status === 'absent' ? '#ffebee' :
                                                                        record.status === 'late' ? '#fff3e0' : '#e3f2fd',
                                                            color:
                                                                record.status === 'present' ? '#2e7d32' :
                                                                    record.status === 'absent' ? '#c62828' :
                                                                        record.status === 'late' ? '#ef6c00' : '#1565c0'
                                                        }}>
                                                            {record.status.toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td style={tdStyle}>{record.remarks || '-'}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                                                    {t('noAttendanceRecordsFound')}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>{t('student')}</label>
                            <select
                                name="studentId"
                                value={attendanceForm.studentId}
                                onChange={handleInputChange}
                                style={inputStyle}
                            >
                                <option value="">{t('selectStudent')}</option>
                                {students.map(s => (
                                    <option key={s.id} value={s.studentId}>{s.name} ({s.studentId})</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid-container" style={{ marginBottom: '15px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px' }}>{t('courseCode')}</label>
                                <input
                                    type="text"
                                    name="courseCode"
                                    value={attendanceForm.courseCode}
                                    onChange={handleInputChange}
                                    placeholder="e.g. CS101"
                                    style={inputStyle}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px' }}>{t('courseName')}</label>
                                <input
                                    type="text"
                                    name="courseName"
                                    value={attendanceForm.courseName}
                                    onChange={handleInputChange}
                                    placeholder="e.g. Programming Fund"
                                    style={inputStyle}
                                />
                            </div>
                        </div>

                        <div className="grid-container" style={{ marginBottom: '15px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px' }}>{t('date')}</label>
                                <input
                                    type="date"
                                    name="date"
                                    value={attendanceForm.date}
                                    onChange={handleInputChange}
                                    style={inputStyle}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px' }}>{t('status')}</label>
                                <select
                                    name="status"
                                    value={attendanceForm.status}
                                    onChange={handleInputChange}
                                    style={inputStyle}
                                >
                                    <option value="present">{t('present')}</option>
                                    <option value="absent">{t('absent')}</option>
                                    <option value="late">{t('late')}</option>
                                    <option value="excused">{t('excused')}</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>{t('remarks')}</label>
                            <textarea
                                name="remarks"
                                value={attendanceForm.remarks}
                                onChange={handleInputChange}
                                rows="3"
                                style={inputStyle}
                            ></textarea>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '12px',
                                backgroundColor: '#1976d2',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                fontWeight: 'bold',
                                cursor: loading ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {loading ? t('submitting') : t('recordAttendance')}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

const inputStyle = {
    width: '100%',
    padding: '10px',
    borderRadius: '5px',
    border: '1px solid #ddd',
    fontSize: '16px'
};

const thStyle = {
    padding: '12px',
    textAlign: 'left',
    fontWeight: '600',
    color: '#444'
};

const tdStyle = {
    padding: '12px',
    verticalAlign: 'middle'
};

export default AttendanceManagement;
