import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

const StudentAssignments = () => {
    const { user } = useAuth();
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [file, setFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchAssignments();
    }, []);

    const fetchAssignments = async () => {
        try {
            setLoading(true);
            const data = await api.getStudentAssignments();
            setAssignments(data);
        } catch (error) {
            console.error('Error fetching assignments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitAssignment = async (e) => {
        e.preventDefault();
        if (!file) {
            alert('Please select a file to upload');
            return;
        }

        try {
            setSubmitting(true);
            const formData = new FormData();
            formData.append('file', file);

            await api.submitAssignment(selectedAssignment.id, formData);
            alert('Assignment submitted successfully!');
            setShowSubmitModal(false);
            setFile(null);
            fetchAssignments();
        } catch (error) {
            alert('Error submitting assignment: ' + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const downloadFile = async (type, id, filename) => {
        try {
            const blob = await api.downloadAssignmentFile(type, id);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename || 'download';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            alert('Error downloading file: ' + error.message);
        }
    };

    if (loading) return <LoadingSpinner fullScreen />;

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
            <div style={{ marginBottom: '30px' }}>
                <h1 style={{ marginBottom: '10px' }}>📝 My Assignments</h1>
                <p style={{ color: '#666' }}>View and submit your course assignments</p>
            </div>

            <div style={{ display: 'grid', gap: '20px' }}>
                {assignments.map((assignment) => {
                    const submission = assignment.submissions && assignment.submissions[0];
                    const isSubmitted = !!submission;
                    const isGraded = submission && submission.status === 'graded';

                    return (
                        <div
                            key={assignment.id}
                            style={{
                                backgroundColor: 'white',
                                borderRadius: '10px',
                                padding: '25px',
                                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                                border: isSubmitted ? '2px solid #e8f5e9' : '1px solid #e0e0e0',
                                position: 'relative'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
                                <div>
                                    <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>{assignment.title}</h3>
                                    <p style={{ margin: '0 0 10px 0', color: '#666' }}>{assignment.description}</p>
                                    <div style={{ display: 'flex', gap: '15px', fontSize: '14px', color: '#888', flexWrap: 'wrap' }}>
                                        <span>📘 {assignment.courseName} ({assignment.courseCode})</span>
                                        <span style={{ color: new Date(assignment.dueDate) < new Date() ? '#f44336' : '#888' }}>
                                            📅 Due: {new Date(assignment.dueDate).toLocaleDateString()} {new Date(assignment.dueDate).toLocaleTimeString()}
                                        </span>
                                        <span>🎯 Max Score: {assignment.maxScore}</span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px' }}>
                                    <span style={{
                                        padding: '6px 12px',
                                        backgroundColor: isSubmitted ? '#e8f5e9' : '#fff3e0',
                                        color: isSubmitted ? '#2e7d32' : '#ef6c00',
                                        borderRadius: '20px',
                                        fontSize: '12px',
                                        fontWeight: 'bold'
                                    }}>
                                        {isSubmitted ? 'SUBMITTED' : 'NOT SUBMITTED'}
                                    </span>
                                    {isGraded && (
                                        <span style={{
                                            padding: '6px 12px',
                                            backgroundColor: '#e3f2fd',
                                            color: '#1976d2',
                                            borderRadius: '20px',
                                            fontSize: '12px',
                                            fontWeight: 'bold'
                                        }}>
                                            GRADED: {submission.score}/{assignment.maxScore}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {assignment.instructions && (
                                <div style={{ backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '8px', marginBottom: '15px', fontSize: '14px' }}>
                                    <strong>Instructions:</strong>
                                    <p style={{ margin: '5px 0 0 0' }}>{assignment.instructions}</p>
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '10px', marginTop: '15px', flexWrap: 'wrap' }}>
                                {assignment.attachmentPath && (
                                    <button
                                        onClick={() => downloadFile('assignment', assignment.id, `${assignment.title}_instructions`)}
                                        style={{
                                            padding: '8px 16px',
                                            backgroundColor: '#4caf50',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '5px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '5px'
                                        }}
                                    >
                                        📥 Download Instructions
                                    </button>
                                )}

                                {!isSubmitted ? (
                                    <button
                                        onClick={() => {
                                            setSelectedAssignment(assignment);
                                            setShowSubmitModal(true);
                                        }}
                                        disabled={new Date(assignment.dueDate) < new Date()}
                                        style={{
                                            padding: '8px 16px',
                                            backgroundColor: '#1976d2',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '5px',
                                            cursor: new Date(assignment.dueDate) < new Date() ? 'not-allowed' : 'pointer',
                                            fontWeight: 'bold',
                                            opacity: new Date(assignment.dueDate) < new Date() ? 0.6 : 1
                                        }}
                                    >
                                        {new Date(assignment.dueDate) < new Date() ? '⌛ Deadline Passed' : '📤 Submit Assignment'}
                                    </button>
                                ) : (
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button
                                            onClick={() => downloadFile('submission', submission.id, submission.fileName)}
                                            style={{
                                                padding: '8px 16px',
                                                backgroundColor: '#757575',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '5px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            📄 My Submission ({submission.fileName})
                                        </button>
                                        {submission.gradedFilePath && (
                                            <button
                                                onClick={() => downloadFile('graded', submission.id, `graded_${submission.fileName}`)}
                                                style={{
                                                    padding: '8px 16px',
                                                    backgroundColor: '#9c27b0',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '5px',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                📂 Download Graded File
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            {isGraded && submission.feedback && (
                                <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '8px', borderLeft: '4px solid #1976d2' }}>
                                    <h4 style={{ margin: '0 0 5px 0', color: '#1976d2' }}>Feedback:</h4>
                                    <p style={{ margin: 0, fontSize: '14px' }}>{submission.feedback}</p>
                                </div>
                            )}
                        </div>
                    );
                })}

                {assignments.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '60px', backgroundColor: 'white', borderRadius: '10px' }}>
                        <div style={{ fontSize: '64px', marginBottom: '20px' }}>📋</div>
                        <h3 style={{ color: '#666' }}>No assignments for your year level</h3>
                        <p style={{ color: '#999' }}>Check back later or contact your teachers</p>
                    </div>
                )}
            </div>

            {/* Submit Assignment Modal */}
            {showSubmitModal && (
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
                        padding: '40px',
                        borderRadius: '12px',
                        maxWidth: '500px',
                        width: '90%',
                        boxShadow: '0 4px 25px rgba(0,0,0,0.2)'
                    }}>
                        <h2 style={{ marginBottom: '15px' }}>Submit Assignment</h2>
                        <p style={{ color: '#666', marginBottom: '25px' }}>
                            Submitting for: <strong>{selectedAssignment.title}</strong>
                        </p>

                        <form onSubmit={handleSubmitAssignment}>
                            <div style={{ marginBottom: '25px' }}>
                                <label style={{ display: 'block', marginBottom: '10px', color: '#333', fontWeight: 'bold' }}>
                                    Select File (PDF, Word, or Images)
                                </label>
                                <input
                                    type="file"
                                    onChange={(e) => setFile(e.target.files[0])}
                                    required
                                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.zip"
                                    style={{
                                        width: '100%',
                                        padding: '15px',
                                        border: '2px dashed #ddd',
                                        borderRadius: '8px',
                                        cursor: 'pointer'
                                    }}
                                />
                                <p style={{ fontSize: '12px', color: '#888', marginTop: '10px' }}>
                                    Maximum file size: 10MB
                                </p>
                            </div>

                            <div style={{ display: 'flex', gap: '15px' }}>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    style={{
                                        flex: 1,
                                        padding: '12px',
                                        backgroundColor: '#1976d2',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontWeight: 'bold',
                                        cursor: submitting ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    {submitting ? '🚀 Submitting...' : '🚀 Submit Now'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowSubmitModal(false);
                                        setFile(null);
                                    }}
                                    disabled={submitting}
                                    style={{
                                        flex: 1,
                                        padding: '12px',
                                        backgroundColor: '#f5f5f5',
                                        color: '#333',
                                        border: '1px solid #ddd',
                                        borderRadius: '8px',
                                        fontWeight: 'bold',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentAssignments;
