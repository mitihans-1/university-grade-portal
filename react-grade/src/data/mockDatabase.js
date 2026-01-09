// Mock database structure for our frontend
export const mockDatabase = {
  // Students register first
  students: [
    {
      id: 'ST001',
      studentId: 'UGR/1234/14',
      name: 'Abebe Kebede',
      email: 'abebe@university.edu',
      password: 'demo123',
      department: 'Computer Science',
      year: 3,
      phone: '+251911223344',
      registrationDate: '2023-09-01',
      status: 'active'
    }
  ],
  
  // Parents register with student ID
  parents: [
    {
      id: 'PA001',
      name: 'Kebede Worku',
      email: 'kebede.parent@example.com',
      password: 'demo123',
      phone: '+251922334455',
      studentId: 'UGR/1234/14', // Links to student
      relationship: 'Father',
      status: 'pending' // pending/approved/rejected
    }
  ],
  
  // Admin links parents to students
  parentStudentLinks: [
    {
      id: 'LNK001',
      parentId: 'PA001',
      studentId: 'ST001',
      linkedBy: 'AD001', // Admin who approved
      linkDate: '2024-01-15',
      status: 'approved' // pending/approved
    }
  ],
  
  // Grades uploaded by admin
  grades: [
    {
      id: 'G001',
      studentId: 'ST001',
      courseCode: 'CS301',
      courseName: 'Data Structures',
      grade: 'A',
      score: 92,
      creditHours: 3,
      semester: 'Spring 2024',
      uploadedBy: 'AD001',
      uploadDate: '2024-05-15',
      published: true,
      parentNotified: true
    }
  ],
  
  // Notifications/alerts for parents
  notifications: [
    {
      id: 'N001',
      parentId: 'PA001',
      studentId: 'ST001',
      type: 'grade_update', // grade_update, attendance, warning, achievement
      title: 'New Grade Published',
      message: 'Your child Abebe Kebede received A in Data Structures',
      date: '2024-05-15 10:30:00',
      read: false,
      sentVia: ['email', 'sms'] // email, sms, push
    }
  ]
};