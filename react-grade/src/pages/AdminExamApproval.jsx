import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import LoadingSpinner from '../components/common/LoadingSpinner';

const AdminExamApproval = () => {
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [entryCodes, setEntryCodes] = useState({});

    useEffect(() => {
        fetchPendingExams();
    }, []);

    const fetchPendingExams = async () => {
        try {
            const data = await api.getPendingExams();
            setExams(data);
        } catch (error) {
            console.error('Error fetching pending exams:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCodeChange = (examId, code) => {
        setEntryCodes({ ...entryCodes, [examId]: code });
    };

    const handlePublish = async (examId) => {
        const code = entryCodes[examId];
        if (!code || code.length < 4) {
            alert('Please provide a secret code (min 4 characters)');
            return;
        }

        try {
            await api.publishExam(examId, code);
            alert('Exam published successfully with code: ' + code);
            fetchPendingExams();
        } catch (error) {
            console.error('Error publishing exam:', error);
            alert('Failed to publish exam');
        }
    };

    if (loading) return <LoadingSpinner fullScreen />;

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
            <h1 style={{ marginBottom: '20px' }}>🔐 Admin Exam Approval</h1>
            <p style={{ color: '#64748b', marginBottom: '30px' }}>Review exams submitted by teachers and set the secret start code.</p>

            {exams.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '50px', backgroundColor: 'white', borderRadius: '10px' }}>
                    <p>No exams currently pending review.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '20px' }}>
                    {exams.map(exam => (
                        <div key={exam.id} style={{
                            backgroundColor: 'white',
                            padding: '25px',
                            borderRadius: '12px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            borderLeft: '6px solid #f59e0b',
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '20px',
                            alignItems: 'center'
                        }}>
                            <div>
                                <h3 style={{ margin: '0 0 5px 0' }}>{exam.title}</h3>
                                <p style={{ margin: 0, color: '#475569', fontSize: '14px' }}>
                                    <strong>Course:</strong> {exam.courseName} ({exam.courseCode})
                                </p>
                                <p style={{ margin: '5px 0 0 0', color: '#64748b', fontSize: '13px' }}>
                                    <strong>Teacher:</strong> {exam.teacher?.name} | <strong>Target:</strong> Year {exam.targetYear}
                                </p>
                            </div>

                            <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
                                <div style={{ flex: 1, maxWidth: '200px' }}>
                                    <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Secret Start Code</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 9988"
                                        value={entryCodes[exam.id] || ''}
                                        onChange={(e) => handleCodeChange(exam.id, e.target.value)}
                                        style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #cbd5e1' }}
                                    />
                                </div>
                                <button
                                    onClick={() => handlePublish(exam.id)}
                                    style={{
                                        padding: '12px 24px',
                                        backgroundColor: '#10b981',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontWeight: 'bold',
                                        transition: 'background 0.2s'
                                    }}
                                >
                                    Publish 🚀
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminExamApproval;
