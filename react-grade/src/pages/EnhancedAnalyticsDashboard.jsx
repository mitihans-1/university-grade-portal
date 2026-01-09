import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../utils/api';
import { generateAdminReportPDF } from '../utils/pdfGenerator';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
    AreaChart, Area
} from 'recharts';

const COLORS = ['#4caf50', '#2196f3', '#ff9800', '#f44336', '#9c27b0'];

const EnhancedAnalyticsDashboard = () => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [analytics, setAnalytics] = useState(null);
    const [adminOverview, setAdminOverview] = useState(null);
    const [selectedView, setSelectedView] = useState('overview');

    useEffect(() => {
        fetchAnalytics();
    }, [user]);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);

            if (user.permissions?.includes('view_analytics')) {
                const overview = await api.getAdminAnalytics();
                setAdminOverview(overview);
            } else if (user.permissions?.includes('view_own_grades') && !user.permissions?.includes('view_child_grades')) {
                const studentAnalytics = await api.getStudentAnalytics(user.studentId);
                setAnalytics(studentAnalytics);
            } else if (user.permissions?.includes('view_child_grades') && user.studentId) {
                const studentAnalytics = await api.getStudentAnalytics(user.studentId);
                setAnalytics(studentAnalytics);
            }
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExportAdminPDF = () => {
        if (adminOverview) {
            generateAdminReportPDF(adminOverview);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                <div style={{ fontSize: '48px' }}>📊</div>
                <p style={{ marginLeft: '20px', fontSize: '18px', color: '#666' }}>Loading Analytics...</p>
            </div>
        );
    }

    // Admin View
    if (user.permissions?.includes('view_analytics') && adminOverview) {
        const gradeDistData = [
            { name: 'A', value: adminOverview.gradeDistribution.A, color: '#4caf50' },
            { name: 'B', value: adminOverview.gradeDistribution.B, color: '#2196f3' },
            { name: 'C', value: adminOverview.gradeDistribution.C, color: '#ff9800' },
            { name: 'D', value: adminOverview.gradeDistribution.D, color: '#f44336' },
            { name: 'F', value: adminOverview.gradeDistribution.F, color: '#9c27b0' }
        ];

        return (
            <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <div>
                        <h1 style={{ margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <span style={{ fontSize: '40px' }}>📊</span>
                            University Analytics Dashboard
                        </h1>
                        <p style={{ color: '#666', fontSize: '16px' }}>Comprehensive insights into academic performance</p>
                    </div>
                    <button
                        onClick={handleExportAdminPDF}
                        style={{
                            padding: '12px 24px',
                            backgroundColor: '#f44336',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: '0 2px 8px rgba(244,67,54,0.3)',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#d32f2f';
                            e.target.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.backgroundColor = '#f44336';
                            e.target.style.transform = 'translateY(0)';
                        }}
                    >
                        📄 Export PDF Report
                    </button>
                </div>

                {/* Key Metrics Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                    <MetricCard
                        icon="🎓"
                        title="Total Students"
                        value={adminOverview.totalStudents}
                        color="#1976d2"
                        subtitle="Enrolled"
                    />
                    <MetricCard
                        icon="📚"
                        title="Total Grades"
                        value={adminOverview.totalGrades}
                        color="#2e7d32"
                        subtitle="Recorded"
                    />
                    <MetricCard
                        icon="⭐"
                        title="University GPA"
                        value={adminOverview.averageUniversityGPA}
                        color="#ed6c02"
                        subtitle="Average"
                    />
                    <MetricCard
                        icon="⚠️"
                        title="At-Risk Students"
                        value={adminOverview.atRiskStudents.length}
                        color="#d32f2f"
                        subtitle="Need Support"
                    />
                </div>

                {/* Charts Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '25px' }}>

                    {/* Grade Distribution Pie Chart */}
                    <ChartCard title="📈 Grade Distribution">
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={gradeDistData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {gradeDistData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    {/* Department Performance Bar Chart */}
                    <ChartCard title="🏛️ Department Performance">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={adminOverview.departmentBreakdown}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="department" angle={-15} textAnchor="end" height={80} />
                                <YAxis domain={[0, 4]} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="avgGPA" fill="#1976d2" name="Average GPA" />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    {/* Department Student Count */}
                    <ChartCard title="👥 Students by Department">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={adminOverview.departmentBreakdown} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis dataKey="department" type="category" width={150} />
                                <Tooltip />
                                <Bar dataKey="studentCount" fill="#2e7d32" name="Students" />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    {/* At-Risk Students List */}
                    <ChartCard title="⚠️ At-Risk Students">
                        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            {adminOverview.atRiskStudents.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px', color: '#4caf50' }}>
                                    <div style={{ fontSize: '48px', marginBottom: '10px' }}>✅</div>
                                    <p>No students at risk!</p>
                                </div>
                            ) : (
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                                            <th style={{ padding: '10px', textAlign: 'left' }}>Student</th>
                                            <th style={{ padding: '10px', textAlign: 'left' }}>Department</th>
                                            <th style={{ padding: '10px', textAlign: 'center' }}>GPA</th>
                                            <th style={{ padding: '10px', textAlign: 'center' }}>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {adminOverview.atRiskStudents.map((student, idx) => (
                                            <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                                                <td style={{ padding: '10px' }}>{student.name}</td>
                                                <td style={{ padding: '10px' }}>{student.department}</td>
                                                <td style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold', color: '#d32f2f' }}>
                                                    {student.gpa}
                                                </td>
                                                <td style={{ padding: '10px', textAlign: 'center' }}>
                                                    {student.hasFailing && <span style={{ color: '#d32f2f' }}>❌ Failing</span>}
                                                    {!student.hasFailing && <span style={{ color: '#ff9800' }}>⚠️ Low GPA</span>}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </ChartCard>
                </div>
            </div>
        );
    }

    // Student/Parent View
    if (analytics) {
        const semesterData = analytics.semesterGPAs.map(s => ({
            semester: s.semester,
            GPA: s.gpa,
            courses: s.courses
        }));

        const gradeDistData = [
            { name: 'A', value: analytics.gradeDistribution.A, color: '#4caf50' },
            { name: 'B', value: analytics.gradeDistribution.B, color: '#2196f3' },
            { name: 'C', value: analytics.gradeDistribution.C, color: '#ff9800' },
            { name: 'D', value: analytics.gradeDistribution.D, color: '#f44336' },
            { name: 'F', value: analytics.gradeDistribution.F, color: '#9c27b0' }
        ];

        return (
            <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
                <div style={{ marginBottom: '30px' }}>
                    <h1 style={{ margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <span style={{ fontSize: '40px' }}>📊</span>
                        Academic Performance Analytics
                    </h1>
                    <p style={{ color: '#666', fontSize: '16px' }}>Track your progress and identify areas for improvement</p>
                </div>

                {/* Performance Overview Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                    <MetricCard
                        icon="⭐"
                        title="Overall GPA"
                        value={analytics.overallGPA.toFixed(2)}
                        color={analytics.overallGPA >= 3.5 ? '#4caf50' : analytics.overallGPA >= 2.5 ? '#ff9800' : '#f44336'}
                        subtitle="Out of 4.0"
                    />
                    <MetricCard
                        icon="📚"
                        title="Total Courses"
                        value={analytics.totalCourses}
                        color="#1976d2"
                        subtitle="Completed"
                    />
                    <MetricCard
                        icon="🎓"
                        title="Total Credits"
                        value={analytics.totalCredits}
                        color="#2e7d32"
                        subtitle="Earned"
                    />
                    <MetricCard
                        icon={analytics.trends.improving ? '📈' : analytics.trends.declining ? '📉' : '➡️'}
                        title="Trend"
                        value={analytics.trends.improving ? 'Improving' : analytics.trends.declining ? 'Declining' : 'Stable'}
                        color={analytics.trends.improving ? '#4caf50' : analytics.trends.declining ? '#f44336' : '#ff9800'}
                        subtitle="Performance"
                    />
                </div>

                {/* Risk Alert */}
                {analytics.riskLevel !== 'low' && (
                    <div style={{
                        padding: '20px',
                        backgroundColor: analytics.riskLevel === 'high' ? '#ffebee' : '#fff3e0',
                        borderLeft: `6px solid ${analytics.riskLevel === 'high' ? '#f44336' : '#ff9800'}`,
                        borderRadius: '8px',
                        marginBottom: '30px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <span style={{ fontSize: '32px' }}>{analytics.riskLevel === 'high' ? '🚨' : '⚠️'}</span>
                            <div>
                                <h3 style={{ margin: '0 0 5px 0', color: analytics.riskLevel === 'high' ? '#c62828' : '#e65100' }}>
                                    {analytics.riskLevel === 'high' ? 'High Risk Alert' : 'Academic Warning'}
                                </h3>
                                <p style={{ margin: 0, fontSize: '14px' }}>
                                    You have {analytics.failingCoursesCount} failing course(s) and {analytics.lowGradesCount} low grade(s).
                                    Please consult with your academic advisor.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Charts Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '25px' }}>

                    {/* GPA Trend Line Chart */}
                    <ChartCard title="📈 GPA Progression">
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={semesterData}>
                                <defs>
                                    <linearGradient id="colorGPA" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#1976d2" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#1976d2" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="semester" />
                                <YAxis domain={[0, 4]} />
                                <Tooltip />
                                <Area type="monotone" dataKey="GPA" stroke="#1976d2" fillOpacity={1} fill="url(#colorGPA)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    {/* Grade Distribution */}
                    <ChartCard title="🎯 Grade Distribution">
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={gradeDistData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {gradeDistData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    {/* Courses per Semester */}
                    <ChartCard title="📚 Course Load by Semester">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={semesterData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="semester" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="courses" fill="#2e7d32" name="Courses" />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    {/* Recent Performance */}
                    <ChartCard title="📋 Recent Course Performance">
                        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd', position: 'sticky', top: 0 }}>
                                        <th style={{ padding: '10px', textAlign: 'left' }}>Course</th>
                                        <th style={{ padding: '10px', textAlign: 'center' }}>Grade</th>
                                        <th style={{ padding: '10px', textAlign: 'center' }}>Score</th>
                                        <th style={{ padding: '10px', textAlign: 'left' }}>Semester</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {analytics.coursePerformance.slice(-10).reverse().map((course, idx) => (
                                        <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                                            <td style={{ padding: '10px' }}>{course.courseName}</td>
                                            <td style={{ padding: '10px', textAlign: 'center' }}>
                                                <span style={{
                                                    padding: '4px 12px',
                                                    borderRadius: '12px',
                                                    backgroundColor: course.grade.startsWith('A') ? '#4caf50' :
                                                        course.grade.startsWith('B') ? '#2196f3' :
                                                            course.grade.startsWith('C') ? '#ff9800' : '#f44336',
                                                    color: 'white',
                                                    fontWeight: 'bold'
                                                }}>
                                                    {course.grade}
                                                </span>
                                            </td>
                                            <td style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>{course.score}%</td>
                                            <td style={{ padding: '10px' }}>{course.semester}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </ChartCard>
                </div>
            </div>
        );
    }

    return (
        <div style={{ textAlign: 'center', padding: '60px' }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>📊</div>
            <h2>No Analytics Data Available</h2>
            <p style={{ color: '#666' }}>Complete some courses to see your performance analytics.</p>
        </div>
    );
};

// Reusable Components
const MetricCard = ({ icon, title, value, color, subtitle }) => {
    return (
        <div style={{
            backgroundColor: 'white',
            padding: '25px',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            borderLeft: `6px solid ${color}`,
            transition: 'transform 0.2s',
            cursor: 'pointer'
        }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
            <div style={{ fontSize: '36px', marginBottom: '10px' }}>{icon}</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: color, marginBottom: '5px' }}>{value}</div>
            <div style={{ fontSize: '14px', color: '#666', fontWeight: '600' }}>{title}</div>
            <div style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>{subtitle}</div>
        </div>
    );
};

const ChartCard = ({ title, children }) => {
    return (
        <div style={{
            backgroundColor: 'white',
            padding: '25px',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
        }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 'bold', color: '#333' }}>{title}</h3>
            {children}
        </div>
    );
};

export default EnhancedAnalyticsDashboard;
