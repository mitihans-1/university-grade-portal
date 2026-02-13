import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../utils/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { QRCodeSVG } from 'qrcode.react';
import {
    Calendar,
    User,
    BookOpen,
    CheckCircle,
    XCircle,
    Clock,
    QrCode,
    Search,
    Plus,
    AlertTriangle,
    BarChart2,
    X
} from 'lucide-react';
import '../admin-dashboard.css';

const AttendanceManagement = () => {
    const { t } = useLanguage();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [students, setStudents] = useState([]);

    // Modes: 'view', 'record', 'qr'
    const [viewMode, setViewMode] = useState(user?.role === 'admin' ? 'view' : 'record');
    const [attendanceRecords, setAttendanceRecords] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    // Manual Form
    const [attendanceForm, setAttendanceForm] = useState({
        studentId: '',
        courseCode: '',
        courseName: '',
        date: new Date().toISOString().split('T')[0],
        status: 'present',
        remarks: ''
    });

    // QR Session State
    const [activeSessions, setActiveSessions] = useState([]);
    const [qrForm, setQrForm] = useState({
        courseCode: '',
        courseName: '',
        startTime: '09:00',
        endTime: '10:00'
    });

    useEffect(() => {
        if (user?.role === 'admin') {
            setViewMode('view');
            fetchAttendanceRecords();
        } else {
            setViewMode('record');
        }
    }, [user]);

    // Poll for active sessions if in QR mode
    useEffect(() => {
        let interval;
        if (viewMode === 'qr') {
            fetchActiveSessions();
            interval = setInterval(fetchActiveSessions, 30000); // 30s poll
        }
        return () => clearInterval(interval);
    }, [viewMode]);

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const studentData = await api.getAllStudents();
                setStudents(Array.isArray(studentData) ? studentData : []);
            } catch (error) {
                console.error('Error fetching students:', error);
            }
        };
        fetchStudents();
    }, []);

    const fetchAttendanceRecords = async () => {
        try {
            setLoading(true);
            const data = await api.getAllAttendance();
            setAttendanceRecords(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching attendance:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchActiveSessions = async () => {
        try {
            const data = await api.getActiveSessions();
            if (data && data.sessions) {
                setActiveSessions(data.sessions);
            }
        } catch (error) {
            console.error('Error fetching active sessions:', error);
        }
    };

    const handleStartSession = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const result = await api.startSession(qrForm);
            if (result.success) {
                alert(t('sessionStartedSuccess'));
                fetchActiveSessions();
                setQrForm({ ...qrForm, courseCode: '', courseName: '' });
            } else {
                alert(t('sessionStartFailed'));
            }
        } catch (error) {
            alert(error.message || t('sessionStartFailed'));
        } finally {
            setLoading(false);
        }
    };

    const handleEndSession = async (sessionId) => {
        if (!window.confirm(t('confirmEndSession'))) return;
        try {
            await api.endSession(sessionId);
            fetchActiveSessions();
        } catch (error) {
            console.error(error);
        }
    };

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

    const filteredRecords = attendanceRecords.filter(record => {
        const query = searchQuery.toLowerCase();
        return (
            record.student?.name?.toLowerCase().includes(query) ||
            record.courseCode?.toLowerCase().includes(query) ||
            record.courseName?.toLowerCase().includes(query) ||
            record.status?.toLowerCase().includes(query)
        );
    });

    return (
        <div className="admin-dashboard-container fade-in">
            <div className="admin-card" style={{ maxWidth: '1200px', margin: '20px auto' }}>
                <header className="admin-header">
                    <div className="admin-title" style={{ textAlign: 'center' }}>
                        {t('attendanceManagementTitle')}
                    </div>
                    {user?.role === 'admin' && (
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '20px' }}>
                            <button
                                onClick={() => setViewMode('view')}
                                className="admin-btn"
                                style={{ background: viewMode === 'view' ? '#3b82f6' : '#64748b', opacity: viewMode === 'view' ? 1 : 0.7 }}
                            >
                                <BarChart2 size={16} /> {t('records')}
                            </button>
                            <button
                                onClick={() => setViewMode('record')}
                                className="admin-btn"
                                style={{ background: viewMode === 'record' ? '#3b82f6' : '#64748b', opacity: viewMode === 'record' ? 1 : 0.7 }}
                            >
                                <Plus size={16} /> {t('manualEntry')}
                            </button>
                            <button
                                onClick={() => setViewMode('qr')}
                                className="admin-btn"
                                style={{ background: viewMode === 'qr' ? '#3b82f6' : '#64748b', opacity: viewMode === 'qr' ? 1 : 0.7 }}
                            >
                                <QrCode size={16} /> {t('qrSessions')}
                            </button>
                        </div>
                    )}
                </header>

                {viewMode === 'view' && (
                    <>
                        <div className="admin-card" style={{ marginBottom: '30px', background: 'rgba(255,255,255,0.5)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Search size={20} color="#64748b" />
                                <input
                                    type="text"
                                    placeholder={t('searchRecords')}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="form-input"
                                    style={{ flex: 1 }}
                                />
                            </div>
                        </div>

                        {loading ? (
                            <LoadingSpinner />
                        ) : (
                            <div className="admin-card" style={{ padding: '0', overflow: 'hidden' }}>
                                <div style={{ overflowX: 'auto' }}>
                                    <table className="dash-table">
                                        <thead>
                                            <tr>
                                                <th>{t('date')}</th>
                                                <th>{t('student')}/{t('teacher')}</th>
                                                <th>{t('courses')}</th>
                                                <th>{t('status')}</th>
                                                <th>{t('remarks')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredRecords.length > 0 ? (
                                                filteredRecords.map(record => (
                                                    <tr key={record.id}>
                                                        <td>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                <Calendar size={14} style={{ opacity: 0.6 }} />
                                                                {new Date(record.date).toLocaleDateString()}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            {record.student ? (
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#4338ca' }}>
                                                                        {record.student.name.charAt(0)}
                                                                    </div>
                                                                    <div>
                                                                        <div style={{ fontWeight: 'bold' }}>{record.student.name}</div>
                                                                        <div style={{ fontSize: '0.8em', opacity: 0.7 }}>{record.studentId}</div>
                                                                    </div>
                                                                </div>
                                                            ) : record.teacher ? (
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#d97706' }}>
                                                                        {record.teacher.name.charAt(0)}
                                                                    </div>
                                                                    <div>
                                                                        <div style={{ fontWeight: 'bold' }}>{record.teacher.name}</div>
                                                                        <div style={{ fontSize: '0.8em', opacity: 0.7 }}>{record.teacherId}</div>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <span style={{ opacity: 0.5 }}>{t('unknownUser')}</span>
                                                            )}
                                                        </td>
                                                        <td>
                                                            <div style={{ fontWeight: 'bold' }}>{record.courseCode}</div>
                                                            <div style={{ fontSize: '0.8em', opacity: 0.7 }}>{record.courseName}</div>
                                                        </td>
                                                        <td>
                                                            <span className={`status-badge ${record.status}`}>
                                                                {record.status === 'present' && <CheckCircle size={12} />}
                                                                {record.status === 'absent' && <XCircle size={12} />}
                                                                {record.status === 'late' && <Clock size={12} />}
                                                                {record.status.toUpperCase()}
                                                            </span>
                                                        </td>
                                                        <td>{record.remarks || '-'}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="5" style={{ textAlign: 'center', padding: '40px', opacity: 0.6 }}>
                                                        {t('noAttendanceRecordsFound')}
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {viewMode === 'record' && (
                    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">{t('student')}</label>
                                <select
                                    name="studentId"
                                    value={attendanceForm.studentId}
                                    onChange={handleInputChange}
                                    className="form-input"
                                >
                                    <option value="">{t('selectStudent')}</option>
                                    {students.map(s => (
                                        <option key={s.id} value={s.studentId}>{s.name} ({s.studentId})</option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div className="form-group">
                                    <label className="form-label">{t('courseCode')}</label>
                                    <input
                                        type="text"
                                        name="courseCode"
                                        value={attendanceForm.courseCode}
                                        onChange={handleInputChange}
                                        placeholder="e.g. CS101"
                                        className="form-input"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">{t('courseName')}</label>
                                    <input
                                        type="text"
                                        name="courseName"
                                        value={attendanceForm.courseName}
                                        onChange={handleInputChange}
                                        placeholder="e.g. Programming Fund"
                                        className="form-input"
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div className="form-group">
                                    <label className="form-label">{t('date')}</label>
                                    <input
                                        type="date"
                                        name="date"
                                        value={attendanceForm.date}
                                        onChange={handleInputChange}
                                        className="form-input"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">{t('status')}</label>
                                    <select
                                        name="status"
                                        value={attendanceForm.status}
                                        onChange={handleInputChange}
                                        className="form-input"
                                    >
                                        <option value="present">{t('present')}</option>
                                        <option value="absent">{t('absent')}</option>
                                        <option value="late">{t('late')}</option>
                                        <option value="excused">{t('excused')}</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">{t('remarks')}</label>
                                <textarea
                                    name="remarks"
                                    value={attendanceForm.remarks}
                                    onChange={handleInputChange}
                                    rows="3"
                                    className="form-input"
                                ></textarea>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="admin-btn"
                                style={{ width: '100%', padding: '12px' }}
                            >
                                {loading ? t('submitting') : t('recordAttendance')}
                            </button>
                        </form>
                    </div>
                )}

                {viewMode === 'qr' && (
                    <div className="fade-in">
                        <div className="admin-card" style={{ marginBottom: '30px', background: 'rgba(255,255,255,0.7)' }}>
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: 0 }}>
                                <QrCode size={20} /> {t('startNewClassSession')}
                            </h3>
                            <form onSubmit={handleStartSession} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', alignItems: 'end' }}>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">{t('courseCode')}</label>
                                    <input
                                        type="text"
                                        placeholder="CS101"
                                        className="form-input"
                                        value={qrForm.courseCode}
                                        onChange={e => setQrForm({ ...qrForm, courseCode: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">{t('courseName')}</label>
                                    <input
                                        type="text"
                                        placeholder="Intro to CS"
                                        className="form-input"
                                        value={qrForm.courseName}
                                        onChange={e => setQrForm({ ...qrForm, courseName: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">{t('startTime')}</label>
                                    <input
                                        type="time"
                                        className="form-input"
                                        value={qrForm.startTime}
                                        onChange={e => setQrForm({ ...qrForm, startTime: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">{t('endTime')}</label>
                                    <input
                                        type="time"
                                        className="form-input"
                                        value={qrForm.endTime}
                                        onChange={e => setQrForm({ ...qrForm, endTime: e.target.value })}
                                        required
                                    />
                                </div>
                                <button type="submit" disabled={loading} className="admin-btn" style={{ height: '42px' }}>
                                    {t('startSessionAndGenerateQR')}
                                </button>
                            </form>
                        </div>

                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                            <AlertTriangle size={20} /> {t('activeSessions')}
                        </h3>

                        {activeSessions.length > 0 ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                                {activeSessions.map(session => (
                                    <div key={session.id} className="admin-card" style={{ display: 'flex', gap: '20px' }}>
                                        <div style={{ background: 'white', padding: '10px', borderRadius: '8px' }}>
                                            <QRCodeSVG value={session.qrCodeToken} size={150} level="H" />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <h4>{session.courseCode}</h4>
                                            <p>{session.courseName}</p>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9em', color: '#666', marginTop: '10px' }}>
                                                <Clock size={14} />
                                                <span>{session.startTime} - {session.endTime}</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9em', color: '#666', marginTop: '5px' }}>
                                                <Calendar size={14} />
                                                <span>{new Date(session.date).toLocaleDateString()}</span>
                                            </div>
                                            <div style={{ fontSize: '0.8em', fontFamily: 'monospace', background: '#f5f5f5', padding: '5px', borderRadius: '4px', marginTop: '10px', wordBreak: 'break-all' }}>
                                                Token: {session.qrCodeToken}
                                            </div>
                                            <button
                                                onClick={() => handleEndSession(session.id)}
                                                className="admin-btn"
                                                style={{ width: '100%', marginTop: '15px', background: '#ef4444' }}
                                            >
                                                {t('endSession')}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                                <QrCode size={48} style={{ opacity: 0.2, marginBottom: '20px' }} />
                                <p>{t('noActiveSessions')}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AttendanceManagement;
