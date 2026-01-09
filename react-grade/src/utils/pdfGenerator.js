import jsPDF from 'jspdf';
import 'jspdf-autotable';

// University branding colors
const COLORS = {
    primary: '#1976d2',
    secondary: '#2e7d32',
    accent: '#ed6c02',
    dark: '#333333',
    light: '#666666',
    background: '#f5f5f5'
};

/**
 * Generate Official University Transcript PDF
 */
export const generateTranscriptPDF = (studentData, grades, analytics) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Header - University Logo and Name
    doc.setFillColor(COLORS.primary);
    doc.rect(0, 0, pageWidth, 35, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('UNIVERSITY GRADE PORTAL', pageWidth / 2, 15, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Official Academic Transcript', pageWidth / 2, 25, { align: 'center' });

    // Document Info
    doc.setTextColor(COLORS.dark);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    doc.text(`Generated: ${currentDate}`, pageWidth - 15, 30, { align: 'right' });

    // Student Information Section
    let yPos = 45;
    doc.setFillColor(COLORS.background);
    doc.rect(15, yPos, pageWidth - 30, 45, 'F');

    yPos += 8;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.primary);
    doc.text('STUDENT INFORMATION', 20, yPos);

    yPos += 8;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.dark);

    const studentInfo = [
        [`Name:`, studentData.name || 'N/A'],
        [`Student ID:`, studentData.studentId || 'N/A'],
        [`Department:`, studentData.department || 'N/A'],
        [`Year:`, studentData.year ? `Year ${studentData.year}` : 'N/A']
    ];

    studentInfo.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold');
        doc.text(label, 20, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(value, 60, yPos);
        yPos += 7;
    });

    // Academic Summary Section
    yPos += 5;
    doc.setFillColor(COLORS.secondary);
    doc.rect(15, yPos, pageWidth - 30, 8, 'F');

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('ACADEMIC SUMMARY', 20, yPos + 6);

    yPos += 15;
    doc.setFontSize(10);
    doc.setTextColor(COLORS.dark);

    const summaryData = [
        [`Overall GPA:`, analytics?.overallGPA?.toFixed(2) || 'N/A', `/4.0`],
        [`Total Credits:`, analytics?.totalCredits || '0', `credits`],
        [`Courses Completed:`, analytics?.totalCourses || '0', `courses`],
        [`Performance Trend:`, analytics?.trends?.improving ? 'Improving ↗' :
            analytics?.trends?.declining ? 'Declining ↘' : 'Stable →', '']
    ];

    summaryData.forEach(([label, value, unit]) => {
        doc.setFont('helvetica', 'normal');
        doc.text(label, 20, yPos);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(COLORS.primary);
        doc.text(value, 80, yPos);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(COLORS.light);
        doc.text(unit, 95, yPos);
        doc.setTextColor(COLORS.dark);
        yPos += 7;
    });

    // Grade Details Table
    yPos += 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.primary);
    doc.text('GRADE DETAILS', 20, yPos);

    yPos += 5;

    // Prepare table data
    const tableData = grades.map(grade => [
        grade.courseCode || 'N/A',
        grade.courseName || 'N/A',
        grade.semester || 'N/A',
        grade.grade || 'N/A',
        grade.score ? `${grade.score}%` : 'N/A',
        grade.creditHours || '3'
    ]);

    // Add table
    doc.autoTable({
        startY: yPos,
        head: [['Code', 'Course Name', 'Semester', 'Grade', 'Score', 'Credits']],
        body: tableData,
        theme: 'striped',
        headStyles: {
            fillColor: [25, 118, 210],
            textColor: 255,
            fontStyle: 'bold',
            fontSize: 10
        },
        bodyStyles: {
            fontSize: 9,
            textColor: [51, 51, 51]
        },
        alternateRowStyles: {
            fillColor: [245, 245, 245]
        },
        columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: 60 },
            2: { cellWidth: 30 },
            3: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
            4: { cellWidth: 25, halign: 'center' },
            5: { cellWidth: 20, halign: 'center' }
        },
        margin: { left: 15, right: 15 }
    });

    // Footer
    const finalY = doc.lastAutoTable.finalY + 20;

    if (finalY < pageHeight - 40) {
        // Signature section
        doc.setDrawColor(COLORS.light);
        doc.line(20, finalY, 90, finalY);
        doc.line(pageWidth - 90, finalY, pageWidth - 20, finalY);

        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(COLORS.light);
        doc.text('Registrar Signature', 55, finalY + 5, { align: 'center' });
        doc.text('Date', pageWidth - 55, finalY + 5, { align: 'center' });
    }

    // Document footer
    doc.setFontSize(8);
    doc.setTextColor(COLORS.light);
    doc.text('This is an official document generated by University Grade Portal',
        pageWidth / 2, pageHeight - 15, { align: 'center' });
    doc.text(`Document ID: UGP-${studentData.studentId}-${Date.now()}`,
        pageWidth / 2, pageHeight - 10, { align: 'center' });

    // Save the PDF
    doc.save(`Transcript_${studentData.studentId}_${currentDate.replace(/\s/g, '_')}.pdf`);
};

