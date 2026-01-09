const express = require('express');
const router = express.Router();
const models = require('../models');
const { Exam, Question, ExamAttempt, Student } = models;
const auth = require('../middleware/auth');

// @route   POST api/exams/create
// @desc    Create a new exam (Teacher only)
router.post('/create', auth, async (req, res) => {
    try {
        if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied' });
        }

        const { title, description, courseCode, courseName, duration, academicYear, semester, targetYear } = req.body;

        const exam = await Exam.create({
            title,
            description,
            courseCode,
            courseName,
            teacherId: req.user.id,
            duration,
            academicYear,
            semester,
            targetYear: targetYear || '1',
            status: 'pending_admin'
        });

        res.json(exam);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/exams/pending
// @desc    Get exams pending admin approval
router.get('/pending', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied' });
        }

        const exams = await Exam.findAll({
            where: { status: 'pending_admin' },
            include: [{ model: models.Teacher, as: 'teacher', attributes: ['name'] }]
        });

        res.json(exams);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/exams/:id/publish
// @desc    Admin publishes exam and sets entry code
router.post('/:id/publish', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied' });
        }

        const { entryCode } = req.body;
        if (!entryCode) return res.status(400).json({ msg: 'Entry code is required' });

        const exam = await Exam.findByPk(req.params.id);
        if (!exam) return res.status(404).json({ msg: 'Exam not found' });

        await Exam.update({
            status: 'published',
            entryCode: entryCode
        }, {
            where: { id: req.params.id }
        });

        res.json({ msg: 'Exam published successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/exams/:id/questions
// @desc    Add questions to an exam
router.post('/:id/questions', auth, async (req, res) => {
    try {
        const exam = await Exam.findByPk(req.params.id);
        if (!exam) return res.status(404).json({ msg: 'Exam not found' });

        if (exam.teacherId !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Not authorized' });
        }

        const { questions } = req.body;

        const questionDocs = questions.map(q => ({
            ...q,
            examId: req.params.id
        }));

        await Question.bulkCreate(questionDocs);
        res.json({ msg: 'Questions added successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/exams/available
// @desc    Get available exams for students based on their year
router.get('/available', auth, async (req, res) => {
    try {
        if (req.user.role !== 'student') {
            return res.status(403).json({ msg: 'Only students can take exams' });
        }

        const student = await Student.findOne({ where: { studentId: req.user.studentId } });

        const exams = await Exam.findAll({
            where: {
                status: 'published',
                targetYear: student ? student.year : '1'
            }
        });

        res.json(exams);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/exams/:id/start
// @desc    Start an exam attempt (Requires Secret Code)
router.post('/:id/start', auth, async (req, res) => {
    try {
        const { entryCode } = req.body;
        const exam = await Exam.findByPk(req.params.id);

        if (!exam || exam.status !== 'published') {
            return res.status(404).json({ msg: 'Exam not available' });
        }

        // Validate Entry Code
        if (exam.entryCode !== entryCode) {
            return res.status(403).json({ msg: 'Invalid secret entry code' });
        }

        const existingAttempt = await ExamAttempt.findOne({
            where: { examId: req.params.id, studentId: req.user.studentId, status: 'submitted' }
        });
        if (existingAttempt) {
            return res.status(400).json({ msg: 'You have already submitted this exam' });
        }

        let attempt = await ExamAttempt.findOne({
            where: { examId: req.params.id, studentId: req.user.studentId, status: 'started' }
        });

        if (!attempt) {
            attempt = await ExamAttempt.create({
                examId: req.params.id,
                studentId: req.user.studentId,
                status: 'started',
                startTime: new Date()
            });
        }

        const questions = await Question.findAll({
            where: { examId: req.params.id },
            attributes: ['id', 'questionText', 'questionType', 'options', 'marks', 'order'],
            order: [['order', 'ASC']]
        });

        res.json({ attempt, questions });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/exams/attempt/:attemptId/save-answer
router.post('/attempt/:attemptId/save-answer', auth, async (req, res) => {
    try {
        const { questionId, answer, nextIndex } = req.body;
        const attempt = await ExamAttempt.findByPk(req.params.attemptId);

        if (!attempt || attempt.studentId !== req.user.studentId) {
            return res.status(403).json({ msg: 'Unauthorized' });
        }

        const currentAnswers = attempt.answers || {};
        currentAnswers[questionId] = answer;

        await ExamAttempt.update({
            answers: currentAnswers,
            currentQuestionIndex: nextIndex !== undefined ? nextIndex : attempt.currentQuestionIndex
        }, {
            where: { id: req.params.attemptId }
        });

        res.json({ success: true });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/exams/attempt/:attemptId/submit
router.post('/attempt/:attemptId/submit', auth, async (req, res) => {
    try {
        const attempt = await ExamAttempt.findByPk(req.params.attemptId);
        if (!attempt || attempt.studentId !== req.user.studentId) {
            return res.status(403).json({ msg: 'Unauthorized' });
        }

        const { GoogleGenerativeAI } = require("@google/generative-ai");

        // Initialize Gemini (Replace with your actual key or use env var)
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "YOUR_GEMINI_API_KEY");

        const questions = await Question.findAll({ where: { examId: attempt.examId } });
        const studentAnswers = attempt.answers || {};
        let totalScore = 0;

        // Prepare data for AI analysis (only for wrong answers to save tokens/time)
        const wrongAnswersForAI = [];

        const results = questions.map(q => {
            const isCorrect = studentAnswers[q.id] === q.correctAnswer;
            if (isCorrect) totalScore += q.marks;

            const resultItem = {
                questionId: q.id,
                questionText: q.questionText,
                options: q.options,
                selectedAnswer: studentAnswers[q.id] || null,
                correctAnswer: q.correctAnswer,
                isCorrect,
                marks: q.marks,
                explanation: null // Placeholder for AI explanation
            };

            if (!isCorrect && studentAnswers[q.id]) {
                wrongAnswersForAI.push({
                    id: q.id,
                    question: q.questionText,
                    studentAnswer: studentAnswers[q.id],
                    correctAnswer: q.correctAnswer
                });
            }

            return resultItem;
        });

        // Call Gemini AI for explanations
        if (wrongAnswersForAI.length > 0) {
            try {
                const model = genAI.getGenerativeModel({ model: "gemini-pro" });
                const prompt = `You are a helpful university tutor. A student just finished an exam. 
                For each of the following incorrect answers, provide a BRIEF (1-2 sentences) explanation of why their answer is wrong and why the correct answer is right.
                
                Return the response as a JSON object where keys are the Question IDs and values are the explanations.
                
                Questions to analyze:
                ${JSON.stringify(wrongAnswersForAI)}`;

                const result = await model.generateContent(prompt);
                const response = await result.response;
                const text = response.text();

                // Parse JSON from AI response (handle potential markdown formatting)
                const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
                const aiExplanations = JSON.parse(jsonString);

                // Merge explanations back into results
                results.forEach(r => {
                    if (aiExplanations[r.questionId]) {
                        r.explanation = aiExplanations[r.questionId];
                    }
                });

            } catch (aiError) {
                console.error("AI Generation Error:", aiError);
                // Fail gracefully - continue without explanations
            }
        }

        await ExamAttempt.update({
            status: 'submitted',
            endTime: new Date(),
            score: totalScore
        }, {
            where: { id: req.params.attemptId }
        });

        res.json({
            msg: 'Exam submitted successfully',
            score: totalScore,
            results
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;