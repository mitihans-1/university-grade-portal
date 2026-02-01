import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../utils/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useToast } from '../components/common/Toast';

const AlertsPage = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, critical, high

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true);
        const data = await api.getAlerts();
        setAlerts(data || []);
      } catch (error) {
        console.error('Error fetching alerts:', error);
        setAlerts([]);
      } finally {
        setLoading(false);
      }
    };

    if (user && user.permissions?.includes('view_child_grades')) {
      fetchAlerts();
    }
  }, [user]);

  const markAsRead = async (alertId) => {
    try {
      await api.markAlertAsRead(alertId);
      setAlerts(alerts.map(alert =>
        alert.id === alertId ? { ...alert, isRead: true } : alert
      ));
      showToast(t('alertMarkedAsRead'), 'success');
    } catch (error) {
      showToast(t('errorMarkingAlert'), 'error');
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.markAllAlertsAsRead();
      setAlerts(alerts.map(alert => ({ ...alert, isRead: true })));
      showToast(t('allAlertsMarkedAsRead'), 'success');
    } catch (error) {
      showToast(t('errorMarkingAllAlerts'), 'error');
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return '#f44336';
      case 'high': return '#ff9800';
      case 'medium': return '#2196f3';
      case 'low': return '#4caf50';
      default: return '#666';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'failing': return '🔴';
      case 'low_grade': return '🟠';
      case 'improvement': return '🟢';
      case 'excellent': return '⭐';
      case 'new_grade': return '📊';
      default: return '📢';
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'unread') return !alert.isRead;
    if (filter === 'critical') return alert.severity === 'critical';
    if (filter === 'high') return alert.severity === 'high' || alert.severity === 'critical';
    return true;
  });

  const unreadCount = alerts.filter(a => !a.isRead).length;
  const criticalCount = alerts.filter(a => a.severity === 'critical').length;

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h2 style={{ margin: '0 0 10px 0' }}>{t('academicAlertsTitle')}</h2>
          <p style={{ color: '#666', margin: 0 }}>
            {t('alertsDescription')}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            style={{
              padding: '10px 20px',
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            {t('markAllAsRead')} ({unreadCount})
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '25px',
        borderBottom: '2px solid #eee',
        paddingBottom: '10px'
      }}>
        {[
          { key: 'all', label: t('allAlerts'), count: alerts.length },
          { key: 'unread', label: t('unread'), count: unreadCount },
          { key: 'critical', label: t('critical'), count: criticalCount },
          { key: 'high', label: t('highPriority'), count: alerts.filter(a => a.severity === 'high' || a.severity === 'critical').length }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            style={{
              padding: '10px 20px',
              backgroundColor: filter === tab.key ? '#1976d2' : 'transparent',
              color: filter === tab.key ? 'white' : '#666',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: filter === tab.key ? 'bold' : 'normal',
              position: 'relative'
            }}
          >
            {tab.label}
            {tab.count > 0 && (
              <span style={{
                marginLeft: '8px',
                backgroundColor: filter === tab.key ? 'rgba(255,255,255,0.3)' : '#1976d2',
                color: 'white',
                padding: '2px 8px',
                borderRadius: '10px',
                fontSize: '12px'
              }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Alerts List */}
      {filteredAlerts.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          backgroundColor: 'white',
          borderRadius: '10px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>✅</div>
          <h3 style={{ color: '#666', marginBottom: '10px' }}>{t('noAlerts')}</h3>
          <p style={{ color: '#999' }}>
            {filter === 'unread' ? t('allAlertsRead') :
              filter === 'critical' ? t('noCriticalAlerts') :
                t('noAlertsToDisplay')}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {filteredAlerts.map(alert => (
            <div
              key={alert.id}
              style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '10px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                borderLeft: `5px solid ${getSeverityColor(alert.severity)}`,
                opacity: alert.isRead ? 0.7 : 1,
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <span style={{ fontSize: '24px' }}>{getTypeIcon(alert.type)}</span>
                    <h3 style={{ margin: 0, color: '#333' }}>{alert.title}</h3>
                    {!alert.isRead && (
                      <span style={{
                        backgroundColor: '#ff9800',
                        color: 'white',
                        padding: '3px 10px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 'bold'
                      }}>
                        {t('newBadge')}
                      </span>
                    )}
                    <span style={{
                      backgroundColor: `${getSeverityColor(alert.severity)}20`,
                      color: getSeverityColor(alert.severity),
                      padding: '3px 10px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      textTransform: 'uppercase'
                    }}>
                      {t(alert.severity.replace('_', '')) || alert.severity}
                    </span>
                  </div>
                  <p style={{ margin: '10px 0', color: '#666', lineHeight: '1.6' }}>
                    {alert.message}
                  </p>
                  {alert.courseCode && (
                    <div style={{ marginTop: '10px', fontSize: '14px', color: '#999' }}>
                      {t('courseLabel')}: {alert.courseCode}
                    </div>
                  )}
                  <div style={{ marginTop: '10px', fontSize: '12px', color: '#999' }}>
                    {new Date(alert.createdAt).toLocaleString()}
                  </div>
                </div>
                {!alert.isRead && (
                  <button
                    onClick={() => markAsRead(alert.id)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#4caf50',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      marginLeft: '15px'
                    }}
                  >
                    {t('markAsRead')}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AlertsPage;



