import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import LoadingSpinner from '../components/common/LoadingSpinner';

const AdminGradeApproval = () => {
    const [pendingGrades, setPendingGrades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [selectedGradeId, setSelectedGradeId] = useState(null);
    const [showRejectModal, setShowRejectModal] = useState(false);

    useEffect(() => {
        fetchPendingGrades();
    }, []);

    const fetchPendingGrades = async () => {
        try {
            setLoading(true);
            setError(null);
            const grades = await api.getPendingGradesForApproval();
            setPendingGrades(grades);
        } catch (error) {
            console.error('Error fetching pending grades:', error);
            setError(error.message || 'Failed to load pending grades');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (gradeId) => {
        if (!window.confirm('Are you sure you want to approve this grade? It will be published to students and parents.')) {
            return;
        }

        try {
            await api.approveGrade(gradeId);
            alert('Grade approved and published successfully!');
            fetchPendingGrades(); // Refresh the list
        } catch (error) {
            console.error('Error approving grade:', error);
            alert('Failed to approve grade: ' + error.message);
        }
    };

    const handleRejectClick = (gradeId) => {
        setSelectedGradeId(gradeId);
        setRejectionReason('');
        setShowRejectModal(true);
    };

    const handleRejectSubmit = async () => {
        if (!rejectionReason.trim()) {
            alert('Please provide a reason for rejection');
            return;
        }

        try {
            await api.rejectGrade(selectedGradeId, rejectionReason);
            alert('Grade rejected successfully. Teacher will be notified.');
            setShowRejectModal(false);
            setSelectedGradeId(null);
            setRejectionReason('');
            fetchPendingGrades(); // Refresh the list
        } catch (error) {
            console.error('Error rejecting grade:', error);
            alert('Failed to reject grade: ' + error.message);
        }
    };

    const handleApproveAll = async () => {
        if (pendingGrades.length === 0) return;

        if (!window.confirm(`Are you sure you want to approve ALL ${pendingGrades.length} pending grades? This will publish them to all respective students and parents.`)) {
            return;
        }

        try {
            setLoading(true);
            const gradeIds = pendingGrades.map(g => g.id);
            const result = await api.approveGradesBulk(gradeIds);
            alert(result.msg || 'Batch approval successful!');
            fetchPendingGrades();
        } catch (error) {
            console.error('Error in batch approval:', error);
            alert('Failed to approve all grades: ' + error.message);
            setLoading(false);
        }
    };

    if (loading) {
        return <LoadingSpinner fullScreen />;
    }

    if (error) {
        return (
            <div style={{ maxWidth: '1200px', margin: '20px auto', padding: '20px', backgroundColor: '#ffebee', color: '#c62828', borderRadius: '8px', border: '1px solid #ef5350', textAlign: 'center' }}>
                <h3>Error Loading Pending Grades</h3>
                <p>{error}</p>
                <button onClick={fetchPendingGrades} style={{ padding: '8px 16px', background: '#c62828', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '10px' }}>Retry</button>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px' }}>
            <div style={{ marginBottom: '30px' }}>
                <h1 style={{ marginBottom: '10px', fontSize: '2rem' }}>📋 Teacher Grade Approvals</h1>
                <p style={{ color: '#666' }}>Review and approve grades submitted by teachers before they are published to students and parents.</p>
            </div>

            {pendingGrades.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                    <div style={{ fontSize: '64px', marginBottom: '20px' }}>✅</div>
                    <h3 style={{ color: '#2e7d32', marginBottom: '10px' }}>All Caught Up!</h3>
                    <p style={{ color: '#666' }}>There are no pending grade submissions to review.</p>
                </div>
            ) : (
                <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '25px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                    <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ margin: 0 }}>Pending Approvals ({pendingGrades.length})</h3>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                onClick={handleApproveAll}
                                style={{
                                    padding: '8px 20px',
                                    backgroundColor: '#2e7d32',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }}
                            >
                                ✅ Approve All Pending
                            </button>
                            <button onClick={fetchPendingGrades} style={{ padding: '8px 16px', backgroundColor: '#1976d2', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                                🔄 Refresh
                            </button>
                        </div>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f5f5f5', textAlign: 'left' }}>
                                    <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>Student</th>
                                    <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>Course</th>
                                    <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>Grade</th>
                                    <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>Score</th>
                                    <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>Semester</th>
                                    <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>Teacher</th>
                                    <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>Submitted</th>
                                    <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pendingGrades.map((grade) => (
                                    <tr key={grade.id} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '12px' }}>
                                            <div style={{ fontWeight: 'bold' }}>{grade.studentName}</div>
                                            <div style={{ fontSize: '12px', color: '#888' }}>{grade.studentId}</div>
                                        </td>
                                        <td style={{ padding: '12px' }}>
                                            <div style={{ fontWeight: 'bold' }}>{grade.courseName}</div>
                                            <div style={{ fontSize: '12px', color: '#888' }}>{grade.courseCode}</div>
                                        </td>
                                        <td style={{ padding: '12px' }}>
                                            <span style={{
                                                padding: '6px 12px',
                                                backgroundColor: grade.grade === 'A' ? '#4caf50' : grade.grade === 'B' ? '#2196f3' : grade.grade === 'C' ? '#ff9800' : '#f44336',
                                                color: 'white',
                                                borderRadius: '5px',
                                                fontWeight: 'bold',
                                                fontSize: '16px'
                                            }}>
                                                {grade.grade}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px' }}>
                                            <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{grade.score}%</span>
                                        </td>
                                        <td style={{ padding: '12px' }}>
                                            <div>{grade.semester}</div>
                                            <div style={{ fontSize: '12px', color: '#888' }}>{grade.academicYear}</div>
                                        </td>
                                        <td style={{ padding: '12px' }}>
                                            <div style={{ fontWeight: 'bold' }}>{grade.teacherName}</div>
                                            <div style={{ fontSize: '12px', color: '#888' }}>{grade.teacherId}</div>
                                        </td>
                                        <td style={{ padding: '12px' }}>
                                            <div style={{ fontSize: '12px' }}>{new Date(grade.submittedDate).toLocaleDateString()}</div>
                                            <div style={{ fontSize: '11px', color: '#888' }}>{new Date(grade.submittedDate).toLocaleTimeString()}</div>
                                        </td>
                                        <td style={{ padding: '12px' }}>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button
                                                    onClick={() => handleApprove(grade.id)}
                                                    style={{
                                                        padding: '8px 16px',
                                                        backgroundColor: '#4caf50',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '5px',
                                                        cursor: 'pointer',
                                                        fontWeight: 'bold',
                                                        fontSize: '14px'
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#45a049'}
                                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4caf50'}
                                                >
                                                    ✓ Approve
                                                </button>
                                                <button
                                                    onClick={() => handleRejectClick(grade.id)}
                                                    style={{
                                                        padding: '8px 16px',
                                                        backgroundColor: '#f44336',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '5px',
                                                        cursor: 'pointer',
                                                        fontWeight: 'bold',
                                                        fontSize: '14px'
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#da190b'}
                                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f44336'}
                                                >
                                                    ✗ Reject
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Rejection Modal */}
            {showRejectModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '30px',
                        borderRadius: '10px',
                        maxWidth: '500px',
                        width: '90%',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                    }}>
                        <h3 style={{ marginBottom: '20px' }}>Reject Grade Submission</h3>
                        <p style={{ marginBottom: '15px', color: '#666' }}>Please provide a reason for rejecting this grade. The teacher will be notified.</p>
                        <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Enter rejection reason..."
                            style={{
                                width: '100%',
                                minHeight: '100px',
                                padding: '10px',
                                borderRadius: '5px',
                                border: '1px solid #ddd',
                                fontSize: '14px',
                                marginBottom: '20px',
                                fontFamily: 'inherit'
                            }}
                        />
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => {
                                    setShowRejectModal(false);
                                    setSelectedGradeId(null);
                                    setRejectionReason('');
                                }}
                                style={{
                                    padding: '10px 20px',
                                    backgroundColor: '#757575',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRejectSubmit}
                                style={{
                                    padding: '10px 20px',
                                    backgroundColor: '#f44336',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold'
                                }}
                            >
                                Confirm Rejection
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminGradeApproval;
