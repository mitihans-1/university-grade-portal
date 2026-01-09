# University Grade Portal - Complete Setup Guide

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MySQL (v5.7 or higher)
- XAMPP (for Windows) or MySQL server

### Step 1: Database Setup

1. Start MySQL server (via XAMPP or standalone)
2. Create the database:
```sql
CREATE DATABASE gradeportal;
```

3. Run the SQL script:
```bash
# Navigate to backend directory
cd backend
mysql -u root -p gradeportal < create_tables.sql
```

Or import `create_tables.sql` via phpMyAdmin.

### Step 2: Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file in `backend/` directory:
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=gradeportal
JWT_SECRET=university_grade_portal_secret_key_change_in_production
```

4. Start the backend server:
```bash
npm run dev
```

Backend will run on `http://localhost:5000`

### Step 3: Frontend Setup

1. Navigate to frontend directory:
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

Frontend will run on `http://localhost:5173` (or another port if 5173 is busy)

### Step 4: Access the Application

1. Open browser and go to `http://localhost:5173`
2. Default admin credentials:
   - Email: `admin@university.edu`
   - Password: `admin`
   - Role: `admin`

## 📁 Project Structure

```
university-grade-portal/
├── backend/
│   ├── config/
│   │   └── db.js              # Database configuration
│   ├── middleware/
│   │   └── auth.js            # JWT authentication middleware
│   ├── models/
│   │   ├── Student.js         # Student model
│   │   ├── Parent.js          # Parent model
│   │   ├── Grade.js           # Grade model
│   │   ├── Notification.js   # Notification model
│   │   └── ParentStudentLink.js
│   ├── routes/
│   │   ├── auth.js            # Authentication routes
│   │   ├── students.js        # Student routes
│   │   ├── parents.js         # Parent routes
│   │   ├── grades.js          # Grade routes
│   │   ├── links.js           # Parent-student link routes
│   │   ├── notifications.js   # Notification routes
│   │   └── stats.js           # Statistics routes
│   ├── uploads/               # File upload directory
│   ├── create_tables.sql      # Database schema
│   ├── server.js              # Express server
│   └── package.json
│
├── react-grade/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── Toast.jsx          # Toast notifications
│   │   │   │   ├── LoadingSpinner.jsx # Loading component
│   │   │   │   └── GradeFilter.jsx    # Grade filtering
│   │   │   ├── auth/
│   │   │   └── dashboard/
│   │   ├── context/
│   │   │   ├── AuthContext.jsx        # Authentication context
│   │   │   └── LanguageContext.jsx    # Multi-language support
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── StudentDashboard.jsx
│   │   │   ├── ParentDashboard.jsx
│   │   │   ├── AdminDashboard.jsx     # NEW: Admin dashboard
│   │   │   ├── AdminUpload.jsx
│   │   │   ├── AdminLinkRequests.jsx
│   │   │   ├── SettingsPage.jsx       # NEW: Settings page
│   │   │   ├── StudentRegistration.jsx
│   │   │   └── ParentRegistration.jsx
│   │   ├── utils/
│   │   │   ├── api.js                 # API utilities
│   │   │   └── exportUtils.js         # NEW: Export functions
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
│
└── README.md
```

## 🔑 User Roles & Access

### Admin
- **Dashboard**: View statistics and quick actions
- **Upload Grades**: Single or bulk CSV upload
- **Manage Links**: Approve/reject parent-student links
- **View All**: Access to all students, parents, and grades

### Student
- **View Grades**: See own grades with GPA calculation
- **Notifications**: View academic notifications
- **Profile**: Update profile and change password
- **Export**: Download/print transcript

### Parent
- **Monitor Child**: View linked child's grades
- **Notifications**: Real-time grade update notifications
- **Contact Advisor**: Send messages to student advisor
- **Profile**: Update profile and change password

## 🎯 Key Features

### ✅ Implemented Features

1. **User Authentication**
   - JWT-based authentication
   - Role-based access control
   - Secure password hashing (bcrypt)

