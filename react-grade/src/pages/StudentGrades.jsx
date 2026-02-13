import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../utils/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
    GraduationCap, TrendingUp, Award, Clock, Download,
    Printer, Filter, ChevronRight, BookOpen, AlertCircle
} from 'lucide-react';
import '../admin-dashboard.css';

const StudentGrades = () => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [grades, setGrades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSemester, setSelectedSemester] = useState('all');

    useEffect(() => {
        fetchGrades();
    }, []);

    const fetchGrades = async () => {
        try {
            setLoading(true);
            const data = await api.getMyGrades();
            setGrades(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching grades:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateGPA = (gradeList) => {
        if (!gradeList.length) return '0.00';
        const gradePoints = { 'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7, 'C+': 2.3, 'C': 2.0, 'C-': 1.7, 'D': 1.0, 'F': 0.0 };
        let points = 0, units = 0;
        gradeList.forEach(g => {
            const u = g.creditHours || g.credits || 3;
            points += (gradePoints[g.grade] || 0) * u;
            units += u;
        });
        return (points / (units || 1)).toFixed(2);
    };

    const handlePrint = () => window.print();

    if (loading) return <LoadingSpinner fullScreen />;

    const filteredGrades = selectedSemester === 'all'
        ? grades
        : grades.filter(g => g.semester?.toString() === selectedSemester);

    const gpa = calculateGPA(filteredGrades);
    const totalCredits = filteredGrades.reduce((acc, curr) => acc + (curr.creditHours || curr.credits || 0), 0);

    return (
        <div className="admin-dashboard-container fade-in">
            <header className="admin-header no-print">
                <div>
                    <h1 className="admin-title">Academic Records</h1>
                    <p className="admin-subtitle">Comprehensive performance analytics and transcripts</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={handlePrint} className="admin-btn" style={{ background: 'white', color: '#1e293b' }}>
                        <Printer size={18} /> Print Transcript
                    </button>
                    <button className="admin-btn primary">
                        <Download size={18} /> Export PDF
                    </button>
                </div>
            </header>

            <div className="admin-stats-grid no-print">
                <div className="stat-card-glass">
                    <div className="stat-icon-box" style={{ color: '#3b82f6', background: 'rgba(59, 130, 246, 0.1)' }}>
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <div className="stat-value">{gpa}</div>
                        <div className="stat-label">Cumulative GPA</div>
                    </div>
                </div>
                <div className="stat-card-glass">
                    <div className="stat-icon-box" style={{ color: '#8b5cf6', background: 'rgba(139, 92, 246, 0.1)' }}>
                        <Award size={24} />
                    </div>
                    <div>
                        <div className="stat-value">{totalCredits}</div>
                        <div className="stat-label">Credits Earned</div>
                    </div>
                </div>
                <div className="stat-card-glass">
                    <div className="stat-icon-box" style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.1)' }}>
                        <BookOpen size={24} />
                    </div>
                    <div>
                        <div className="stat-value">{filteredGrades.length}</div>
                        <div className="stat-label">Courses Completed</div>
                    </div>
                </div>
            </div>

            <div className="admin-card">
                <div className="section-title no-print" style={{ justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <GraduationCap size={20} color="#3b82f6" />
                        Semester Results
                    </div>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                        <Filter size={16} color="#64748b" />
                        <select
                            className="form-input"
                            style={{ padding: '8px 12px', fontSize: '0.85rem', width: 'auto' }}
                            value={selectedSemester}
                            onChange={(e) => setSelectedSemester(e.target.value)}
                        >
                            <option value="all">All Semesters</option>
                            <option value="1">Semester 1</option>
                            <option value="2">Semester 2</option>
                            <option value="3">Semester 3</option>
                        </select>
                    </div>
                </div>

                <div className="table-container" style={{ border: 'none', boxShadow: 'none' }}>
                    <table className="dash-table">
                        <thead>
                            <tr>
                                <th>Course Details</th>
                                <th>Code</th>
                                <th>Credits</th>
                                <th>Grade</th>
                                <th>Status</th>
                                <th className="no-print">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredGrades.length > 0 ? filteredGrades.map((g, i) => (
                                <tr key={i} className="table-row-animate">
                                    <td style={{ fontWeight: '600' }}>{g.courseName}</td>
                                    <td style={{ color: '#64748b' }}>{g.courseCode || g.code}</td>
                                    <td>{g.creditHours || g.credits || 3}</td>
                                    <td>
                                        <span className="status-badge" style={{
                                            background: ['A', 'A-'].includes(g.grade) ? '#dcfce7' : '#dbeafe',
                                            color: ['A', 'A-'].includes(g.grade) ? '#15803d' : '#1e40af',
                                            padding: '4px 12px',
                                            borderRadius: '8px',
                                            fontWeight: '800'
                                        }}>
                                            {g.grade}
                                        </span>
                                    </td>
                                    <td>
                                        <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', fontWeight: '600' }}>
                                            Completed
                                        </span>
                                    </td>
                                    <td className="no-print">
                                        <button className="admin-btn" style={{ padding: '6px 12px', fontSize: '0.75rem', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b' }}>
                                            Details
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '100px 0' }}>
                                        <div className="empty-state">
                                            <div className="empty-icon-box">
                                                <AlertCircle size={32} color="#94a3b8" />
                                            </div>
                                            <h4>No records found</h4>
                                            <p>There are no grades matching the selected criteria.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; }
                    .admin-dashboard-container { padding: 0 !important; }
                    .admin-card { border: none !important; box-shadow: none !important; background: transparent !important; }
                    .dash-table th { background: #f1f5f9 !important; -webkit-print-color-adjust: exact; }
                }
            `}</style>
        </div>
    );
};

export default StudentGrades;
