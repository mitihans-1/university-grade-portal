import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { useLanguage } from '../context/LanguageContext';
import { BookOpen, GraduationCap, Award, Calendar, FileText, CheckCircle, TrendingUp, ChevronLeft, Printer, User, Clock, AlertCircle, Sparkles } from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import '../premium-pages.css';

const GradeDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [grade, setGrade] = useState(null);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGradeDetails = async () => {
      try {
        setLoading(true);
        const allGrades = await api.getMyGrades();
        const foundGrade = allGrades.find(g => g.id === parseInt(id));

        if (foundGrade) {
          setGrade(foundGrade);
        } else {
          console.error(t('gradeNotFound'));
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
    if (!gradeLetter) return '#64748b';
    if (gradeLetter.includes('A')) return '#10b981';
    if (gradeLetter.includes('B')) return '#3b82f6';
    if (gradeLetter.includes('C')) return '#f59e0b';
    return '#ef4444';
  };

  const getGradePoint = (gradeLetter) => {
    const gradePoints = {
      'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7,
      'C+': 2.3, 'C': 2.0, 'C-': 1.7, 'D': 1.0, 'F': 0.0
    };
    return gradePoints[gradeLetter] || 0;
  };

  if (loading) return <LoadingSpinner fullScreen />;

  if (!grade) {
    return (
      <div className="premium-page-container fade-in">
        <div className="premium-glass-card" style={{ textAlign: 'center', padding: '100px 20px' }}>
          <AlertCircle size={80} color="#ef4444" style={{ marginBottom: '30px', filter: 'drop-shadow(0 0 20px rgba(239, 68, 68, 0.4))' }} />
          <h2 className="premium-title">{t('gradeNotFound')}</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '30px' }}>{t('gradeNotFoundMessage')}</p>
          <button onClick={() => navigate(-1)} className="premium-btn" style={{ maxWidth: '200px', margin: '0 auto' }}>
            <ChevronLeft size={20} /> {t('goBack')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="premium-page-container fade-in">
      <div className="dashboard-background"></div>

      <div style={{ maxWidth: '1000px', margin: '0 auto', position: 'relative' }}>
        {/* Header Section */}
        <div className="premium-glass-card stagger-item" style={{ padding: '40px', marginBottom: '30px' }}>
          <button
            onClick={() => navigate(-1)}
            className="premium-btn"
            style={{ padding: '8px 20px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', marginBottom: '30px', fontSize: '14px', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <ChevronLeft size={18} /> {t('back')}
          </button>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '30px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--primary)', marginBottom: '10px' }}>
                <BookOpen size={20} />
                <span style={{ fontWeight: '900', letterSpacing: '2px', fontSize: '0.8rem', textTransform: 'uppercase' }}>{t('academicRecord')}</span>
              </div>
              <h1 className="premium-title" style={{ textAlign: 'left', fontSize: '2.5rem', marginBottom: '10px' }}>{grade.courseName}</h1>
              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
                <span className="year-badge" style={{ padding: '4px 12px', fontSize: '0.8rem' }}>{grade.courseCode}</span>
                <span style={{ color: 'var(--text-muted)', fontWeight: '700' }}>•</span>
                <span style={{ color: 'var(--text-muted)', fontWeight: '700' }}>{grade.semester}</span>
                <span style={{ color: 'var(--text-muted)', fontWeight: '700' }}>•</span>
                <span style={{ color: 'var(--text-muted)', fontWeight: '700' }}>{grade.academicYear}</span>
              </div>
            </div>

            <div className="icon-glow" style={{
              width: '120px', height: '120px', borderRadius: '30px',
              background: 'rgba(255,255,255,0.03)',
              border: `2px solid ${getGradeColor(grade.grade)}`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 0 30px ${getGradeColor(grade.grade)}44`
            }}>
              <span style={{ fontSize: '3rem', fontWeight: '900', color: getGradeColor(grade.grade), lineHeight: 1 }}>{grade.grade}</span>
              <span style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-muted)', marginTop: '5px' }}>{grade.score}%</span>
            </div>
          </div>
        </div>

        <div className="responsive-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', marginBottom: '30px' }}>
          {/* Main Grade Stats */}
          <div className="premium-glass-card stagger-item" style={{ padding: '30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '30px' }}>
              <TrendingUp size={20} className="text-primary" />
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800' }}>{t('performanceMetrics')}</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px', marginBottom: '40px' }}>
              <div className="stat-card" style={{ padding: '20px', background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase', marginBottom: '10px' }}>{t('creditHours')}</div>
                <div style={{ fontSize: '1.8rem', fontWeight: '900', color: 'var(--text-main)' }}>{grade.creditHours || 3}</div>
              </div>
              <div className="stat-card" style={{ padding: '20px', background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase', marginBottom: '10px' }}>{t('gradePoints')}</div>
                <div style={{ fontSize: '1.8rem', fontWeight: '900', color: 'var(--secondary)' }}>{getGradePoint(grade.grade).toFixed(1)}</div>
              </div>
            </div>

            <div style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'center' }}>
                <span style={{ fontWeight: '800', fontSize: '0.9rem', color: 'var(--text-muted)' }}>{t('overallPerformance')}</span>
                <span style={{ fontWeight: '900', fontSize: '1.1rem', color: getGradeColor(grade.grade) }}>{grade.score}%</span>
              </div>
              <div className="health-bar-container" style={{ height: '12px', background: 'rgba(255,255,255,0.05)' }}>
                <div className="health-bar-fill" style={{
                  width: `${grade.score}%`,
                  background: `linear-gradient(90deg, var(--primary), ${getGradeColor(grade.grade)})`,
                  boxShadow: `0 0 15px ${getGradeColor(grade.grade)}66`
                }}></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700' }}>
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          {/* Details & Status */}
          <div className="premium-glass-card stagger-item" style={{ padding: '30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '30px' }}>
              <FileText size={20} className="text-secondary" />
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800' }}>{t('recordDetails')}</h3>
            </div>

            <div className="responsive-stack" style={{ gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 20px', background: 'rgba(255,255,255,0.03)', borderRadius: '15px' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: '700' }}>{t('submissionStatus')}</span>
                <span className={`status-badge ${grade.status === 'published' ? 'status-published' : 'status-pending'}`} style={{ fontSize: '0.75rem' }}>
                  {grade.status === 'published' ? t('published') : t('underReview')}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 20px', background: 'rgba(255,255,255,0.03)', borderRadius: '15px' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: '700' }}>{t('uploadedDate')}</span>
                <span style={{ fontWeight: '900', color: 'var(--text-main)' }}>{new Date(grade.createdAt).toLocaleDateString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 20px', background: 'rgba(255,255,255,0.03)', borderRadius: '15px' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: '700' }}>{t('instructor')}</span>
                <span style={{ fontWeight: '900', color: 'var(--text-main)' }}>{grade.lecturer || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 20px', background: 'rgba(255,255,255,0.03)', borderRadius: '15px' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: '700' }}>{t('parentNotified')}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: grade.notified ? '#10b981' : 'var(--text-muted)', fontWeight: '900' }}>
                  {grade.notified ? <CheckCircle size={16} /> : <Clock size={16} />}
                  {grade.notified ? t('yes') : t('pending')}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Remarks Section */}
        {grade.remarks && (
          <div className="premium-glass-card stagger-item" style={{ padding: '30px', marginBottom: '30px', borderLeft: '5px solid var(--primary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <Sparkles size={20} className="text-primary" />
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800' }}>{t('instructorRemarks')}</h3>
            </div>
            <p style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.1rem', lineHeight: '1.6', fontWeight: '500', fontStyle: 'italic' }}>
              "{grade.remarks}"
            </p>
          </div>
        )}

        {/* Action Bar */}
        <div className="premium-glass-card stagger-item" style={{ padding: '25px', display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <button onClick={() => window.print()} className="premium-btn" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <Printer size={20} /> {t('saveAsPdf')}
          </button>
          <button onClick={() => navigate(-1)} className="premium-btn" style={{ minWidth: '200px' }}>
            {t('backToGrades')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GradeDetails;