2. **Grade Management**
   - Single grade upload
   - Bulk CSV upload
   - Grade filtering and search
   - Export to CSV
   - Print transcript

3. **Parent-Student Linking**
   - Parent registration with student ID verification
   - Admin approval workflow
   - Automatic notifications

4. **Notifications**
   - Real-time grade update notifications
   - Account approval notifications
   - Toast notification system

5. **Multi-language Support**
   - English
   - Amharic (አማርኛ)
   - Oromo (Oromoo)
   - Somali
   - Tigrinya

6. **Dashboard Features**
   - Statistics overview (Admin)
   - Recent grades display
   - Quick actions
   - GPA calculation

7. **Settings & Profile**
   - Profile update
   - Password change
   - Form validation

## 🔧 Configuration

### Backend Environment Variables

Create `backend/.env`:
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=gradeportal
JWT_SECRET=your_secret_key_here
```

### Frontend API Configuration

Update `react-grade/src/utils/api.js` if backend runs on different port:
```javascript
const API_BASE_URL = 'http://localhost:5000/api';
```

## 📝 Usage Examples

### For Students

1. **Register**: Go to `/student/register`
2. **Login**: Use email and password
3. **View Grades**: See all grades with GPA
4. **Export**: Click export button to download transcript

### For Parents

1. **Register**: Go to `/parent/register`
2. **Verify Student ID**: Enter child's student ID
3. **Wait for Approval**: Admin must approve account
4. **Monitor**: View child's grades and receive notifications

### For Admins

1. **Login**: Use admin credentials
2. **Dashboard**: View statistics and quick actions
3. **Upload Grades**: Single or bulk upload
4. **Manage Links**: Approve parent registrations
5. **View All**: Access all data

## 🐛 Troubleshooting

### Database Connection Issues

1. Check MySQL is running
2. Verify database credentials in `.env`
3. Ensure database `gradeportal` exists
4. Check MySQL port (default: 3306)

### Backend Not Starting

1. Check if port 5000 is available
2. Verify all dependencies installed: `npm install`
3. Check `.env` file exists and is correct
4. Review error messages in console

### Frontend Not Connecting

1. Verify backend is running on port 5000
2. Check CORS settings in `backend/server.js`
3. Verify API_BASE_URL in `utils/api.js`
4. Check browser console for errors

### Login Issues

- Ensure email is normalized (lowercase)
- Check password is correct
- Verify user exists in database
- Check JWT_SECRET is set

## 🚀 Production Deployment

### Backend

1. Set `NODE_ENV=production`
2. Use strong JWT_SECRET
3. Configure proper database credentials
4. Use process manager (PM2)
5. Set up SSL/HTTPS

### Frontend

1. Build for production: `npm run build`
2. Serve static files (Nginx, Apache)
3. Configure API_BASE_URL for production
4. Enable HTTPS

## 📚 API Documentation

### Authentication
- `POST /api/auth/login` - Login
- `GET /api/auth/user` - Get current user
- `POST /api/auth/logout` - Logout

### Students
- `POST /api/students/register` - Register student
- `GET /api/students/my-grades` - Get student's grades
- `GET /api/students/:studentId/grades` - Get specific student's grades

### Parents
- `POST /api/parents/register` - Register parent
- `GET /api/parents/me` - Get parent details

### Grades
- `POST /api/grades/upload` - Upload single grade
- `POST /api/grades/upload-bulk` - Bulk upload
- `GET /api/grades` - Get all grades (admin)
- `PUT /api/grades/:id` - Update grade
- `DELETE /api/grades/:id` - Delete grade

### Links
- `GET /api/links/pending` - Get pending links
- `POST /api/links/approve/:id` - Approve link
- `POST /api/links/reject/:id` - Reject link

### Statistics
- `GET /api/stats/dashboard` - Get dashboard stats (admin)

## 🎓 Support

For issues or questions:
1. Check this guide
2. Review error messages
3. Check database connection
4. Verify all dependencies installed

## 📄 License

This project is for educational purposes.

