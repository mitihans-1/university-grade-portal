import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../utils/api';
import LoadingSpinner from '../components/common/LoadingSpinner';

const StudentExamPlayer = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    // State for the Lobby
    const [gameState, setGameState] = useState('lobby'); // lobby, playing, review
    const [entryCode, setEntryCode] = useState('');
    const [examInfo, setExamInfo] = useState(location.state?.exam || null);
    const [error, setError] = useState('');

    // State for the Exam/Review
    const [loading, setLoading] = useState(false);
    const [questions, setQuestions] = useState([]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [answers, setAnswers] = useState({});
    const [attemptId, setAttemptId] = useState(null);
    const [timeLeft, setTimeLeft] = useState(null);

    // State for Results
    const [examResults, setExamResults] = useState(null);

    useEffect(() => {
        // If we don't have exam info (direct link), fetch it
        if (!examInfo) {
            const fetchInfo = async () => {
                try {
                    const available = await api.getAvailableExams();
                    const found = available.find(e => e.id === parseInt(id));
                    if (found) setExamInfo(found);
                    else {
                        setError('Exam not found or not available.');
                    }
                } catch (err) {
                    console.error(err);
                    setError('Failed to load exam info.');
                }
            };
            fetchInfo();
        }
    }, [id, examInfo]);

    // Timer logic
    useEffect(() => {
        if (gameState !== 'playing' || timeLeft === null) return;

        if (timeLeft <= 0) {
            handleSubmit();
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, gameState]);

    const handleStartGame = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const data = await api.startExam(id, entryCode);
            setAttemptId(data.attempt.id);
            setQuestions(data.questions);
            setAnswers(data.attempt.answers || {});

            // Resume or Start Fresh
            if (data.attempt.status === 'submitted') {
                alert('You have already submitted this exam.');
                navigate('/student/exams');
                return;
            }

            if (data.attempt.status === 'started' && data.attempt.createdAt) {
                // Resume or Sync with Global Time
                const now = new Date().getTime();
                let remaining;

                if (examInfo.status === 'active' && examInfo.endTime) {
                    const globalEndTime = new Date(examInfo.endTime).getTime();
                    remaining = Math.floor((globalEndTime - now) / 1000);
                } else {
                    const startTime = new Date(data.attempt.startTime).getTime();
                    const totalSeconds = examInfo.duration * 60;
                    const elapsedSeconds = Math.floor((now - startTime) / 1000);
                    remaining = totalSeconds - elapsedSeconds;
                }

                if (remaining <= 0) {
                    handleSubmit();
                    return;
                }
                setTimeLeft(remaining);
            } else {
                // Initial Start
                if (examInfo.status === 'active' && examInfo.endTime) {
                    const now = new Date().getTime();
                    const globalEndTime = new Date(examInfo.endTime).getTime();
                    const remaining = Math.floor((globalEndTime - now) / 1000);

                    if (remaining <= 0) {
                        alert('This exam session has already ended.');
                        return;
                    }
                    setTimeLeft(remaining);
                } else {
                    // Start individual timer for 'published' or non-global 'active'
                    setTimeLeft(examInfo.duration * 60);
                }
            }

            setCurrentIdx(data.attempt.currentQuestionIndex || 0);
            setGameState('playing');
        } catch (err) {
            console.error('Start Error:', err);
            setError(err.message || 'Invalid code or system error.');
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const handleAnswerSelect = (option) => {
        if (gameState !== 'playing') return;
        setAnswers({ ...answers, [questions[currentIdx].id]: option });
    };

    const handleNext = async () => {
        if (gameState !== 'playing') {
            if (currentIdx < questions.length - 1) setCurrentIdx(currentIdx + 1);
            return;
        }

        // Autosave
        const qId = questions[currentIdx].id;
        api.saveExamAnswer(attemptId, qId, answers[qId], currentIdx + 1);

        if (currentIdx < questions.length - 1) {
            setCurrentIdx(currentIdx + 1);
        }
    };

    const handleBack = () => {
        if (currentIdx > 0) {
            setCurrentIdx(currentIdx - 1);
        }
    };

    const handleSubmit = async () => {
        // Save last answer if playing
        if (gameState === 'playing' && currentIdx < questions.length) {
            const qId = questions[currentIdx].id;
            await api.saveExamAnswer(attemptId, qId, answers[qId], currentIdx);
        }

        if (gameState === 'playing') {
            const confirmed = window.confirm('Are you sure you want to finish the exam?\n\nYou cannot change your answers after this.');
            if (!confirmed) return;
        }

        try {
            setLoading(true);
            const result = await api.submitExam(attemptId);
            setExamResults(result);

            if (result.results) {
                setQuestions(result.results);
                setGameState('review');
                setCurrentIdx(0);
            } else {
                alert(`Exam submitted! Score: ${result.score}`);
                navigate('/student/exams');
            }
        } catch (err) {
            alert('Submission failed. Try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Helper to get option style
    const getOptionStyle = (option, questionId) => {
        const baseStyle = {
            textAlign: 'left',
            padding: '18px 25px',
            borderRadius: '12px',
            cursor: gameState === 'playing' ? 'pointer' : 'default',
            fontSize: '16px',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '15px',
            boxShadow: 'none',
            border: '1px solid #e2e8f0',
            backgroundColor: 'white'
        };

        if (gameState === 'playing') {
            const isSelected = answers[questionId] === option;
            if (isSelected) {
                return {
                    ...baseStyle,
                    border: '2px solid #3b82f6',
                    backgroundColor: '#eff6ff',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.1)'
                };
            }
        } else if (gameState === 'review') {
            const questionData = questions[currentIdx];
            const isSelected = questionData.selectedAnswer === option;
            const isCorrect = questionData.correctAnswer === option;

            if (isCorrect) {
                return {
                    ...baseStyle,
                    border: '2px solid #10b981',
                    backgroundColor: '#dcfce7', // Light green
                    color: '#166534',
                    fontWeight: 'bold'
                };
            }
            if (isSelected && !isCorrect) {
                return {
                    ...baseStyle,
                    border: '2px solid #ef4444',
                    backgroundColor: '#fee2e2', // Light red
                    color: '#991b1b'
                };
            }
            // If option was selected AND correct, it's covered by the first check.
            // If unselected and incorrect, leave neutral.
        }

        return baseStyle;
    };

    if (loading && !questions.length) return <LoadingSpinner fullScreen />;

    // LOBBY VIEW
    if (gameState === 'lobby') {
        return (
            <div style={{ maxWidth: '600px', margin: '50px auto', padding: '30px', backgroundColor: 'white', borderRadius: '15px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', textAlign: 'center' }}>
                {examInfo ? (
                    <>
                        <div style={{ fontSize: '40px', marginBottom: '20px' }}>📝</div>
                        <h1 style={{ color: '#1e293b', marginBottom: '10px' }}>{examInfo.title}</h1>
                        <p style={{ color: '#64748b', fontSize: '18px', marginBottom: '30px' }}>
                            {examInfo.courseName} ({examInfo.courseCode})
                        </p>

                        <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', marginBottom: '40px' }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>{examInfo.duration}</div>
                                <div style={{ fontSize: '14px', color: '#94a3b8' }}>Minutes</div>
                            </div>
                            <div style={{ padding: '0 1px', backgroundColor: '#e2e8f0' }}></div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>Year {examInfo.targetYear}</div>
                                <div style={{ fontSize: '14px', color: '#94a3b8' }}>Target</div>
                            </div>
                        </div>

                        <form onSubmit={handleStartGame} style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center' }}>
                            <div style={{ width: '100%', maxWidth: '300px' }}>
                                <label style={{ display: 'block', textAlign: 'left', marginBottom: '5px', color: '#475569', fontWeight: '600' }}>Enter Secret Code</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="text"
                                        value={entryCode}
                                        onChange={(e) => setEntryCode(e.target.value)}
                                        placeholder="e.g. 1234"
                                        style={{
                                            width: '100%',
                                            padding: '15px',
                                            fontSize: '18px',
                                            textAlign: 'center',
                                            letterSpacing: '5px',
                                            borderRadius: '8px',
                                            border: '2px solid #e2e8f0',
                                            outline: 'none',
                                            fontWeight: 'bold'
                                        }}
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={async () => {
                                        try {
                                            const res = await api.requestCode(id);
                                            alert(res.msg || 'Code sent to your dashboard!');
                                        } catch (err) {
                                            alert('Failed to send code.');
                                        }
                                    }}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#3b82f6',
                                        fontSize: '13px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        marginTop: '10px',
                                        textDecoration: 'underline'
                                    }}
                                >
                                    Send code to my notifications 📢
                                </button>
                            </div>

                            {error && <p style={{ color: '#ef4444', margin: '0' }}>{error}</p>}

                            <button
                                type="submit"
                                disabled={!entryCode}
                                style={{
                                    padding: '15px 40px',
                                    backgroundColor: entryCode ? '#3b82f6' : '#cbd5e1',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '18px',
                                    fontWeight: 'bold',
                                    cursor: entryCode ? 'pointer' : 'not-allowed',
                                    marginTop: '10px'
                                }}
                            >
                                Start Exam 🚀
                            </button>
                        </form>
                    </>
                ) : (
                    <div>{error || 'Loading exam details...'}</div>
                )}
            </div>
        );
    }

    // GAME / REVIEW VIEW
    const currentQ = questions[currentIdx];
    const questionId = gameState === 'review' ? currentQ.questionId : currentQ.id;

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: 'white',
                padding: '15px 25px',
                borderRadius: '10px',
                marginBottom: '20px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                position: 'sticky',
                top: '0',
                zIndex: '10'
            }}>
                <div>
                    <h3 style={{ margin: 0 }}>
                        {examInfo?.title}
                        {gameState === 'review' && <span style={{ color: '#f59e0b', marginLeft: '10px' }}> (Review Mode)</span>}
                    </h3>
                    <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                        Question {currentIdx + 1} of {questions.length}
                    </p>
                </div>

                {gameState === 'playing' ? (
                    <div style={{
                        fontSize: '20px',
                        fontWeight: 'bold',
                        color: timeLeft < 60 ? '#ef4444' : '#1e293b',
                        padding: '5px 15px',
                        borderRadius: '5px',
                        backgroundColor: timeLeft < 60 ? '#fee2e2' : '#f1f5f9'
                    }}>
                        ⏱️ {formatTime(timeLeft)}
                    </div>
                ) : (
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#3b82f6' }}>
                        Final Score: {examResults?.score}
                    </div>
                )}
            </div>

            <div style={{
                backgroundColor: 'white',
                padding: '40px',
                borderRadius: '15px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                minHeight: '400px',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <h2 style={{ marginBottom: '30px', lineHeight: '1.5', fontSize: '22px', color: '#1e293b' }}>
                    <span style={{ color: '#cbd5e1', marginRight: '10px' }}>{currentIdx + 1}.</span>
                    {currentQ.questionText}
                </h2>

                <div style={{ display: 'grid', gap: '15px', flex: 1 }}>
                    {currentQ.options.map((option, idx) => (
                        <div
                            key={idx}
                            onClick={() => handleAnswerSelect(option)}
                            style={getOptionStyle(option, questionId || currentQ.id)}
                        >
                            <span style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                border: '1px solid #cbd5e1',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '14px',
                                fontWeight: 'bold',
                                backgroundColor: gameState === 'playing' ? (answers[questionId || currentQ.id] === option ? '#3b82f6' : 'white') : 'transparent',
                                color: gameState === 'playing' ? (answers[questionId || currentQ.id] === option ? 'white' : '#64748b') : 'inherit',
                                transition: 'all 0.2s'
                            }}>
                                {String.fromCharCode(65 + idx)}
                            </span>
                            {option}
                        </div>
                    ))}
                </div>

                {/* AI Explanation Section */}
                {gameState === 'review' && currentQ.explanation && (
                    <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fff7ed', borderRadius: '8px', borderLeft: '4px solid #f97316' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <span style={{ fontSize: '18px' }}>🤖</span>
                            <strong style={{ color: '#9a3412' }}>AI Tutor Explanation:</strong>
                        </div>
                        <p style={{ margin: 0, color: '#431407', fontSize: '15px', lineHeight: '1.5' }}>
                            {currentQ.explanation}
                        </p>
                    </div>
                )}

                <div style={{
                    marginTop: '50px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTop: '1px solid #f1f5f9',
                    paddingTop: '25px'
                }}>
                    <button
                        onClick={handleBack}
                        disabled={currentIdx === 0}
                        style={{
                            padding: '12px 30px',
                            backgroundColor: 'white',
                            color: currentIdx === 0 ? '#cbd5e1' : '#64748b',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            cursor: currentIdx === 0 ? 'not-allowed' : 'pointer',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        ← Back
                    </button>

                    {gameState === 'playing' ? (
                        currentIdx === questions.length - 1 ? (
                            <button
                                onClick={handleSubmit}
                                style={{
                                    padding: '12px 40px',
                                    backgroundColor: '#10b981',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    fontSize: '16px',
                                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
                                }}
                            >
                                Final Submit 🎯
                            </button>
                        ) : (
                            <button
                                onClick={handleNext}
                                style={{
                                    padding: '12px 30px',
                                    backgroundColor: '#3b82f6',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    fontSize: '16px',
                                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)'
                                }}
                            >
                                Next →
                            </button>
                        )
                    ) : (
                        <div style={{ display: 'flex', gap: '15px' }}>
                            {currentIdx < questions.length - 1 ? (
                                <button
                                    onClick={handleNext}
                                    style={{
                                        padding: '12px 30px',
                                        backgroundColor: '#3b82f6',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontWeight: '600',
                                    }}
                                >
                                    Next Question →
                                </button>
                            ) : (
                                <button
                                    onClick={() => navigate('/student/exams')}
                                    style={{
                                        padding: '12px 30px',
                                        backgroundColor: '#64748b',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontWeight: '600',
                                    }}
                                >
                                    Exit Review
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
            {/* Question indicators with review colors if in review mode */}
            <div style={{
                marginTop: '30px',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '10px',
                justifyContent: 'center'
            }}>
                {questions.map((q, idx) => {
                    let bgColor = 'white';
                    let textColor = '#64748b';

                    if (gameState === 'playing') {
                        if (currentIdx === idx) {
                            bgColor = '#3b82f6';
                            textColor = 'white';
                        } else if (answers[q.id]) {
                            bgColor = '#10b981';
                            textColor = 'white';
                        }
                    } else if (gameState === 'review') {
                        if (currentIdx === idx) {
                            bgColor = '#3b82f6';
                            textColor = 'white';
                        } else if (q.isCorrect) {
                            bgColor = '#10b981'; // Green for correct
                            textColor = 'white';
                        } else {
                            bgColor = '#ef4444'; // Red for incorrect
                            textColor = 'white';
                        }
                    }

                    return (
                        <div
                            key={idx}
                            onClick={() => setCurrentIdx(idx)}
                            style={{
                                width: '35px',
                                height: '35px',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '14px',
                                cursor: 'pointer',
                                backgroundColor: bgColor,
                                color: textColor,
                                fontWeight: currentIdx === idx ? 'bold' : 'normal',
                                boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                                border: currentIdx === idx ? 'none' : '1px solid #e2e8f0'
                            }}
                        >
                            {idx + 1}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default StudentExamPlayer;
