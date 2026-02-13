import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../utils/api';
import { useLanguage } from '../context/LanguageContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
    Trophy, Clock, ChevronRight, ChevronLeft, Send,
    HelpCircle, AlertCircle, CheckCircle2, XCircle, Eye, Bell
} from 'lucide-react';
import '../admin-dashboard.css';

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
    const { t } = useLanguage();

    useEffect(() => {
        // PREVIEW MODE for Teachers/Admins
        if (location.state?.preview) {
            const fetchPreview = async () => {
                try {
                    setLoading(true);
                    setExamInfo(location.state.exam);
                    const data = await api.previewExam(id);
                    setQuestions(data.results); // Uses same "results" format as review
                    setGameState('preview'); // New state specifically for preview
                    setCurrentIdx(0);
                } catch (err) {
                    console.error(err);
                    setError('Failed to load preview.');
                } finally {
                    setLoading(false);
                }
            };
            fetchPreview();
            return;
        }

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
    }, [id, examInfo, location.state]);

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

            // If returned results (Review Mode)
            if (data.mode === 'review' || data.results) {
                setQuestions(data.results);
                setExamResults({ score: data.attempt.score });
                setGameState('review');
                setCurrentIdx(0);
                return;
            }

            if (data.attempt.status === 'submitted') {
                // Fallback if backend didn't send results for some reason
                alert('You have already submitted this exam.');
                return;
            }

            if (data.attempt.status === 'started' && data.attempt.startTime) {
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
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
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
            <div className="admin-dashboard-container fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
                <div className="admin-card" style={{ maxWidth: '600px', width: '100%', padding: '50px', textAlign: 'center' }}>
                    {examInfo ? (
                        <>
                            <div style={{ color: '#6366f1', background: '#e0e7ff', width: '80px', height: '80px', borderRadius: '24px', margin: '0 auto 30px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Trophy size={40} />
                            </div>
                            <h1 className="admin-title" style={{ fontSize: '2rem', marginBottom: '10px' }}>{examInfo.title}</h1>
                            <p style={{ color: '#64748b', fontSize: '1.1rem', marginBottom: '40px', fontWeight: '600' }}>
                                {examInfo.courseName} <span style={{ opacity: 0.5 }}>•</span> {examInfo.courseCode}
                            </p>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1px 1fr', gap: '20px', marginBottom: '50px', alignItems: 'center' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#6366f1' }}>{examInfo.duration}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('minutes')}</div>
                                </div>
                                <div style={{ height: '40px', background: '#e2e8f0' }}></div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#10b981' }}>{examInfo.targetYear}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('targetYear')}</div>
                                </div>
                            </div>

                            <form onSubmit={handleStartGame} style={{ display: 'flex', flexDirection: 'column', gap: '25px', alignItems: 'center' }}>
                                <div style={{ width: '100%', maxWidth: '350px' }}>
                                    <label style={{ display: 'block', textAlign: 'left', marginBottom: '10px', color: '#475569', fontWeight: '700', fontSize: '0.9rem' }}>
                                        {t('enterSecretCode') || 'Authentication Code'}
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type="text"
                                            value={entryCode}
                                            onChange={(e) => setEntryCode(e.target.value)}
                                            placeholder="••••"
                                            className="form-input"
                                            style={{
                                                width: '100%',
                                                textAlign: 'center',
                                                fontSize: '1.5rem',
                                                letterSpacing: '8px',
                                                padding: '18px',
                                            }}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            try {
                                                const res = await api.requestCode(id);
                                                alert(res.msg || 'Code sent to your notifications!');
                                            } catch (err) {
                                                alert('Failed to send code.');
                                            }
                                        }}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: '#6366f1',
                                            fontSize: '0.85rem',
                                            fontWeight: '700',
                                            cursor: 'pointer',
                                            marginTop: '15px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            margin: '15px auto 0'
                                        }}
                                    >
                                        <Bell size={14} /> {t('sendCodeToNotifications') || 'Request code via notifications'}
                                    </button>
                                </div>

                                {error && (
                                    <div style={{ padding: '10px 20px', borderRadius: '12px', background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center' }}>
                                        <AlertCircle size={16} style={{ marginRight: '8px' }} /> {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={!entryCode || loading}
                                    className="admin-btn"
                                    style={{
                                        width: '100%',
                                        maxWidth: '350px',
                                        padding: '20px',
                                        fontSize: '1.1rem',
                                        background: entryCode ? 'linear-gradient(45deg, #6366f1, #8b5cf6)' : '#f1f5f9',
                                        color: entryCode ? 'white' : '#94a3b8',
                                        opacity: entryCode ? 1 : 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '12px',
                                        border: 'none',
                                        boxShadow: entryCode ? '0 10px 25px -5px rgba(99, 102, 241, 0.4)' : 'none',
                                        cursor: entryCode ? 'pointer' : 'not-allowed'
                                    }}
                                >
                                    {loading ? <Clock className="animate-spin" /> : <><Send size={20} /> {t('startExam') || 'Begin Examination'}</>}
                                </button>
                            </form>
                        </>
                    ) : (
                        <div style={{ padding: '40px', color: '#94a3b8' }}>
                            <Clock className="animate-spin" size={40} style={{ marginBottom: '20px' }} />
                            <p>{error || t('loadingExamDetails') || 'Preparing examination environment...'}</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // GAME / REVIEW / PREVIEW VIEW
    const currentQ = questions[currentIdx];
    const questionId = (gameState === 'review' || gameState === 'preview') ? currentQ.questionId : currentQ.id;

    return (
        <div className="admin-dashboard-container fade-in" style={{ padding: '20px', minHeight: '100vh', background: '#f8fafc' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto', position: 'relative' }}>
                {/* Preview Banner */}
                {gameState === 'preview' && (
                    <div className="admin-card" style={{
                        padding: '12px 25px', marginBottom: '20px', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', gap: '15px',
                        border: '1px solid #f97316', background: '#fff7ed'
                    }}>
                        <Eye size={20} style={{ color: '#f97316' }} />
                        <span style={{ fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.9rem', color: '#9a3412' }}>
                            {t('previewMode') || 'Teacher Preview Mode'}
                        </span>
                        <button onClick={() => navigate(-1)} className="admin-btn" style={{ padding: '6px 15px', fontSize: '0.8rem', background: 'white', color: '#f97316', border: '1px solid #f97316' }}>
                            {t('exit') || 'Exit'}
                        </button>
                    </div>
                )}

                {/* Header Stats Bar */}
                <div className="admin-card stagger-item" style={{
                    padding: '20px 30px', marginBottom: '30px', display: 'flex',
                    justifyContent: 'space-between', alignItems: 'center',
                    position: 'sticky', top: '20px', zIndex: 100
                }}>
                    <div style={{ flex: 1 }}>
                        <h3 className="admin-title" style={{ margin: 0, fontSize: '1.4rem', textAlign: 'left' }}>
                            {examInfo?.title}
                            {gameState === 'review' && <span style={{ color: '#8b5cf6', marginLeft: '12px', fontSize: '0.9rem', opacity: 0.8 }}>({t('reviewMode') || 'Review'})</span>}
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '5px' }}>
                            <div style={{ padding: '2px 10px', fontSize: '0.75rem', background: '#f1f5f9', borderRadius: '4px', color: '#64748b', fontWeight: 'bold' }}>
                                {t('question')} {currentIdx + 1} / {questions.length}
                            </div>
                            <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>
                                {examInfo?.courseCode}
                            </span>
                        </div>
                    </div>

                    {gameState === 'playing' ? (
                        <div style={{
                            padding: '10px 20px', borderRadius: '15px',
                            background: timeLeft < 60 ? '#fee2e2' : '#e0e7ff',
                            color: timeLeft < 60 ? '#ef4444' : '#6366f1',
                            display: 'flex', alignItems: 'center', gap: '10px', minWidth: '120px', justifyContent: 'center',
                            fontWeight: 'bold'
                        }}>
                            <Clock size={20} className={timeLeft < 60 ? 'animate-pulse' : ''} />
                            <span style={{ fontSize: '1.2rem', fontWeight: '900', fontFamily: 'monospace' }}>{formatTime(timeLeft)}</span>
                        </div>
                    ) : gameState === 'preview' ? (
                        <div style={{ padding: '8px 15px', fontWeight: '800', background: '#f1f5f9', color: '#64748b', borderRadius: '8px' }}>
                            {t('readOnly') || 'READ ONLY'}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '1px' }}>{t('finalScore')}</div>
                            <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#6366f1' }}>
                                {examResults?.score} <span style={{ fontSize: '1rem', color: '#94a3b8', fontWeight: '600' }}>/ {questions.reduce((a, b) => a + (b.marks || 1), 0)}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Progress Bar */}
                <div style={{ marginBottom: '30px', padding: '0 10px' }}>
                    <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{
                            width: `${((currentIdx + 1) / questions.length) * 100}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                            transition: 'width 0.3s ease'
                        }}></div>
                    </div>
                </div>

                {/* Review Summary */}
                {gameState === 'review' && (
                    <div className="admin-card stagger-item" style={{
                        padding: '25px', marginBottom: '30px', borderLeft: '5px solid #6366f1',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                    }}>
                        <div>
                            <h4 style={{ margin: '0 0 5px 0', fontSize: '1.2rem', fontWeight: '800', color: '#1e293b' }}>
                                {examResults?.score >= (questions.reduce((a, b) => a + (b.marks || 1), 0) / 2) ? t('greatJob') || '🎉 Great Job!' : t('keepStudying') || '📚 Keep Studying!'}
                            </h4>
                            <p style={{ margin: 0, color: '#64748b', fontWeight: '600' }}>
                                {t('answeredCorrectly', { count: questions.filter(q => q.isCorrect).length, total: questions.length }) || `You answered ${questions.filter(q => q.isCorrect).length} out of ${questions.length} correctly.`}
                            </p>
                        </div>
                        <div style={{
                            padding: '12px 25px', borderRadius: '15px',
                            background: '#dcfce7', color: '#10b981',
                            fontSize: '1.2rem', fontWeight: '900'
                        }}>
                            {Math.round((examResults?.score / (questions.reduce((a, b) => a + (b.marks || 1), 0) || 1)) * 100)}%
                        </div>
                    </div>
                )}

                {/* Question Card */}
                <div className="admin-card stagger-item" style={{ padding: '50px', minHeight: '450px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ marginBottom: '40px' }}>
                        <span style={{
                            fontSize: '0.8rem', fontWeight: '900', color: '#6366f1',
                            textTransform: 'uppercase', letterSpacing: '2px', display: 'block', marginBottom: '10px'
                        }}>{t('questionNumber', { n: currentIdx + 1 }) || `Question ${currentIdx + 1}`}</span>
                        <h2 style={{ fontSize: '1.8rem', lineHeight: '1.4', fontWeight: '800', color: '#1e293b' }}>
                            {currentQ.questionText}
                        </h2>
                    </div>

                    <div style={{ display: 'grid', gap: '15px', flexGrow: 1 }}>
                        {currentQ.options.map((option, idx) => {
                            const qId = questionId || currentQ.id;
                            const isSelected = (gameState === 'playing' ? answers[qId] === option : currentQ.selectedAnswer === option);
                            const isCorrect = (gameState === 'review' || gameState === 'preview') && currentQ.correctAnswer === option;
                            const isWrongSelection = (gameState === 'review' || gameState === 'preview') && isSelected && !isCorrect;

                            return (
                                <div
                                    key={idx}
                                    onClick={() => handleAnswerSelect(option)}
                                    style={{
                                        padding: '20px 30px',
                                        borderRadius: '20px',
                                        background: isCorrect ? '#dcfce7' : (isWrongSelection ? '#fee2e2' : (isSelected ? '#eff6ff' : 'white')),
                                        border: `1px solid ${isCorrect ? '#10b981' : (isWrongSelection ? '#ef4444' : (isSelected ? '#3b82f6' : '#e2e8f0'))}`,
                                        cursor: gameState === 'playing' ? 'pointer' : 'default',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '20px',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        boxShadow: isSelected ? '0 4px 12px rgba(59, 130, 246, 0.1)' : '0 2px 4px rgba(0,0,0,0.02)'
                                    }}
                                >
                                    <div style={{
                                        width: '40px', height: '40px', borderRadius: '12px',
                                        background: isSelected ? '#3b82f6' : '#f1f5f9',
                                        color: isSelected ? 'white' : '#64748b',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '1rem', fontWeight: '900', transition: 'all 0.3s'
                                    }}>
                                        {String.fromCharCode(65 + idx)}
                                    </div>
                                    <span style={{ fontSize: '1.1rem', fontWeight: '600', color: isSelected || isCorrect ? '#1e293b' : '#475569' }}>
                                        {option}
                                    </span>

                                    <div style={{ marginLeft: 'auto' }}>
                                        {isCorrect && <CheckCircle2 size={24} color="#10b981" />}
                                        {isWrongSelection && <XCircle size={24} color="#ef4444" />}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* AI Explanation Section */}
                    {(gameState === 'review' || gameState === 'preview') && currentQ.explanation && (
                        <div className="admin-card" style={{
                            marginTop: '40px', padding: '25px', background: '#e0e7ff',
                            borderLeft: '4px solid #6366f1', boxShadow: 'none'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px' }}>
                                <HelpCircle size={22} style={{ color: '#6366f1' }} />
                                <strong style={{ color: '#6366f1', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.9rem' }}>
                                    {t('explanation') || 'Tutor Explanation'}
                                </strong>
                            </div>
                            <p style={{ margin: 0, color: '#312e81', fontSize: '1rem', lineHeight: '1.6', fontWeight: '500' }}>
                                {currentQ.explanation}
                            </p>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div style={{
                        marginTop: '50px', paddingTop: '30px', borderTop: '1px solid #e2e8f0',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                        <button
                            onClick={handleBack}
                            disabled={currentIdx === 0}
                            className="admin-btn"
                            style={{
                                background: 'white', color: '#64748b', border: '1px solid #e2e8f0',
                                opacity: currentIdx === 0 ? 0.3 : 1, display: 'flex', alignItems: 'center', gap: '10px', boxShadow: 'none'
                            }}
                        >
                            <ChevronLeft size={20} /> {t('back')}
                        </button>

                        <div style={{ display: 'flex', gap: '15px' }}>
                            {gameState === 'playing' ? (
                                currentIdx === questions.length - 1 ? (
                                    <button onClick={handleSubmit} className="admin-btn" style={{ background: 'linear-gradient(45deg, #10b981, #059669)', padding: '15px 40px', color: 'white', border: 'none' }}>
                                        {t('submitExam') || 'Complete Exam'} <Trophy size={20} style={{ marginLeft: '10px' }} />
                                    </button>
                                ) : (
                                    <button onClick={handleNext} className="admin-btn" style={{ padding: '15px 40px', background: 'linear-gradient(45deg, #6366f1, #8b5cf6)', color: 'white', border: 'none' }}>
                                        {t('next')} <ChevronRight size={20} />
                                    </button>
                                )
                            ) : (
                                currentIdx < questions.length - 1 && (
                                    <button onClick={handleNext} className="admin-btn" style={{ padding: '15px 40px', background: '#6366f1', color: 'white', border: 'none' }}>
                                        {t('nextQuestion') || 'Next Question'} <ChevronRight size={20} />
                                    </button>
                                )
                            )}
                        </div>
                    </div>
                </div>

                {/* Question Map */}
                <div className="admin-card stagger-item" style={{
                    marginTop: '30px', padding: '20px', display: 'flex',
                    flexWrap: 'wrap', gap: '12px', justifyContent: 'center'
                }}>
                    {questions.map((q, idx) => {
                        let statusColor = '#f1f5f9';
                        let borderColor = '#e2e8f0';
                        let textCol = '#64748b';
                        let isActive = currentIdx === idx;

                        if (gameState === 'playing') {
                            if (answers[q.id]) {
                                statusColor = '#e0e7ff';
                                borderColor = '#6366f1';
                                textCol = '#6366f1';
                            }
                        } else if (gameState === 'review') {
                            if (q.isCorrect) {
                                statusColor = '#dcfce7';
                                borderColor = '#10b981';
                                textCol = '#166534';
                            } else {
                                statusColor = '#fee2e2';
                                borderColor = '#ef4444';
                                textCol = '#991b1b';
                            }
                        }

                        if (isActive) {
                            borderColor = '#f97316';
                            statusColor = '#ffedd5';
                            textCol = '#c2410c';
                        }

                        return (
                            <button
                                key={idx}
                                onClick={() => setCurrentIdx(idx)}
                                style={{
                                    width: '45px', height: '45px', borderRadius: '12px',
                                    background: statusColor, border: `2px solid ${borderColor}`,
                                    color: textCol, fontWeight: '900', cursor: 'pointer',
                                    transition: 'all 0.3s',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transform: isActive ? 'scale(1.1)' : 'scale(1)',
                                    boxShadow: isActive ? '0 4px 10px rgba(249, 115, 22, 0.3)' : 'none'
                                }}
                            >
                                {idx + 1}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default StudentExamPlayer;
