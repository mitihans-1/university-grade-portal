import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useToast } from '../components/common/Toast';

const AdminReportCard = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [studentId, setStudentId] = useState('');
    const [academicYear, setAcademicYear] = useState('2024');
    const [semester, setSemester] = useState('Fall 2024');
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [remarks, setRemarks] = useState('');
    const [sendingEmail, setSendingEmail] = useState(false);

    const fetchReportData = async () => {
        if (!studentId) {
            showToast('Please enter a Student ID', 'error');
            return;
        }
        try {
            setLoading(true);
            const data = await api.getStudentReportData(studentId, academicYear, semester);
            setReportData(data);
            setRemarks(data.report?.remarks || '');
        } catch (error) {
            showToast('Error fetching student data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveRemarks = async () => {
        try {
            await api.saveReportRemarks({
                studentId,
                academicYear,
                semester,
                remarks
            });
            showToast('Remarks saved successfully!', 'success');
        } catch (error) {
            showToast('Failed to save remarks', 'error');
        }
    };

    const handleEmailReport = async () => {
        try {
            setSendingEmail(true);
            await api.emailReportCard({
                studentId,
                academicYear,
                semester
            });
            showToast('Report card emailed successfully to parent!', 'success');
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            setSendingEmail(false);
        }
    };

    const calculateGPA = () => {
        if (!reportData?.grades) return '0.00';
        const gradePoints = { 'A': 4, 'A-': 3.7, 'B+': 3.3, 'B': 3, 'B-': 2.7, 'C+': 2.3, 'C': 2, 'C-': 1.7, 'D': 1, 'F': 0 };
        let totalPoints = 0;
        let totalCredits = 0;
        reportData.grades.forEach(g => {
            const credits = g.creditHours || 3;
            totalPoints += (gradePoints[g.grade] || 0) * credits;
            totalCredits += credits;
        });
        return totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';
    };

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
            <div style={{
                backgroundColor: 'white',
                padding: '30px',
                borderRadius: '15px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                marginBottom: '30px'
            }}>
                <h1 style={{ color: '#1976d2', marginBottom: '20px' }}>⭐ Digital Report Card Generator</h1>
                <p style={{ color: '#666', marginBottom: '30px' }}>Generate professional report cards with GPA, attendance, and custom teacher remarks.</p>

                <div className="responsive-grid" style={{ marginBottom: '20px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Student ID</label>
                        <input
                            type="text"
                            placeholder="e.g. UGR/1234/14"
                            value={studentId}
                            onChange={(e) => setStudentId(e.target.value)}
                            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Academic Year</label>
                        <select
                            value={academicYear}
                            onChange={(e) => setAcademicYear(e.target.value)}
                            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
                        >
                            <option value="2024">2024</option>
                            <option value="2025">2025</option>
                            <option value="2026">2026</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Semester</label>
                        <select
                            value={semester}
                            onChange={(e) => setSemester(e.target.value)}
                            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
                        >
                            <option value="Fall 2024">Fall 2024</option>
                            <option value="Spring 2025">Spring 2025</option>
                            <option value="Summer 2025">Summer 2025</option>
                        </select>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                        <button
                            onClick={fetchReportData}
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '12px',
                                backgroundColor: '#1976d2',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                            }}
                        >
                            {loading ? '🔍 Finding...' : '🔍 Generate Preview'}
                        </button>
                    </div>
                </div>
            </div>

            {reportData && (
                <div style={{ animation: 'fadeIn 0.5s ease-in' }}>
                    {/* Report Preview */}
                    <div id="report-preview" style={{
                        backgroundColor: 'white',
                        padding: '40px',
                        borderRadius: '15px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                        marginBottom: '30px',
                        border: '1px solid #eee'
                    }}>
                        <div style={{ textAlign: 'center', borderBottom: '3px solid #1976d2', paddingBottom: '20px', marginBottom: '30px' }}>
                            <h2 style={{ color: '#1976d2', margin: 0 }}>UNIVERSITY GRADE PORTAL</h2>
                            <h3 style={{ color: '#666', marginTop: '5px' }}>Official Semester Report Card</h3>
                        </div>

                        <div className="responsive-grid" style={{ gap: '40px', marginBottom: '30px' }}>
                            <div>
                                <p><strong>Student Name:</strong> {reportData.student.name}</p>
                                <p><strong>Student ID:</strong> {reportData.student.studentId}</p>
                                <p><strong>Department:</strong> {reportData.student.department}</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <p><strong>Academic Year:</strong> {academicYear}</p>
                                <p><strong>Semester:</strong> {semester}</p>
                                <p><strong>Attendance:</strong> <span style={{ color: '#2e7d32', fontWeight: 'bold' }}>{reportData.attendance.percentage}%</span></p>
                            </div>
                        </div>

                        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#1976d2', color: 'white' }}>
                                    <th style={{ padding: '12px', textAlign: 'left' }}>Course Code</th>
                                    <th style={{ padding: '12px', textAlign: 'left' }}>Course Name</th>
                                    <th style={{ padding: '12px', textAlign: 'center' }}>Grade</th>
                                    <th style={{ padding: '12px', textAlign: 'center' }}>Score</th>
                                    <th style={{ padding: '12px', textAlign: 'center' }}>Credits</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reportData.grades.map((grade, index) => (
                                    <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '12px' }}>{grade.courseCode}</td>
                                        <td style={{ padding: '12px' }}>{grade.courseName}</td>
                                        <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>{grade.grade}</td>
                                        <td style={{ padding: '12px', textAlign: 'center' }}>{grade.score}%</td>
                                        <td style={{ padding: '12px', textAlign: 'center' }}>{grade.creditHours || 3}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '30px' }}>
                            <div style={{ backgroundColor: '#e3f2fd', padding: '15px 30px', borderRadius: '10px', textAlign: 'center' }}>
                                <div style={{ fontSize: '14px', color: '#1565c0', fontWeight: 'bold' }}>SEMESTER GPA</div>
                                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#0d47a1' }}>{calculateGPA()}</div>
                            </div>
                        </div>

                        <div style={{ marginBottom: '30px' }}>
                            <h4 style={{ color: '#1976d2', marginBottom: '10px' }}>Teacher's Remarks</h4>
                            <textarea
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                placeholder="Enter behavioral and academic remarks here..."
                                style={{
                                    width: '100%',
                                    padding: '15px',
                                    borderRadius: '10px',
                                    border: '1px solid #ddd',
                                    minHeight: '100px',
                                    fontSize: '14px',
                                    backgroundColor: '#fffdf9'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                            <button
                                onClick={handleSaveRemarks}
                                style={{
                                    padding: '12px 25px',
                                    backgroundColor: '#4caf50',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                💾 Save Remarks
                            </button>
                            <button
                                onClick={handleEmailReport}
                                disabled={sendingEmail}
                                style={{
                                    padding: '12px 25px',
                                    backgroundColor: '#ff9800',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                {sendingEmail ? '✉️ Sending...' : '✉️ Email to Parent'}
                            </button>
                            <button
                                onClick={() => window.print()}
                                style={{
                                    padding: '12px 25px',
                                    backgroundColor: '#757575',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                🖨️ Print Report
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {loading && <LoadingSpinner />}

            <style>{`
        @media print {
          body * { visibility: hidden; }
          #report-preview, #report-preview * { visibility: visible; }
          #report-preview {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            box-shadow: none;
            padding: 0;
          }
          button, textarea { display: none; }
          textarea { border: none; padding: 0; background: none; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
        </div>
    );
};

export default AdminReportCard;
