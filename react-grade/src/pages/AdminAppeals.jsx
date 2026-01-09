import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useToast } from '../components/common/Toast';
import { Check, X, MessageSquare } from 'lucide-react';

const AdminAppeals = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [appeals, setAppeals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedAppeal, setSelectedAppeal] = useState(null);
    const [resolutionComments, setResolutionComments] = useState('');
    const [actionType, setActionType] = useState(null); // 'approved' or 'rejected'

    useEffect(() => {
        fetchAppeals();
    }, []);

    const fetchAppeals = async () => {
        try {
            setLoading(true);
            const data = await api.getAppeals();
            setAppeals(data);
        } catch (error) {
            console.error('Error fetching appeals:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleResolve = async () => {
        if (!resolutionComments) {
            showToast('Please add comments', 'error');
            return;
        }

        try {
            await api.resolveAppeal(selectedAppeal.id, {
                status: actionType,
                teacherComments: resolutionComments
            });
            showToast(`Appeal ${actionType} successfully`, 'success');
            setSelectedAppeal(null);
            setResolutionComments('');
            setActionType(null);
            fetchAppeals();
        } catch (error) {
            console.error('Error resolving appeal:', error);
            showToast('Failed to resolve appeal', 'error');
        }
    };

    const StatusBadge = ({ status }) => {
        let color = '#ffc107';
        if (status === 'approved') color = '#28a745';
        if (status === 'rejected') color = '#dc3545';

        return (
            <span style={{
                backgroundColor: color,
                color: 'white',
                padding: '4px 10px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 'bold',
                textTransform: 'capitalize'
            }}>
                {status}
            </span>
        );
    };

    if (loading) return <LoadingSpinner fullScreen />;

    return (
        <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 20px' }}>
            <div style={{ marginBottom: '30px' }}>
                <h1 style={{ margin: '0 0 10px 0' }}>⚖️ Grade Appeals</h1>
                <p style={{ color: '#666' }}>Manage and resolve student grade disputes.</p>
            </div>

            <div style={{ backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                        <tr>
                            <th style={{ padding: '15px', textAlign: 'left' }}>Student</th>
                            <th style={{ padding: '15px', textAlign: 'left' }}>Course</th>
                            <th style={{ padding: '15px', textAlign: 'left' }}>Grade</th>
                            <th style={{ padding: '15px', textAlign: 'left' }}>Reason</th>
                            <th style={{ padding: '15px', textAlign: 'left' }}>Date</th>
                            <th style={{ padding: '15px', textAlign: 'left' }}>Status</th>
                            <th style={{ padding: '15px', textAlign: 'center' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {appeals.length === 0 ? (
                            <tr>
                                <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                                    No appeals found.
                                </td>
                            </tr>
                        ) : (
                            appeals.map(appeal => (
                                <tr key={appeal.id} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '15px', fontWeight: 'bold' }}>
                                        {appeal.Student?.name || appeal.studentId}
                                    </td>
                                    <td style={{ padding: '15px' }}>
                                        {appeal.Grade?.courseCode}
                                    </td>
                                    <td style={{ padding: '15px' }}>
                                        <span style={{ fontWeight: 'bold', color: '#3174ad' }}>{appeal.Grade?.grade}</span>
                                    </td>
                                    <td style={{ padding: '15px', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {appeal.reason}
                                    </td>
                                    <td style={{ padding: '15px', color: '#666', fontSize: '13px' }}>
                                        {new Date(appeal.createdAt).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: '15px' }}>
                                        <StatusBadge status={appeal.status} />
                                    </td>
                                    <td style={{ padding: '15px', textAlign: 'center' }}>
                                        {appeal.status === 'pending' && (
                                            <div style={{ display: 'flex', justifyContent: 'center', gap: '5px' }}>
                                                <button
                                                    onClick={() => { setSelectedAppeal(appeal); setActionType('approved'); }}
                                                    style={{ backgroundColor: '#4caf50', color: 'white', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer' }}
                                                    title="Approve"
                                                >
                                                    <Check size={16} />
                                                </button>
                                                <button
                                                    onClick={() => { setSelectedAppeal(appeal); setActionType('rejected'); }}
                                                    style={{ backgroundColor: '#f44336', color: 'white', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer' }}
                                                    title="Reject"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        )}
                                        {appeal.status !== 'pending' && (
                                            <div style={{ fontSize: '12px', color: '#666' }}>
                                                {appeal.teacherComments ? (
                                                    <span title={appeal.teacherComments} style={{ cursor: 'help', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
                                                        <MessageSquare size={14} /> Comment
                                                    </span>
                                                ) : '-'}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Resolution Modal */}
            {selectedAppeal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', width: '500px', maxWidth: '90%' }}>
                        <h2>{actionType === 'approved' ? 'Approve Appeal' : 'Reject Appeal'}</h2>

                        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                            <p><strong>Student:</strong> {selectedAppeal.Student?.name}</p>
                            <p><strong>Course:</strong> {selectedAppeal.Grade?.courseCode}</p>
                            <p><strong>Current Grade:</strong> {selectedAppeal.Grade?.grade}</p>
                            <p><strong>Reason:</strong> {selectedAppeal.reason}</p>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                {actionType === 'approved' ? 'Resolution Comments (Actions taken)' : 'Rejection Reason'}
                            </label>
                            <textarea
                                value={resolutionComments}
                                onChange={e => setResolutionComments(e.target.value)}
                                placeholder="Enter comments here..."
                                style={{ width: '100%', padding: '10px', height: '100px', borderRadius: '5px', border: '1px solid #ddd' }}
                            ></textarea>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button
                                onClick={() => { setSelectedAppeal(null); setActionType(null); setResolutionComments(''); }}
                                style={{ padding: '10px 20px', backgroundColor: '#eee', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleResolve}
                                style={{
                                    padding: '10px 20px',
                                    backgroundColor: actionType === 'approved' ? '#4caf50' : '#f44336',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold'
                                }}
                            >
                                Confirm {actionType === 'approved' ? 'Approval' : 'Rejection'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminAppeals;
