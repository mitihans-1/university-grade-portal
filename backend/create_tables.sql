-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS gradeportal;
USE gradeportal;

-- Create students table
CREATE TABLE students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    studentId VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    department VARCHAR(255) NOT NULL,
    year INT NOT NULL,
    phone VARCHAR(20) NOT NULL,
    registrationDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'active'
);

-- Create parents table
CREATE TABLE parents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    studentId VARCHAR(255) NOT NULL,
    relationship VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    registrationDate DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create parent_student_links table
CREATE TABLE parent_student_links (
    id INT AUTO_INCREMENT PRIMARY KEY,
    parentId VARCHAR(255) NOT NULL,
    studentId VARCHAR(255) NOT NULL,
    linkedBy VARCHAR(255) NOT NULL,
    linkDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'pending',
    approvedDate DATETIME NULL,
    rejectedDate DATETIME NULL
);

-- Create grades table
CREATE TABLE grades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    studentId VARCHAR(255) NOT NULL,
    courseCode VARCHAR(100) NOT NULL,
    courseName VARCHAR(255) NOT NULL,
    grade VARCHAR(10) NOT NULL,
    score INT NOT NULL,
    creditHours INT NOT NULL,
    semester VARCHAR(100) NOT NULL,
    academicYear VARCHAR(10) DEFAULT '2024',
    uploadedBy VARCHAR(255) NOT NULL,
    uploadDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    published BOOLEAN DEFAULT TRUE,
    parentNotified BOOLEAN DEFAULT FALSE,
    remarks TEXT
);

-- Create notifications table
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    parentId VARCHAR(255) NULL,
    studentId VARCHAR(255) NULL,
    type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE,
    sentVia VARCHAR(255) NULL
);

-- Insert an initial admin user
INSERT INTO students (studentId, name, email, password, department, year, phone, status) 
VALUES ('UGR/ADMIN/01', 'Admin User', 'admin@university.edu', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administration', 0, '+1234567890', 'active');

-- Create alerts table
CREATE TABLE alerts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    studentId VARCHAR(255) NOT NULL,
    parentId INT NOT NULL,
    type VARCHAR(100) NOT NULL,
    severity VARCHAR(50) DEFAULT 'medium',
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    gradeId INT NULL,
    courseCode VARCHAR(100) NULL,
    isRead BOOLEAN DEFAULT FALSE,
    sentVia VARCHAR(255) DEFAULT 'app',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parentId) REFERENCES parents(id) ON DELETE CASCADE
);