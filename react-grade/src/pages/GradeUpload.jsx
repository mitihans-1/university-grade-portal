import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';

const GradeUpload = () => {
  const [uploadType, setUploadType] = useState('single'); // 'single' or 'bulk'
  const [grades, setGrades] = useState([]);
  const [students, setStudents] = useState([]);
  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    sendEmail: true,
    sendSMS: true,
    immediateNotification: true,
    weeklySummary: true
  });

  // New single grade form
  const [newGrade, setNewGrade] = useState({
    studentId: '',
    courseCode: '',
    courseName: '',
    grade: '',
    score: '',
    creditHours: '3',
    semester: '',
    academicYear: '2024',
    remarks: ''
  });

  // Load students and grades from API
  useEffect(() => {
    const fetchStudentsAndGrades = async () => {
      try {
        // Fetch all grades for the admin
        const gradesData = await api.getGrades();
        setGrades(gradesData);
        
        // Also fetch all students to populate the dropdown
        // We'll use the students from the grades data for now
        // In a real implementation, you would fetch students separately
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    
    fetchStudentsAndGrades();
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && (selectedFile.type === 'text/csv' || selectedFile.name.match(/\.(csv|xlsx|xls)$/))) {
      setFile(selectedFile);
    } else {
      alert('Please select a CSV or Excel file');
    }
  };

  const handleBulkUpload = async () => {
    if (!file) {
      alert('Please select a file first');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);

      // Send file to backend for processing using API utility
      const result = await api.bulkUploadGrades(file);
      
      if (result.success) {
        setUploadProgress(100);
        alert(`Successfully uploaded ${file.name}! ${result.count || 'multiple'} grades added.`);
      } else {
        throw new Error(result.msg || 'Bulk upload failed');
      }

      // Fetch all grades to update the table
      const updatedGrades = await api.getGrades();
      setGrades(updatedGrades);
      
      setIsUploading(false);
      setFile(null);
      alert(`Successfully uploaded ${file.name}! ${successCount} grades added.`);
    } catch (error) {
      console.error('Error during bulk upload:', error);
      setIsUploading(false);
      alert('An error occurred during bulk upload');
    }
  };

  const handleSingleUpload = async () => {
    if (!newGrade.studentId || !newGrade.courseCode || !newGrade.grade) {
      alert('Please fill all required fields');
      return;
    }

    try {
      // Prepare grade data for API call
      const gradeData = {
        studentId: newGrade.studentId,
        courseCode: newGrade.courseCode,
        courseName: newGrade.courseName,
        grade: newGrade.grade,
        score: newGrade.score || 0,
        creditHours: parseInt(newGrade.creditHours) || 3,
        semester: newGrade.semester,
        academicYear: newGrade.academicYear,
        remarks: newGrade.remarks
      };
      
      // Call the API to upload the grade
      const result = await api.uploadGrade(gradeData);
      
      if (result && result.grade) {
        // Add the new grade to the current grades list immediately
        const newGradeRecord = result.grade;
        setGrades(prevGrades => {
          // Check if grade is already in the list to avoid duplicates
          const gradeExists = prevGrades.some(g => g.id === newGradeRecord.id);
          if (!gradeExists) {
            return [...prevGrades, newGradeRecord];
          }
          // If grade already exists, update it
          return prevGrades.map(g => g.id === newGradeRecord.id ? newGradeRecord : g);
        });
        
        // Reset form
        setNewGrade({
          studentId: '',
          courseCode: '',
          courseName: '',
          grade: '',
          score: '',
          creditHours: '3',
          semester: '',
          academicYear: '2024',
          remarks: ''
        });
        
        // Also fetch all grades to ensure consistency (in background)
        setTimeout(async () => {
          const updatedGrades = await api.getGrades();
          setGrades(updatedGrades || []);
        }, 1000); // Update from server after 1 second
        
        alert('Grade added successfully!');
      } else {
        alert(result.msg || 'Error uploading grade');
      }
    } catch (error) {
      console.error('Error uploading grade:', error);
      alert('An error occurred while uploading the grade');
    }
  };

  const handlePublish = async (id) => {
    const grade = grades.find(g => g.id === id);
    if (!grade) return;

    try {
      // Update grade status via API
      const response = await api.updateGrade(id, { status: 'published' });
      
      if (response.success) {
        // Update the grade in the current grades list immediately
        setGrades(prevGrades => 
          prevGrades.map(g => 
            g.id === id ? { ...g, status: 'published', notified: true } : g
          )
        );
        
        // Send notification to parent
        sendParentNotification(grade);
        
        // Also fetch all grades to ensure consistency (in background)
        setTimeout(async () => {
          const updatedGrades = await api.getGrades();
          setGrades(updatedGrades || []);
        }, 1000); // Update from server after 1 second
        
        alert('Grade published and parents notified!');
      } else {
        alert(response.msg || 'Error publishing grade');
      }
    } catch (error) {
      console.error('Error publishing grade:', error);
      alert('An error occurred while publishing the grade');
    }
  };

  const sendParentNotification = async (grade) => {
    try {
      // The backend will automatically handle notification creation when a grade is published
      // This is handled by the API endpoint when updating the grade status
      console.log(`Notification sent for grade update: ${grade.studentName} - ${grade.grade}`);
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this grade record?')) {
      try {
        // Delete grade via API
        const response = await api.deleteGrade(id);
        
        if (response.success) {
          // Remove the grade from the current grades list immediately
          setGrades(prevGrades => 
            prevGrades.filter(g => g.id !== id)
          );
          
          // Also fetch all grades to ensure consistency (in background)
          setTimeout(async () => {
            const updatedGrades = await api.getGrades();
            setGrades(updatedGrades || []);
          }, 1000); // Update from server after 1 second
          
          alert('Grade record deleted.');
        } else {
          alert(response.msg || 'Error deleting grade');
        }
      } catch (error) {
        console.error('Error deleting grade:', error);
        alert('An error occurred while deleting the grade');
      }
    }
  };

  const getGradeColor = (grade) => {
    if (grade.includes('A')) return '#2e7d32';
    if (grade.includes('B')) return '#1976d2';
    if (grade.includes('C')) return '#ed6c02';
    if (grade.includes('D')) return '#d32f2f';
    return '#b71c1c';
  };

  const pendingGrades = grades.filter(g => g.status === 'pending');
  const publishedGrades = grades.filter(g => g.status === 'published');

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '10px',
        padding: '25px',
        marginBottom: '25px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ margin: '0 0 20px 0', color: '#333' }}>📤 Grade Upload Portal</h1>
        <p style={{ color: '#666', marginBottom: '20px' }}>
          Upload student grades and automatically notify parents via email/SMS
        </p>

        {/* Stats */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '20px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '30px', fontWeight: 'bold', color: '#333' }}>
              {grades.length}
            </div>
            <div style={{ color: '#666', fontSize: '14px' }}>Total Grades</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '30px', fontWeight: 'bold', color: '#ff9800' }}>
              {pendingGrades.length}
            </div>
            <div style={{ color: '#666', fontSize: '14px' }}>Pending</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '30px', fontWeight: 'bold', color: '#4caf50' }}>
              {publishedGrades.length}
            </div>
            <div style={{ color: '#666', fontSize: '14px' }}>Published</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '30px', fontWeight: 'bold', color: '#2196f3' }}>
              {grades.filter(g => g.notified).length}
            </div>
            <div style={{ color: '#666', fontSize: '14px' }}>Notified</div>
          </div>
        </div>
      </div>

      {/* Upload Type Selection */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '10px',
        padding: '25px',
        marginBottom: '25px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button
            onClick={() => setUploadType('single')}
            style={{
              padding: '10px 20px',
              backgroundColor: uploadType === 'single' ? '#1976d2' : '#f5f5f5',
              color: uploadType === 'single' ? 'white' : '#333',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: uploadType === 'single' ? 'bold' : 'normal'
            }}
          >
            📝 Single Grade Upload
          </button>
          <button
            onClick={() => setUploadType('bulk')}
            style={{
              padding: '10px 20px',
              backgroundColor: uploadType === 'bulk' ? '#1976d2' : '#f5f5f5',
              color: uploadType === 'bulk' ? 'white' : '#333',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: uploadType === 'bulk' ? 'bold' : 'normal'
            }}
          >
            📁 Bulk Upload (CSV/Excel)
          </button>
        </div>

        {/* Notification Settings */}
        <div style={{ 
          backgroundColor: '#f0f7ff', 
          padding: '15px', 
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h4 style={{ margin: '0 0 10px 0' }}>📢 Notification Settings</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <input
                type="checkbox"
                checked={notificationSettings.sendEmail}
                onChange={(e) => setNotificationSettings({
                  ...notificationSettings,
                  sendEmail: e.target.checked
                })}
              />
              Send Email
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <input
                type="checkbox"
                checked={notificationSettings.sendSMS}
                onChange={(e) => setNotificationSettings({
                  ...notificationSettings,
                  sendSMS: e.target.checked
                })}
              />
              Send SMS
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <input
                type="checkbox"
                checked={notificationSettings.immediateNotification}
                onChange={(e) => setNotificationSettings({
                  ...notificationSettings,
                  immediateNotification: e.target.checked
                })}
              />
              Immediate Notification
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <input
                type="checkbox"
                checked={notificationSettings.weeklySummary}
                onChange={(e) => setNotificationSettings({
                  ...notificationSettings,
                  weeklySummary: e.target.checked
                })}
              />
              Weekly Summary
            </label>
          </div>
        </div>

        {/* Single Grade Upload Form */}
        {uploadType === 'single' && (
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '20px',
            borderRadius: '8px'
          }}>
            <h3 style={{ margin: '0 0 15px 0' }}>Add Single Grade</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                  Student ID *
                </label>
                <input
                  type="text"
                  value={newGrade.studentId}
                  onChange={(e) => setNewGrade({...newGrade, studentId: e.target.value})}
                  list="studentList"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '5px'
                  }}
                  placeholder="UGR/1234/14"
                />
                <datalist id="studentList">
                  {students.map(student => (
                    <option key={student.id} value={student.studentId}>
                      {student.name} - {student.studentId}
                    </option>
                  ))}
                </datalist>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                  Course Code *
                </label>
                <input
                  type="text"
                  value={newGrade.courseCode}
                  onChange={(e) => setNewGrade({...newGrade, courseCode: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '5px'
                  }}
                  placeholder="CS301"
                />
              </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                Course Name
              </label>
              <input
                type="text"
                value={newGrade.courseName}
                onChange={(e) => setNewGrade({...newGrade, courseName: e.target.value})}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '5px'
                }}
                placeholder="Data Structures"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                  Grade *
                </label>
                <select
                  value={newGrade.grade}
                  onChange={(e) => setNewGrade({...newGrade, grade: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '5px'
                  }}
                >
                  <option value="">Select Grade</option>
                  <option value="A">A (90-100%)</option>
                  <option value="A-">A- (85-89%)</option>
                  <option value="B+">B+ (80-84%)</option>
                  <option value="B">B (75-79%)</option>
                  <option value="B-">B- (70-74%)</option>
                  <option value="C+">C+ (65-69%)</option>
                  <option value="C">C (60-64%)</option>
                  <option value="D">D (50-59%)</option>
                  <option value="F">F (Below 50%)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                  Score (%)
                </label>
                <input
                  type="number"
                  value={newGrade.score}
                  onChange={(e) => setNewGrade({...newGrade, score: e.target.value})}
                  min="0"
                  max="100"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '5px'
                  }}
                  placeholder="85"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                  Credit Hours
                </label>
                <select
                  value={newGrade.creditHours}
                  onChange={(e) => setNewGrade({...newGrade, creditHours: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '5px'
                  }}
                >
                  <option value="1">1 Credit</option>
                  <option value="2">2 Credits</option>
                  <option value="3">3 Credits</option>
                  <option value="4">4 Credits</option>
                  <option value="5">5 Credits</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                  Semester
                </label>
                <input
                  type="text"
                  value={newGrade.semester}
                  onChange={(e) => setNewGrade({...newGrade, semester: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '5px'
                  }}
                  placeholder="Spring 2024"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                  Academic Year
                </label>
                <input
                  type="text"
                  value={newGrade.academicYear}
                  onChange={(e) => setNewGrade({...newGrade, academicYear: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '5px'
                  }}
                  placeholder="2024"
                />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                Remarks (Optional)
              </label>
              <textarea
                value={newGrade.remarks}
                onChange={(e) => setNewGrade({...newGrade, remarks: e.target.value})}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  minHeight: '80px'
                }}
                placeholder="Any additional comments..."
              />
            </div>

            <button
              onClick={handleSingleUpload}
              style={{
                padding: '12px 24px',
                backgroundColor: '#4caf50',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              📥 Add Grade Record
            </button>
          </div>
        )}

        {/* Bulk Upload Form */}
        {uploadType === 'bulk' && (
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '20px',
            borderRadius: '8px'
          }}>
            <h3 style={{ margin: '0 0 15px 0' }}>Bulk Upload Grades</h3>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: '500' }}>
                Select CSV or Excel File
              </label>
              <div
                onClick={() => document.getElementById('fileInput').click()}
                style={{
                  border: '2px dashed #2196f3',
                  borderRadius: '8px',
                  padding: '40px 20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  backgroundColor: file ? '#e3f2fd' : '#f8f9fa',
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
                  {file ? '📁' : '📄'}
                </div>
                <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>
                  {file ? file.name : 'Click to select file'}
                </p>
                <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                  CSV or Excel files only. Required columns: StudentID, CourseCode, Grade, Score, Semester
                </p>
              </div>
            </div>

            {file && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span style={{ color: '#666' }}>File Size:</span>
                  <span style={{ fontWeight: 'bold' }}>{(file.size / 1024).toFixed(2)} KB</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>Type:</span>
                  <span style={{ fontWeight: 'bold' }}>{file.type || 'Unknown'}</span>
                </div>
              </div>
            )}

            {isUploading && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span style={{ color: '#666' }}>Uploading...</span>
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
              disabled={!file || isUploading}
              style={{
                width: '100%',
                padding: '15px',
                backgroundColor: file && !isUploading ? '#2196f3' : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: file && !isUploading ? 'pointer' : 'not-allowed'
              }}
            >
              {isUploading ? 'Uploading...' : '📤 Upload & Process File'}
            </button>

            <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '8px' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#856404' }}>📋 File Format Example</h4>
              <pre style={{
                backgroundColor: '#f8f9fa',
                padding: '10px',
                borderRadius: '5px',
                overflowX: 'auto',
                fontSize: '12px'
              }}>
                StudentID,CourseCode,Grade,Score,CreditHours,Semester,AcademicYear{'\n'}
                UGR/1234/14,CS301,A,92,3,Spring 2024,2024{'\n'}
                UGR/1235/14,CS301,B+,87,3,Spring 2024,2024{'\n'}
                UGR/1236/14,CS301,C+,78,3,Spring 2024,2024
              </pre>
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
          <h2 style={{ margin: 0, color: '#333' }}>Grade Records</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={async () => {
                if (pendingGrades.length === 0) {
                  alert('No pending grades to publish');
                  return;
                }
                if (window.confirm(`Publish ${pendingGrades.length} pending grades and notify parents?`)) {
                  // Update the grades in the current grades list immediately
                  setGrades(prevGrades => 
                    prevGrades.map(grade => 
                      grade.status === 'pending' 
                        ? (() => {
                            sendParentNotification(grade);
                            return { ...grade, status: 'published', notified: true };
                          })()
                        : grade
                    )
                  );
                  
                  // Publish all pending grades
                  const publishPromises = pendingGrades.map(grade => 
                    api.updateGrade(grade.id, { status: 'published' })
                  );
                  
                  await Promise.all(publishPromises);
                  
                  // Also fetch all grades to ensure consistency (in background)
                  setTimeout(async () => {
                    const updatedGrades = await api.getGrades();
                    setGrades(updatedGrades || []);
                  }, 1000); // Update from server after 1 second
                  
                  alert(`Published ${pendingGrades.length} grades! Parents notified.`);
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
              Publish All ({pendingGrades.length})
            </button>
          </div>
        </div>

        {grades.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>📊</div>
            <h3>No grade records yet</h3>
            <p>Upload grades using the forms above to get started.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Course</th>
                  <th>Grade</th>
                  <th>Score</th>
                  <th>Semester</th>
                  <th>Status</th>
                  <th>Notification</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {grades.map(grade => (
                  <tr key={grade.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px' }}>
                      <strong>{grade.studentName}</strong>
                      <div style={{ fontSize: '14px', color: '#666' }}>{grade.studentId}</div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <strong>{grade.courseName}</strong>
                      <div style={{ fontSize: '14px', color: '#666' }}>{grade.courseCode}</div>
                    </td>
                    <td style={{ padding: '12px' }}>
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
                    <td style={{ padding: '12px', fontWeight: 'bold' }}>
                      {grade.score}%
                    </td>
                    <td style={{ padding: '12px' }}>
                      {grade.semester}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        backgroundColor: grade.status === 'published' ? '#d4edda' : '#fff3cd',
                        color: grade.status === 'published' ? '#155724' : '#856404',
                        padding: '5px 10px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        {grade.status === 'published' ? '✅ Published' : '⏳ Pending'}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      {grade.notified ? (
                        <span style={{ color: '#4caf50', fontWeight: 'bold' }}>✓ Sent</span>
                      ) : (
                        <span style={{ color: '#ff9800', fontWeight: 'bold' }}>Pending</span>
                      )}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button
                          onClick={() => handlePublish(grade.id)}
                          disabled={grade.status === 'published'}
                          style={{
                            padding: '5px 10px',
                            backgroundColor: grade.status === 'published' ? '#ccc' : '#4caf50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: grade.status === 'published' ? 'not-allowed' : 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          {grade.status === 'published' ? 'Published' : 'Publish'}
                        </button>
                        <button
                          onClick={() => handleDelete(grade.id)}
                          style={{
                            padding: '5px 10px',
                            backgroundColor: '#f44336',
                            color: 'white',
                            border: 'none',
                            borderRadius: '3px',
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
        )}
      </div>
    </div>
  );
};

export default GradeUpload;