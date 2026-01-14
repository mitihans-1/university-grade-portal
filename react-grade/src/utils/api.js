const API_BASE_URL = 'http://127.0.0.1:5000/api';

// Get token from localStorage
const getToken = () => localStorage.getItem('token');

// API utility functions
export const api = {
  // Authentication
  login: async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.msg || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  forgotPassword: async (email) => {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });
    return response.json();
  },

  resetPassword: async (token, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password/${token}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password }),
    });
    return response.json();
  },

  getUser: async () => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/auth/user`, {
      headers: {
        'x-auth-token': token,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.msg || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  logout: async () => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'x-auth-token': token,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.msg || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  // Update user profile
  updateProfile: async (profileData) => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token,
      },
      body: JSON.stringify(profileData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.msg || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  // Get student grades
  getStudentGrades: async (studentId) => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/students/${studentId}/grades`, {
      headers: {
        'x-auth-token': token,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.msg || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  // Get logged-in student's grades
  getMyGrades: async () => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/students/my-grades`, {
      headers: {
        'x-auth-token': token,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.msg || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  // Get pending parent links (admin only)
  getPendingLinks: async () => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/links/pending`, {
      headers: {
        'x-auth-token': token,
      },
    });
    return response.json();
  },

  // Get approved parent links (admin only)
  getApprovedLinks: async () => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/links/approved`, {
      headers: {
        'x-auth-token': token,
      },
    });
    return response.json();
  },

  // Approve a parent link
  approveLink: async (linkId) => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/links/approve/${linkId}`, {
      method: 'POST',
      headers: {
        'x-auth-token': token,
      },
    });
    return response.json();
  },

  // Reject a parent link
  rejectLink: async (linkId) => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/links/reject/${linkId}`, {
      method: 'POST',
      headers: {
        'x-auth-token': token,
      },
    });
    return response.json();
  },

  // Upload grades (admin only)
  uploadGrade: async (gradeData) => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/grades/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token,
      },
      body: JSON.stringify(gradeData),
    });
    return response.json();
  },

  // Register a student
  registerStudent: async (studentData) => {
    const response = await fetch(`${API_BASE_URL}/students/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(studentData),
    });
    return response.json();
  },

  // Register a parent
  registerParent: async (parentData) => {
    const response = await fetch(`${API_BASE_URL}/parents/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(parentData),
    });
    return response.json();
  },

  // Register a teacher
  registerTeacher: async (teacherData) => {
    const response = await fetch(`${API_BASE_URL}/teachers/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(teacherData),
    });
    return response.json();
  },

  // Get notifications (parent only)
  getNotifications: async () => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/notifications`, {
      headers: {
        'x-auth-token': token,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.msg || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (Array.isArray(data)) {
      return data.map(notification => ({
        ...notification,
        read: notification.is_read
      }));
    }
    return data;
  },

  // Get unread notifications
  getUnreadNotifications: async () => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/notifications/unread`, {
      headers: {
        'x-auth-token': token,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.msg || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (Array.isArray(data)) {
      return data.map(notification => ({
        ...notification,
        read: notification.is_read
      }));
    }
    return data;
  },

  // Mark a notification as read
  markNotificationAsRead: async (notificationId) => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
      method: 'PUT',
      headers: {
        'x-auth-token': token,
      },
    });
    return response.json();
  },

  // Delete a notification
  deleteNotification: async (notificationId) => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}`, {
      method: 'DELETE',
      headers: {
        'x-auth-token': token,
      },
    });
    return response.json();
  },

  // Verify a student's ID (Admin only)
  verifyStudent: async (studentId, isVerified) => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/students/${studentId}/verify`, {
      method: 'PUT',
      headers: {
        'x-auth-token': token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ isVerified })
    });
    return response.json();
  },

  // Update a grade (admin only)
  updateGrade: async (gradeId, gradeData) => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/grades/${gradeId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token,
      },
      body: JSON.stringify(gradeData),
    });
    return response.json();
  },

  // Delete a grade (admin only)
  deleteGrade: async (gradeId) => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/grades/${gradeId}`, {
      method: 'DELETE',
      headers: {
        'x-auth-token': token,
      },
    });
    return response.json();
  },

  // Bulk approve teacher grades (Admin only)
  approveGradesBulk: async (gradeIds) => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/grades/approve-bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token,
      },
      body: JSON.stringify({ gradeIds }),
    });
    return response.json();
  },

  // Get student by ID
  getStudentById: async (studentId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/students/${studentId}`);
      if (!response.ok) {
        return { msg: 'Student not found' };
      }
      return response.json();
    } catch (error) {
      console.error('Error fetching student:', error);
      return { msg: 'Error fetching student' };
    }
  },

  // Get all grades (admin only)
  getGrades: async () => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/grades`, {
      headers: {
        'x-auth-token': token,
      },
    });
    if (!response.ok) {
      return [];
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  },

  // Mark all notifications as read
  markAllNotificationsAsRead: async () => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/notifications/read-all`, {
      method: 'PUT',
      headers: {
        'x-auth-token': token,
      },
    });
    return response.json();
  },

  // Bulk upload grades
  bulkUploadGrades: async (file) => {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/grades/upload-bulk`, {
      method: 'POST',
      headers: {
        'x-auth-token': token,
      },
      body: formData,
    });
    return response.json();
  },

  // Get all students (admin only)
  getAllStudents: async () => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/students`, {
      headers: {
        'x-auth-token': token,
      },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.msg || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  // Get dashboard statistics
  getDashboardStats: async () => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/stats/dashboard`, {
      headers: {
        'x-auth-token': token,
      },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.msg || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  // Admin Preferences
  getAdminPreference: async (key) => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/admin/preferences/${key}`, {
      headers: {
        'x-auth-token': token,
      },
    });
    return response.json();
  },

  setAdminPreference: async (key, value) => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/admin/preferences`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token,
      },
      body: JSON.stringify({ key, value }),
    });
    return response.json();
  },

  // Get alerts for parent
  getAlerts: async () => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/alerts`, {
      headers: {
        'x-auth-token': token,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.msg || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  // Get unread alerts
  getUnreadAlerts: async () => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/alerts/unread`, {
      headers: {
        'x-auth-token': token,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.msg || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  // Mark alert as read
  markAlertAsRead: async (alertId) => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/alerts/${alertId}/read`, {
      method: 'PUT',
      headers: {
        'x-auth-token': token,
      },
    });
    return response.json();
  },

  // Mark all alerts as read
  markAllAlertsAsRead: async () => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/alerts/read-all`, {
      method: 'PUT',
      headers: {
        'x-auth-token': token,
      },
    });
    return response.json();
  },

  // Analytics
  getAdminAnalytics: async () => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/analytics/admin/overview`, {
      headers: {
        'x-auth-token': token,
      },
    });
    return response.json();
  },

  getStudentAnalytics: async (studentId) => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/analytics/student/${studentId}`, {
      headers: {
        'x-auth-token': token,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.msg || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  // Attendance
  uploadAttendance: async (attendanceData) => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/attendance/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token,
      },
      body: JSON.stringify(attendanceData),
    });
    return response.json();
  },

  getAllAttendance: async () => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/attendance/all`, {
      method: 'GET',
      headers: {
        'x-auth-token': token,
      },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.msg || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  getStudentAttendance: async (studentId) => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/attendance/student/${studentId}`, {
      headers: {
        'x-auth-token': token,
      },
    });
    return response.json();
  },

  getAttendanceSummary: async (studentId) => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/attendance/summary/${studentId}`, {
      headers: {
        'x-auth-token': token,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.msg || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  // Schedule
  getSchedules: async (params) => {
    const token = getToken();
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/schedule?${query}`, {
      headers: {
        'x-auth-token': token,
      },
    });
    return response.json();
  },

  addScheduleItem: async (scheduleData) => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/schedule/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token,
      },
      body: JSON.stringify(scheduleData),
    });
    return response.json();
  },

  deleteScheduleItem: async (id) => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/schedule/${id}`, {
      method: 'DELETE',
      headers: {
        'x-auth-token': token,
      },
    });
    return response.json();
  },

  // Fee Management
  getFees: async () => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/fees`, {
      headers: {
        'x-auth-token': token,
      },
    });
    return response.json();
  },

  assignFee: async (feeData) => {
    const token = getToken();
    const isFormData = feeData instanceof FormData;

    const headers = {
      'x-auth-token': token,
    };

    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_BASE_URL}/fees`, {
      method: 'POST',
      headers: headers,
      body: isFormData ? feeData : JSON.stringify(feeData),
    });
    return response.json();
  },

  payFee: async (feeId) => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/fees/${feeId}/pay`, {
      method: 'POST',
      headers: {
        'x-auth-token': token,
      },
    });
    return response.json();
  },

  deleteFee: async (feeId) => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/fees/${feeId}`, {
      method: 'DELETE',
      headers: {
        'x-auth-token': token,
      },
    });
    return response.json();
  },


  // Update student information
  updateStudent: async (studentId, studentData) => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/students/${studentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token,
      },
      body: JSON.stringify(studentData),
    });
    return response.json();
  },

  // Delete a student
  deleteStudent: async (studentId) => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/students/${studentId}`, {
      method: 'DELETE',
      headers: {
        'x-auth-token': token,
      },
    });
    return response.json();
  },

  // Notifications Broadcast & Direct
  // Notifications Broadcast & Direct
  sendBroadcast: async (broadcastData) => {
    const token = getToken();
    const isFormData = broadcastData instanceof FormData;

    // If sending FormData, do NOT set Content-Type header manually. 
    // The browser will set it with the correct boundary.
    const headers = {
      'x-auth-token': token,
    };

    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_BASE_URL}/notifications/broadcast`, {
      method: 'POST',
      headers: headers,
      body: isFormData ? broadcastData : JSON.stringify(broadcastData),
    });
    return response.json();
  },

  sendDirectNotification: async (notificationData) => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/notifications/direct`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token,
      },
      body: JSON.stringify(notificationData),
    });
    return response.json();
  },

  // Grade Approval Workflow (Teacher-Admin)
  getPendingGradesForApproval: async () => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/grades/pending-approval`, {
      headers: {
        'x-auth-token': token,
      },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.msg || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  approveGrade: async (gradeId) => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/grades/${gradeId}/approve`, {
      method: 'POST',
      headers: {
        'x-auth-token': token,
      },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.msg || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  rejectGrade: async (gradeId, reason) => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/grades/${gradeId}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token,
      },
      body: JSON.stringify({ reason }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.msg || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  // Assignment Submission System
  createAssignment: async (formData) => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/assignments/create`, {
      method: 'POST',
      headers: {
        'x-auth-token': token,
      },
      body: formData, // FormData for file upload
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.msg || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  getTeacherAssignments: async () => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/assignments/teacher`, {
      headers: {
        'x-auth-token': token,
      },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.msg || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  getStudentAssignments: async () => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/assignments/student`, {
      headers: {
        'x-auth-token': token,
      },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.msg || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  submitAssignment: async (assignmentId, formData) => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/assignments/${assignmentId}/submit`, {
      method: 'POST',
      headers: {
        'x-auth-token': token,
      },
      body: formData, // FormData for file upload
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.msg || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  getAssignmentSubmissions: async (assignmentId) => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/assignments/${assignmentId}/submissions`, {
      headers: {
        'x-auth-token': token,
      },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.msg || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  gradeSubmission: async (submissionId, formData) => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/assignments/submission/${submissionId}/grade`, {
      method: 'POST',
      headers: {
        'x-auth-token': token,
      },
      body: formData, // FormData for optional graded file upload
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.msg || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  downloadAssignmentFile: async (type, id) => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/assignments/download/${type}/${id}`, {
      headers: {
        'x-auth-token': token,
      },
    });
    if (!response.ok) {
      throw new Error('File download failed');
    }
    return response.blob();
  },

  deleteAssignment: async (assignmentId) => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/assignments/${assignmentId}`, {
      method: 'DELETE',
      headers: {
        'x-auth-token': token,
      },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.msg || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  // Report Card Generator
  getStudentReportData: async (studentId, academicYear, semester) => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/reports/student/${studentId}?academicYear=${academicYear}&semester=${semester}`, {
      headers: { 'x-auth-token': token },
    });
    if (!response.ok) throw new Error('Failed to fetch report data');
    return response.json();
  },

  saveReportRemarks: async (reportData) => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/reports/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token,
      },
      body: JSON.stringify(reportData),
    });
    if (!response.ok) throw new Error('Failed to save remarks');
    return response.json();
  },

  emailReportCard: async (emailData) => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/reports/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token,
      },
      body: JSON.stringify(emailData),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.msg || 'Failed to email report card');
    }
    return response.json();
  },

  // Calendar Events
  getEvents: async () => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/calendar`, {
      headers: {
        'x-auth-token': token,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch events');
    return response.json();
  },

  createEvent: async (eventData) => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/calendar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token,
      },
      body: JSON.stringify(eventData),
    });
    if (!response.ok) throw new Error('Failed to create event');
    return response.json();
  },

  deleteEvent: async (id) => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/calendar/${id}`, {
      method: 'DELETE',
      headers: {
        'x-auth-token': token,
      },
    });
    if (!response.ok) throw new Error('Failed to delete event');
    return response.json();
  },

  // Messaging System
  getConversations: async () => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/messages/conversations`, {
      headers: { 'x-auth-token': token },
    });
    if (!response.ok) throw new Error('Failed to fetch conversations');
    return response.json();
  },

  getChatHistory: async (otherId, otherRole) => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/messages/history/${otherId}/${otherRole}`, {
      headers: { 'x-auth-token': token },
    });
    if (!response.ok) throw new Error('Failed to fetch chat history');
    return response.json();
  },

  searchUsers: async (query) => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/messages/search?query=${query}`, {
      headers: { 'x-auth-token': token },
    });
    if (!response.ok) throw new Error('Failed to search users');
    return response.json();
  },

  // Exam System
  createExam: async (examData) => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/exams/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token,
      },
      body: JSON.stringify(examData),
    });
    return response.json();
  },

  addExamQuestions: async (examId, questions) => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/exams/${examId}/questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token,
      },
      body: JSON.stringify({ questions }),
    });
    return response.json();
  },

  getAvailableExams: async () => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/exams/available`, {
      headers: {
        'x-auth-token': token,
      },
    });
    return response.json();
  },

  getPendingExams: async () => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/exams/pending`, {
      headers: {
        'x-auth-token': token,
      },
    });
    return response.json();
  },

  publishExam: async (examId, entryCode) => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/exams/${examId}/publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token,
      },
      body: JSON.stringify({ entryCode }),
    });
    return response.json();
  },

  startExam: async (examId, entryCode) => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/exams/${examId}/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token,
      },
      body: JSON.stringify({ entryCode }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.msg || 'Failed to start exam');
    }

    return response.json();
  },

  saveExamAnswer: async (attemptId, questionId, answer, nextIndex) => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/exams/attempt/${attemptId}/save-answer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token,
      },
      body: JSON.stringify({ questionId, answer, nextIndex }),
    });
    return response.json();
  },

  submitExam: async (attemptId) => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/exams/attempt/${attemptId}/submit`, {
      method: 'POST',
      headers: {
        'x-auth-token': token,
      },
    });
    return response.json();
  },
};

