import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../utils/api';

const sendParentNotification = async (studentId, notificationData) => {
  try {
    // In the actual implementation, this would be handled by the backend
    // when grades are published
    console.log(`Notification sent for student ${studentId}:`, notificationData);
    return true;
  } catch (error) {
    console.error('Error sending notification:', error);
    return false;
  }
};

const AdminUpload = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [uploadType, setUploadType] = useState('single'); // 'single', 'bulk', or 'batch'
  const [grades, setGrades] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedYear, setSelectedYear] = useState('All');
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [selectedSemester, setSelectedSemester] = useState('Fall 2024');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Batch entry state
  const [batchInfo, setBatchInfo] = useState({
    course: '',
    subject: '',
    department: 'All',
    academicYear: '2024',
    semester: 'Fall 2024'
  });
  const [batchGrades, setBatchGrades] = useState({}); // { studentId: { grade: '', score: '' } }

  const [newGrade, setNewGrade] = useState({
    studentId: '',
    course: '',
    grade: '',
    score: '',
    credits: 3,
    academicYear: '2024',
    semester: 'Fall 2024'
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [systemSettings, setSystemSettings] = useState(null);

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        console.log('Fetching grades for admin...');
        const gradesData = await api.getGrades();
        console.log('Received grades data:', gradesData);
        // Ensure gradesData is an array
        setGrades(Array.isArray(gradesData) ? gradesData : []);
      } catch (error) {
        console.error('Error fetching grades:', error);
        setGrades([]);
      }
    };

    const fetchStudents = async () => {
      try {
        console.log('Fetching students for admin...');
        // Get all students for the dropdown using API utility
        const studentsData = await api.getAllStudents();
        console.log('Received students data:', studentsData);
        // Ensure studentsData is an array
        setStudents(Array.isArray(studentsData) ? studentsData : []);
      } catch (error) {
        console.error('Error fetching students:', error);
        setStudents([]); // Set to empty array on error
      }
    };

    const fetchSettings = async () => {
      try {
        const data = await api.getPublicSettings();
        setSystemSettings(data);
      } catch (e) { console.error('Error fetching settings:', e); }
    };

    // Only fetch data if user has permission to enter grades (Admin or Teacher)
    const canEnterGrades = user && (user.role === 'admin' || user.permissions?.includes('enter_grades'));

    if (canEnterGrades) {
      console.log('User has grade entry permission, fetching data...', user);
      fetchGrades();
      fetchStudents();
      fetchSettings();

      // Pre-fill filters for teachers
      if (user.role === 'teacher') {
        if (user.department) setSelectedDepartment(user.department);
        if (user.year) setSelectedYear(user.year);
        if (user.semester) setSelectedSemester(user.semester);

        // Also update batch and single entry defaults
        setBatchInfo(prev => ({
          ...prev,
          academicYear: String(user.year || prev.academicYear),
          semester: user.semester || prev.semester
        }));
        setNewGrade(prev => ({
          ...prev,
          academicYear: String(user.year || prev.academicYear),
          semester: user.semester || prev.semester
        }));
      }
    } else {
      console.log('User does not have required permissions', user);
    }
  }, [user]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && (file.type === 'text/csv' || file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      setSelectedFile(file);
    } else {
      alert('Please select a CSV or Excel file');
    }
  };

  const handleBulkUpload = async () => {
    if (!selectedFile) {
      alert('Please select a file first');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      setIsUploading(true);
      setUploadProgress(10); // Start progress

      const result = await api.bulkUploadGrades(selectedFile);
      setUploadProgress(100);

      if (result.success) {
        const count = result.count || 'multiple';
        const msg = result.msg || 'File processed successfully';
        alert(`Successfully uploaded ${selectedFile.name}! ${count} grades added/updated.`);

        // Refresh grades list
        const updatedGrades = await api.getGrades();
        setGrades(Array.isArray(updatedGrades) ? updatedGrades : []);
      } else {
        alert(result.msg || 'Bulk upload failed');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file: ' + error.message);
    } finally {
      setIsUploading(false);
      setSelectedFile(null);
      setUploadProgress(0);
    }
  };

  const handleBatchSubmit = async () => {
    if (!batchInfo.course) {
      alert('Please enter a course name/code');
      return;
    }

    const studentsToSubmit = filteredStudents.filter(s => batchGrades[s.studentId]?.grade);
    if (studentsToSubmit.length === 0) {
      alert('No grades entered to submit');
      return;
    }

    setIsUploading(true);
    try {
      let success = 0;
      for (const student of studentsToSubmit) {
        const gradeData = {
          studentId: student.studentId,
          courseCode: batchInfo.course,
          courseName: batchInfo.subject || batchInfo.course,
          grade: batchGrades[student.studentId].grade,
          score: parseFloat(batchGrades[student.studentId].score) || 0,
          creditHours: 3,
          semester: batchInfo.semester,
          academicYear: batchInfo.academicYear,
          status: 'pending'
        };
        const result = await api.uploadGrade(gradeData);
        if (result && result.grade) success++;
      }

      alert(`Successfully submitted ${success} grades for approval.`);
      setBatchGrades({});
      const updatedGrades = await api.getGrades();
      setGrades(Array.isArray(updatedGrades) ? updatedGrades : []);
    } catch (error) {
      console.error('Error submitting batch:', error);
      alert('Error during batch submission: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSingleUpload = async () => {
    if (!newGrade.studentId || !newGrade.course || !newGrade.grade) {
      alert('Please fill all required fields');
      return;
    }

    try {
      const gradeData = {
        studentId: newGrade.studentId,
        courseCode: newGrade.course,
        courseName: newGrade.course, // In a real app, this would come from a course catalog
        grade: newGrade.grade,
        score: parseFloat(newGrade.score) || 0,
        creditHours: parseInt(newGrade.credits) || 3,
        semester: newGrade.semester,
        academicYear: newGrade.academicYear,
        status: 'pending' // Initially pending
      };

      const result = await api.uploadGrade(gradeData);
      console.log('Upload grade result:', result); // Debug log

      if (result && result.grade) {
        // Add the new grade to the current grades list
        const newGradeRecord = result.grade;
        setGrades(prevGrades => {
          const prev = Array.isArray(prevGrades) ? prevGrades : [];
          const gradeExists = prev.some(g => g.id === newGradeRecord.id);
          if (!gradeExists) {
            return [...prev, newGradeRecord];
          }
          return prev.map(g => g.id === newGradeRecord.id ? newGradeRecord : g);
        });

        // Also fetch all grades to ensure consistency (in background)
        setTimeout(async () => {
          const updatedGrades = await api.getGrades();
          setGrades(Array.isArray(updatedGrades) ? updatedGrades : []);
        }, 1000);

        setNewGrade({ studentId: '', course: '', grade: '', score: '', credits: 3, academicYear: '2024', semester: 'Fall 2024' });
        alert('Grade added successfully! Parents will be notified when published.');
      } else {
        alert(result.msg || 'Error adding grade');
      }
    } catch (error) {
      console.error('Error uploading grade:', error);
      alert('Error adding grade: ' + error.message);
    }
  };

  const handlePublish = async (id) => {
    try {
      // Update the grade status to published
      const gradeToUpdate = grades.find(g => g.id === id);
      if (!gradeToUpdate) {
        alert('Grade not found');
        return;
      }

      const updatedGrade = { ...gradeToUpdate, status: 'published', published: true };
      const result = await api.updateGrade(id, updatedGrade);

      if (result && result.success) {
        // Update the grade in the current grades list
        setGrades(prevGrades =>
          prevGrades.map(g =>
            g.id === id ? { ...g, status: 'published', published: true } : g
          )
        );

        // Refresh view staying in the current context
        if (selectedStudentId) {
          await loadGradesForStudent(selectedStudentId);
        } else {
          const updatedGrades = await api.getGrades();
          setGrades(Array.isArray(updatedGrades) ? updatedGrades : []);
        }
      } else {
        alert(result.msg || 'Error publishing grade');
      }
    } catch (error) {
      console.error('Error publishing grade:', error);
      alert('Error publishing grade: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this grade record?')) {
      try {
        const result = await api.deleteGrade(id);

        if (result && !result.msg) {
          // Remove the grade from the current grades list
          setGrades(prevGrades =>
            prevGrades.filter(g => g.id !== id)
          );

          // Also fetch all grades to ensure consistency (in background)
          setTimeout(async () => {
            const updatedGrades = await api.getGrades();
            setGrades(Array.isArray(updatedGrades) ? updatedGrades : []);
          }, 1000);

          alert('Grade record deleted.');
        } else {
          alert(result.msg || 'Error deleting grade');
        }
      } catch (error) {
        console.error('Error deleting grade:', error);
        alert('Error deleting grade: ' + error.message);
      }
    }
  };

  const getGradeColor = (grade) => {
    if (!grade) return '#666';
    if (grade.includes('A')) return '#2e7d32';
    if (grade.includes('B')) return '#1976d2';
    if (grade.includes('C')) return '#ed6c02';
    if (grade.includes('D')) return '#d32f2f';
    return '#b71c1c';
  };

  const gradesArray = Array.isArray(grades) ? grades : [];

  // Get catalogs from settings or fallback to data-derived values
  const departments = systemSettings?.departments ? JSON.parse(systemSettings.departments) :
    ['All', ...Array.from(new Set(students.map(s => s.department))).sort()];
  if (!departments.includes('All')) departments.unshift('All');

  const years = systemSettings?.academic_years ? JSON.parse(systemSettings.academic_years) :
    ['All', ...Array.from(new Set(students.map(s => s.year))).sort((a, b) => a - b)];
  if (!years.includes('All')) years.unshift('All');

  const semesters = systemSettings?.semesters ? JSON.parse(systemSettings.semesters) :
    ['All', ...Array.from(new Set(students.map(s => s.semester))).sort()];
  if (!semesters.includes('All')) semesters.unshift('All');

  const coursesCatalog = systemSettings?.courses ? JSON.parse(systemSettings.courses) : [];

  // Filter grades for teachers to only show their own submissions
  const filteredGradeList = user?.role === 'teacher'
    ? gradesArray.filter(g => g.uploadedBy === user?.teacherId)
    : gradesArray;

  const pendingGrades = filteredGradeList.filter(g => (g.status === 'pending' || g.status === 'Pending' || g.approvalStatus === 'pending_approval'));
  const publishedGrades = filteredGradeList.filter(g => (g.status === 'published' || g.status === 'Published'));

  const filteredStudents = students.filter(s => {
    const yearMatch = selectedYear === 'All' || String(s.year) === String(selectedYear);
    const deptMatch = selectedDepartment === 'All' || s.department === selectedDepartment;
    const semesterMatch = selectedSemester === 'All' || s.semester === selectedSemester;
    const query = searchQuery.toLowerCase();
    const searchMatch = !query ||
      s.name?.toLowerCase().includes(query) ||
      s.studentId?.toLowerCase().includes(query);

    return yearMatch && deptMatch && semesterMatch && searchMatch;
  });

  const loadGradesForStudent = async (studentId) => {
    try {
      const data = await api.getStudentGrades(studentId);
      const student = students.find(s => s.studentId === studentId);
      const mapped = Array.isArray(data)
        ? data.map(g => ({
          ...g,
          status: g.published ? 'published' : 'pending',
          studentId: g.studentId || studentId,
          studentName: student ? student.name : g.studentName || 'N/A'
        }))
        : [];
      setGrades(mapped);
    } catch (e) {
      setGrades([]);
    }
  };

  const handleSelectStudent = async (studentId) => {
    setSelectedStudentId(studentId);
    await loadGradesForStudent(studentId);
  };

  const handleShowAll = async () => {
    setSelectedStudentId('');
    const data = await api.getGrades();
    setGrades(Array.isArray(data) ? data : []);
  };

  const publishAllForSelected = async () => {
    if (!selectedStudentId) return;
    const toPublish = gradesArray
      .filter(g => (g.status === 'pending' || g.status === 'Pending') && g.studentId === selectedStudentId)
      .map(g => g.id);
    try {
      for (const gradeId of toPublish) {
        const grade = grades.find(g => g.id === gradeId);
        if (grade) {
          const updated = { ...grade, status: 'published', published: true };
          await api.updateGrade(gradeId, updated);
        }
      }
      await loadGradesForStudent(selectedStudentId);
    } catch (e) { }
  };

  const publishAllPendingGrades = async () => {
    const toPublish = grades.filter(g => g.status === 'pending').map(g => g.id);
    if (toPublish.length === 0) {
      alert('No pending grades to publish');
      return { success: true }; // Nothing to do is a success
    }

    try {
      // Update the grades in the current grades list immediately for UI feedback
      setGrades(prevGrades =>
        prevGrades.map(g =>
          toPublish.includes(g.id) ? { ...g, status: 'published', published: true } : g
        )
      );

      // Publish all pending grades
      for (const gradeId of toPublish) {
        const grade = grades.find(g => g.id === gradeId);
        if (grade) {
          const updatedGrade = { ...grade, status: 'published' };
          await api.updateGrade(gradeId, updatedGrade);
        }
      }

      // Refresh view staying in the current context to ensure consistency
      if (selectedStudentId) {
        await loadGradesForStudent(selectedStudentId);
      } else {
        const updatedGrades = await api.getGrades();
        setGrades(Array.isArray(updatedGrades) ? updatedGrades : []);
      }
      return { success: true };
    } catch (error) {
      console.error('Error publishing grades:', error);
      return { success: false, error: error.message };
    }
  };


  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header Stats */}
      <div className="responsive-header" style={{
        backgroundColor: 'white',
        borderRadius: '10px',
        padding: '25px',
        marginBottom: '25px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <div>
          <h1 style={{ margin: '0 0 10px 0', color: '#333' }}>
            {user?.role === 'admin' ? t('adminGradePortal') : t('teacherGradePortal')}
          </h1>
          <p style={{ color: '#666', margin: 0 }}>
            {user?.role === 'admin'
              ? t('adminPortalDescription')
              : t('teacherPortalDescription')}
          </p>
        </div>
      </div>

      <div className="responsive-grid" style={{ marginBottom: '25px' }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '10px',
          padding: '20px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '30px', fontWeight: 'bold', color: '#333', marginBottom: '5px' }}>
            {filteredGradeList.length}
          </div>
          <div style={{ color: '#666', fontSize: '14px' }}>{user?.role === 'admin' ? t('totalGrades') : t('mySubmissions')}</div>
        </div>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '10px',
          padding: '20px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '30px', fontWeight: 'bold', color: '#ff9800', marginBottom: '5px' }}>
            {pendingGrades.length}
          </div>
          <div style={{ color: '#666', fontSize: '14px' }}>{t('pending')}</div>
        </div>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '10px',
          padding: '20px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '30px', fontWeight: 'bold', color: '#4caf50', marginBottom: '5px' }}>
            {publishedGrades.length}
          </div>
          <div style={{ color: '#666', fontSize: '14px' }}>{t('published')}</div>
        </div>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '10px',
          padding: '20px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '30px', fontWeight: 'bold', color: '#2196f3', marginBottom: '5px' }}>
            {filteredGradeList.filter(g => g.notified).length}
          </div>
          <div style={{ color: '#666', fontSize: '14px' }}>{t('notificationsSent')}</div>
        </div>
      </div>

      <div style={{
        marginBottom: '25px'
      }}>
        <div className="responsive-header" style={{ gap: '10px', marginBottom: '30px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setUploadType('single')}
            style={{
              padding: '12px 20px',
              backgroundColor: uploadType === 'single' ? '#1976d2' : 'white',
              color: uploadType === 'single' ? 'white' : '#555',
              border: '1px solid #1976d2',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            {t('singleEntry')}
          </button>
          <button
            onClick={() => setUploadType('batch')}
            style={{
              padding: '12px 20px',
              backgroundColor: uploadType === 'batch' ? '#2e7d32' : 'white',
              color: uploadType === 'batch' ? 'white' : '#555',
              border: '1px solid #2e7d32',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            {t('batchGroupEntry')}
          </button>
          <button
            onClick={() => setUploadType('bulk')}
            style={{
              padding: '12px 20px',
              backgroundColor: uploadType === 'bulk' ? '#ed6c02' : 'white',
              color: uploadType === 'bulk' ? 'white' : '#555',
              border: '1px solid #ed6c02',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            {t('bulkUpload')}
          </button>
        </div>

        {/* Conditional Rendering of Sections */}
        {uploadType === 'bulk' && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '10px',
            padding: '25px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            marginBottom: '25px',
            width: '100%'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                backgroundColor: '#2196f3',
                color: 'white',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px'
              }}>
                📤
              </div>
              <h2 style={{ margin: 0, color: '#333' }}>{t('bulkUpload')}</h2>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '10px', color: '#555' }}>
                {t('bulkUploadDescription')}
              </label>
              <div
                onClick={() => document.getElementById('fileInput').click()}
                style={{
                  border: '2px dashed #2196f3',
                  borderRadius: '8px',
                  padding: '40px 20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  backgroundColor: selectedFile ? '#e3f2fd' : '#f8f9fa',
                  transition: 'all 0.2s'
                }}
              >
                <input
                  id="fileInput"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <div style={{ fontSize: '40px', marginBottom: '10px' }}>
                  {selectedFile ? '📁' : '📄'}
                </div>
                <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>
                  {selectedFile ? selectedFile.name : t('clickToSelectFile')}
                </p>
                <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                  {t('csvExcelOnly')}
                </p>
              </div>
            </div>

            {selectedFile && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span style={{ color: '#666' }}>{t('fileSize')}:</span>
                  <span style={{ fontWeight: 'bold' }}>{(selectedFile.size / 1024).toFixed(2)} KB</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>{t('type')}:</span>
                  <span style={{ fontWeight: 'bold' }}>{selectedFile.type || 'Unknown'}</span>
                </div>
              </div>
            )}

            {isUploading && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span style={{ color: '#666' }}>{t('uploading')}</span>
                  <span style={{ fontWeight: 'bold' }}>{uploadProgress}%</span>
                </div>
                <div style={{
                  height: '10px',
                  backgroundColor: '#f0f0f0',
                  borderRadius: '5px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${uploadProgress}%`,
                    height: '100%',
                    backgroundColor: '#4caf50',
                    transition: 'width 0.3s'
                  }}></div>
                </div>
              </div>
            )}

            <button
              onClick={handleBulkUpload}
              disabled={!selectedFile || isUploading}
              style={{
                width: '100%',
                padding: '15px',
                backgroundColor: selectedFile && !isUploading ? '#ed6c02' : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: selectedFile && !isUploading ? 'pointer' : 'not-allowed'
              }}
            >
              {isUploading ? t('uploading') : t('processBulkFile')}
            </button>
          </div>
        )}

        {uploadType === 'batch' && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '10px',
            padding: '25px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            marginBottom: '25px',
            width: '100%'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                backgroundColor: '#2e7d32',
                color: 'white',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px'
              }}>
                👥
              </div>
              <h2 style={{ margin: 0, color: '#333' }}>{t('batchGroupEntry')}</h2>
            </div>

            <div className="responsive-grid" style={{ gap: '15px', marginBottom: '20px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>{t('department')}</label>
                <select
                  value={batchInfo.department}
                  onChange={(e) => {
                    const dept = e.target.value;
                    setBatchInfo({ ...batchInfo, department: dept });
                    setSelectedDepartment(dept); // Sync with main filter
                  }}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
                >
                  {departments.map((d) => (
                    <option key={d} value={d}>{d === 'All' ? t('allDepartments') || 'All Departments' : d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>{t('courseCode')}</label>
                <input
                  type="text"
                  value={batchInfo.course}
                  list="course-codes"
                  onChange={(e) => {
                    const code = e.target.value.toUpperCase();
                    const course = coursesCatalog.find(c => c.code === code);
                    setBatchInfo({
                      ...batchInfo,
                      course: code,
                      subject: course ? course.name : batchInfo.subject
                    });
                  }}
                  placeholder="e.g. CS101"
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>{t('subjectName')}</label>
                <input
                  type="text"
                  value={batchInfo.subject}
                  list="course-names"
                  onChange={(e) => setBatchInfo({ ...batchInfo, subject: e.target.value })}
                  placeholder="e.g. Introduction to Programming"
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
                />
              </div>

              <datalist id="course-codes">
                {coursesCatalog.map(c => <option key={c.code} value={c.code} />)}
              </datalist>
              <datalist id="course-names">
                {coursesCatalog.map(c => <option key={c.code} value={c.name} />)}
              </datalist>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>{t('academicYear')}</label>
                <select
                  value={batchInfo.academicYear}
                  onChange={(e) => {
                    const year = e.target.value === 'All' ? 'All' : parseInt(e.target.value);
                    setBatchInfo({ ...batchInfo, academicYear: String(year) });
                    setSelectedYear(year); // Sync with main filter
                  }}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
                >
                  {years.map((y) => (
                    <option key={y} value={y}>{y === 'All' ? t('selectYear') : `${t('year')} ${y}`}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>{t('semester')}</label>
                <select
                  value={batchInfo.semester}
                  onChange={(e) => {
                    const sem = e.target.value;
                    setBatchInfo({ ...batchInfo, semester: sem });
                    setSelectedSemester(sem); // Sync with main filter
                  }}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
                >
                  {semesters.map((s) => (
                    <option key={s} value={s}>{s === 'All' ? t('selectSemester') : s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ overflowX: 'auto', marginBottom: '20px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f5f5f5', textAlign: 'left' }}>
                    <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{t('studentId')}</th>
                    <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{t('fullName')}</th>
                    <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{t('grade')}</th>
                    <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{t('score')} %</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map(s => (
                    <tr key={s.studentId}>
                      <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>{s.studentId}</td>
                      <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>{s.name}</td>
                      <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                        <select
                          value={batchGrades[s.studentId]?.grade || ''}
                          onChange={(e) => setBatchGrades({
                            ...batchGrades,
                            [s.studentId]: { ...batchGrades[s.studentId], grade: e.target.value }
                          })}
                          style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ddd' }}
                        >
                          <option value="">--</option>
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="C">C</option>
                          <option value="D">D</option>
                          <option value="F">F</option>
                        </select>
                      </td>
                      <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                        <input
                          type="number"
                          value={batchGrades[s.studentId]?.score || ''}
                          onChange={(e) => setBatchGrades({
                            ...batchGrades,
                            [s.studentId]: { ...batchGrades[s.studentId], score: e.target.value }
                          })}
                          placeholder="0-100"
                          style={{ width: '70px', padding: '5px', borderRadius: '4px', border: '1px solid #ddd' }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              onClick={handleBatchSubmit}
              disabled={isUploading || filteredStudents.length === 0}
              style={{
                width: '100%',
                padding: '15px',
                backgroundColor: '#2e7d32',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              {isUploading ? t('submitting') : `${t('recordAttendance')} ${filteredStudents.length} ${t('manageStudents')}`}
            </button>
          </div>
        )}

        {uploadType === 'single' && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '10px',
            padding: '25px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            marginBottom: '25px',
            width: '100%'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                backgroundColor: '#4caf50',
                color: 'white',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px'
              }}>
                ➕
              </div>
              <h2 style={{ margin: 0, color: '#333' }}>{t('singleEntry')}</h2>
            </div>
            {/* ... rest of single entry content ... */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>{t('studentId')}</label>
                <select
                  value={newGrade.studentId}
                  onChange={(e) => setNewGrade({ ...newGrade, studentId: e.target.value })}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
                >
                  <option value="">{t('selectStudent')}</option>
                  {students.map(s => <option key={s.id} value={s.studentId}>{s.name} ({s.studentId})</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>{t('courseCode')} / {t('courseName')}</label>
                <input
                  type="text"
                  value={newGrade.course}
                  list="course-names"
                  onChange={(e) => setNewGrade({ ...newGrade, course: e.target.value })}
                  placeholder={`${t('selectLanguage')}...`}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px' }}>{t('grade')}</label>
                  <select
                    value={newGrade.grade}
                    onChange={(e) => setNewGrade({ ...newGrade, grade: e.target.value })}
                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
                  >
                    <option value="">--</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                    <option value="F">F</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px' }}>{t('score')}</label>
                  <input
                    type="number"
                    value={newGrade.score}
                    onChange={(e) => setNewGrade({ ...newGrade, score: e.target.value })}
                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
                  />
                </div>
              </div>
              <button
                onClick={handleSingleUpload}
                style={{ width: '100%', padding: '15px', backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                {t('submitting')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Grades Table */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '10px',
        padding: '25px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, color: '#333' }}>
            {user?.role === 'admin' ? t('gradeApprovals') : t('mySubmissions')}
          </h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={async () => {
                const publishResult = await publishAllPendingGrades();
                if (!publishResult.success) {
                  alert('Error publishing grades: ' + publishResult.error);
                } else {
                  // Refresh is handled inside publishAllPendingGrades or we can trigger a refresh if needed, 
                  // but the function updates state directly.
                }
              }}
              disabled={pendingGrades.length === 0}
              style={{
                padding: '10px 20px',
                backgroundColor: pendingGrades.length > 0 ? '#4caf50' : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: pendingGrades.length > 0 ? 'pointer' : 'not-allowed',
                fontWeight: 'bold'
              }}
            >
              {t('approve')} ({pendingGrades.length})
            </button>
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          borderRadius: '10px',
          padding: '25px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          marginBottom: '25px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h2 style={{ margin: 0, color: '#333' }}>{t('manageStudents')}</h2>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '5px', backgroundColor: 'white' }}
              >
                {departments.map((d) => (
                  <option key={d} value={d}>{d === 'All' ? t('allDepartments') || 'All Departments' : d}</option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value === 'All' ? 'All' : parseInt(e.target.value))}
                style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '5px', backgroundColor: 'white' }}
              >
                {years.map((y) => (
                  <option key={y} value={y}>{y === 'All' ? t('selectYear') : `${t('year')} ${y}`}</option>
                ))}
              </select>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '5px', backgroundColor: 'white' }}
              >
                {semesters.map((s) => (
                  <option key={s} value={s}>{s === 'All' ? t('selectSemester') : s}</option>
                ))}
              </select>
              <button
                onClick={handleShowAll}
                style={{ padding: '8px 12px', backgroundColor: '#1976d2', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
              >
                {t('viewGradesAndAcademicProgress')}
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder={`🔍 ${t('searchPeople')}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 15px',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  fontSize: '15px'
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '15px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#999',
                    cursor: 'pointer',
                    fontSize: '18px'
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div className="table-responsive-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
            {filteredStudents.map((s) => (
              <button
                key={s.id}
                onClick={() => handleSelectStudent(s.studentId)}
                style={{
                  textAlign: 'left',
                  padding: '12px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  backgroundColor: selectedStudentId === s.studentId ? '#e3f2fd' : 'white',
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontWeight: 'bold', color: '#333' }}>{s.name}</div>
                <div style={{ color: '#666', fontSize: '13px' }}>{s.studentId} • {t('yearNumber').replace('{year}', s.year)}</div>
              </button>
            ))}
            {filteredStudents.length === 0 && (
              <div style={{ color: '#666' }}>{t('noStudentsFound')}</div>
            )}
          </div>
        </div>

        <div className="table-responsive-cards">
          <table style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>{t('studentId')}</th>
                <th>{t('fullName')}</th>
                <th>{t('courses')}</th>
                <th>{t('grade')}</th>
                <th>{t('status')}</th>
                <th>{t('notifications')}</th>
                <th>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredGradeList.map((grade) => (
                <tr key={grade.id}>
                  <td data-label={t('studentId')} style={{ fontWeight: 'bold' }}>{grade.studentId}</td>
                  <td data-label={t('fullName')}>{grade.studentName || 'N/A'}</td>
                  <td data-label={t('courses')}>{grade.courseCode || grade.courseName}</td>
                  <td data-label={t('grade')}>
                    <span style={{
                      backgroundColor: getGradeColor(grade.grade),
                      color: 'white',
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontWeight: 'bold',
                      display: 'inline-block',
                      minWidth: '45px',
                      textAlign: 'center'
                    }}>
                      {grade.grade}
                    </span>
                  </td>
                  <td data-label={t('status')}>
                    <span style={{
                      backgroundColor: grade.status === 'published' ? '#d4edda' : '#fff3cd',
                      color: grade.status === 'published' ? '#155724' : '#856404',
                      padding: '5px 10px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {grade.status === 'published' ? 'Published' : 'Pending'}
                    </span>
                  </td>
                  <td data-label={t('notifications')}>
                    {grade.status === 'published' ? (
                      <span style={{ color: '#4caf50', fontWeight: 'bold' }}>✓ Sent</span>
                    ) : (
                      <span style={{ color: '#ff9800', fontWeight: 'bold' }}>Pending</span>
                    )}
                  </td>
                  <td data-label={t('actions')}>
                    <div style={{ display: 'flex', gap: '5px', width: '100%' }}>
                      {user?.role === 'admin' && (
                        <button
                          onClick={() => handlePublish(grade.id)}
                          disabled={grade.status === 'published'}
                          style={{
                            flex: 1,
                            padding: '8px 10px',
                            backgroundColor: grade.status === 'published' ? '#ccc' : '#4caf50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: grade.status === 'published' ? 'not-allowed' : 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          {grade.status === 'published' ? 'Published' : 'Publish'}
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(grade.id)}
                        style={{
                          flex: 1,
                          padding: '8px 10px',
                          backgroundColor: '#f44336',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>


        {user?.role === 'admin' && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '15px', marginBottom: '15px' }}>
            <button
              onClick={async () => {
                const result = await publishAllPendingGrades();
                if (!result.success) {
                  alert('Error publishing grades: ' + result.error);
                }
              }}
              disabled={pendingGrades.length === 0}
              style={{
                padding: '12px 24px',
                backgroundColor: pendingGrades.length > 0 ? '#4caf50' : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: pendingGrades.length > 0 ? 'pointer' : 'not-allowed',
                fontWeight: 'bold',
                fontSize: '16px',
                boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
              }}
            >
              Publish All Pending Grades ({pendingGrades.length})
            </button>
          </div>
        )}

        {user?.role === 'admin' && selectedStudentId && pendingGrades.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button
              onClick={publishAllForSelected}
              style={{ padding: '10px 16px', backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Publish All For Student ({pendingGrades.length})
            </button>
          </div>
        )}

        {gradesArray.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>📊</div>
            <h3>No grade records yet</h3>
            <p>Upload grades using the forms above to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUpload;
