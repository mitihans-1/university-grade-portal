import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../utils/api';

const StudentNotifications = () => {
    const { t } = useLanguage();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const data = await api.getNotifications();
            setNotifications(data || []);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const markAsRead = async (id) => {
        try {
            await api.markNotificationAsRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(t('deleteNotificationConfirm'))) return;
        try {
            await api.deleteNotification(id);
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px' }}>
            <div style={{
                backgroundColor: 'white',
                borderRadius: '10px',
                padding: '25px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ margin: 0, color: '#333' }}>{t('notifications')}</h2>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>{t('loading')}...</div>
                ) : notifications.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                        <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔔</div>
                        <h3 style={{ color: '#666' }}>{t('noNotificationsTitle')}</h3>
                        <p style={{ color: '#999' }}>{t('noNotificationsMessage')}</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {notifications.map((notification) => (
                            <div
                                key={notification.id}
                                style={{
                                    padding: '15px',
                                    borderLeft: `4px solid ${notification.type === 'warning' ? '#f44336' : notification.read ? '#ccc' : '#1976d2'}`,
                                    backgroundColor: notification.read ? '#fafafa' : '#e3f2fd',
                                    borderRadius: '5px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}
                            >
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                                        <p style={{ margin: 0, fontWeight: notification.read ? 'normal' : 'bold', color: '#333' }}>
                                            {notification.title || t('notification')}
                                        </p>
                                        <small style={{ color: '#666' }}>
                                            {new Date(notification.date || notification.createdAt).toLocaleDateString()}
                                        </small>
                                    </div>
                                    <p style={{ margin: '0 0 10px 0', color: '#555', fontSize: '14px' }}>
                                        {notification.message}
                                    </p>
                                    <div style={{ display: 'flex', gap: '15px' }}>
                                        {!notification.read && (
                                            <button
                                                onClick={() => markAsRead(notification.id)}
                                                style={{
                                                    fontSize: '12px',
                                                    color: '#1976d2',
                                                    background: 'none',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    padding: 0,
                                                    textDecoration: 'underline'
                                                }}
                                            >
                                                {t('markAsRead')}
                                            </button>
                                        )}
                                        {!['warning', 'failing', 'low_grade'].includes(notification.type) && (
                                            <button
                                                onClick={() => handleDelete(notification.id)}
                                                style={{
                                                    fontSize: '12px',
                                                    color: '#d32f2f',
                                                    background: 'none',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    padding: 0,
                                                    textDecoration: 'underline'
                                                }}
                                            >
                                                {t('delete')}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentNotifications;
