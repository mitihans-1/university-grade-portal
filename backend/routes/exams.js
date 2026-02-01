const express = require('express');
const router = express.Router();
const models = require('../models');
const { Exam, Question, ExamAttempt, Student, Notification } = models;
const { Op } = require('sequelize');
const auth = require('../middleware/auth');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const fs = require('fs');
const pdf = require('pdf-parse');

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

// @route   POST api/exams/generate-ai
// @desc    Generate exam questions using AI (Teacher only)
router.post('/generate-ai', auth, upload.single('file'), async (req, res) => {
    try {
        if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied' });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY') {
            return res.status(400).json({
                msg: 'Gemini API Key is missing. Please add GEMINI_API_KEY to your backend/.env file to use this feature.'
            });
        }

        const { topic, subject, count, difficulty } = req.body;
        let fileContent = "";

        if (req.file) {
            try {
                const dataBuffer = fs.readFileSync(req.file.path);
                if (req.file.mimetype === 'application/pdf') {
                    const pdfData = await pdf(dataBuffer);
                    fileContent = pdfData.text;
                } else {
                    fileContent = dataBuffer.toString();
                }

                // OPTIMIZATION: Limit text to avoid quota exhaustion (Approx 10k chars)
                if (fileContent.length > 10000) {
                    fileContent = fileContent.substring(0, 10000) + "... (text truncated for AI efficiency)";
                }

                // Clean up temp file
                fs.unlinkSync(req.file.path);
            } catch (fileErr) {
                console.error("File processing error:", fileErr);
            }
        }

        if (!topic && !fileContent) {
            return res.status(400).json({ msg: 'Please provide an exam topic or upload a file' });
        }

        const { GoogleGenerativeAI } = require("@google/generative-ai");
        const genAI = new GoogleGenerativeAI(apiKey);

        // Reverting to 2.0-flash-lite which is available on your specific API key list
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

        const prompt = `You are an expert academic examiner. Generate exactly ${count || 5} high-quality university-level multiple choice questions.
        
        CONTEXT:
        Subject: ${subject || 'General'}
        Topic: ${topic || 'Based on provided document'}
        Difficulty: ${difficulty || 'intermediate'}
        ${fileContent ? `DOCUMENT CONTENT:\n${fileContent}\n` : ''}
        
        REQUIREMENTS:
        - Each question must have exactly 4 distinct options.
        - One option MUST be clearly correct.
        - Marks should be 1 per question.
        ${fileContent ? '- Questions MUST be based on the provided DOCUMENT CONTENT.' : ''}
        
        OUTPUT FORMAT (Strict JSON Array):
        [
          {
            "questionText": "...",
            "options": ["A", "B", "C", "D"],
            "correctAnswerIndex": 0,
            "marks": 1,
            "explanation": "Brief explanation of why the answer is correct"
          }
        ]
        
        Return ONLY the raw JSON array. No conversational text, no markdown blocks.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Robust JSON extraction
        let jsonString = text.trim();
        if (jsonString.includes('```')) {
            const matches = jsonString.match(/\[[\s\S]*\]/);
            if (matches) jsonString = matches[0];
        }

        const questions = JSON.parse(jsonString);
        res.json(questions);
    } catch (err) {
        console.error('AI Generation Error:', err);

        if (err.message?.includes('429') || err.message?.includes('quota')) {
            return res.status(429).json({
                msg: 'The AI is currently busy or the quota is exhausted (Rate Limit). Please wait about 60 seconds and try again.'
            });
        }

        res.status(500).json({
            msg: 'Failed to generate questions with AI: ' + err.message
        });
    }
});

