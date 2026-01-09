import React, { useState } from 'react';
import { api } from '../utils/api';
import { useNavigate } from 'react-router-dom';

const CreateExam = () => {
    const navigate = useNavigate();
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (!examData.title || !examData.courseCode) {
                alert('Please fill exam title and course code');
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

            alert('Exam created successfully and sent to Admin for review!');
            navigate('/teacher');
        } catch (error) {
            console.error('Error creating exam:', error);
            alert(error.message || 'Failed to create exam');
        }
    };

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
            <h1 style={{ marginBottom: '30px' }}>🛠️ Professional Exam Creator</h1>

            <form onSubmit={handleSubmit}>
                <div style={{
                    backgroundColor: 'white',
                    padding: '25px',
                    borderRadius: '10px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                    marginBottom: '30px'
                }}>
                    <h3>Exam Details</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
                        <div>
                            <label>Exam Title</label>
                            <input
                                type="text"
                                name="title"
                                value={examData.title}
                                onChange={handleExamChange}
                                style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '5px', border: '1px solid #ddd' }}
                                placeholder="e.g. Advanced Calculus Midterm"
                            />
                        </div>
                        <div>
                            <label>Course Code</label>
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
                            <label>Course Name</label>
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
                            <label>Target Student Year</label>
                            <select
                                name="targetYear"
                                value={examData.targetYear}
                                onChange={handleExamChange}
                                style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '5px', border: '1px solid #ddd' }}
                            >
                                <option value="1">Year 1</option>
                                <option value="2">Year 2</option>
                                <option value="3">Year 3</option>
                                <option value="4">Year 4</option>
                                <option value="5">Year 5</option>
                            </select>
                        </div>
                        <div>
                            <label>Duration (Minutes)</label>
                            <input
                                type="number"
                                name="duration"
                                value={examData.duration}
                                onChange={handleExamChange}
                                style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '5px', border: '1px solid #ddd' }}
                            />
                        </div>
                        <div>
                            <label>Current Status</label>
                            <div style={{ padding: '10px', marginTop: '5px', backgroundColor: '#fef3c7', color: '#92400e', borderRadius: '5px', fontSize: '14px', fontWeight: 'bold' }}>
                                📨 Will be sent to Admin for review
                            </div>
                        </div>
                    </div>
                </div>

                <h3>Questions</h3>
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
                                Marks:
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
                            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Question {qIndex + 1}</label>
                            <textarea
                                value={q.questionText}
                                onChange={(e) => handleQuestionChange(qIndex, 'questionText', e.target.value)}
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', minHeight: '80px', fontFamily: 'inherit' }}
                                placeholder="Enter your question here..."
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
                                        title="Click to mark as correct answer"
                                    />
                                    <input
                                        type="text"
                                        value={opt}
                                        onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                                        style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                        placeholder={`Option ${String.fromCharCode(65 + oIndex)}`}
                                    />
                                </div>
                            ))}
                        </div>

                        <div style={{ marginTop: '10px', fontSize: '13px', color: '#64748b', textAlign: 'right' }}>
                            * Click the circle to select the correct answer
                        </div>
                    </div>
                ))}

                <div style={{ display: 'flex', gap: '15px', marginTop: '20px', marginBottom: '50px' }}>
                    <button
                        type="button"
                        onClick={addQuestion}
                        style={{ flex: 1, padding: '15px', backgroundColor: '#f1f5f9', color: '#1e293b', border: '1px dashed #cbd5e1', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        + Add Another Question
                    </button>
                    <button
                        type="submit"
                        style={{ flex: 1, padding: '15px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}
                    >
                        Create Exam 🚀
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateExam;
