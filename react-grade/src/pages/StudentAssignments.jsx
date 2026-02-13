import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
    BookOpen, FileText, Upload, Download, CheckCircle,
    Clock, AlertCircle, Calendar, Plus
} from 'lucide-react';
import '../admin-dashboard.css';

const StudentAssignments = () => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAssignments();
    }, []);

    const fetchAssignments = async () => {
        try {
            setLoading(true);
            const data = await api.getStudentAssignments().catch(() => []);
            setAssignments(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching assignments:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <LoadingSpinner fullScreen />;

    return (
        <div className="admin-dashboard-container fade-in">
            <header className="admin-header">
                <div>
                    <h1 className="admin-title">Academic Assignments</h1>
                    <p className="admin-subtitle">Track your coursework and submission deadlines</p>
                </div>
                <div style={{ display: 'flex', gap: '15px' }}>
                    <div className="stat-card-glass" style={{ padding: '10px 20px', marginBottom: '0', flexDirection: 'row', gap: '15px', alignItems: 'center' }}>
                        <div style={{ background: '#dcfce7', color: '#10b981', padding: '8px', borderRadius: '10px' }}>
                            <CheckCircle size={20} />
                        </div>
                        <div>
                            <div style={{ fontSize: '1.2rem', fontWeight: '900', color: '#1e293b', lineHeight: '1' }}>
                                {assignments.filter(a => a.status === 'submitted' || a.status === 'graded').length}
                            </div>
                            <div style={{ fontSize: '0.65rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Done</div>
                        </div>
                    </div>
                    <div className="stat-card-glass" style={{ padding: '10px 20px', marginBottom: '0', flexDirection: 'row', gap: '15px', alignItems: 'center' }}>
                        <div style={{ background: '#fee2e2', color: '#ef4444', padding: '8px', borderRadius: '10px' }}>
                            <Clock size={20} />
                        </div>
                        <div>
                            <div style={{ fontSize: '1.2rem', fontWeight: '900', color: '#1e293b', lineHeight: '1' }}>
                                {assignments.filter(a => a.status === 'missing').length}
                            </div>
                            <div style={{ fontSize: '0.65rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>To-Do</div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="admin-content-grid" style={{ gridTemplateColumns: '1fr' }}>
                <div className="admin-card" style={{ padding: '0' }}>
                    <div className="section-title" style={{ padding: '25px 30px', margin: '0', borderBottom: '1px solid #f1f5f9' }}>
                        <BookOpen size={20} color="#3b82f6" />
                        My Assignments
                    </div>
                    <div className="table-container" style={{ border: 'none', boxShadow: 'none' }}>
                        <table className="dash-table">
                            <thead>
                                <tr>
                                    <th>Title & Description</th>
                                    <th>Deadline</th>
                                    <th>Status</th>
                                    <th>Grade</th>
                                    <th>Submission</th>
                                </tr>
                            </thead>
                            <tbody>
                                {assignments.length > 0 ? assignments.map((a, i) => (
                                    <tr key={i} className="stagger-item">
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ padding: '10px', background: '#f8fafc', borderRadius: '10px' }}>
                                                    <FileText size={20} color="#64748b" />
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: '700', fontSize: '1rem', color: '#1e293b' }}>{a.title}</div>
                                                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{a.courseName}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontWeight: '600', fontSize: '0.85rem' }}>
                                                <Calendar size={14} />
                                                {new Date(a.deadline).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td>
                                            <span className="status-badge" style={{
                                                background: a.status === 'submitted' ? '#dcfce7' : a.status === 'graded' ? '#dbeafe' : '#fee2e2',
                                                color: a.status === 'submitted' ? '#15803d' : a.status === 'graded' ? '#1e40af' : '#b91c1c'
                                            }}>
                                                {a.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: '900', color: '#1e293b' }}>
                                                {a.grade || '--'}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                <button className="admin-btn" style={{ padding: '8px 12px', background: 'white', border: '1px solid #e2e8f0', color: '#3b82f6' }}>
                                                    <Download size={16} />
                                                </button>
                                                {a.status === 'missing' && (
                                                    <button className="admin-btn primary" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>
                                                        <Plus size={16} /> Submit
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="5" style={{ textAlign: 'center', padding: '100px 0' }}>
                                            <div className="empty-state">
                                                <div className="empty-icon-box">
                                                    <FileText size={40} color="#cbd5e1" />
                                                </div>
                                                <h3>No Assignments Yet</h3>
                                                <p>When instructors assign coursework, it will appear here for you to track and submit.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentAssignments;
