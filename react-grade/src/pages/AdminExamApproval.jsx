import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useLanguage } from '../context/LanguageContext';

const AdminExamApproval = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [entryCodes, setEntryCodes] = useState({});
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchPendingExams();
    }, []);

    const filteredExams = exams.filter(e =>
        e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.courseCode.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
            <h1 style={{ marginBottom: '20px' }}>🔐 {t('examApprovals')}</h1>
            <p style={{ color: '#64748b', marginBottom: '30px' }}>{t('teacherGradeApprovalsDescription')}</p>

            <div style={{ marginBottom: '25px' }}>
                <input
                    type="text"
                    placeholder="Search by Subject, Topic or Course Code..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '12px 20px',
                        borderRadius: '10px',
                        border: '1px solid #e2e8f0',
                        fontSize: '16px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}
                />
            </div>

            {filteredExams.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '50px', backgroundColor: 'white', borderRadius: '10px' }}>
                    <p>{searchTerm ? 'No matches found for your search.' : t('noPendingGradesToReview')}</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '20px' }}>
                    {filteredExams.map(exam => (
                        <div key={exam.id} style={{
                            backgroundColor: 'white',
                            padding: '25px',
                            borderRadius: '12px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            borderLeft: exam.status === 'active' ? '6px solid #10b981' : exam.status === 'published' ? '6px solid #3b82f6' : exam.status === 'ended' ? '6px solid #64748b' : '6px solid #f59e0b',
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '20px',
                            alignItems: 'center',
                            opacity: exam.status === 'ended' ? 0.7 : 1
                        }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '12px', backgroundColor: '#f1f5f9', color: '#475569', fontWeight: 'bold', border: '1px solid #e2e8f0' }}>
                                        {exam.courseCode}
                                    </span>
                                    <span style={{ fontSize: '13px', color: '#64748b' }}>Year {exam.targetYear} | {exam.semester}</span>
                                </div>
                                <h3 style={{ margin: '0 0 5px 0', fontSize: '18px', color: '#1e293b' }}>
                                    <span style={{ color: '#6366f1', fontWeight: '800' }}>Subject:</span> {exam.courseName}
                                </h3>
                                <h4 style={{ margin: '0', fontSize: '16px', color: '#64748b', fontWeight: '500' }}>
                                    <span style={{ color: '#a855f7', fontWeight: '800' }}>Topic:</span> {exam.title}
                                </h4>
                                <p style={{ margin: '10px 0 0 0', color: '#94a3b8', fontSize: '13px' }}>
                                    Teacher: <strong>{exam.teacher?.name}</strong> | Duration: {exam.duration} Min
                                    {exam.status === 'ended' && <span style={{ color: '#ef4444', fontWeight: 'bold', marginLeft: '10px' }}>(Ended)</span>}
                                </p>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'flex-end' }}>
                                <div style={{ display: 'flex', gap: '10px', width: '100%', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                    <div style={{ flex: 1, minWidth: '120px' }}>
                                        <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Secret Entry Code</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. 9988"
                                            value={entryCodes[exam.id] || exam.entryCode || ''}
                                            onChange={(e) => handleCodeChange(exam.id, e.target.value)}
                                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '2px solid #e2e8f0', textAlign: 'center', fontWeight: 'bold', fontSize: '16px' }}
                                        />
                                    </div>

                                    {exam.status === 'pending_admin' ? (
                                        <button
                                            onClick={() => handlePublish(exam.id)}
                                            style={{
                                                padding: '12px 24px',
                                                backgroundColor: '#6366f1',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                fontWeight: 'bold',
                                                boxShadow: '0 4px 6px rgba(99, 102, 241, 0.2)'
                                            }}
                                        >
                                            Approve & Post 📢
                                        </button>
                                    ) : exam.status !== 'ended' ? (
                                        <button
                                            onClick={async () => {
                                                if (window.confirm('Send secret code to students and START the exam timer?')) {
                                                    try {
                                                        const res = await api.notifyExamCode(exam.id);
                                                        alert(res.msg);
                                                        fetchPendingExams();
                                                    } catch (err) {
                                                        alert('Failed to send code notification.');
                                                    }
                                                }
                                            }}
                                            style={{
                                                padding: '12px 20px',
                                                backgroundColor: '#10b981',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                fontWeight: 'bold',
                                                boxShadow: '0 4px 6px rgba(16, 185, 129, 0.2)'
                                            }}
                                        >
                                            🚀 Send Code & Start Exam
                                        </button>
                                    ) : (
                                        <div style={{ padding: '12px 20px', backgroundColor: '#f1f5f9', color: '#64748b', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>
                                            {exam.status === 'active' ? '✅ Active' : '🏁 Ended'}
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                    {/* PREVIEW BUTTON - Not active or ended */}
                                    {exam.status !== 'active' && exam.status !== 'ended' && (
                                        <button
                                            onClick={() => {
                                                navigate(`/student/exam/${exam.id}`, { state: { preview: true, exam: exam } });
                                            }}
                                            style={{
                                                padding: '8px 12px',
                                                backgroundColor: '#f59e0b',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                boxShadow: '0 4px 6px rgba(245, 158, 11, 0.2)',
                                                fontWeight: 'bold',
                                                fontSize: '13px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '5px'
                                            }}
                                            title="Preview Exam"
                                        >
                                            👁️ Preview
                                        </button>
                                    )}

                                    {/* DELETE BUTTON - Always available */}
                                    <button
                                        onClick={async () => {
                                            if (window.confirm('Are you SURE you want to delete this exam? This cannot be undone.')) {
                                                try {
                                                    await api.deleteExam(exam.id);
                                                    fetchPendingExams();
                                                } catch (err) {
                                                    alert('Failed to delete exam.');
                                                }
                                            }
                                        }}
                                        style={{
                                            padding: '8px 12px',
                                            backgroundColor: '#fee2e2',
                                            color: '#ef4444',
                                            border: '1px solid #fecaca',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontWeight: 'bold',
                                            fontSize: '13px'
                                        }}
                                        title="Delete Exam"
                                    >
                                        🗑️ Delete
                                    </button>

                                    {/* STOP BUTTON - Active/Published only */}
                                    {['active', 'published'].includes(exam.status) && (
                                        <button
                                            onClick={async () => {
                                                if (window.confirm('Stop this exam immediately? Students will typically submit automatically or lose access.')) {
                                                    try {
                                                        await api.stopExam(exam.id);
                                                        fetchPendingExams();
                                                    } catch (err) {
                                                        alert('Failed to stop exam.');
                                                    }
                                                }
                                            }}
                                            style={{
                                                padding: '8px 12px',
                                                backgroundColor: '#fee2e2', // darker red for stop?
                                                color: '#b91c1c',
                                                border: '1px solid #fecaca',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                fontWeight: 'bold',
                                                fontSize: '13px'
                                            }}
                                        >
                                            🛑 Stop Exam
                                        </button>
                                    )}

                                    {/* ADD TIME BUTTON - Active/Published only */}
                                    {['active', 'published'].includes(exam.status) && (
                                        <button
                                            onClick={async () => {
                                                const mins = prompt('Enter minutes to add (e.g. 10):', '10');
                                                if (mins && !isNaN(mins)) {
                                                    try {
                                                        await api.addExamTime(exam.id, parseInt(mins));
                                                        fetchPendingExams();
                                                        alert(`Added ${mins} minutes successfully.`);
                                                    } catch (err) {
                                                        alert('Failed to add time.');
                                                    }
                                                }
                                            }}
                                            style={{
                                                padding: '8px 12px',
                                                backgroundColor: '#e0e7ff',
                                                color: '#4338ca',
                                                border: '1px solid #c7d2fe',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                fontWeight: 'bold',
                                                fontSize: '13px'
                                            }}
                                        >
                                            ⏱️ +Time
                                        </button>
                                    )}

                                    {/* Removed Start Official Timer button as it is now merged with Send Code */}
                                    {exam.status === 'active' && (
                                        <span style={{
                                            padding: '8px 16px',
                                            backgroundColor: '#ecfdf5',
                                            color: '#10b981',
                                            borderRadius: '20px',
                                            fontWeight: 'bold',
                                            border: '1px solid #10b981',
                                            fontSize: '13px'
                                        }}>
                                            🟢 Live Session
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminExamApproval;