/**
 * Generate Semester Report PDF
 */
export const generateSemesterReportPDF = (studentData, semester, semesterGrades, semesterGPA) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFillColor(COLORS.accent);
    doc.rect(0, 0, pageWidth, 30, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('SEMESTER GRADE REPORT', pageWidth / 2, 15, { align: 'center' });

    doc.setFontSize(11);
    doc.text(semester, pageWidth / 2, 23, { align: 'center' });

    // Student Info
    let yPos = 45;
    doc.setFontSize(11);
    doc.setTextColor(COLORS.dark);
    doc.setFont('helvetica', 'bold');
    doc.text(`Student: `, 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(studentData.name, 50, yPos);

    yPos += 7;
    doc.setFont('helvetica', 'bold');
    doc.text(`ID: `, 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(studentData.studentId, 50, yPos);

    yPos += 7;
    doc.setFont('helvetica', 'bold');
    doc.text(`Semester GPA: `, 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.primary);
    doc.text(`${semesterGPA.toFixed(2)} / 4.0`, 60, yPos);

    // Grades Table
    yPos += 15;
    const tableData = semesterGrades.map(grade => [
        grade.courseCode,
        grade.courseName,
        grade.grade,
        `${grade.score}%`,
        grade.creditHours || '3'
    ]);

    doc.autoTable({
        startY: yPos,
        head: [['Code', 'Course Name', 'Grade', 'Score', 'Credits']],
        body: tableData,
        theme: 'grid',
        headStyles: {
            fillColor: [237, 108, 2],
            fontSize: 10,
            fontStyle: 'bold'
        },
        bodyStyles: {
            fontSize: 9
        },
        columnStyles: {
            2: { halign: 'center', fontStyle: 'bold' },
            3: { halign: 'center' },
            4: { halign: 'center' }
        }
    });

    doc.save(`Semester_Report_${semester.replace(/\s/g, '_')}_${studentData.studentId}.pdf`);
};

/**
 * Generate Grade Certificate PDF
 */
export const generateGradeCertificatePDF = (studentData, achievement) => {
    const doc = new jsPDF('landscape');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Decorative border
    doc.setLineWidth(2);
    doc.setDrawColor(COLORS.primary);
    doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

    doc.setLineWidth(0.5);
    doc.rect(15, 15, pageWidth - 30, pageHeight - 30);

    // Title
    doc.setFontSize(36);
    doc.setFont('times', 'bold');
    doc.setTextColor(COLORS.primary);
    doc.text('CERTIFICATE OF ACHIEVEMENT', pageWidth / 2, 40, { align: 'center' });

    // Subtitle
    doc.setFontSize(14);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(COLORS.light);
    doc.text('This certifies that', pageWidth / 2, 60, { align: 'center' });

    // Student Name
    doc.setFontSize(28);
    doc.setFont('times', 'bold');
    doc.setTextColor(COLORS.dark);
    doc.text(studentData.name.toUpperCase(), pageWidth / 2, 80, { align: 'center' });

    // Achievement
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.light);
    doc.text('has successfully achieved', pageWidth / 2, 100, { align: 'center' });

    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.secondary);
    doc.text(achievement, pageWidth / 2, 115, { align: 'center' });

    // GPA
    doc.setFontSize(16);
    doc.setTextColor(COLORS.dark);
    doc.text(`with a GPA of ${studentData.gpa}`, pageWidth / 2, 130, { align: 'center' });

    // Date
    doc.setFontSize(12);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(COLORS.light);
    const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    doc.text(`Issued on ${date}`, pageWidth / 2, 150, { align: 'center' });

    // Signature line
    doc.setLineWidth(0.5);
    doc.line(pageWidth / 2 - 40, 175, pageWidth / 2 + 40, 175);
    doc.setFontSize(10);
    doc.text('University Registrar', pageWidth / 2, 182, { align: 'center' });

    doc.save(`Certificate_${studentData.studentId}_${achievement.replace(/\s/g, '_')}.pdf`);
};

