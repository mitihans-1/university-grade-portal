import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
    Clock, MapPin, User, BookOpen,
    Calendar, Filter, Download, Info
} from 'lucide-react';
import '../admin-dashboard.css';

const ClassSchedule = () => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [schedule, setSchedule] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeDay, setActiveDay] = useState(new Date().toLocaleDateString('en-US', { weekday: 'long' }));

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    useEffect(() => {
        fetchSchedule();
    }, []);

    const fetchSchedule = async () => {
        try {
            setLoading(true);
            const data = await api.getStudentSchedule().catch(() => []);
            setSchedule(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching schedule:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <LoadingSpinner fullScreen />;

    const daySchedule = schedule.filter(s => s.day === activeDay);

    return (
        <div className="admin-dashboard-container fade-in">
            <header className="admin-header">
                <div>
                    <h1 className="admin-title">Class Schedule</h1>
                    <p className="admin-subtitle">Your weekly academic timetable and classroom sessions</p>
                </div>
                <button className="admin-btn primary">
                    <Download size={18} /> Download Timetable
                </button>
            </header>

            <div className="admin-card" style={{ padding: '10px', marginBottom: '30px', background: 'rgba(255,255,255,0.5)' }}>
                <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px' }} className="no-scrollbar">
                    {days.map(day => (
                        <button
                            key={day}
                            onClick={() => setActiveDay(day)}
                            className={`admin-btn ${activeDay === day ? 'primary' : ''}`}
                            style={{
                                border: 'none',
                                background: activeDay === day ? '' : 'white',
                                color: activeDay === day ? '' : '#64748b',
                                minWidth: '120px',
                                textTransform: 'uppercase',
                                fontSize: '0.8rem',
                                letterSpacing: '1px',
                                fontWeight: '800'
                            }}
                        >
                            {day.substring(0, 3)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="admin-content-grid" style={{ gridTemplateColumns: '1fr' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {daySchedule.length > 0 ? daySchedule.sort((a, b) => a.startTime?.localeCompare(b.startTime)).map((session, i) => (
                        <div key={i} className="admin-card stagger-item" style={{ padding: '0', overflow: 'hidden', display: 'flex', border: '1px solid #f1f5f9' }}>
                            <div style={{ width: '120px', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                                <Clock size={24} style={{ marginBottom: '8px' }} />
                                <div style={{ fontWeight: '900', fontSize: '1.2rem' }}>{session.startTime?.split(':')[0]}:{session.startTime?.split(':')[1]}</div>
                                <div style={{ fontSize: '0.7rem', opacity: 0.8, fontWeight: '700' }}>To {session.endTime || '10:30'}</div>
                            </div>
                            <div style={{ flex: 1, padding: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                        <span className="status-badge" style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '0.65rem' }}>
                                            {session.type || 'LECTURE'}
                                        </span>
                                        <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: '600' }}>Credits: 3</span>
                                    </div>
                                    <h3 style={{ fontSize: '1.4rem', fontWeight: '900', color: '#1e293b', marginBottom: '10px' }}>{session.courseName}</h3>
                                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '0.9rem', fontWeight: '500' }}>
                                            <User size={16} /> {session.instructor || 'Staff Faculty'}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#3b82f6', fontSize: '0.9rem', fontWeight: '700' }}>
                                            <MapPin size={16} /> {session.room || 'Block B-402'}
                                        </div>
                                    </div>
                                </div>
                                <div className="stat-card-glass" style={{ padding: '15px 25px', marginBottom: '0', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }}></div>
                                        <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#1e293b' }}>IN PROGRESS</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="empty-state" style={{ padding: '80px 0', borderStyle: 'solid', background: 'white' }}>
                            <div className="empty-icon-box">
                                <Info size={40} color="#cbd5e1" />
                            </div>
                            <h3>No Classes Today</h3>
                            <p>You have no scheduled sessions for {activeDay}. Enjoy your break!</p>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
};

export default ClassSchedule;
