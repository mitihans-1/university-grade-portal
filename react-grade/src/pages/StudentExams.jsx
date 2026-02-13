import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { useLanguage } from '../context/LanguageContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
    Clock, ShieldCheck, Play, Info, AlertCircle,
    Calendar, CheckCircle2, History, Zap, Lock
} from 'lucide-react';
import '../admin-dashboard.css';

const StudentExams = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [exams, setExams] = useState([]);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('available');

    useEffect(() => {
        fetchExamsData();
    }, []);

    const fetchExamsData = async () => {
        try {
            setLoading(true);
            const [availableExams, examHistory] = await Promise.all([
                api.getAvailableExams(),
                api.getExamHistory().catch(() => [])
            ]);
            setExams(Array.isArray(availableExams) ? availableExams : []);
            setHistory(Array.isArray(examHistory) ? examHistory : []);
        } catch (error) {
            console.error('Error fetching exams:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStartExam = (examId) => {
        navigate(`/student/exam/${examId}`);
    };

    if (loading) return <LoadingSpinner fullScreen />;

    return (
        <div className="admin-dashboard-container fade-in">
            <header className="admin-header">
                <div>
                    <h1 className="admin-title">Exam Center</h1>
                    <p className="admin-subtitle">Secure examination portal and academic assessments</p>
                </div>
                <div style={{ display: 'flex', gap: '15px', background: '#f1f5f9', padding: '6px', borderRadius: '12px' }}>
                    <button
                        onClick={() => setActiveTab('available')}
                        className={`admin-btn ${activeTab === 'available' ? 'primary' : ''}`}
                        style={{ border: 'none', background: activeTab === 'available' ? '' : 'transparent', color: activeTab === 'available' ? '' : '#64748b' }}
                    >
                        Active Exams
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`admin-btn ${activeTab === 'history' ? 'primary' : ''}`}
                        style={{ border: 'none', background: activeTab === 'history' ? '' : 'transparent', color: activeTab === 'history' ? '' : '#64748b' }}
                    >
                        Results & History
                    </button>
                </div>
            </header>

            {activeTab === 'available' ? (
                <div className="admin-stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))' }}>
                    {exams.length > 0 ? exams.map((exam) => (
                        <div key={exam.id} className="admin-card stagger-item" style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ height: '8px', background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)' }}></div>
                            <div style={{ padding: '25px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                                    <div style={{ background: '#eff6ff', color: '#1d4ed8', padding: '10px', borderRadius: '12px' }}>
                                        <Zap size={24} />
                                    </div>
                                    <span style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', background: '#f1f5f9', padding: '4px 10px', borderRadius: '20px', color: '#64748b' }}>
                                        {exam.duration} mins
                                    </span>
                                </div>
                                <h3 style={{ fontSize: '1.25rem', marginBottom: '8px', fontWeight: '800' }}>{exam.title}</h3>
                                <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '20px', lineHeight: '1.5' }}>{exam.description || 'Professional academic assessment for the current semester.'}</p>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '25px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: '#475569', fontWeight: '600' }}>
                                        <Calendar size={16} /> Ends on: {new Date(exam.endDate).toLocaleDateString()}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: '#475569', fontWeight: '600' }}>
                                        <Info size={16} /> Questions: {exam.questionCount}
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleStartExam(exam.id)}
                                    className="admin-btn primary"
                                    style={{ width: '100%', gap: '12px', padding: '15px' }}
                                >
                                    <Play size={18} fill="currentColor" /> ENTER EXAM LOBBY
                                </button>
                            </div>
                        </div>
                    )) : (
                        <div style={{ gridColumn: '1 / -1', padding: '100px 0' }}>
                            <div className="empty-state">
                                <div className="empty-icon-box" style={{ background: '#f8fafc' }}>
                                    <ShieldCheck size={40} color="#cbd5e1" />
                                </div>
                                <h3>No Exams Scheduled</h3>
                                <p>You have no active exams for your department at this time.</p>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="admin-card">
                    <div className="section-title">
                        <History size={20} color="#6366f1" />
                        Examination History
                    </div>
                    <div className="table-container" style={{ border: 'none', boxShadow: 'none' }}>
                        <table className="dash-table">
                            <thead>
                                <tr>
                                    <th>Exam Title</th>
                                    <th>Date Taken</th>
                                    <th>Duration</th>
                                    <th>Score</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.length > 0 ? history.map((h, i) => (
                                    <tr key={i}>
                                        <td style={{ fontWeight: '700' }}>{h.examTitle}</td>
                                        <td>{new Date(h.takenAt).toLocaleDateString()}</td>
                                        <td>{h.durationUsed} mins</td>
                                        <td>
                                            <span style={{ fontWeight: '900', color: h.score >= 50 ? '#10b981' : '#ef4444' }}>
                                                {h.score}%
                                            </span>
                                        </td>
                                        <td>
                                            <span className="status-badge" style={{ background: '#f0fdf4', color: '#15803d' }}>
                                                COMPLETED
                                            </span>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="5" style={{ textAlign: 'center', padding: '60px' }}>
                                            <p style={{ color: '#94a3b8', fontWeight: '600' }}>No examination history found.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentExams;