/**
 * Generate Admin Report PDF (University-wide statistics)
 */
export const generateAdminReportPDF = (adminData) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFillColor(COLORS.primary);
    doc.rect(0, 0, pageWidth, 35, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('UNIVERSITY ANALYTICS REPORT', pageWidth / 2, 15, { align: 'center' });

    doc.setFontSize(11);
    const date = new Date().toLocaleDateString();
    doc.text(`Report Date: ${date}`, pageWidth / 2, 25, { align: 'center' });

    // Summary Statistics
    let yPos = 50;
    doc.setFontSize(14);
    doc.setTextColor(COLORS.primary);
    doc.setFont('helvetica', 'bold');
    doc.text('UNIVERSITY OVERVIEW', 20, yPos);

    yPos += 10;
    doc.setFontSize(11);
    doc.setTextColor(COLORS.dark);
    doc.setFont('helvetica', 'normal');

    const stats = [
        [`Total Students:`, adminData.totalStudents],
        [`Total Grades Recorded:`, adminData.totalGrades],
        [`University Average GPA:`, adminData.averageUniversityGPA],
        [`At-Risk Students:`, adminData.atRiskStudents?.length || 0]
    ];

    stats.forEach(([label, value]) => {
        doc.text(label, 20, yPos);
        doc.setFont('helvetica', 'bold');
        doc.text(String(value), 100, yPos);
        doc.setFont('helvetica', 'normal');
        yPos += 8;
    });

    // Department Performance Table
    yPos += 10;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.primary);
    doc.text('DEPARTMENT PERFORMANCE', 20, yPos);

    yPos += 5;
    const deptData = adminData.departmentBreakdown?.map(dept => [
        dept.department,
        dept.studentCount,
        dept.avgGPA,
        dept.coursesCount
    ]) || [];

    doc.autoTable({
        startY: yPos,
        head: [['Department', 'Students', 'Avg GPA', 'Courses']],
        body: deptData,
        theme: 'striped',
        headStyles: {
            fillColor: [25, 118, 210],
            fontSize: 10,
            fontStyle: 'bold'
        },
        columnStyles: {
            1: { halign: 'center' },
            2: { halign: 'center', fontStyle: 'bold' },
            3: { halign: 'center' }
        }
    });

    doc.save(`University_Report_${date.replace(/\//g, '-')}.pdf`);
};

export default {
    generateTranscriptPDF,
    generateSemesterReportPDF,
    generateGradeCertificatePDF,
    generateAdminReportPDF
};
