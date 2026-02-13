import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useLanguage } from '../context/LanguageContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
    Bell, Megaphone, Clock, Trash2, CheckCircle,
    MessageSquare, AlertTriangle, Zap, Info
} from 'lucide-react';
import '../admin-dashboard.css';

const StudentNotifications = () => {
    const { t } = useLanguage();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const data = await api.getNotifications();
            setNotifications(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'broadcast': return <Megaphone size={20} color="#3b82f6" />;
            case 'exam_code': return <Zap size={20} color="#f59e0b" />;
            case 'grade': return <CheckCircle size={20} color="#10b981" />;
            case 'alert': return <AlertTriangle size={20} color="#ef4444" />;
            default: return <Info size={20} color="#6366f1" />;
        }
    };

    const getIconBg = (type) => {
        switch (type) {
            case 'broadcast': return '#eff6ff';
            case 'exam_code': return '#fef3c7';
            case 'grade': return '#dcfce7';
            case 'alert': return '#fef2f2';
            default: return '#f5f3ff';
        }
    };

    if (loading) return <LoadingSpinner fullScreen />;

    return (
        <div className="admin-dashboard-container fade-in">
            <header className="admin-header">
                <div>
                    <h1 className="admin-title">Notification Center</h1>
                    <p className="admin-subtitle">Stay informed about university announcements and academic updates</p>
                </div>
                <button className="admin-btn" style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fee2e2' }}>
                    <Trash2 size={18} /> Clear All
                </button>
            </header>

            <div className="admin-content-grid" style={{ gridTemplateColumns: 'minmax(0, 800px)', justifyContent: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {notifications.length > 0 ? notifications.map((n, i) => (
                        <div key={n.id || i} className="admin-card stagger-item" style={{ padding: '20px', display: 'flex', gap: '20px', alignItems: 'flex-start', border: '1px solid #f1f5f9' }}>
                            <div style={{ padding: '12px', borderRadius: '14px', background: getIconBg(n.type) }}>
                                {getIcon(n.type)}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#1e293b' }}>{n.title}</h3>
                                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Clock size={14} /> {new Date(n.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <p style={{ fontSize: '0.95rem', color: '#475569', lineHeight: '1.6', marginBottom: '15px' }}>{n.message}</p>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button className="admin-btn" style={{ padding: '6px 15px', fontSize: '0.8rem', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b' }}>
                                        Mark as Read
                                    </button>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="empty-state" style={{ padding: '100px 0' }}>
                            <div className="empty-icon-box">
                                <Bell size={40} color="#cbd5e1" />
                            </div>
                            <h3>No Notifications</h3>
                            <p>Your notification tray is currently empty. We'll alert you when there's an update.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentNotifications;
