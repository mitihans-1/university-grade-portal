# Online Exam System - Answer Storage & Comparison Flow

## 📚 **Complete System Flow**

### **Database Schema**

The system uses 3 main tables:

1. **`exams`** - Stores exam metadata
2. **`questions`** - Stores questions with **correct answers** (hidden from students)
3. **`exam_attempts`** - Stores student answers and scores

---

## 🔄 **Step-by-Step Flow**

### **PHASE 1: Teacher Creates Exam** 🧑‍🏫

```
Teacher → Creates Exam → Backend stores in database
```

**What Happens:**
1. Teacher creates exam with title, course, duration
2. Teacher adds questions (manually or AI-generated)
3. **Each question stores:**
   - `questionText`: "What is 2+2?"
   - `options`: ["2", "3", "4", "5"]
   - `correctAnswer`: "4" ← **STORED IN DATABASE**
   - `marks`: 1

**Database Storage (questions table):**
```javascript
{
  id: 1,
  examId: 5,
  questionText: "What is the capital of France?",
  options: ["London", "Paris", "Berlin", "Madrid"],
  correctAnswer: "Paris",  // ← CORRECT ANSWER STORED HERE
  marks: 1
}
```

---

### **PHASE 2: Admin Publishes Exam** 👨‍💼

```
Admin → Sets Entry Code → Publishes → Sends Code to Students
```

**What Happens:**
1. Admin reviews exam
2. Sets secret entry code (e.g., "EXAM2024")
3. Changes status to "published"
4. Sends code to target year students via notifications

---

### **PHASE 3: Student Takes Exam** 🎓

#### **3.1 Student Starts Exam**

```
Student → Enters Code → Backend Validates → Returns Questions
```

**Backend Code (Line 500-575):**
```javascript
// Student requests to start exam
POST /api/exams/:id/start

// Backend checks:
1. Is entry code correct? ✓
2. Has student already submitted? ✓
3. Create or resume attempt

// IMPORTANT: Questions sent WITHOUT correct answers!
const questions = await Question.findAll({
  where: { examId: req.params.id },
  attributes: ['id', 'questionText', 'options', 'marks'], 
  // ❌ correctAnswer is EXCLUDED - student cannot see it!
});
```

**What Student Receives:**
```javascript
{
  attempt: { id: 123, examId: 5, studentId: "S001", status: "started" },
  questions: [
    {
      id: 1,
      questionText: "What is the capital of France?",
      options: ["London", "Paris", "Berlin", "Madrid"],
      marks: 1
      // ❌ NO correctAnswer field - hidden from student!
    }
  ]
}
```

#### **3.2 Student Answers Questions**

```
Student Selects Answer → Frontend Saves → Backend Stores in exam_attempts
```

**Backend Code (Line 577-602):**
```javascript
POST /api/exams/attempt/:attemptId/save-answer

// Student submits answer
{
  questionId: 1,
  answer: "Paris"  // Student's selected answer
}

// Backend stores in exam_attempts table
const currentAnswers = attempt.answers || {};
currentAnswers[questionId] = answer;  // { "1": "Paris", "2": "Berlin", ... }

await ExamAttempt.update({
  answers: currentAnswers  // Stored as JSON: {"1": "Paris", "2": "Berlin"}
});
```

**Database Storage (exam_attempts table):**
```javascript
{
  id: 123,
  examId: 5,
  studentId: "S001",
  status: "started",
  answers: {
    "1": "Paris",      // Student's answer to question 1
    "2": "Berlin",     // Student's answer to question 2
    "3": "Madrid"      // Student's answer to question 3
  },
  score: null  // Not calculated yet
}
```

---

### **PHASE 4: Student Submits Exam** ✅

```
Student Clicks Submit → Backend Compares Answers → Calculates Score
```

**Backend Code (Line 604-730):**
```javascript
POST /api/exams/attempt/:attemptId/submit

// 1. Fetch all questions WITH correct answers
const questions = await Question.findAll({ 
  where: { examId: attempt.examId } 
});

// 2. Get student's answers from exam_attempts table
const studentAnswers = attempt.answers;  // {"1": "Paris", "2": "Berlin", ...}

// 3. COMPARE each answer
let totalScore = 0;
const results = questions.map(q => {
  const isCorrect = studentAnswers[q.id] === q.correctAnswer;
  //                ↑ Student Answer      ↑ Stored Correct Answer
  
  if (isCorrect) {
    totalScore += q.marks;  // Add marks if correct
  }
  
  return {
    questionId: q.id,
    questionText: q.questionText,
    selectedAnswer: studentAnswers[q.id],  // What student chose
    correctAnswer: q.correctAnswer,         // What was correct
    isCorrect: isCorrect,                   // true/false
    marks: q.marks
  };
});

// 4. Save final score
await ExamAttempt.update({
  status: 'submitted',
  endTime: new Date(),
  score: totalScore  // Final score saved
}, {
  where: { id: attemptId }
});

// 5. Return results to student
res.json({
  score: totalScore,
  results: results  // Now includes correct answers for review
});
```

