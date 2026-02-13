import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
    FileText,
    Plus,
    Calendar,
    Target,
    Layers,
    BookOpen,
    User,
    X,
    Download,
    CheckCircle,
    BarChart2,
    Clock,
    Search,
    ChevronRight,
    Award
} from 'lucide-react';
import '../premium-pages.css';

const TeacherAssignments = () => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [newAssignment, setNewAssignment] = useState({
        title: '',
        description: '',
        courseCode: '',
        courseName: '',
        dueDate: '',
        maxScore: 100,
        academicYear: '2024',
        semester: 'Fall 2024',
        year: 1,
        instructions: '',
        attachment: null
    });

    useEffect(() => {
        fetchAssignments();
    }, []);

    const fetchAssignments = async () => {
        try {
            setLoading(true);
            const data = await api.getTeacherAssignments();
            setAssignments(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching assignments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAssignment = async (e) => {
        e.preventDefault();

        try {
            const formData = new FormData();
            formData.append('title', newAssignment.title);
            formData.append('description', newAssignment.description);
            formData.append('courseCode', newAssignment.courseCode);
            formData.append('courseName', newAssignment.courseName);
            formData.append('dueDate', newAssignment.dueDate);
            formData.append('maxScore', newAssignment.maxScore);
            formData.append('academicYear', newAssignment.academicYear);
            formData.append('semester', newAssignment.semester);
            formData.append('year', newAssignment.year);
            formData.append('instructions', newAssignment.instructions);

            if (newAssignment.attachment) {
                formData.append('attachment', newAssignment.attachment);
            }

            await api.createAssignment(formData);
            alert(t('assignmentCreatedSuccess'));
            setShowCreateModal(false);
            setNewAssignment({
                title: '',
                description: '',
                courseCode: '',
                courseName: '',
                dueDate: '',
                maxScore: 100,
                academicYear: '2024',
                semester: 'Fall 2024',
                year: 1,
                instructions: '',
                attachment: null
            });
            fetchAssignments();
        } catch (error) {
            alert('Error creating assignment: ' + error.message);
        }
    };

    const viewSubmissions = async (assignment) => {
        try {
            const data = await api.getAssignmentSubmissions(assignment.id);
            setSubmissions(Array.isArray(data) ? data : []);
            setSelectedAssignment(assignment);
        } catch (error) {
            alert('Error fetching submissions: ' + error.message);
        }
    };

    const handleGradeSubmission = async (submissionId) => {
        const score = prompt(`${t('score')} (0-${selectedAssignment?.maxScore || 100}):`);
        const feedback = prompt(`${t('remarks')} (${t('optional') || 'optional'}):`);

        if (score === null) return;

        try {
            const formData = new FormData();
            formData.append('score', score);
            if (feedback) formData.append('feedback', feedback);

            await api.gradeSubmission(submissionId, formData);
            alert(t('submissionGradedSuccess'));
            viewSubmissions(selectedAssignment);
        } catch (error) {
            alert('Error grading submission: ' + error.message);
        }
    };

    const downloadFile = async (type, id, filename) => {
        try {
            const blob = await api.downloadAssignmentFile(type, id);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename || 'download';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            alert('Error downloading file: ' + error.message);
        }
    };

    const filteredAssignments = assignments.filter(a =>
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.courseCode.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) return <LoadingSpinner fullScreen />;

    return (
        <div className="premium-page-container fade-in">
            <div className="premium-glass-card">
                <header style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <h1 className="premium-title">{t('myAssignments')}</h1>
                    <div className="year-badge" style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', background: 'transparent', boxShadow: 'none', animation: 'none' }}>
                        <span style={{ fontSize: '1rem', fontWeight: '700', opacity: 0.9 }}>FACULTY CONTROL</span>
                        <span style={{ opacity: 0.4 }}>|</span>
                        <span style={{ fontSize: '1.4rem', fontWeight: '900', color: '#fff', textShadow: '0 2px 10px rgba(0,198,255,0.4)', background: 'rgba(255,255,255,0.1)', padding: '2px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)' }}>
                            {user.name}
                        </span>
                        <span style={{ opacity: 0.4 }}>|</span>
                        <span style={{ fontWeight: '500', opacity: 0.9, letterSpacing: '1px' }}>ID: {user.teacherId}</span>
                    </div>
                </header>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', flexWrap: 'wrap', gap: '20px' }}>
                    <div style={{ position: 'relative', flex: 1, minWidth: '300px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                        <input
                            type="text"
                            placeholder={t('searchAssignments')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="premium-input"
                            style={{ width: '100%', paddingLeft: '45px' }}
                        />
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="premium-btn hover-scale"
                        style={{ height: '50px', padding: '0 30px', background: 'linear-gradient(45deg, #00c9ff, #92fe9d)', color: '#0f172a', border: 'none' }}
                    >
                        <Plus size={18} />
                        <span style={{ marginLeft: '10px' }}>{t('createAssignment')}</span>
                    </button>
                </div>

                <div style={{ display: 'grid', gap: '25px' }}>
                    {filteredAssignments.map((assignment) => (
                        <div
                            key={assignment.id}
                            style={{
                                background: 'rgba(255,255,255,0.05)',
                                padding: '30px',
                                borderRadius: '25px',
                                border: '1px solid rgba(255,255,255,0.1)',
                                position: 'relative',
                                overflow: 'hidden',
                                transition: 'all 0.3s ease'
                            }}
                            className="info-card"
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
                                <div style={{ flex: 1, minWidth: '300px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                        <span style={{ fontSize: '11px', fontWeight: '900', color: '#00c9ff', textTransform: 'uppercase', letterSpacing: '1px', background: 'rgba(0, 201, 255, 0.1)', padding: '4px 12px', borderRadius: '50px' }}>
                                            {assignment.courseCode}
                                        </span>
                                        <span style={{ fontSize: '0.85rem', opacity: 0.7, fontWeight: '700' }}>{assignment.courseName}</span>
                                    </div>
                                    <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '10px', color: 'white' }}>{assignment.title}</h3>
                                    <p style={{ opacity: 0.7, fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '20px' }}>{assignment.description}</p>

                                    <div style={{ display: 'flex', gap: '20px', fontSize: '0.85rem', opacity: 0.6, flexWrap: 'wrap' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Calendar size={14} /> {t('due')}: {new Date(assignment.dueDate).toLocaleDateString()}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Target size={14} /> {t('points')}: {assignment.maxScore}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Layers size={14} /> {assignment.semester} ({assignment.academicYear})
                                        </div>
                                    </div>
                                </div>

                                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <div style={{
                                        padding: '8px 16px',
                                        background: assignment.status === 'active' ? 'rgba(146, 254, 157, 0.1)' : 'rgba(255, 75, 43, 0.1)',
                                        border: `1px solid ${assignment.status === 'active' ? 'rgba(146, 254, 157, 0.2)' : 'rgba(255, 75, 43, 0.2)'}`,
                                        color: assignment.status === 'active' ? '#92fe9d' : '#ff4b2b',
                                        borderRadius: '50px',
                                        fontSize: '11px',
                                        fontWeight: '900',
                                        textTransform: 'uppercase',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        justifyContent: 'center'
                                    }}>
                                        {assignment.status === 'active' ? <CheckCircle size={14} /> : <Clock size={14} />}
                                        {assignment.status}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', fontWeight: '700', opacity: 0.5 }}>
                                        {t('yearNumber').replace('{year}', assignment.year)}
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '10px' }}>
                                <button
                                    onClick={() => viewSubmissions(assignment)}
                                    className="premium-btn hover-scale"
                                    style={{ padding: '12px 25px', fontSize: '13px', background: 'rgba(0, 201, 255, 0.1)', color: '#00c9ff', border: '1px solid rgba(0, 201, 255, 0.2)' }}
                                >
                                    <BarChart2 size={16} />
                                    <span style={{ marginLeft: '8px' }}>{t('viewSubmissions')} ({assignment.submissionsCount || 0})</span>
                                </button>

                                {assignment.attachmentPath && (
                                    <button
                                        onClick={() => downloadFile('assignment', assignment.id, `${assignment.title}_instructions`)}
                                        className="premium-btn hover-scale"
                                        style={{ padding: '12px 25px', fontSize: '13px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}
                                    >
                                        <Download size={16} />
                                        <span style={{ marginLeft: '8px' }}>{t('guide')}</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}

                    {filteredAssignments.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '100px', background: 'rgba(255,255,255,0.02)', borderRadius: '30px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                            <BookOpen size={60} style={{ opacity: 0.2, marginBottom: '20px' }} />
                            <h3 style={{ opacity: 0.5 }}>{t('noAssignmentsYet')}</h3>
                            <button onClick={() => setShowCreateModal(true)} className="premium-btn" style={{ marginTop: '20px', background: 'transparent', border: '1px solid #00c9ff', color: '#00c9ff' }}>
                                {t('createFirstAssignment')}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Assignment Modal */}
            {showCreateModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }} className="fade-in">
                    <div className="premium-glass-card" style={{ maxWidth: '700px', width: '100%', maxHeight: '90vh', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '900' }}>{t('createNewAssignment')}</h2>
                            <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', opacity: 0.5 }}><X /></button>
                        </div>

                        <form onSubmit={handleCreateAssignment}>
                            <div style={{ display: 'grid', gap: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', opacity: 0.5, textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '1px' }}>{t('assignmentTitle')}</label>
                                    <input
                                        type="text"
                                        placeholder={t('assignmentTitle')}
                                        value={newAssignment.title}
                                        onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                                        required
                                        className="premium-input"
                                        style={{ width: '100%' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', opacity: 0.5, textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '1px' }}>{t('description')}</label>
                                    <textarea
                                        placeholder={t('description')}
                                        value={newAssignment.description}
                                        onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                                        className="premium-input"
                                        style={{ width: '100%', minHeight: '100px' }}
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', opacity: 0.5, textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '1px' }}>{t('courseCode')}</label>
                                        <input
                                            type="text"
                                            placeholder="CS101"
                                            value={newAssignment.courseCode}
                                            onChange={(e) => setNewAssignment({ ...newAssignment, courseCode: e.target.value })}
                                            required
                                            className="premium-input"
                                            style={{ width: '100%' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', opacity: 0.5, textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '1px' }}>{t('courseName')}</label>
                                        <input
                                            type="text"
                                            placeholder="Computer Science"
                                            value={newAssignment.courseName}
                                            onChange={(e) => setNewAssignment({ ...newAssignment, courseName: e.target.value })}
                                            required
                                            className="premium-input"
                                            style={{ width: '100%' }}
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', opacity: 0.5, textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '1px' }}>{t('dueDate')}</label>
                                        <input
                                            type="datetime-local"
                                            value={newAssignment.dueDate}
                                            onChange={(e) => setNewAssignment({ ...newAssignment, dueDate: e.target.value })}
                                            required
                                            className="premium-input"
                                            style={{ width: '100%' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', opacity: 0.5, textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '1px' }}>{t('maxScore')}</label>
                                        <input
                                            type="number"
                                            placeholder="100"
                                            value={newAssignment.maxScore}
                                            onChange={(e) => setNewAssignment({ ...newAssignment, maxScore: e.target.value })}
                                            className="premium-input"
                                            style={{ width: '100%' }}
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', opacity: 0.5, textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '1px' }}>{t('year')}</label>
                                        <select
                                            value={newAssignment.year}
                                            onChange={(e) => setNewAssignment({ ...newAssignment, year: e.target.value })}
                                            className="premium-input"
                                            style={{ width: '100%' }}
                                        >
                                            <option value="1">Year 1</option>
                                            <option value="2">Year 2</option>
                                            <option value="3">Year 3</option>
                                            <option value="4">Year 4</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', opacity: 0.5, textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '1px' }}>{t('semester')}</label>
                                        <select
                                            value={newAssignment.semester}
                                            onChange={(e) => setNewAssignment({ ...newAssignment, semester: e.target.value })}
                                            className="premium-input"
                                            style={{ width: '100%' }}
                                        >
                                            <option value="Fall 2024">Fall 2024</option>
                                            <option value="Spring 2025">Spring 2025</option>
                                            <option value="Summer 2025">Summer 2025</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', opacity: 0.5, textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '1px' }}>{t('academicYear')}</label>
                                        <input
                                            type="text"
                                            value={newAssignment.academicYear}
                                            onChange={(e) => setNewAssignment({ ...newAssignment, academicYear: e.target.value })}
                                            className="premium-input"
                                            style={{ width: '100%' }}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', opacity: 0.5, textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '1px' }}>{t('instructions')}</label>
                                    <textarea
                                        placeholder={t('instructions')}
                                        value={newAssignment.instructions}
                                        onChange={(e) => setNewAssignment({ ...newAssignment, instructions: e.target.value })}
                                        className="premium-input"
                                        style={{ width: '100%', minHeight: '80px' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', opacity: 0.5, textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '1px' }}>{t('attachment')}</label>
                                    <div style={{ position: 'relative', height: '60px', background: 'rgba(255,255,255,0.03)', borderRadius: '15px', border: '1px dashed rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                        <Plus style={{ opacity: 0.3, marginRight: '10px' }} />
                                        <span style={{ fontSize: '0.9rem', opacity: 0.4 }}>{newAssignment.attachment ? newAssignment.attachment.name : t('uploadGuide')}</span>
                                        <input
                                            type="file"
                                            onChange={(e) => setNewAssignment({ ...newAssignment, attachment: e.target.files[0] })}
                                            accept=".pdf,.doc,.docx,.txt"
                                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                                        />
                                    </div>
                                </div>

                                <button type="submit" className="premium-btn hover-scale" style={{ width: '100%', height: '60px', marginTop: '20px', background: 'linear-gradient(45deg, #00c9ff, #92fe9d)', color: '#0f172a', border: 'none', fontSize: '1rem' }}>
                                    {t('createAssignment')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Submissions Modal */}
            {selectedAssignment && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }} className="fade-in">
                    <div className="premium-glass-card" style={{ maxWidth: '1000px', width: '100%', maxHeight: '90vh', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                            <div>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: '900' }}>{t('submissions')}</h2>
                                <p style={{ opacity: 0.5, fontSize: '0.9rem' }}>{selectedAssignment.title} • {selectedAssignment.courseCode}</p>
                            </div>
                            <button onClick={() => setSelectedAssignment(null)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', opacity: 0.5 }}><X /></button>
                        </div>

                        {submissions.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '100px', opacity: 0.3 }}>
                                <BarChart2 size={50} style={{ marginBottom: '15px' }} />
                                <h3>{t('noSubmissionsYet')}</h3>
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table className="premium-table">
                                    <thead>
                                        <tr>
                                            <th>{t('student')}</th>
                                            <th>{t('date')}</th>
                                            <th>{t('status')}</th>
                                            <th>{t('score')}</th>
                                            <th>{t('actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {submissions.map((sub) => (
                                            <tr key={sub.id}>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <div style={{ width: '35px', height: '35px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '0.8rem' }}>
                                                            {sub.student?.name?.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: '800' }}>{sub.student?.name}</div>
                                                            <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>{sub.student?.studentId}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ fontSize: '0.9rem' }}>{new Date(sub.submittedAt).toLocaleDateString()}</div>
                                                    {sub.isLate && <span style={{ color: '#ff4b2b', fontSize: '0.7rem', fontWeight: '900' }}>⚠️ {t('late').toUpperCase()}</span>}
                                                </td>
                                                <td>
                                                    <span style={{
                                                        padding: '4px 12px', borderRadius: '50px', fontSize: '10px', fontWeight: '900',
                                                        background: sub.status === 'graded' ? 'rgba(146, 254, 157, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                                        color: sub.status === 'graded' ? '#92fe9d' : '#f59e0b',
                                                        border: `1px solid ${sub.status === 'graded' ? 'rgba(146, 254, 157, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`,
                                                        textTransform: 'uppercase'
                                                    }}>
                                                        {sub.status}
                                                    </span>
                                                </td>
                                                <td style={{ fontWeight: '900' }}>
                                                    {sub.score !== null ? `${sub.score} / ${selectedAssignment.maxScore}` : '-'}
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <button
                                                            onClick={() => downloadFile('submission', sub.id, `${sub.student?.name}_assignment`)}
                                                            className="premium-btn hover-scale"
                                                            style={{ padding: '8px 15px', fontSize: '11px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}
                                                        >
                                                            <Download size={12} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleGradeSubmission(sub.id)}
                                                            className="premium-btn hover-scale"
                                                            style={{ padding: '8px 15px', fontSize: '11px', background: 'linear-gradient(45deg, #00c9ff, #92fe9d)', color: '#0f172a', border: 'none' }}
                                                        >
                                                            <Award size={12} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <div style={{ marginTop: '30px', textAlign: 'right' }}>
                            <button onClick={() => setSelectedAssignment(null)} className="premium-btn" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                {t('close')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherAssignments;
