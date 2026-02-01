import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../utils/api';

import { useLanguage } from '../context/LanguageContext';

const AdminLinkRequests = () => {
  const { t } = useLanguage();
  const [linkRequests, setLinkRequests] = useState([]);
  const [approvedLinks, setApprovedLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const location = useLocation();

  useEffect(() => {
    // Check URL query parameters for tab selection
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get('tab');
    if (tab === 'approved') {
      setActiveTab('approved');
    }
  }, [location]);

  useEffect(() => {
    const fetchLinkRequests = async () => {
      try {
        setLoading(true);
        setError(null);

        const [pendingLinks, approvedLinksData] = await Promise.all([
          api.getPendingLinks(),
          api.getApprovedLinks()
        ]);

        console.log('Pending Links Response:', pendingLinks);

        if (pendingLinks && pendingLinks.msg) {
          setError(pendingLinks.msg);
        } else if (Array.isArray(pendingLinks)) {
          setLinkRequests(pendingLinks);
        }

        if (approvedLinksData && !approvedLinksData.msg) {
          setApprovedLinks(approvedLinksData);
        }
      } catch (error) {
        console.error('Error fetching link requests:', error);
        setError(error.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchLinkRequests();
  }, []);

  const handleApprove = async (linkId) => {
    try {
      const result = await api.approveLink(linkId);

      if (result.msg && !result.msg.includes('error')) {
        // Refresh the data after successful approval
        const pendingLinks = await api.getPendingLinks();
        const approvedLinksData = await api.getApprovedLinks();

        if (pendingLinks && !pendingLinks.msg) {
          setLinkRequests(pendingLinks);
        }

        if (approvedLinksData && !approvedLinksData.msg) {
          setApprovedLinks(approvedLinksData);
        }

        alert(t('approveSuccess'));
      } else {
        alert('Error approving link: ' + (result.msg || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error approving link:', error);
      alert('An error occurred while approving the link request.');
    }
  };

  const handleReject = async (linkId) => {
    try {
      const result = await api.rejectLink(linkId);

      if (result.msg && !result.msg.includes('error')) {
        // Refresh the data after successful rejection
        const pendingLinks = await api.getPendingLinks();

        if (pendingLinks && !pendingLinks.msg) {
          setLinkRequests(pendingLinks);
        }

        alert(t('rejectSuccess'));
      } else {
        alert('Error rejecting link: ' + (result.msg || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error rejecting link:', error);
      alert('An error occurred while rejecting the link request.');
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>{t('loading')}...</div>;
  }

  if (error) {
    return (
      <div style={{ maxWidth: '1200px', margin: '20px auto', padding: '20px', backgroundColor: '#ffebee', color: '#c62828', borderRadius: '8px', border: '1px solid #ef5350', textAlign: 'center' }}>
        <h3>Error Loading Requests</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} style={{ padding: '8px 16px', background: '#c62828', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '10px' }}>Retry</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <h2>{t('linkRequests')}</h2>
      <p>{t('linkRequestsDescription')}</p>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #ddd',
        marginBottom: '20px'
      }}>
        <button
          onClick={() => setActiveTab('pending')}
          style={{
            padding: '10px 20px',
            backgroundColor: activeTab === 'pending' ? 'white' : '#f5f5f5',
            border: activeTab === 'pending' ? '1px solid #ddd' : 'none',
            borderBottom: activeTab === 'pending' ? 'none' : '1px solid #ddd',
            borderTopLeftRadius: '5px',
            borderTopRightRadius: '5px',
            cursor: 'pointer',
            fontWeight: activeTab === 'pending' ? 'bold' : 'normal',
            color: activeTab === 'pending' ? '#1976d2' : '#666'
          }}
        >
          {t('pendingRequestsTab')} ({linkRequests.length})
        </button>
        <button
          onClick={() => setActiveTab('approved')}
          style={{
            padding: '10px 20px',
            backgroundColor: activeTab === 'approved' ? 'white' : '#f5f5f5',
            border: activeTab === 'approved' ? '1px solid #ddd' : 'none',
            borderBottom: activeTab === 'approved' ? 'none' : '1px solid #ddd',
            borderTopLeftRadius: '5px',
            borderTopRightRadius: '5px',
            cursor: 'pointer',
            fontWeight: activeTab === 'approved' ? 'bold' : 'normal',
            color: activeTab === 'approved' ? '#2e7d32' : '#666'
          }}
        >
          {t('approvedLinksTab')} ({approvedLinks.length})
        </button>
      </div>

      {activeTab === 'pending' && (
        <>
          {linkRequests.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              backgroundColor: '#f5f5f5',
              borderRadius: '10px',
              marginTop: '20px'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>✅</div>
              <h3>{t('noPendingRequests')}</h3>
              <p>{t('pendingRequestsProcessed')}</p>
            </div>
          ) : (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '10px',
              padding: '25px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
            }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>{t('parent')}</th>
                      <th>{t('student')}</th>
                      <th>{t('studentId')}</th>
                      <th>{t('relationship')}</th>
                      <th>{t('requestDate')}</th>
                      <th>{t('contactInfo')}</th>
                      <th>{t('source')}</th>
                      <th>{t('status')}</th>
                      <th>{t('actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {linkRequests.map(link => {
                      // Access nested parent and student data from the API response
                      const parent = link.parent || {};
                      const student = link.student || {};

                      return (
                        <tr key={link.id} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '12px' }}>
                            <strong>{parent.name}</strong>
                            <div style={{ fontSize: '14px', color: '#666' }}>{parent.email}</div>
                          </td>
                          <td style={{ padding: '12px' }}>
                            <strong>{student.name}</strong>
                            <div style={{ fontSize: '14px', color: '#666' }}>{student.department}</div>
                          </td>
                          <td style={{ padding: '12px' }}>{student.studentId}</td>
                          <td style={{ padding: '12px' }}>{parent.relationship}</td>
                          <td style={{ padding: '12px' }}>
                            {new Date(link.linkDate || link.createdAt).toLocaleDateString()}
                          </td>
                          <td style={{ padding: '12px' }}>
                            <div>{parent.phone}</div>
                            <div style={{ fontSize: '14px', color: '#666' }}>{parent.email}</div>
                            <div style={{ fontSize: '12px', color: '#2e7d32', marginTop: '4px', fontStyle: 'italic' }}>
                              🔔 {t('notificationPreference')}: {parent.notificationPreference === 'both' ? t('bothEmailAndSms') : parent.notificationPreference === 'email' ? t('emailOnly') : t('smsOnly')}
                            </div>
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span style={{
                              backgroundColor: link.linkedBy === 'System' ? '#e3f2fd' : '#f3e5f5',
                              color: link.linkedBy === 'System' ? '#1976d2' : '#7b1fa2',
                              padding: '4px 8px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: 'bold',
                              textTransform: 'uppercase'
                            }}>
                              {link.linkedBy === 'System' ? 'Registration' : 'Dashboard'}
                            </span>
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span style={{
                              backgroundColor: '#fff3e0',
                              color: '#ef6c00',
                              padding: '4px 8px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: 'bold'
                            }}>
                              ⏳ {t('pending')}
                            </span>
                          </td>
                          <td style={{ padding: '12px' }}>
                            <div style={{ display: 'flex', gap: '10px' }}>
                              <button
                                onClick={() => handleApprove(link.id)}
                                style={{
                                  padding: '8px 16px',
                                  backgroundColor: '#4caf50',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer'
                                }}
                              >
                                {t('approve')}
                              </button>
                              <button
                                onClick={() => handleReject(link.id)}
                                style={{
                                  padding: '8px 16px',
                                  backgroundColor: '#f44336',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer'
                                }}
                              >
                                {t('reject')}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )
      }

      {
        activeTab === 'approved' && (
          <div style={{ marginTop: '20px' }}>
            <h3>{t('approvedLinksTab')}</h3>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '10px',
              padding: '25px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
            }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>{t('parent')}</th>
                      <th>{t('student')}</th>
                      <th>{t('relationship')}</th>
                      <th>{t('approvedDate')}</th>
                      <th>{t('source')}</th>
                      <th>{t('status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {approvedLinks.map(link => {
                      const parent = link.parent || {};
                      const student = link.student || {};

                      return (
                        <tr key={link.id} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '12px' }}>{parent.name}</td>
                          <td style={{ padding: '12px' }}>{student.name} ({student.studentId})</td>
                          <td style={{ padding: '12px' }}>{parent.relationship}</td>
                          <td style={{ padding: '12px' }}>
                            {new Date(link.approvedDate || link.linkDate).toLocaleDateString()}
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span style={{
                              backgroundColor: link.linkedBy === 'System' ? '#e3f2fd' : '#f3e5f5',
                              color: link.linkedBy === 'System' ? '#1976d2' : '#7b1fa2',
                              padding: '4px 8px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: 'bold',
                              textTransform: 'uppercase'
                            }}>
                              {link.linkedBy === 'System' ? 'Registration' : 'Dashboard'}
                            </span>
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span style={{
                              backgroundColor: '#e8f5e9',
                              color: '#2e7d32',
                              padding: '4px 8px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: 'bold'
                            }}>
                              ✅ {t('active')}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default AdminLinkRequests;