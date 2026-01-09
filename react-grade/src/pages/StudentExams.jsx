import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/common/LoadingSpinner';

const StudentExams = () => {
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

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
            <h1 style={{ marginBottom: '20px' }}>📝 Available Exams</h1>

            {exams.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '50px', backgroundColor: 'white', borderRadius: '10px' }}>
                    <p>No exams are currently available for you.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                    {exams.map(exam => (
                        <div key={exam.id} style={{
                            backgroundColor: 'white',
                            padding: '20px',
                            borderRadius: '10px',
                            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                            borderLeft: '5px solid #3b82f6'
                        }}>
                            <h3>{exam.title}</h3>
                            <p style={{ color: '#666', fontSize: '14px' }}>{exam.courseName} ({exam.courseCode})</p>
                            <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>⏱️ {exam.duration} Min</span>
                                <button
                                    onClick={() => handleStartExam(exam)}
                                    style={{
                                        padding: '8px 16px',
                                        backgroundColor: '#3b82f6',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '5px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Start Exam
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
