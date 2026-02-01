import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../utils/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useToast } from '../components/common/Toast';
import { generateTranscriptPDF, generateSemesterReportPDF } from '../utils/pdfGenerator';

const ReportsPage = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState('transcript'); // transcript, semester, summary
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        if (user?.studentId) {
          const [gradesData, analyticsData] = await Promise.all([
            api.getStudentGrades(user.studentId),
            api.getStudentAnalytics(user.studentId).catch(() => null)
          ]);
          setGrades(gradesData || []);
          setAnalytics(analyticsData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setGrades([]);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  const calculateGPA = (gradesList) => {
    const gradePoints = {
      'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7,
      'C+': 2.3, 'C': 2.0, 'C-': 1.7, 'D': 1.0, 'F': 0.0
    };

    let totalPoints = 0;
    let totalCredits = 0;

    gradesList.forEach(g => {
      const credits = g.creditHours || 3;
      const points = gradePoints[g.grade] || 0;
      totalPoints += points * credits;
      totalCredits += credits;
    });

    return totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    try {
      const studentData = {
        name: user.name,
        studentId: user.studentId,
        department: user.department,
        year: user.year
      };

      if (reportType === 'transcript') {
        generateTranscriptPDF(studentData, grades, analytics);
        showToast('📄 Official Transcript PDF Generated!', 'success');
      } else if (reportType === 'semester') {
        const semesters = [...new Set(grades.map(g => g.semester || 'Unknown'))];
        if (semesters.length > 0) {
          const semester = semesters[0]; // Generate for first semester
          const semesterGrades = grades.filter(g => (g.semester || 'Unknown') === semester);
          const semesterGPA = parseFloat(calculateGPA(semesterGrades));
          generateSemesterReportPDF(studentData, semester, semesterGrades, semesterGPA);
          showToast(`📅 ${semester} Report PDF Generated!`, 'success');
        }
      } else {
        generateTranscriptPDF(studentData, grades, analytics);
        showToast('📊 Summary Report PDF Generated!', 'success');
      }
    } catch (error) {
      console.error('PDF Generation Error:', error);
      showToast('Error generating PDF', 'error');
    }
  };

  const handleExportCSV = () => {
    const csvContent = generateCSV();
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `academic_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    showToast(t('exportedToCSV'), 'success');
  };

  const generateCSV = () => {
    const headers = ['Course Code', 'Course Name', 'Grade', 'Score', 'Credits', 'Semester', 'Date'];
    const rows = grades.map(g => [
      g.courseCode,
      g.courseName,
      g.grade,
      g.score,
      g.creditHours || 3,
      g.semester || 'N/A',
      new Date(g.uploadDate || g.createdAt).toLocaleDateString()
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const getGradeColor = (grade) => {
    if (grade.startsWith('A')) return '#4caf50';
    if (grade.startsWith('B')) return '#2196f3';
    if (grade.startsWith('C')) return '#ff9800';
    if (grade.startsWith('D')) return '#ff5722';
    return '#f44336';
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  const overallGPA = calculateGPA(grades);
  const semesters = [...new Set(grades.map(g => g.semester || 'Unknown'))];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h2 style={{ margin: '0 0 10px 0' }}>{t('academicReports')}</h2>
          <p style={{ color: '#666', margin: 0 }}>
            {t('reportsDescription')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleExportCSV}
            style={{
              padding: '10px 20px',
              backgroundColor: '#4caf50',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            📥 {t('exportCSV')}
          </button>
          <button
            onClick={handleExportPDF}
            style={{
              padding: '10px 20px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            📄 Export PDF
          </button>
          <button
            onClick={handlePrint}
            style={{
              padding: '10px 20px',
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            🖨️ {t('print')}
          </button>
        </div>
      </div>

      {/* Report Type Selector */}
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        marginBottom: '25px'
      }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          {['transcript', 'semester', 'summary'].map(type => (
            <button
              key={type}
              onClick={() => setReportType(type)}
              style={{
                padding: '10px 20px',
                backgroundColor: reportType === type ? '#1976d2' : '#f5f5f5',
                color: reportType === type ? 'white' : '#333',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: reportType === type ? 'bold' : 'normal',
                textTransform: 'capitalize'
              }}
            >
              {type === 'transcript' ? `📄 ${t('fullTranscript')}` :
                type === 'semester' ? `📅 ${t('semesterReport')}` :
                  `📊 ${t('summaryReport')}`}
            </button>
          ))}
        </div>
      </div>

      {/* Report Content */}
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        minHeight: '600px'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px', borderBottom: '3px solid #1976d2', paddingBottom: '20px' }}>
          <h1 style={{ margin: '0 0 10px 0', color: '#1976d2' }}>{t('universityGradePortal').toUpperCase()}</h1>
          <h2 style={{ margin: '0 0 20px 0', color: '#666' }}>{t('officialTranscript')}</h2>
          <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '20px' }}>
            <div>
              <strong>{t('studentId')}:</strong> {user?.studentId || 'N/A'}
            </div>
            <div>
              <strong>{t('dateGenerated')}:</strong> {new Date().toLocaleDateString()}
            </div>
            <div>
              <strong>{t('overallGPA')}:</strong> {overallGPA} / 4.0
            </div>
          </div>
        </div>

        {/* Summary Section */}
        <div style={{
          backgroundColor: '#f5f5f5',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '30px'
        }}>
          <h3 style={{ marginTop: 0 }}>{t('academicSummary')}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
            <div>
              <div style={{ fontSize: '14px', color: '#666' }}>{t('totalCourses')}</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{grades.length}</div>
            </div>
            <div>
              <div style={{ fontSize: '14px', color: '#666' }}>{t('totalCredits')}</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                {grades.reduce((sum, g) => sum + (g.creditHours || 3), 0)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '14px', color: '#666' }}>{t('overallGPA')}</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1976d2' }}>
                {overallGPA}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '14px', color: '#666' }}>{t('semesters')}</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{semesters.length}</div>
            </div>
          </div>
        </div>

        {/* Grades Table */}
        {reportType === 'transcript' && (
          <div>
            <h3 style={{ marginBottom: '20px' }}>{t('courseGrades')}</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#1976d2', color: 'white' }}>
                  <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>{t('courseCode')}</th>
                  <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>{t('courseName')}</th>
                  <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #ddd' }}>{t('credits')}</th>
                  <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #ddd' }}>{t('grade')}</th>
                  <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #ddd' }}>{t('score')}</th>
                  <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>{t('semester')}</th>
                  <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>{t('date')}</th>
                </tr>
              </thead>
              <tbody>
                {grades.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                      {t('noGradesAvailable')}
                    </td>
                  </tr>
                ) : (
                  grades.map((grade, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '12px', border: '1px solid #ddd' }}>{grade.courseCode}</td>
                      <td style={{ padding: '12px', border: '1px solid #ddd' }}>{grade.courseName}</td>
                      <td style={{ padding: '12px', textAlign: 'center', border: '1px solid #ddd' }}>
                        {grade.creditHours || 3}
                      </td>
                      <td style={{
                        padding: '12px',
                        textAlign: 'center',
                        border: '1px solid #ddd',
                        fontWeight: 'bold',
                        color: getGradeColor(grade.grade)
                      }}>
                        {grade.grade}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', border: '1px solid #ddd' }}>
                        {grade.score}%
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                        {grade.semester || 'N/A'}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                        {new Date(grade.uploadDate || grade.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Semester Report */}
        {reportType === 'semester' && (
          <div>
            {semesters.map(semester => {
              const semesterGrades = grades.filter(g => (g.semester || 'Unknown') === semester);
              const semesterGPA = calculateGPA(semesterGrades);
              return (
                <div key={semester} style={{ marginBottom: '30px' }}>
                  <h3 style={{ borderBottom: '2px solid #1976d2', paddingBottom: '10px' }}>
                    {semester} - GPA: {semesterGPA}
                  </h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f5f5f5' }}>
                        <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>{t('course')}</th>
                        <th style={{ padding: '10px', textAlign: 'center', border: '1px solid #ddd' }}>{t('credits')}</th>
                        <th style={{ padding: '10px', textAlign: 'center', border: '1px solid #ddd' }}>{t('grade')}</th>
                        <th style={{ padding: '10px', textAlign: 'center', border: '1px solid #ddd' }}>{t('score')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {semesterGrades.map((grade, index) => (
                        <tr key={index}>
                          <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                            {grade.courseCode} - {grade.courseName}
                          </td>
                          <td style={{ padding: '10px', textAlign: 'center', border: '1px solid #ddd' }}>
                            {grade.creditHours || 3}
                          </td>
                          <td style={{
                            padding: '10px',
                            textAlign: 'center',
                            border: '1px solid #ddd',
                            fontWeight: 'bold',
                            color: getGradeColor(grade.grade)
                          }}>
                            {grade.grade}
                          </td>
                          <td style={{ padding: '10px', textAlign: 'center', border: '1px solid #ddd' }}>
                            {grade.score}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div style={{
          marginTop: '40px',
          paddingTop: '20px',
          borderTop: '2px solid #eee',
          textAlign: 'center',
          color: '#666',
          fontSize: '12px'
        }}>
          <p>{t('officialDocumentFooter')}</p>
          <p>{t('verificationFooter')}</p>
        </div>
      </div>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-content, .print-content * {
            visibility: visible;
          }
          .print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default ReportsPage;



