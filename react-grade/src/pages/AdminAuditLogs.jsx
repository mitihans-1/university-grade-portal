import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import LoadingSpinner from '../components/common/LoadingSpinner';

const AdminAuditLogs = () => {
    const { user } = useAuth();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterAction, setFilterAction] = useState('');

    useEffect(() => {
        fetchLogs();
    }, [filterAction]);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const filters = {};
            if (filterAction) filters.action = filterAction;

            const data = await api.getAuditLogs(filters);
            setLogs(data);
        } catch (error) {
            console.error('Error fetching logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const getActionColor = (action) => {
        if (action.includes('LOGIN')) return '#4caf50'; // Green
        if (action.includes('UPLOAD')) return '#2196f3'; // Blue
        if (action.includes('DELETE')) return '#f44336'; // Red
        if (action.includes('UPDATE')) return '#ff9800'; // Orange
        return '#666'; // Grey
    };

    const formatDetails = (details) => {
        try {
            const parsed = JSON.parse(details);
            return (
                <pre style={{ margin: 0, fontSize: '11px', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                    {JSON.stringify(parsed, null, 2)}
                </pre>
            );
        } catch (e) {
            return details;
        }
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
            <div style={{ marginBottom: '30px' }}>
                <h1 style={{ margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '32px' }}>🛡️</span>
                    System Audit Logs
                </h1>
                <p style={{ color: '#666' }}>Track user activity and system events for security and compliance.</p>
            </div>

            {/* Filters */}
            <div style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '10px',
                boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                marginBottom: '20px',
                display: 'flex',
                gap: '20px'
            }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Filter by Action:</label>
                    <select
                        value={filterAction}
                        onChange={(e) => setFilterAction(e.target.value)}
                        style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ddd', minWidth: '200px' }}
                    >
                        <option value="">All Actions</option>
                        <option value="LOGIN_SUCCESS">Login Success</option>
                        <option value="UPLOAD_GRADE">Upload Grade</option>
                        <option value="UPDATE_GRADE">Update Grade</option>
                    </select>
                </div>
            </div>

            {/* Logs Table */}
            <div style={{
                backgroundColor: 'white',
                borderRadius: '10px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                overflow: 'hidden'
            }}>
                {loading ? (
                    <div style={{ padding: '40px' }}><LoadingSpinner /></div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                                <th style={{ padding: '15px', textAlign: 'left', width: '180px' }}>Date & Time</th>
                                <th style={{ padding: '15px', textAlign: 'left', width: '120px' }}>User Role</th>
                                <th style={{ padding: '15px', textAlign: 'left', width: '100px' }}>User ID</th>
                                <th style={{ padding: '15px', textAlign: 'left', width: '200px' }}>Action</th>
                                <th style={{ padding: '15px', textAlign: 'left' }}>Details</th>
                                <th style={{ padding: '15px', textAlign: 'left', width: '120px' }}>IP Address</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                                        No logs found matching your criteria.
                                    </td>
                                </tr>
                            ) : (
                                logs.map(log => (
                                    <tr key={log.id} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '15px', color: '#666', fontSize: '13px' }}>
                                            {new Date(log.createdAt).toLocaleString()}
                                        </td>
                                        <td style={{ padding: '15px' }}>
                                            <span style={{
                                                textTransform: 'capitalize',
                                                backgroundColor: '#f0f0f0',
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                fontSize: '12px',
                                                fontWeight: 'bold'
                                            }}>
                                                {log.userRole || 'System'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '15px', fontFamily: 'monospace' }}>{log.userId || '-'}</td>
                                        <td style={{ padding: '15px' }}>
                                            <span style={{
                                                color: getActionColor(log.action),
                                                fontWeight: 'bold',
                                                border: `1px solid ${getActionColor(log.action)}`,
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                fontSize: '12px'
                                            }}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td style={{ padding: '15px' }}>{formatDetails(log.details)}</td>
                                        <td style={{ padding: '15px', color: '#666', fontSize: '12px' }}>{log.ipAddress}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default AdminAuditLogs;
