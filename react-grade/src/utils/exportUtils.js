// Utility functions for exporting grades/transcripts

export const exportToCSV = (grades, studentInfo) => {
  const headers = ['Course Code', 'Course Name', 'Grade', 'Score', 'Credit Hours', 'Semester', 'Academic Year'];
  const rows = grades.map(grade => [
    grade.courseCode || '',
    grade.courseName || '',
    grade.grade || '',
    grade.score || '',
    grade.creditHours || '',
    grade.semester || '',
    grade.academicYear || ''
  ]);

  const csvContent = [
    [`Student: ${studentInfo?.name || 'Unknown'}`],
    [`Student ID: ${studentInfo?.studentId || 'Unknown'}`],
    [`Department: ${studentInfo?.department || 'Unknown'}`],
    [`GPA: ${studentInfo?.gpa || '0.00'}`],
    [],
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `transcript_${studentInfo?.studentId || 'transcript'}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const printTranscript = (grades, studentInfo) => {
  const printWindow = window.open('', '_blank');
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Academic Transcript - ${studentInfo?.name || 'Student'}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 40px;
          color: #333;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 3px solid #1976d2;
          padding-bottom: 20px;
        }
        .student-info {
          margin-bottom: 30px;
          line-height: 1.8;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 12px;
          text-align: left;
        }
        th {
          background-color: #1976d2;
          color: white;
          font-weight: bold;
        }
        tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        .gpa-section {
          margin-top: 30px;
          text-align: right;
          font-size: 18px;
          font-weight: bold;
        }
        @media print {
          body { padding: 20px; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>UNIVERSITY GRADE PORTAL</h1>
        <h2>Academic Transcript</h2>
      </div>
      
      <div class="student-info">
        <p><strong>Student Name:</strong> ${studentInfo?.name || 'N/A'}</p>
        <p><strong>Student ID:</strong> ${studentInfo?.studentId || 'N/A'}</p>
        <p><strong>Department:</strong> ${studentInfo?.department || 'N/A'}</p>
        <p><strong>Year:</strong> ${studentInfo?.year || 'N/A'}</p>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Course Code</th>
            <th>Course Name</th>
            <th>Grade</th>
            <th>Score</th>
            <th>Credit Hours</th>
            <th>Semester</th>
            <th>Academic Year</th>
          </tr>
        </thead>
        <tbody>
          ${grades.map(grade => `
            <tr>
              <td>${grade.courseCode || ''}</td>
              <td>${grade.courseName || ''}</td>
              <td><strong>${grade.grade || ''}</strong></td>
              <td>${grade.score || ''}</td>
              <td>${grade.creditHours || ''}</td>
              <td>${grade.semester || ''}</td>
              <td>${grade.academicYear || ''}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="gpa-section">
        <p>GPA: ${studentInfo?.gpa || '0.00'}</p>
        <p>Total Credits: ${grades.reduce((sum, g) => sum + (g.creditHours || 0), 0)}</p>
      </div>
      
      <div style="margin-top: 40px; text-align: center; font-size: 12px; color: #666;">
        <p>Generated on: ${new Date().toLocaleDateString()}</p>
        <p>This is an official transcript from the University Grade Portal</p>
      </div>
    </body>
    </html>
  `;
  
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
};

