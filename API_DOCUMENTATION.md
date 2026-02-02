# University Grade Portal - Detailed Feature Documentation

This document consolidates workflow guides and feature specifications into a single reference.

---

## 📚 Table of Contents
1. [Teacher-Admin Grade Approval Workflow](#1-teacher-admin-grade-approval-workflow)
2. [Family Monitoring Features](#2-family-monitoring-features)
3. [Teacher Assignment System](#3-teacher-assignment-system)
4. [Role-Based Workflows](#4-role-based-workflows)
5. [Data Integrity & Cleanup Systems](#5-data-integrity--cleanup-systems)
7. [Online Exam System](#7-online-exam-system)
8. [Performance & Caching](#8-performance--caching)


---

## 1. Teacher-Admin Grade Approval Workflow

This system enforces a security layer where teachers cannot mistakenly publish grades directly to students.

### The Problem
- Previously, teachers could upload grades that went directly to "published" status.
- There was no quality control or review process.

### The Solution Workflow
`Teacher Uploads Grade` → `Pending Status` → `Admin Reviews` → `Approved/Rejected`

### Detailed Steps

#### Step 1: Teacher Uploads Grade
- **Action**: Teacher uses "Single Entry" or "Bulk Upload" form.
- **System**: Saves grade with `status = 'pending_approval'`.
- **Result**: Grade is NOT visible to students or parents.

#### Step 2: Admin Reviews
- **Action**: Admin navigates to **Grade Approvals** page.
- **View**: Admin sees a list of pending grades grouped by teacher/course.
- **Review**: Admin checks for anomalies (e.g., too many F's, wrong semester).

#### Step 3: Approval or Rejection
- **Approve**: Status becomes `published`. Notifications are sent to parents/students.
- **Reject**: Status becomes `rejected`. Teacher sees this status and can resubmit.

---

## 2. Family Monitoring Features

Designed to bridge the gap for students studying away from home.

### 🎯 Key Features

#### Real-Time Alerts
- **Critical (🔴)**: Failing grades (< 50%).
- **Warning (🟠)**: Low grades (< 60%).
- **Unread Badge**: Red badge on the dashboard indicates new academic alerts.

#### Analytics Dashboard
- **GPA Tracking**: Real-time GPA calculation across all semesters.
- **Risk Assessment**:
    - **High Risk**: Multiple failing grades.
    - **Low Risk**: Consistent good performance.
- **Visuals**: Grade distribution charts (A vs B vs C).

#### Official Reports
- **Transcripts**: Generate full academic history in a print-friendly format.
- **Semester Reports**: Breakdown of specific term performance.

### Privacy & Security
- Parents can ONLY see data for students they have securely linked via **Student ID**.
- Links require **Admin Approval** before data is shared.

---

## 3. Teacher Assignment System

Support for teachers instructing across multiple departments.

### Overview
A teacher is no longer bound to a single "Department" string. They can have multiple active assignments.

### Data Model
**One Teacher** → **Many Assignments**
- Assignment 1: `CS101` (Computer Science, Year 1)
- Assignment 2: `MATH202` (Mathematics, Year 2)

### Admin Usage
- Admins can "Bulk Assign" a teacher to multiple classes at once via the API or Admin Dashboard.
- Example: Dr. Smith teaches *Algorithms* (CS Dept) and *Web Dev* (IT Dept).

---

## 4. Role-Based Workflows

### 👨‍🎓 Student
- **Register**: Sign up with Student ID.
- **View**: See "Published" grades only.
- **Action**: Download transcripts.

### 👨‍👩‍👧‍👦 Parent
- **Register**: Sign up and request link to Student ID.
- **Wait**: Link shows "Pending" until Admin approves.
- **Monitor**: Once linked, receive alerts for new grades.

### 👩‍🏫 Teacher
- **Upload**: Submit grades via CSV or Form.
- **Wait**: Grades remain "Pending" until Admin approves.
- **Manage**: View assigned courses across different departments.

### 🛡️ Admin
- **Gatekeeper**:
    - Approve Parent-Student Links.
    - Approve Teacher Grade Submissions.
- **Manager**:
    - Assign teachers to courses.

---

## 5. Data Integrity & Cleanup Systems

### Automatic Orphan Link Cleanup
The system automatically maintains database integrity when parents or students are deleted.

**Feature**: Parent Registration - Automatic Orphan Link Cleanup
- **Problem**: Previously, if a parent was deleted, their "link" to a student remained, preventing new parents from registering for that student.
- **Solution**: The `POST /register` route deals with this automatically.
    - It checks if a student is linked.
    - If linked, it verifies if the parent still exists.
    - If the parent is missing (orphan link), it **auto-deletes** the link and allows the new registration to proceed.

**Deletion Workflows**:
- **Admin Deletes Parent (`DELETE /parents/:id`)**: Automatically removes all associated `ParentStudentLink` records.
- **Admin Deletes Student (`DELETE /students/:id`)**: Automatically removes all `Grade` records and `ParentStudentLink` records associated with that student.

---

## 6. Backend API Endpoints

This is the backend API for the University Grade Portal application, built with Node.js, Express, and MySQL.

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/user` - Get current user data
- `POST /api/auth/logout` - User logout

### Students
- `POST /api/students/register` - Register a new student
- `GET /api/students/:studentId` - Get student by ID
- `GET /api/students/my-grades` - Get logged-in student's grades
- `GET /api/students/:studentId/grades` - Get grades for a specific student

### Parents
- `POST /api/parents/register` - Register a new parent
- `GET /api/parents/me` - Get logged-in parent's details
- `GET /api/parents/pending` - Get all pending parent registrations (admin only)

### Links
- `GET /api/links/pending` - Get all pending parent-student link requests (admin only)
- `GET /api/links/approved` - Get all approved parent-student links (admin only)
- `POST /api/links/approve/:id` - Approve a parent-student link request (admin only)
- `POST /api/links/reject/:id` - Reject a parent-student link request (admin only)
- `POST /api/links/request` - Create a new parent-student link request (parent only)

### Grades
- `POST /api/grades/upload` - Upload grades (admin only)
- `GET /api/grades/student/:studentId` - Get grades for a specific student
- `GET /api/grades/my-grades` - Get grades for logged-in student
- `PUT /api/grades/:id` - Update a grade (admin only)
- `DELETE /api/grades/:id` - Delete a grade (admin only)

### Notifications
- `GET /api/notifications` - Get notifications for logged-in parent
- `GET /api/notifications/unread` - Get unread notifications for logged-in parent
- `PUT /api/notifications/:id/read` - Mark a notification as read
- `PUT /api/notifications/read-all` - Mark all notifications as read

---

## 7. Online Exam System

Secure, real-time exam platform with cheat prevention and role-based access.

### 🔐 Security Architecture
- **Hidden Answers**: Correct answers are stored securely in the database (`questions` table) and **NEVER** sent to the client during the exam.
- **Server-Side Grading**: All answer comparisons happen on the server after submission.
- **Entry Codes**: Exams are protected by a unique secret code set by the Admin.

### 🔄 Exam Flow
1. **Teacher**: Creates exam & selects correct answers (visually) → Saves to DB.
2. **Admin**: Reviews exam → Sets Entry Code → Publishes.
3. **Student**: Enters Code → Takes Exam (Simulated Timer) → Submits.
4. **System**: Compares answers → Calculates Score → Notifies Student/Parent.

### 🌐 Exam API Endpoints
- `POST /api/exams/create` - Create new exam (Teacher)
- `POST /api/exams/:id/publish` - Publish exam & set code (Admin)
- `POST /api/exams/:id/start` - Start attempt (Student)
- `POST /api/exams/attempt/:id/save-answer` - Auto-save answer (Student)
- `POST /api/exams/attempt/:id/submit` - Submit & Grade (Student)
- `GET /api/exams/:id/preview` - Preview exam content (Admin/Teacher)

---

## 8. Performance & Caching

System-wide optimizations for speed and scalability.

### 🚀 Caching Strategy
- **Dashboard Stats**: The `/api/stats/dashboard` endpoint uses an in-memory cache with a **30-second TTL**.
    - **Hit**: Returns cached JSON instantly (< 50ms).
    - **Miss**: Queries DB, aggregates data, caches result, returns JSON (~2000ms).
- **Client-Side**: Language preference is persisted in `localStorage` to prevent style recalculations on refetch.

### ⚡ Optimization Features
- **Parallel Queries**: Dashboard endpoints use `Promise.all` to fetch unrelated data concurrently.
- **Request Cancellation**: Frontend uses `AbortController` to cancel stale requests when navigating away.
- **Lazy Loading**: Exam questions are fetched only when the exam starts, not during listing.

---

*Last Updated: 2026-02-02*
