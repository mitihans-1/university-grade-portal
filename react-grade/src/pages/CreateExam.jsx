import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const CreateExam = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [loadingAI, setLoadingAI] = useState(false);
    const [showAIAssistant, setShowAIAssistant] = useState(false);
    const [aiFile, setAIFile] = useState(null);
    const [aiInput, setAIInput] = useState({
        topic: '',
        count: 5,
        difficulty: 'intermediate'
    });

    const [examData, setExamData] = useState({
        title: '',
        description: '',
        courseCode: '',
        courseName: '',
        duration: 60,
        academicYear: '2024',
        semester: 'Fall 2024',
        targetYear: '1',
        status: 'pending_admin'
    });

    // Each question now explicitly tracks correctAnswerIndex instead of just text
    const [questions, setQuestions] = useState([
        {
            questionText: '',
            questionType: 'multiple_choice',
            options: ['', '', '', ''],
            correctAnswerIndex: 0, // Default to first option
            marks: 1,
            order: 0
        }
    ]);

    const handleExamChange = (e) => {
        setExamData({ ...examData, [e.target.name]: e.target.value });
    };

    const handleQuestionChange = (index, field, value) => {
        const newQuestions = [...questions];
        newQuestions[index][field] = value;
        setQuestions(newQuestions);
    };

    const handleOptionChange = (qIndex, oIndex, value) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].options[oIndex] = value;
        setQuestions(newQuestions);
    };

    // Helper to select the correct answer visually
    const setCorrectOption = (qIndex, oIndex) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].correctAnswerIndex = oIndex;
        setQuestions(newQuestions);
    };

    const addQuestion = () => {
        setQuestions([...questions, {
            questionText: '',
            questionType: 'multiple_choice',
            options: ['', '', '', ''],
            correctAnswerIndex: 0,
            marks: 1,
            order: questions.length
        }]);
    };

    const removeQuestion = (index) => {
        if (questions.length > 1) {
            setQuestions(questions.filter((_, i) => i !== index));
        }
    };

    const handleAIGenerate = async () => {
        if (!aiInput.topic && !aiFile) {
            alert(t('pleaseEnterTopicOrUploadFile') || 'Please enter a topic or upload a file');
            return;
        }

        try {
            setLoadingAI(true);
            const formData = new FormData();
            formData.append('topic', aiInput.topic);
            formData.append('count', aiInput.count);
            formData.append('difficulty', aiInput.difficulty);
            formData.append('subject', examData.courseName || examData.courseCode || 'General');
            if (aiFile) {
                formData.append('file', aiFile);
            }

            const generatedQuestions = await api.generateAIQuestions(formData);

            if (Array.isArray(generatedQuestions)) {
                // If questions are currently empty or just placeholder, replace them
                if (questions.length === 1 && !questions[0].questionText) {
                    setQuestions(generatedQuestions);
                } else {
                    // Append
                    setQuestions([...questions, ...generatedQuestions]);
                }
                setShowAIAssistant(false);
                alert(t('aiQuestionsGenerated') || `Generated ${generatedQuestions.length} questions successfully!`);
            }
        } catch (error) {
            console.error('AI error:', error);
            alert(error.message || 'Failed to generate questions with AI');
        } finally {
            setLoadingAI(false);
        }
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (!examData.title || !examData.courseCode) {
                alert(t('pleaseFillExamTitleAndCourseCode'));
                return;
            }

            // Prepare questions: map correctAnswerIndex back to the actual text string expected by backend
            const formattedQuestions = questions.map(q => {
                const answerText = q.options[q.correctAnswerIndex];
                if (!answerText) {
                    throw new Error(`Question ${q.order + 1} has an empty correct answer.`);
                }
                return {
                    ...q,
                    correctAnswer: answerText
                };
            });

            // 1. Create Exam
            const exam = await api.createExam(examData);

            // 2. Add Questions
            await api.addExamQuestions(exam.id, formattedQuestions);

            alert(t('examCreatedSuccess'));
            navigate('/teacher');
        } catch (error) {
            console.error('Error creating exam:', error);
            alert(error.message || 'Failed to create exam');
        }
    };

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h1 style={{ margin: 0 }}>🛠️ {t('professionalExamCreator')}</h1>
                <button
                    type="button"
                    onClick={() => setShowAIAssistant(true)}
                    style={{
                        padding: '12px 20px',
                        background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)',
                        transition: 'transform 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                    <span>✨ {t('generateWithAI') || 'AI Assistant'}</span>
                </button>
            </div>

            {/* AI Assistant Modal */}
            {showAIAssistant && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(5px)',
                    zIndex: 2000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <div className="stagger-item" style={{
                        backgroundColor: 'white',
                        width: '90%',
                        maxWidth: '500px',
                        padding: '40px',
                        borderRadius: '24px',
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                        position: 'relative'
                    }}>
                        <button
                            onClick={() => setShowAIAssistant(false)}
                            style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}
                        >✕</button>

                        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                            <div style={{
                                width: '60px', height: '60px',
                                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                                borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 15px', color: 'white', fontSize: '30px'
                            }}>✨</div>
                            <h2 style={{ margin: '0 0 10px 0' }}>{t('aiExamAssistant') || 'AI Exam Assistant'}</h2>
                            <p style={{ color: '#64748b', fontSize: '14px' }}>{t('aiAssistantHint') || 'Let AI help you create high-quality questions in seconds.'}</p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1e293b' }}>{t('examTopic') || 'Exam Topic'}</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Newton's Laws, Organic Chemistry..."
                                    value={aiInput.topic}
                                    onChange={(e) => setAIInput({ ...aiInput, topic: e.target.value })}
                                    style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '2px solid #e2e8f0', outline: 'none', transition: 'border-color 0.2s' }}
                                    onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1e293b' }}>{t('numberOfQuestions') || 'Count'}</label>
                                    <select
                                        value={aiInput.count}
                                        onChange={(e) => setAIInput({ ...aiInput, count: parseInt(e.target.value) })}
                                        style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '2px solid #e2e8f0' }}
                                    >
                                        {[3, 5, 10, 15].map(n => <option key={n} value={n}>{n} {t('questions')}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1e293b' }}>{t('difficulty') || 'Difficulty'}</label>
                                    <select
                                        value={aiInput.difficulty}
                                        onChange={(e) => setAIInput({ ...aiInput, difficulty: e.target.value })}
                                        style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '2px solid #e2e8f0' }}
                                    >
                                        <option value="easy">{t('difficultyEasy') || 'Easy'}</option>
                                        <option value="intermediate">{t('difficultyIntermediate') || 'Intermediate'}</option>
                                        <option value="hard">{t('difficultyHard') || 'Hard'}</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1e293b' }}>
                                    📄 {t('uploadStudyMaterial') || 'Source Document (PDF/Text)'}
                                </label>
                                <div
                                    style={{
                                        border: '2px dashed #cbd5e1',
                                        borderRadius: '12px',
                                        padding: '15px',
                                        textAlign: 'center',
                                        backgroundColor: aiFile ? '#f0f9ff' : 'transparent',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => document.getElementById('ai-file-input').click()}
                                >
                                    <input
                                        id="ai-file-input"
                                        type="file"
                                        accept=".pdf,.txt"
                                        onChange={(e) => setAIFile(e.target.files[0])}
                                        style={{ display: 'none' }}
                                    />
                                    {aiFile ? (
                                        <div style={{ color: '#0369a1', fontWeight: 'bold' }}>✅ {aiFile.name}</div>
                                    ) : (
                                        <div style={{ color: '#64748b' }}>{t('clickToUpload') || 'Click to select PDF or text file'}</div>
                                    )}
                                </div>
                                {aiFile && (
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); setAIFile(null); }}
                                        style={{ fontSize: '12px', color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer', marginTop: '5px' }}
                                    >
                                        {t('removeFile') || 'Remove file'}
                                    </button>
                                )}
                            </div>

                            <button
                                onClick={handleAIGenerate}
                                disabled={loadingAI}
                                style={{
                                    marginTop: '10px',
                                    padding: '16px',
                                    background: loadingAI ? '#cbd5e1' : 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '16px',
                                    fontWeight: 'bold',
                                    fontSize: '16px',
                                    cursor: loadingAI ? 'not-allowed' : 'pointer',
                                    transition: 'transform 0.2s',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
                                }}
                            >
                                {loadingAI ? (
                                    <>
                                        <div style={{ width: '20px', height: '20px', border: '3px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                                        {t('generating') || 'Thinking...'}
                                    </>
                                ) : (
                                    <>🪄 {t('generateQuestions') || 'Generate Questions'}</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                .stagger-item { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>

            <form onSubmit={handleSubmit}>
                <div style={{
                    backgroundColor: 'white',
                    padding: '25px',
                    borderRadius: '10px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                    marginBottom: '30px'
                }}>
                    <h3>{t('examDetails')}</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
                        <div>
                            <label>{t('examTitle')}</label>
                            <input
                                type="text"
                                name="title"
                                value={examData.title}
                                onChange={handleExamChange}
                                style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '5px', border: '1px solid #ddd' }}
                                placeholder={t('examTitlePlaceholder')}
                            />
                        </div>
                        <div>
                            <label>{t('courseCode')}</label>
                            <input
                                type="text"
                                name="courseCode"
                                value={examData.courseCode}
                                onChange={handleExamChange}
                                style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '5px', border: '1px solid #ddd' }}
                                placeholder="MATH202"
                            />
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                            <label>{t('courseName')}</label>
                            <input
                                type="text"
                                name="courseName"
                                value={examData.courseName}
                                onChange={handleExamChange}
                                style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '5px', border: '1px solid #ddd' }}
                                placeholder="e.g. Mathematics II"
                            />
                        </div>
                        <div>
                            <label>{t('targetStudentYear')}</label>
                            <select
                                name="targetYear"
                                value={examData.targetYear}
                                onChange={handleExamChange}
                                style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '5px', border: '1px solid #ddd' }}
                            >
                                <option value="1">{t('year1')}</option>
                                <option value="2">{t('year2')}</option>
                                <option value="3">{t('year3')}</option>
                                <option value="4">{t('year4')}</option>
                                <option value="5">{t('year5')}</option>
                            </select>
                        </div>
                        <div>
                            <label>{t('durationMinutes')}</label>
                            <input
                                type="number"
                                name="duration"
                                value={examData.duration}
                                onChange={handleExamChange}
                                style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '5px', border: '1px solid #ddd' }}
                            />
                        </div>
                        <div>
                            <label>{t('currentStatus')}</label>
                            <div style={{ padding: '10px', marginTop: '5px', backgroundColor: '#fef3c7', color: '#92400e', borderRadius: '5px', fontSize: '14px', fontWeight: 'bold' }}>
                                📨 {t('willBeSentToAdmin')}
                            </div>
                        </div>
                    </div>
                </div>

                <h3>{t('questions')}</h3>
                {questions.map((q, qIndex) => (
                    <div key={qIndex} style={{
                        backgroundColor: 'white',
                        padding: '25px',
                        borderRadius: '10px',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                        marginBottom: '20px',
                        borderLeft: '5px solid #3b82f6',
                        position: 'relative'
                    }}>
                        <div style={{ position: 'absolute', top: '15px', right: '15px', display: 'flex', gap: '10px' }}>
                            <div style={{ fontSize: '14px', color: '#64748b', padding: '5px', backgroundColor: '#f1f5f9', borderRadius: '5px' }}>
                                {t('marks')}:
                                <input
                                    type="number"
                                    value={q.marks}
                                    onChange={(e) => handleQuestionChange(qIndex, 'marks', parseInt(e.target.value))}
                                    style={{ width: '40px', marginLeft: '5px', border: '1px solid #cbd5e1', borderRadius: '3px', padding: '2px' }}
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => removeQuestion(qIndex)}
                                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                                ✕
                            </button>
                        </div>

                        <div style={{ marginBottom: '15px', paddingRight: '100px' }}>
                            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>{t('question')} {qIndex + 1}</label>
                            <textarea
                                value={q.questionText}
                                onChange={(e) => handleQuestionChange(qIndex, 'questionText', e.target.value)}
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', minHeight: '80px', fontFamily: 'inherit' }}
                                placeholder={t('enterQuestionPlaceholder')}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            {q.options.map((opt, oIndex) => (
                                <div key={oIndex} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    backgroundColor: q.correctAnswerIndex === oIndex ? '#f0fdf4' : 'transparent',
                                    padding: '5px',
                                    borderRadius: '8px',
                                    border: q.correctAnswerIndex === oIndex ? '1px solid #10b981' : '1px solid transparent'
                                }}>
                                    <div
                                        onClick={() => setCorrectOption(qIndex, oIndex)}
                                        style={{
                                            width: '24px',
                                            height: '24px',
                                            borderRadius: '50%',
                                            border: q.correctAnswerIndex === oIndex ? '6px solid #10b981' : '2px solid #cbd5e1',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0
                                        }}
                                        title={t('clickToMarkCorrect')}
                                    />
                                    <input
                                        type="text"
                                        value={opt}
                                        onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                                        style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                        placeholder={`${t('option')} ${String.fromCharCode(65 + oIndex)}`}
                                    />
                                </div>
                            ))}
                        </div>

                        <div style={{ marginTop: '10px', fontSize: '13px', color: '#64748b', textAlign: 'right' }}>
                            * {t('clickCircleToSelectCorrect')}
                        </div>
                    </div>
                ))}

                <div style={{ display: 'flex', gap: '15px', marginTop: '20px', marginBottom: '50px' }}>
                    <button
                        type="button"
                        onClick={addQuestion}
                        style={{ flex: 1, padding: '15px', backgroundColor: '#f1f5f9', color: '#1e293b', border: '1px dashed #cbd5e1', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        + {t('addAnotherQuestion')}
                    </button>
                    <button
                        type="submit"
                        style={{ flex: 1, padding: '15px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}
                    >
                        {t('createExam')} 🚀
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateExam;
