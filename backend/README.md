# University Grade Portal - Backend

This is the backend API for the University Grade Portal application, built with Node.js, Express, and MySQL.

## Features

- User authentication (students, parents, and admins)
- Student registration and management
- Parent registration and management
- Parent-student linking requests
- Grade management and upload
- Notification system
- Role-based access control

## Tech Stack

- Node.js
- Express.js
- MySQL
- Sequelize ORM
- JWT for authentication
- Bcrypt for password hashing

## Setup

1. Make sure you have Node.js and MySQL installed on your system
2. Clone this repository
3. Install dependencies: `npm install`
4. Create a MySQL database named `gradeportal`
5. Create a `.env` file in the root directory with the following content:
   ```
   PORT=5000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=gradeportal
   JWT_SECRET=university_grade_portal_secret_key
   ```
6. Run the SQL file `create_tables.sql` to create the database tables
7. Start the server: `npm run dev`

## API Endpoints

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

## Database Schema

The application uses the following tables:

- `students` - Stores student information
- `parents` - Stores parent information
- `parent_student_links` - Links parents to students
- `grades` - Stores grade information
- `notifications` - Stores notification information

## Admin Credentials

Default admin credentials:
- Email: `admin@university.edu`
- Password: `admin`