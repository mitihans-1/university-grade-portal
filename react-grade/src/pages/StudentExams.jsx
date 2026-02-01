import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useLanguage } from '../context/LanguageContext';

const StudentExams = () => {
    const { t } = useLanguage();
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    const filteredExams = exams.filter(e =>
        e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.courseCode.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        const fetchExams = async () => {
            try {
                const data = await api.getAvailableExams();
                setExams(data);
            } catch (error) {
                console.error('Error fetching exams:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchExams();
    }, []);

    const handleStartExam = (exam) => {
        navigate(`/student/exam/${exam.id}`, { state: { exam } });
    };

    if (loading) return <LoadingSpinner fullScreen />;

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
            <h1 style={{ marginBottom: '20px' }}>📝 {t('onlineExams')}</h1>

            <div style={{ marginBottom: '25px' }}>
                <input
                    type="text"
                    placeholder="Search by Subject or Topic..."
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
                    <p>{searchTerm ? 'No exams match your search.' : t('noPendingGradesToReview')}</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '25px' }}>
                    {filteredExams.map(exam => (
                        <div key={exam.id} style={{
                            backgroundColor: 'white',
                            padding: '25px',
                            borderRadius: '15px',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                            borderLeft: exam.status === 'active' ? '6px solid #10b981' : '6px solid #3b82f6',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                                <span style={{ fontSize: '11px', fontWeight: '800', backgroundColor: '#eff6ff', color: '#3b82f6', padding: '4px 10px', borderRadius: '20px', textTransform: 'uppercase' }}>
                                    {exam.courseCode}
                                </span>
                                {exam.status === 'active' ? (
                                    <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 'bold' }}>🟢 Live Now</span>
                                ) : (
                                    <span style={{ fontSize: '12px', color: '#3b82f6', fontWeight: 'bold' }}>🕒 Ready</span>
                                )}
                            </div>

                            <h3 style={{ margin: '0 0 5px 0', fontSize: '18px', color: '#1e293b' }}>
                                <span style={{ color: '#6366f1', fontSize: '12px', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Subject</span>
                                {exam.courseName}
                            </h3>
                            <h4 style={{ margin: '0', fontSize: '16px', color: '#64748b', fontWeight: '500' }}>
                                <span style={{ color: '#a855f7', fontSize: '12px', textTransform: 'uppercase', display: 'block', marginBottom: '8px', marginTop: '10px' }}>Topic</span>
                                {exam.title}
                            </h4>

                            <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', gap: '15px' }}>
                                    <span style={{ fontSize: '14px', color: '#64748b' }}>⏱️ {exam.duration} Min</span>
                                </div>
                                <button
                                    onClick={() => handleStartExam(exam)}
                                    style={{
                                        padding: '10px 25px',
                                        backgroundColor: exam.status === 'active' ? '#10b981' : '#3b82f6',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontWeight: 'bold',
                                        boxShadow: '0 4px 10px rgba(59, 130, 246, 0.2)'
                                    }}
                                >
                                    {exam.status === 'active' ? 'Enter Now 🎯' : 'Enter Lobby 🕒'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default StudentExams;
