import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

const TeacherAssignments = () => {
    const { user } = useAuth();
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [newAssignment, setNewAssignment] = useState({
        title: '',
        description: '',
        courseCode: '',
        courseName: '',
        dueDate: '',
        maxScore: 100,
        academicYear: '2024',
        semester: 'Fall 2024',
        year: 1,
        instructions: '',
        attachment: null
    });

    useEffect(() => {
        fetchAssignments();
    }, []);

    const fetchAssignments = async () => {
        try {
            setLoading(true);
            const data = await api.getTeacherAssignments();
            setAssignments(data);
        } catch (error) {
            console.error('Error fetching assignments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAssignment = async (e) => {
        e.preventDefault();

        try {
            const formData = new FormData();
            formData.append('title', newAssignment.title);
            formData.append('description', newAssignment.description);
            formData.append('courseCode', newAssignment.courseCode);
            formData.append('courseName', newAssignment.courseName);
            formData.append('dueDate', newAssignment.dueDate);
            formData.append('maxScore', newAssignment.maxScore);
            formData.append('academicYear', newAssignment.academicYear);
            formData.append('semester', newAssignment.semester);
            formData.append('year', newAssignment.year);
            formData.append('instructions', newAssignment.instructions);

            if (newAssignment.attachment) {
                formData.append('attachment', newAssignment.attachment);
            }

            await api.createAssignment(formData);
            alert('Assignment created successfully!');
            setShowCreateModal(false);
            setNewAssignment({
                title: '',
                description: '',
                courseCode: '',
                courseName: '',
                dueDate: '',
                maxScore: 100,
                academicYear: '2024',
                semester: 'Fall 2024',
                year: 1,
                instructions: '',
                attachment: null
            });
            fetchAssignments();
        } catch (error) {
            alert('Error creating assignment: ' + error.message);
        }
    };

    const viewSubmissions = async (assignment) => {
        try {
            const data = await api.getAssignmentSubmissions(assignment.id);
            setSubmissions(data);
            setSelectedAssignment(assignment);
        } catch (error) {
            alert('Error fetching submissions: ' + error.message);
        }
    };

    const handleGradeSubmission = async (submissionId) => {
        const score = prompt('Enter score (0-100):');
        const feedback = prompt('Enter feedback (optional):');

        if (score === null) return;

        try {
            const formData = new FormData();
            formData.append('score', score);
            if (feedback) formData.append('feedback', feedback);

            await api.gradeSubmission(submissionId, formData);
            alert('Submission graded successfully!');
            viewSubmissions(selectedAssignment);
        } catch (error) {
            alert('Error grading submission: ' + error.message);
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
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px' }}>
            <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ marginBottom: '10px' }}>📚 My Assignments</h1>
                    <p style={{ color: '#666' }}>Create and manage assignments for your students</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    style={{
                        padding: '12px 24px',
                        backgroundColor: '#9c27b0',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(156, 39, 176, 0.3)'
                    }}
                >
                    ➕ Create Assignment
                </button>
            </div>

            {/* Assignments List */}
            <div style={{ display: 'grid', gap: '20px' }}>
                {assignments.map((assignment) => (
                    <div
                        key={assignment.id}
                        style={{
                            backgroundColor: 'white',
                            borderRadius: '10px',
                            padding: '25px',
                            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                            border: '1px solid #e0e0e0'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
                            <div>
                                <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>{assignment.title}</h3>
                                <p style={{ margin: '0 0 10px 0', color: '#666' }}>{assignment.description}</p>
                                <div style={{ display: 'flex', gap: '15px', fontSize: '14px', color: '#888' }}>
                                    <span>📘 {assignment.courseName} ({assignment.courseCode})</span>
                                    <span>📅 Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                                    <span>🎯 Max Score: {assignment.maxScore}</span>
                                    <span>📚 Year {assignment.year}</span>
                                    <span>📆 {assignment.semester}</span>
                                </div>
                            </div>
                            <span style={{
                                padding: '6px 12px',
                                backgroundColor: assignment.status === 'active' ? '#e8f5e9' : '#ffebee',
                                color: assignment.status === 'active' ? '#2e7d32' : '#c62828',
                                borderRadius: '20px',
                                fontSize: '12px',
                                fontWeight: 'bold'
                            }}>
                                {assignment.status}
                            </span>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                            <button
                                onClick={() => viewSubmissions(assignment)}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: '#1976d2',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold'
                                }}
                            >
                                📊 View Submissions ({assignment.submissions?.length || 0})
                            </button>
                            {assignment.attachmentPath && (
                                <button
                                    onClick={() => downloadFile('assignment', assignment.id, `${assignment.title}_instructions`)}
                                    style={{
                                        padding: '8px 16px',
                                        backgroundColor: '#4caf50',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '5px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    📎 Download Instructions
                                </button>
                            )}
                        </div>
                    </div>
                ))}

                {assignments.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '60px', backgroundColor: 'white', borderRadius: '10px' }}>
                        <div style={{ fontSize: '64px', marginBottom: '20px' }}>📚</div>
                        <h3 style={{ color: '#666' }}>No assignments yet</h3>
                        <p style={{ color: '#999' }}>Click "Create Assignment" to get started</p>
                    </div>
                )}
            </div>

            {/* Create Assignment Modal */}
            {showCreateModal && (
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
                    zIndex: 1000,
                    overflowY: 'auto'
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '30px',
                        borderRadius: '10px',
                        maxWidth: '600px',
                        width: '90%',
                        maxHeight: '90vh',
                        overflowY: 'auto'
                    }}>
                        <h2 style={{ marginBottom: '20px' }}>Create New Assignment</h2>
                        <form onSubmit={handleCreateAssignment}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <input
                                    type="text"
                                    placeholder="Assignment Title *"
                                    value={newAssignment.title}
                                    onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                                    required
                                    style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '5px' }}
                                />
                                <textarea
                                    placeholder="Description"
                                    value={newAssignment.description}
                                    onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                                    style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '5px', minHeight: '80px' }}
                                />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    <input
                                        type="text"
                                        placeholder="Course Code *"
                                        value={newAssignment.courseCode}
                                        onChange={(e) => setNewAssignment({ ...newAssignment, courseCode: e.target.value })}
                                        required
                                        style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '5px' }}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Course Name *"
                                        value={newAssignment.courseName}
                                        onChange={(e) => setNewAssignment({ ...newAssignment, courseName: e.target.value })}
                                        required
                                        style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '5px' }}
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    <input
                                        type="datetime-local"
                                        value={newAssignment.dueDate}
                                        onChange={(e) => setNewAssignment({ ...newAssignment, dueDate: e.target.value })}
                                        required
                                        style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '5px' }}
                                    />
                                    <input
                                        type="number"
                                        placeholder="Max Score"
                                        value={newAssignment.maxScore}
                                        onChange={(e) => setNewAssignment({ ...newAssignment, maxScore: e.target.value })}
                                        style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '5px' }}
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                                    <select
                                        value={newAssignment.academicYear}
                                        onChange={(e) => setNewAssignment({ ...newAssignment, academicYear: e.target.value })}
                                        style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '5px' }}
                                    >
                                        <option value="2024">2024</option>
                                        <option value="2025">2025</option>
                                        <option value="2026">2026</option>
                                    </select>
                                    <select
                                        value={newAssignment.semester}
                                        onChange={(e) => setNewAssignment({ ...newAssignment, semester: e.target.value })}
                                        style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '5px' }}
                                    >
                                        <option value="Fall 2024">Fall 2024</option>
                                        <option value="Spring 2025">Spring 2025</option>
                                        <option value="Summer 2025">Summer 2025</option>
                                    </select>
                                    <select
                                        value={newAssignment.year}
                                        onChange={(e) => setNewAssignment({ ...newAssignment, year: e.target.value })}
                                        style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '5px' }}
                                    >
                                        <option value="1">Year 1</option>
                                        <option value="2">Year 2</option>
                                        <option value="3">Year 3</option>
                                        <option value="4">Year 4</option>
                                    </select>
                                </div>
                                <textarea
                                    placeholder="Instructions (optional)"
                                    value={newAssignment.instructions}
                                    onChange={(e) => setNewAssignment({ ...newAssignment, instructions: e.target.value })}
                                    style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '5px', minHeight: '100px' }}
                                />
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', color: '#666' }}>Attachment (optional)</label>
                                    <input
                                        type="file"
                                        onChange={(e) => setNewAssignment({ ...newAssignment, attachment: e.target.files[0] })}
                                        accept=".pdf,.doc,.docx,.txt"
                                        style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '5px', width: '100%' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                    <button
                                        type="submit"
                                        style={{
                                            flex: 1,
                                            padding: '12px',
                                            backgroundColor: '#9c27b0',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '5px',
                                            fontWeight: 'bold',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Create Assignment
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        style={{
                                            flex: 1,
                                            padding: '12px',
                                            backgroundColor: '#757575',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '5px',
                                            fontWeight: 'bold',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Submissions Modal */}
            {selectedAssignment && (
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
                    zIndex: 1000,
                    overflowY: 'auto'
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '30px',
                        borderRadius: '10px',
                        maxWidth: '900px',
                        width: '90%',
                        maxHeight: '90vh',
                        overflowY: 'auto'
                    }}>
                        <h2 style={{ marginBottom: '20px' }}>Submissions for: {selectedAssignment.title}</h2>

                        {submissions.length === 0 ? (
                            <p style={{ textAlign: 'center', color: '#666', padding: '40px' }}>No submissions yet</p>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#f5f5f5' }}>
                                        <th style={{ padding: '12px', textAlign: 'left' }}>Student</th>
                                        <th style={{ padding: '12px', textAlign: 'left' }}>Submitted</th>
                                        <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                                        <th style={{ padding: '12px', textAlign: 'left' }}>Score</th>
                                        <th style={{ padding: '12px', textAlign: 'left' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {submissions.map((sub) => (
                                        <tr key={sub.id} style={{ borderBottom: '1px solid #eee' }}>
                                            <td style={{ padding: '12px' }}>
                                                <div style={{ fontWeight: 'bold' }}>{sub.student?.name}</div>
                                                <div style={{ fontSize: '12px', color: '#888' }}>{sub.student?.studentId}</div>
                                            </td>
                                            <td style={{ padding: '12px' }}>
                                                <div>{new Date(sub.submittedAt).toLocaleDateString()}</div>
                                                {sub.isLate && <span style={{ color: '#f44336', fontSize: '12px' }}>⚠️ Late</span>}
                                            </td>
                                            <td style={{ padding: '12px' }}>
                                                <span style={{
                                                    padding: '4px 8px',
                                                    backgroundColor: sub.status === 'graded' ? '#e8f5e9' : '#fff3e0',
                                                    color: sub.status === 'graded' ? '#2e7d32' : '#ef6c00',
                                                    borderRadius: '12px',
                                                    fontSize: '12px',
                                                    fontWeight: 'bold'
                                                }}>
                                                    {sub.status}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px' }}>
                                                {sub.score ? `${sub.score}/${selectedAssignment.maxScore}` : '-'}
                                            </td>
                                            <td style={{ padding: '12px' }}>
                                                <div style={{ display: 'flex', gap: '5px' }}>
                                                    <button
                                                        onClick={() => downloadFile('submission', sub.id, sub.fileName)}
                                                        style={{
                                                            padding: '6px 12px',
                                                            backgroundColor: '#1976d2',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer',
                                                            fontSize: '12px'
                                                        }}
                                                    >
                                                        📥 Download
                                                    </button>
                                                    <button
                                                        onClick={() => handleGradeSubmission(sub.id)}
                                                        style={{
                                                            padding: '6px 12px',
                                                            backgroundColor: '#4caf50',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer',
                                                            fontSize: '12px'
                                                        }}
                                                    >
                                                        ✏️ Grade
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        <button
                            onClick={() => setSelectedAssignment(null)}
                            style={{
                                marginTop: '20px',
                                padding: '10px 20px',
                                backgroundColor: '#757575',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherAssignments;