// @route   GET api/exams/pending
// @desc    Get exams pending admin approval
router.get('/pending', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied' });
        }

        const { Op } = require('sequelize');
        const exams = await Exam.findAll({
            where: {
                status: { [Op.in]: ['pending_admin', 'published', 'active'] }
            },
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

// @route   DELETE api/exams/:id
// @desc    Delete an exam
router.delete('/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied' });
        }
        await Exam.destroy({ where: { id: req.params.id } });
        res.json({ msg: 'Exam deleted successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/exams/:id/stop
// @desc    Stop/End an active exam immediately
router.post('/:id/stop', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied' });
        }
        const exam = await Exam.findByPk(req.params.id);
        if (!exam) return res.status(404).json({ msg: 'Exam not found' });

        await Exam.update({ status: 'ended', endTime: new Date() }, { where: { id: req.params.id } });
        res.json({ msg: 'Exam stopped successfully.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/exams/:id/add-time
// @desc    Add extra time to an exam
router.put('/:id/add-time', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied' });
        }
        const { minutes } = req.body;
        const exam = await Exam.findByPk(req.params.id);

        if (!exam) return res.status(404).json({ msg: 'Exam not found' });

        if (exam.status === 'active' && exam.endTime) {
            // Extend the active end time
            const newEndTime = new Date(new Date(exam.endTime).getTime() + minutes * 60000);
            await Exam.update({ endTime: newEndTime }, { where: { id: req.params.id } });
            res.json({ msg: `Added ${minutes} minutes to official timer.` });
        } else {
            // Just extend the duration setting
            await Exam.update({ duration: exam.duration + parseInt(minutes) }, { where: { id: req.params.id } });
            res.json({ msg: `Extended exam duration by ${minutes} minutes.` });
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/exams/:id/notify-code
// @desc    Admin sends secret code to students via notification
router.post('/:id/notify-code', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied' });
        }

        const exam = await Exam.findByPk(req.params.id);
        if (!exam) return res.status(404).json({ msg: 'Exam not found' });
        if (!exam.entryCode) return res.status(400).json({ msg: 'No entry code set for this exam. Please publish it first.' });

        console.log(`Sending code for Exam: ${exam.title}, Target Year: ${exam.targetYear}`);

        // Find all students in the target year (explicitly cast to Number just in case)
        const targetYearNum = parseInt(exam.targetYear);
        const students = await Student.findAll({
            where: { year: targetYearNum }
        });

        console.log(`Found ${students.length} students in Year ${targetYearNum}`);

        // 1. Create notifications for students
        const studentNotifications = [];
        let alreadyNotifiedCount = 0;

        for (const student of students) {
            // Check for existing notification to prevent duplicates for this specific exam
            const existing = await models.Notification.findOne({
                where: {
                    studentId: student.studentId,
                    type: 'exam_code',
                    title: { [Op.like]: `%${exam.courseName}%` }
                }
            });

            if (!existing) {
                studentNotifications.push({
                    studentId: student.studentId,
                    type: 'exam_code',
                    title: `🔓 Exam Code: ${exam.courseName}`,
                    message: `The secret code to start your "${exam.title}" exam in ${exam.courseName} is: ${exam.entryCode}. You can now use this code to enter the exam session.`,
                    sentVia: 'push',
                    date: new Date(),
                    is_read: false
                });
            } else {
                alreadyNotifiedCount++;
            }
        }

        if (studentNotifications.length > 0) {
            await models.Notification.bulkCreate(studentNotifications);
            console.log(`Bulk created ${studentNotifications.length} student notifications.`);
        }

        const msg = studentNotifications.length > 0
            ? `Secret code sent to ${studentNotifications.length} students!`
            : alreadyNotifiedCount > 0
                ? `Code was already sent to all ${alreadyNotifiedCount} students.`
                : `No students found for Year ${targetYearNum}.`;

        res.json({ msg });
    } catch (err) {
        console.error('Error in notify-code:', err);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/exams/:id/request-code
// @desc    Student requests the exam code for themselves
router.post('/:id/request-code', auth, async (req, res) => {
    try {
        if (req.user.role !== 'student') {
            return res.status(403).json({ msg: 'Access denied' });
        }

        const exam = await Exam.findByPk(req.params.id);
        if (!exam) return res.status(404).json({ msg: 'Exam not found' });
        if (!exam.entryCode) return res.status(400).json({ msg: 'No entry code set for this exam.' });

        // Logic to send notification ONLY to this requesting student
        // Check for existing first to avoid duplicate spam
        const existing = await models.Notification.findOne({
            where: {
                studentId: req.user.studentId,
                type: 'exam_code',
                title: { [Op.like]: `%${exam.courseName}%` }
            }
        });

        if (!existing) {
            await models.Notification.create({
                studentId: req.user.studentId,
                type: 'exam_code',
                title: `🔓 Exam Code: ${exam.courseName}`,
                message: `The secret code to start your "${exam.title}" exam in ${exam.courseName} is: ${exam.entryCode}. You can now use this code to enter the exam session.`,
                sentVia: 'push',
                date: new Date(),
                is_read: false
            });
            return res.json({ msg: 'Code sent to your notifications!' });
        } else {
            return res.json({ msg: 'Code was already sent to your notifications.' });
        }

    } catch (err) {
        console.error('Error in request-code:', err);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/exams/:id/start-global
// @desc    Admin triggers the official countdown for all students
router.post('/:id/start-global', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied' });
        }

        const exam = await Exam.findByPk(req.params.id);
        if (!exam) return res.status(404).json({ msg: 'Exam not found' });

        const startTime = new Date();
        const endTime = new Date(startTime.getTime() + exam.duration * 60000);

        await Exam.update({
            status: 'active',
            startTime: startTime,
            endTime: endTime
        }, {
            where: { id: req.params.id }
        });

        res.json({ msg: 'Exam started! Countdown is now live for all students.', startTime, endTime });
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

        const { Op } = require('sequelize');
        const exams = await Exam.findAll({
            where: {
                status: { [Op.in]: ['published', 'active'] },
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

        if (!exam || (exam.status !== 'published' && exam.status !== 'active')) {
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
                const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
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

        // NOTIFICATION LOGIC: Send results to Parent
        try {
            const { sendExamResultNotification } = require('../utils/notifier');
            const exam = await Exam.findByPk(attempt.examId);
            const student = await Student.findOne({ where: { studentId: attempt.studentId } });
            const maxScore = questions.reduce((sum, q) => sum + q.marks, 0);

            // Find for linked parents
            const links = await models.ParentStudentLink.findAll({
                where: { studentId: attempt.studentId, status: 'approved' },
                include: [{ model: models.Parent, as: 'parent' }]
            });

            for (const link of links) {
                if (link.parent) {
                    await sendExamResultNotification(
                        link.parent,
                        student.name,
                        exam.title,
                        totalScore,
                        maxScore,
                        results // Pass the detailed results here
                    );
                }
            }
        } catch (notifyErr) {
            console.error('Failed to notify parents of exam result:', notifyErr);
        }

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