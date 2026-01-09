import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../utils/api';
import LoadingSpinner from '../components/common/LoadingSpinner';

const AnalyticsPage = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const studentId = user?.studentId;
        if (studentId) {
          const data = await api.getStudentAnalytics(studentId);
          setAnalytics(data);
        }
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchAnalytics();
    }
  }, [user]);

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!analytics) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <p>No analytics data available</p>
      </div>
    );
  }

  const getRiskColor = (risk) => {
    switch(risk) {
      case 'high': return '#f44336';
      case 'medium': return '#ff9800';
      case 'low': return '#4caf50';
      default: return '#666';
    }
  };

  const getTrendIcon = () => {
    if (analytics.trends?.improving) return '📈';
    if (analytics.trends?.declining) return '📉';
    return '➡️';
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px' }}>
      <h2 style={{ marginBottom: '30px' }}>Academic Analytics & Performance</h2>

      {/* Risk Assessment Card */}
      <div style={{
        backgroundColor: 'white',
        padding: '25px',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        marginBottom: '25px',
        borderLeft: `5px solid ${getRiskColor(analytics.riskLevel)}`
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: '0 0 10px 0' }}>Academic Risk Assessment</h3>
            <p style={{ margin: 0, color: '#666' }}>
              {analytics.riskLevel === 'high' && '⚠️ High Risk - Immediate attention needed'}
              {analytics.riskLevel === 'medium' && '⚠️ Medium Risk - Monitor closely'}
              {analytics.riskLevel === 'low' && '✅ Low Risk - Good performance'}
            </p>
          </div>
          <div style={{
            fontSize: '48px',
            padding: '20px',
            backgroundColor: `${getRiskColor(analytics.riskLevel)}20`,
            borderRadius: '50%'
          }}>
            {analytics.riskLevel === 'high' ? '⚠️' : analytics.riskLevel === 'medium' ? '⚡' : '✅'}
          </div>
        </div>
        <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
          <div>
            <div style={{ fontSize: '14px', color: '#666' }}>Failing Courses</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f44336' }}>
              {analytics.failingCoursesCount}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '14px', color: '#666' }}>Low Grades</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff9800' }}>
              {analytics.lowGradesCount}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '14px', color: '#666' }}>Total Courses</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>
              {analytics.totalCourses}
            </div>
          </div>
        </div>
      </div>

      {/* Performance Trends */}
      <div style={{
        backgroundColor: 'white',
        padding: '25px',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        marginBottom: '25px'
      }}>
        <h3 style={{ marginBottom: '20px' }}>Performance Trends {getTrendIcon()}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {analytics.semesterGPAs && analytics.semesterGPAs.length > 0 ? (
            analytics.semesterGPAs.map((sem, index) => (
              <div key={index}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 'bold' }}>{sem.semester}</span>
                  <span style={{ fontWeight: 'bold', color: '#1976d2' }}>
                    GPA: {sem.gpa.toFixed(2)} / 4.0
                  </span>
                </div>
                <div style={{
                  height: '12px',
                  backgroundColor: '#f0f0f0',
                  borderRadius: '6px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${(sem.gpa / 4) * 100}%`,
                    height: '100%',
                    backgroundColor: sem.gpa >= 3.0 ? '#4caf50' : sem.gpa >= 2.0 ? '#ff9800' : '#f44336',
                    borderRadius: '6px',
                    transition: 'width 0.3s'
                  }}></div>
                </div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                  {sem.courses} courses • {sem.credits} credits
                </div>
              </div>
            ))
          ) : (
            <p style={{ color: '#666', textAlign: 'center' }}>No semester data available</p>
          )}
        </div>
      </div>

      {/* Grade Distribution */}
      <div style={{
        backgroundColor: 'white',
        padding: '25px',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        marginBottom: '25px'
      }}>
        <h3 style={{ marginBottom: '20px' }}>Grade Distribution</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '15px' }}>
          {Object.entries(analytics.gradeDistribution).map(([grade, count]) => (
            <div key={grade} style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color: grade === 'A' ? '#4caf50' : 
                       grade === 'B' ? '#2196f3' : 
                       grade === 'C' ? '#ff9800' : 
                       grade === 'D' ? '#ff5722' : '#f44336'
              }}>
                {count}
              </div>
              <div style={{ color: '#666', fontSize: '14px' }}>Grade {grade}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Overall Statistics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '25px',
          borderRadius: '10px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#1976d2' }}>
            {analytics.overallGPA.toFixed(2)}
          </div>
          <div style={{ color: '#666', marginTop: '10px' }}>Overall GPA</div>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '25px',
          borderRadius: '10px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#2e7d32' }}>
            {analytics.totalCredits}
          </div>
          <div style={{ color: '#666', marginTop: '10px' }}>Total Credits</div>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '25px',
          borderRadius: '10px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#ed6c02' }}>
            {analytics.totalCourses}
          </div>
          <div style={{ color: '#666', marginTop: '10px' }}>Total Courses</div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;

