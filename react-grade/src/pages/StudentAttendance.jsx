import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
    CalendarCheck, UserCheck, UserX, Clock,
    Filter, AlertCircle, CheckCircle2, PieChart
} from 'lucide-react';
import '../admin-dashboard.css';

const StudentAttendance = () => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [summary, setSummary] = useState(null);
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAttendanceData();
    }, []);

    const fetchAttendanceData = async () => {
        try {
            setLoading(true);
            const data = await api.getAttendanceSummary(user.studentId);
            setSummary(data);
            // Fetch detailed records if API supports it, else use mock/empty
            const detailed = await api.getMyAttendanceRecords().catch(() => []);
            setRecords(Array.isArray(detailed) ? detailed : []);
        } catch (error) {
            console.error('Error fetching attendance:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <LoadingSpinner fullScreen />;

    const attendancePercent = summary ? Math.round((summary.present / (summary.total || 1)) * 100) : 0;

    return (
        <div className="admin-dashboard-container fade-in">
            <header className="admin-header">
                <div>
                    <h1 className="admin-title">Attendance Tracker</h1>
                    <p className="admin-subtitle">Monitor your academic presence and engagement levels</p>
                </div>
                <div style={{ background: 'white', padding: '10px 20px', borderRadius: '15px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>Current Status</div>
                        <div style={{ color: attendancePercent > 75 ? '#10b981' : '#f59e0b', fontWeight: '900' }}>{attendancePercent > 75 ? 'ELIGIBLE' : 'WARNING'}</div>
                    </div>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: attendancePercent > 75 ? '#dcfce7' : '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CheckCircle2 color={attendancePercent > 75 ? '#10b981' : '#f59e0b'} size={24} />
                    </div>
                </div>
            </header>

            <div className="admin-stats-grid">
                <div className="stat-card-glass">
                    <div className="stat-icon-box" style={{ color: '#0ea5e9', background: 'rgba(14, 165, 233, 0.1)' }}>
                        <PieChart size={24} />
                    </div>
                    <div>
                        <div className="stat-value">{attendancePercent}%</div>
                        <div className="stat-label">Total Presence</div>
                    </div>
                </div>
                <div className="stat-card-glass">
                    <div className="stat-icon-box" style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.1)' }}>
                        <UserCheck size={24} />
                    </div>
                    <div>
                        <div className="stat-value">{summary?.present || 0}</div>
                        <div className="stat-label">Days Present</div>
                    </div>
                </div>
                <div className="stat-card-glass">
                    <div className="stat-icon-box" style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)' }}>
                        <UserX size={24} />
                    </div>
                    <div>
                        <div className="stat-value">{summary?.absent || 0}</div>
                        <div className="stat-label">Days Absent</div>
                    </div>
                </div>
                <div className="stat-card-glass">
                    <div className="stat-icon-box" style={{ color: '#6366f1', background: 'rgba(99, 102, 241, 0.1)' }}>
                        <Clock size={24} />
                    </div>
                    <div>
                        <div className="stat-value">{summary?.total || 0}</div>
                        <div className="stat-label">Total Classes</div>
                    </div>
                </div>
            </div>

            <div className="admin-card">
                <div className="section-title">
                    <CalendarCheck size={20} color="#0ea5e9" />
                    Attendance Records
                </div>
                <div className="table-container" style={{ border: 'none', boxShadow: 'none' }}>
                    <table className="dash-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Course Name</th>
                                <th>Time Slot</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {records.length > 0 ? records.map((r, i) => (
                                <tr key={i}>
                                    <td style={{ fontWeight: '600' }}>{new Date(r.date).toLocaleDateString()}</td>
                                    <td>{r.courseName}</td>
                                    <td>{r.timeSlot || '08:30 - 10:30'}</td>
                                    <td>
                                        <span className="status-badge" style={{
                                            background: r.status === 'present' ? '#dcfce7' : '#fee2e2',
                                            color: r.status === 'present' ? '#15803d' : '#b91c1c'
                                        }}>
                                            {r.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td>
                                        <button className="admin-btn" style={{ padding: '6px 12px', fontSize: '0.75rem', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b' }}>
                                            Appeal
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '100px 0' }}>
                                        <div className="empty-state">
                                            <div className="empty-icon-box">
                                                <AlertCircle size={32} color="#cbd5e1" />
                                            </div>
                                            <h4>No records found</h4>
                                            <p>Your detailed attendance history for this semester will appear here.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default StudentAttendance;
