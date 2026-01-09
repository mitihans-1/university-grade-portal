import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useLanguage } from '../context/LanguageContext';

const ParentNotifications = () => {
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
            // Refresh list to show updated status clearly or update local state
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.markAllNotificationsAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch (error) {
            console.error('Error marking all as read:', error);
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
                padding: '30px',
                borderRadius: '10px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div style={{
                            width: '50px',
                            height: '50px',
                            backgroundColor: '#ff9800',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '24px',
                            marginRight: '20px'
                        }}>
                            🔔
                        </div>
                        <h2 style={{ margin: 0 }}>{t('notifications')}</h2>
                    </div>
                    {notifications.some(n => !n.read) && (
                        <button
                            onClick={markAllAsRead}
                            style={{
                                background: 'none',
                                border: '1px solid #ddd',
                                padding: '8px 16px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                color: '#666'
                            }}
                        >
                            {t('markAllAsRead')}
                        </button>
                    )}
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>{t('loading')}...</div>
                ) : notifications.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                        <h3>{t('noNotificationsTitle')}</h3>
                        <p>{t('noNotificationsMessage')}</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {notifications.map((notification) => (
                            <div
                                key={notification.id}
                                style={{
                                    padding: '20px',
                                    borderLeft: `5px solid ${notification.type === 'regulation' ? '#d32f2f' : // Red
                                        notification.type === 'problem' ? '#ff9800' :    // Orange
                                            notification.type === 'academic' || notification.type === 'grade_update' ? '#4caf50' : // Green
                                                notification.type === 'administrative' ? '#2196f3' : // Blue
                                                    '#2196f3' // Default Blue
                                        }`,
                                    backgroundColor: notification.read ? '#fff' : '#e3f2fd',
                                    borderTop: '1px solid #eee',
                                    borderRight: '1px solid #eee',
                                    borderBottom: '1px solid #eee',
                                    borderRadius: '0 5px 5px 0',
                                    position: 'relative',
                                    transition: 'background-color 0.3s'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                    <span style={{ fontWeight: 'bold', fontSize: '16px' }}>
                                        {notification.title || t('notification')}
                                    </span>
                                    <span style={{ fontSize: '12px', color: '#666' }}>
                                        {new Date(notification.date || notification.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <p style={{ margin: '0 0 10px 0', color: '#333', lineHeight: '1.5' }}>
                                    {notification.message}
                                </p>

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
                                            textDecoration: 'underline',
                                            marginRight: '15px'
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
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ParentNotifications;
