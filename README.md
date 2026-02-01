# University Grade Portal 🎓

A comprehensive academic management system designed to bridge the communication gap between universities, students, and parents. This platform allows for secure grade tracking, attendance monitoring, and real-time updates for families.

## 🚀 Features

### 👨‍👩‍👧‍👦 For Parents
- **Real-time Grade Monitoring**: View your child's grades as soon as they are published.
- **Secure Linking**: Securely link one or more students to your account using valid Student IDs.
- **Notifications**: Receive instant Email and SMS alerts (optional) for new grades or academic warnings.
- **Attendance Tracking**: Monitor your child's class attendance.

### 👨‍🎓 For Students
- **Grade Dashboard**: Access your complete academic history and current semester grades.
- **GPA Calculation**: View calculated GPA and academic standing.
- **Resources**: Access course materials and assignments.
- **Schedule**: View class schedules and exam timetables.

### 👩‍🏫 For Teachers
- **Grade Submission**: Upload grades individually or via **Bulk CSV/Excel Upload**.
- **Assignments**: Create and manage assignments for your courses.
- **Class Management**: View student lists and manage attendance.

### 🛡️ For Administrators
- **User Management**: Manage Students, Teachers, and Parents.
- **Grade Approval**: Review and approve grades submitted by teachers before they go live.
- **System Settings**: Configure semester dates, grading scales, and school information.
- **Analytics**: View institution-wide performance metrics.

---

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL (via Sequelize ORM)
- **Authentication**: JWT (JSON Web Tokens)
- **Real-time**: Socket.io
- **Utilities**: Multer (File Uploads), PDFKit (Reports), Nodemailer (Emails), Tesseract.js (OCR)

### Frontend
- **Framework**: React (Vite)
- **Styling**: Vanilla CSS, Lucide React (Icons)
- **Routing**: React Router DOM v6
- **Visualization**: Recharts
- **State Management**: Context API

---

## ⚙️ Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MySQL Server (e.g., XAMPP, MySQL Workbench)
- Git

### 1. Database Setup
1. Start your MySQL server.
2. Create a new database named `university_portal` (or update `config/database.js` to match yours).
   ```sql
   CREATE DATABASE university_portal;
   ```

### 2. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `backend` directory (see Configuration section below).
4. Start the server (this will sync the database models):
   ```bash
   npm run dev
   ```
   *The server runs on `http://localhost:5000` by default.*

### 3. Frontend Setup
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd react-grade
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   *The app runs on `http://localhost:5173` by default.*

---

## 🔐 Configuration

Create a `.env` file in the `backend` folder with the following variables:

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASS=
DB_NAME=university_portal
JWT_SECRET=your_super_secret_jwt_key
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password
CLIENT_URL=http://localhost:5173
```

## 📚 Project Documentation

For in-depth information on specific systems and workflows, refer to our consolidated documentation:

- **[Detailed Feature Documentation (API_DOCUMENTATION.md)](API_DOCUMENTATION.md)**: 
    - 🔒 **Grade Approval Workflow**: Review process for teacher submissions.
    - 👨‍👩‍👧‍👦 **Family Monitoring**: Parent alerts and student risk assessment.
    - 🏫 **Multi-Department System**: Handling teachers with cross-department assignments.
    - 🧹 **Data Integrity**: Automatic cleanup of orphan links and deletion cascades.
    - 🛠️ **Backend API**: Comprehensive list of server endpoints.

---

## 📖 Usage Guide

### Registration Flow
1. **Students**: Register with their Student ID.
2. **Parents**: Register and then "Link" a student using the Student ID.
3. **Teachers**: Register and await Admin approval.

### Grade Upload (Teacher)
1. Log in as a Teacher.
2. Go to **Upload Grades**.
3. Choose **Single Entry** or **Bulk Upload (CSV/Excel)**.
4. If using Bulk Upload, ensure your CSV has columns: `StudentID`, `CourseCode`, `Grade`, `Score`, `Semester`.
5. Submit. Grades will be marked as **Pending Approval**.

### Grade Approval (Admin)
1. Log in as an Admin.
2. Go to **Grade Approvals**.
3. Review pending grades submitted by teachers.
4. Click **Approve & Publish**. Only then will parents/students be notified.

> **Detailed Documentation**: For comprehensive workflows, features, role guides, and data cleanup systems, please see [API_DOCUMENTATION.md](API_DOCUMENTATION.md).

---

## 📁 Project Structure

```
university-grade-portal/
├── backend/                # API Server
│   ├── config/             # DB Config
│   ├── controllers/        # Route Logic
│   ├── models/             # Sequelize Models
│   ├── routes/             # API Endpoints
│   └── uploads/            # File storage
├── react-grade/            # Frontend Client
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── context/        # Auth & Global State
│   │   ├── pages/          # Full Application Pages
│   │   └── utils/          # API helpers
│   └── public/             # Static Assets
└── README.md
```

## 📄 License
This project is proprietary and intended for educational institution use.
