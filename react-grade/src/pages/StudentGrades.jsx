import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../utils/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Calendar, BookOpen, Award, FileText, AlertCircle } from 'lucide-react';
import { useToast } from '../components/common/Toast';

const StudentGrades = () => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const { showToast } = useToast();
    const [grades, setGrades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [appealingGrade, setAppealingGrade] = useState(null);
    const [appealReason, setAppealReason] = useState('');

    useEffect(() => {
        const fetchGrades = async () => {
            try {
                if (user?.studentId) {
                    // Assuming getMyGrades is the newer simpler call, but let's stick to what works for student
                    const data = await api.getStudentGrades(user.studentId);
                    setGrades(data || []);
                }
            } catch (error) {
                console.error('Error fetching grades:', error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchGrades();
        }
    }, [user]);

    const getGradeColor = (grade) => {
        if (!grade) return '#666';
        if (grade.includes('A')) return '#2e7d32'; // Green
        if (grade.includes('B')) return '#1976d2'; // Blue
        if (grade.includes('C')) return '#ed6c02'; // Orange
        if (grade.includes('D')) return '#d32f2f'; // Red
        return '#b71c1c'; // F or others
    };

    const handleAppealSubmit = async () => {
        if (!appealReason) return;
        try {
            await api.submitAppeal({
                gradeId: appealingGrade.id,
                reason: appealReason
            });
            showToast('Appeal submitted successfully', 'success');
            setAppealingGrade(null);
            setAppealReason('');
        } catch (error) {
            console.error(error);
            showToast('Failed to submit appeal. You may have already appealed this grade.', 'error');
        }
    };

    if (loading) {
        return <LoadingSpinner fullScreen />;
    }

    return (
        <div className="fade-in" style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 20px' }}>
            <div style={{ marginBottom: '30px' }}>
                <h1 style={{ margin: '0 0 10px 0', fontSize: '28px' }}>{t('myGrades')}</h1>
                <p style={{ color: '#666' }}>{t('viewAcademicPerformance')}</p>
            </div>

            <div style={{ backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #eee' }}>
                        <tr>
                            <th style={{ padding: '15px', textAlign: 'left', color: '#555' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <BookOpen size={16} /> {t('courseName')}
                                </div>
                            </th>
                            <th style={{ padding: '15px', textAlign: 'left', color: '#555' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <FileText size={16} /> {t('code')}
                                </div>
                            </th>
                            <th style={{ padding: '15px', textAlign: 'center', color: '#555' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                    <Award size={16} /> {t('grade')}
                                </div>
                            </th>
                            <th style={{ padding: '15px', textAlign: 'left', color: '#555' }}>{t('score')}</th>
                            <th style={{ padding: '15px', textAlign: 'left', color: '#555' }}>{t('credits')}</th>
                            <th style={{ padding: '15px', textAlign: 'left', color: '#555' }}>{t('status')}</th>
                            <th style={{ padding: '15px', textAlign: 'center', color: '#555' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {grades.length === 0 ? (
                            <tr>
                                <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
                                    {t('noGradesAvailable')}
                                </td>
                            </tr>
                        ) : (
                            grades.map((grade, index) => (
                                <tr key={index} className="table-row-animate" style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '15px', fontWeight: '500' }}>{grade.courseName}</td>
                                    <td style={{ padding: '15px', color: '#666' }}>{grade.courseCode}</td>
                                    <td style={{ padding: '15px', textAlign: 'center' }}>
                                        <span style={{
                                            display: 'inline-block',
                                            padding: '4px 12px',
                                            borderRadius: '20px',
                                            backgroundColor: getGradeColor(grade.grade),
                                            color: 'white',
                                            fontWeight: 'bold',
                                            minWidth: '45px',
                                            textAlign: 'center'
                                        }}>
                                            {grade.grade || 'N/A'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '15px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{
                                                flex: 1,
                                                height: '8px',
                                                backgroundColor: '#eee',
                                                borderRadius: '4px',
                                                overflow: 'hidden',
                                                maxWidth: '100px'
                                            }}>
                                                <div style={{
                                                    width: `${Math.min(grade.score || 0, 100)}%`,
                                                    height: '100%',
                                                    backgroundColor: getGradeColor(grade.grade)
                                                }}></div>
                                            </div>
                                            <span style={{ fontWeight: 'bold' }}>{grade.score || 0}%</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '15px' }}>{grade.creditHours || 3}</td>
                                    <td style={{ padding: '15px' }}>
                                        <span style={{
                                            backgroundColor: (grade.published || grade.status === 'published') ? '#d4edda' : '#fff3cd',
                                            color: (grade.published || grade.status === 'published') ? '#155724' : '#856404',
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            fontSize: '12px',
                                            fontWeight: 'bold'
                                        }}>
                                            {(grade.published || grade.status === 'published') ? t('published') : t('pending')}
                                        </span>
                                    </td>
                                    <td style={{ padding: '15px', textAlign: 'center' }}>
                                        <button
                                            onClick={() => setAppealingGrade(grade)}
                                            style={{
                                                padding: '6px 12px',
                                                backgroundColor: 'white',
                                                border: '1px solid #ff9800',
                                                color: '#ff9800',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '13px'
                                            }}
                                        >
                                            Appeal
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Appeal Modal */}
            {appealingGrade && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', width: '500px', maxWidth: '90%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ margin: 0, fontSize: '20px' }}>Appeal Grade</h2>
                            <button onClick={() => setAppealingGrade(null)} style={{ border: 'none', background: 'none', fontSize: '24px', cursor: 'pointer' }}>×</button>
                        </div>

                        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#fff3e0', borderRadius: '8px', borderLeft: '4px solid #ff9800' }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{appealingGrade.courseName}</div>
                            <div style={{ fontSize: '14px' }}>Current Grade: <b>{appealingGrade.grade}</b> ({appealingGrade.score}%)</div>
                        </div>

                        <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>
                            If you believe there has been an error in your grading, please submit an appeal below. Be specific about your reasoning.
                        </p>

                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' }}>Reason for Appeal</label>
                        <select
                            value={appealReason}
                            onChange={(e) => setAppealReason(e.target.value)}
                            style={{ width: '100%', padding: '10px', marginBottom: '15px', borderRadius: '5px', border: '1px solid #ddd' }}
                        >
                            <option value="">Select a reason...</option>
                            <option value="Calculation Error">Calculation Error</option>
                            <option value="Missing Assignment">Missing Assignment Score</option>
                            <option value="Bias/Unfair Grading">Bias/Unfair Grading</option>
                            <option value="Other">Other</option>
                        </select>

                        {appealReason === 'Other' && (
                            <textarea
                                placeholder="Please explain..."
                                style={{ width: '100%', padding: '10px', height: '80px', borderRadius: '5px', border: '1px solid #ddd', marginBottom: '15px', resize: 'vertical' }}
                            ></textarea>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                            <button
                                onClick={() => setAppealingGrade(null)}
                                style={{ padding: '10px 20px', backgroundColor: '#f5f5f5', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', color: '#666' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAppealSubmit}
                                disabled={!appealReason}
                                style={{
                                    padding: '10px 20px',
                                    backgroundColor: appealReason ? '#ff9800' : '#ccc',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: appealReason ? 'pointer' : 'not-allowed',
                                    fontWeight: 'bold'
                                }}
                            >
                                Submit Appeal
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentGrades;
