import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { useLanguage } from '../context/LanguageContext';

const GradeDetails = () => {
  const { id } = useParams(); // Grade ID from URL
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [grade, setGrade] = useState(null);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGradeDetails = async () => {
      try {
        setLoading(true);

        // In the current implementation, we don't have an API to get a specific grade by ID
        // So we'll fetch all grades and find the specific one
        const allGrades = await api.getGrades();
        const foundGrade = allGrades.find(g => g.id === id);

        if (foundGrade) {
          setGrade(foundGrade);

          // For student details, we'll use the studentId to get the student
          // In a real implementation, we would have an API endpoint for this
          // For now, we'll just set the studentId in the grade object
        } else {
          console.error('Grade not found');
        }
      } catch (error) {
        console.error('Error fetching grade details:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchGradeDetails();
    }
  }, [id]);

  const getGradeColor = (gradeLetter) => {
    if (gradeLetter.includes('A')) return '#2e7d32';
    if (gradeLetter.includes('B')) return '#1976d2';
    if (gradeLetter.includes('C')) return '#ed6c02';
    if (gradeLetter.includes('D')) return '#d32f2f';
    return '#b71c1c';
  };

  const getGradePoint = (gradeLetter) => {
    const gradePoints = {
      'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7,
      'C+': 2.3, 'C': 2.0, 'C-': 1.7, 'D': 1.0, 'F': 0.0
    };
    return gradePoints[gradeLetter] || 0;
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '300px'
      }}>
        <div>{t('loading')}...</div>
      </div>
    );
  }

  if (!grade) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px', textAlign: 'center' }}>
        <h2>{t('gradeNotFound')}</h2>
        <p>{t('gradeNotFoundMessage')}</p>
        <button
          onClick={() => navigate(-1)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            marginTop: '20px'
          }}
        >
          {t('goBack')}
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '10px',
        padding: '25px',
        marginBottom: '25px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            color: '#1976d2',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            marginBottom: '20px',
            fontSize: '16px'
          }}
        >
          ← {t('back')}
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h1 style={{ margin: '0 0 10px 0', color: '#333' }}>{grade.courseName}</h1>
            <p style={{ margin: 0, color: '#666' }}>
              {grade.courseCode} • {grade.semester} • {grade.academicYear}
            </p>
          </div>

          <div style={{
            backgroundColor: getGradeColor(grade.grade),
            color: 'white',
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            fontWeight: 'bold'
          }}>
            {grade.grade}
            <span style={{ fontSize: '14px', opacity: 0.9 }}>
              {grade.score}%
            </span>
          </div>
        </div>
      </div>

      {/* Student Info Card */}
      {student && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '10px',
          padding: '25px',
          marginBottom: '25px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>👨‍🎓 {t('studentInformation')}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <div>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>{t('studentName')}</div>
              <div style={{ fontWeight: 'bold', fontSize: '18px' }}>{student.name}</div>
            </div>
            <div>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>{t('studentId')}</div>
              <div style={{ fontWeight: 'bold' }}>{student.studentId}</div>
            </div>
            <div>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>{t('department')}</div>
              <div style={{ fontWeight: 'bold' }}>{student.department}</div>
            </div>
            <div>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>{t('year')}</div>
              <div style={{ fontWeight: 'bold' }}>{t('year')} {student.year}</div>
            </div>
          </div>
        </div>
      )}

      {/* Grade Details */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '10px',
        padding: '25px',
        marginBottom: '25px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>📊 {t('gradeDetailsTitle')}</h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>{t('letterGrade')}</div>
            <div style={{
              fontSize: '32px',
              fontWeight: 'bold',
              color: getGradeColor(grade.grade)
            }}>
              {grade.grade}
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>{t('scoreLabel')}</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#333' }}>
              {grade.score}%
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>{t('creditHours')}</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#333' }}>
              {grade.creditHours}
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>{t('gradePoint')}</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#333' }}>
              {getGradePoint(grade.grade).toFixed(1)}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <span style={{ fontWeight: '500' }}>{t('performanceScore')}</span>
            <span style={{ fontWeight: 'bold' }}>{grade.score}%</span>
          </div>
          <div style={{
            height: '12px',
            backgroundColor: '#f0f0f0',
            borderRadius: '6px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${grade.score}%`,
              height: '100%',
              backgroundColor: getGradeColor(grade.grade),
              borderRadius: '6px'
            }}></div>
          </div>
        </div>

        {/* Score Breakdown */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '15px',
          marginTop: '30px'
        }}>
          <div style={{
            padding: '15px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px'
          }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>{t('status')}</div>
            <div style={{ fontWeight: 'bold', color: grade.status === 'published' ? '#2e7d32' : '#ff9800' }}>
              {grade.status === 'published' ? `✅ ${t('published')}` : `⏳ ${t('pending')}`}
            </div>
          </div>

          <div style={{
            padding: '15px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px'
          }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>{t('uploadedDate')}</div>
            <div style={{ fontWeight: 'bold' }}>
              {new Date(grade.createdAt || grade.uploadedDate).toLocaleDateString()}
            </div>
          </div>

          <div style={{
            padding: '15px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px'
          }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>{t('uploadedBy')}</div>
            <div style={{ fontWeight: 'bold' }}>{grade.uploadedBy || 'Admin'}</div>
          </div>

          <div style={{
            padding: '15px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px'
          }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>{t('parentsNotified')}</div>
            <div style={{ fontWeight: 'bold', color: grade.notified ? '#2e7d32' : '#ff9800' }}>
              {grade.notified ? `✅ ${t('yes')}` : `⏳ ${t('no')}`}
            </div>
          </div>
        </div>

        {/* Remarks */}
        {grade.remarks && (
          <div style={{ marginTop: '30px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>{t('remarks')}</h4>
            <div style={{
              padding: '15px',
              backgroundColor: '#f0f7ff',
              borderRadius: '8px',
              borderLeft: '4px solid #1976d2'
            }}>
              {grade.remarks}
            </div>
          </div>
        )}

        {/* Performance Evaluation */}
        <div style={{ marginTop: '30px' }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#333' }}>📈 {t('performanceEvaluation')}</h4>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '15px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                backgroundColor: grade.score >= 90 ? '#2e7d32' : grade.score >= 80 ? '#4caf50' : grade.score >= 70 ? '#ff9800' : '#f44336',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 10px',
                fontSize: '24px'
              }}>
                {grade.score >= 90 ? 'A' : grade.score >= 80 ? 'B' : grade.score >= 70 ? 'C' : grade.score >= 60 ? 'D' : 'F'}
              </div>
              <div style={{ fontWeight: 'bold' }}>{t('letterGrade')}</div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {grade.score >= 90 ? t('excellent') : grade.score >= 80 ? t('good') : grade.score >= 70 ? 'Average' : grade.score >= 60 ? 'Pass' : 'Fail'}
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                backgroundColor: '#e3f2fd',
                color: '#1976d2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 10px',
                fontSize: '24px'
              }}>
                {grade.creditHours}
              </div>
              <div style={{ fontWeight: 'bold' }}>{t('credits')}</div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {t('creditHours')}
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                backgroundColor: '#f3e5f5',
                color: '#9c27b0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 10px',
                fontSize: '24px'
              }}>
                {(grade.score / 100).toFixed(2)}
              </div>
              <div style={{ fontWeight: 'bold' }}>{t('percentage')}</div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {t('scoreRatio')}
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                backgroundColor: '#e8f5e9',
                color: '#2e7d32',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 10px',
                fontSize: '24px'
              }}>
                {getGradePoint(grade.grade).toFixed(1)}
              </div>
              <div style={{ fontWeight: 'bold' }}>{t('gradePoint')}</div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {t('gpaContribution')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '10px',
        padding: '20px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        display: 'flex',
        justifyContent: 'center',
        gap: '15px'
      }}>
        <button
          onClick={() => window.print()}
          style={{
            padding: '10px 20px',
            backgroundColor: '#2196f3',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          🖨️ {t('printReport')}
        </button>

        <button
          onClick={() => navigate(-1)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#f5f5f5',
            color: '#333',
            border: '1px solid #ddd',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          ← {t('backToGrades')}
        </button>
      </div>
    </div>
  );
};

export default GradeDetails;