---

## 🔍 **Answer Comparison Logic**

### **How Comparison Works:**

```javascript
// Example Question:
{
  id: 1,
  questionText: "What is 2+2?",
  options: ["2", "3", "4", "5"],
  correctAnswer: "4"  // ← Stored in questions table
}

// Student's Answer (stored in exam_attempts):
studentAnswers = {
  "1": "4"  // ← Student selected "4"
}

// Comparison:
const isCorrect = studentAnswers["1"] === "4";  // true
//                ↑ Student's answer    ↑ Correct answer from DB

if (isCorrect) {
  totalScore += 1;  // Add marks
}
```

---

## 📊 **Data Flow Diagram**

```
┌─────────────────────────────────────────────────────────────┐
│                    EXAM CREATION PHASE                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  questions table │
                    ├──────────────────┤
                    │ id: 1            │
                    │ questionText: ?  │
                    │ options: [...]   │
                    │ correctAnswer: X │ ← CORRECT ANSWER STORED
                    │ marks: 1         │
                    └──────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    STUDENT TAKES EXAM                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Student sees:    │
                    ├──────────────────┤
                    │ questionText: ?  │
                    │ options: [...]   │
                    │ ❌ NO correctAnswer│ ← HIDDEN FROM STUDENT
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Student selects  │
                    │ answer: "Paris"  │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ exam_attempts    │
                    ├──────────────────┤
                    │ id: 123          │
                    │ studentId: S001  │
                    │ answers: {       │
                    │   "1": "Paris"   │ ← STUDENT ANSWER STORED
                    │ }                │
                    │ score: null      │
                    └──────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    SUBMISSION & GRADING                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Backend fetches: │
                    ├──────────────────┤
                    │ 1. questions     │ ← correctAnswer: "Paris"
                    │ 2. exam_attempts │ ← studentAnswer: "Paris"
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ COMPARISON:      │
                    │ "Paris" === ?    │
                    │ "Paris" ✓        │
                    │ isCorrect: true  │
                    │ score += 1       │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ exam_attempts    │
                    ├──────────────────┤
                    │ status: submitted│
                    │ score: 8/10      │ ← FINAL SCORE SAVED
                    │ endTime: ...     │
                    └──────────────────┘
```

---

## 🔐 **Security Features**

### **1. Correct Answers Hidden During Exam**
```javascript
// When student takes exam (Line 564-568):
attributes: ['id', 'questionText', 'options', 'marks']
// ❌ correctAnswer is EXCLUDED - student cannot see it!
```

### **2. Answers Stored Separately**
- **Correct answers** → `questions` table
- **Student answers** → `exam_attempts` table
- They never mix until submission

### **3. Comparison Happens Server-Side**
- Student cannot manipulate comparison
- All grading logic runs on backend
- Results calculated after submission

---

## 💡 **Key Points**

1. **Correct answers are stored in `questions` table** when teacher creates exam
2. **Student NEVER sees correct answers** during the exam
3. **Student answers are stored in `exam_attempts.answers`** as JSON object
4. **On submission, backend compares:**
   ```javascript
   studentAnswers[questionId] === question.correctAnswer
   ```
5. **Score is calculated** by counting correct answers
6. **Results are returned** with both student and correct answers for review

---

## 📝 **Example Complete Flow**

```javascript
// 1. TEACHER CREATES QUESTION
Question.create({
  questionText: "What is 2+2?",
  options: ["2", "3", "4", "5"],
  correctAnswer: "4"  // ← Stored in database
});

// 2. STUDENT TAKES EXAM
// Receives: { questionText: "What is 2+2?", options: [...] }
// ❌ Does NOT receive: correctAnswer

// 3. STUDENT ANSWERS
ExamAttempt.update({
  answers: { "1": "4" }  // ← Student's answer stored
});

// 4. STUDENT SUBMITS
const isCorrect = "4" === "4";  // Compare
//                ↑ Student  ↑ Correct (from DB)
if (isCorrect) score += 1;

// 5. RESULT
{
  selectedAnswer: "4",
  correctAnswer: "4",
  isCorrect: true,
  marks: 1
}
```

---

## 🎯 **Summary**

| Phase | Correct Answer Location | Student Answer Location | Visible to Student? |
|-------|------------------------|------------------------|-------------------|
| **Creation** | `questions.correctAnswer` | N/A | ❌ No |
| **Taking Exam** | `questions.correctAnswer` | N/A | ❌ No |
| **Answering** | `questions.correctAnswer` | `exam_attempts.answers` | ❌ No |
| **Submission** | `questions.correctAnswer` | `exam_attempts.answers` | ✅ Yes (for review) |

**The correct answer is ALWAYS in the database, NEVER sent to the student until after submission!**
