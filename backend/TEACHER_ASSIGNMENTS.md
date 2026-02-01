# Teacher Multi-Department Assignment System

## Overview

The system now supports **teachers teaching multiple departments, years, and semesters** through a new `TeacherAssignment` model and API.

## Database Structure

### New Table: `teacher_assignments`

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| teacherId | STRING | Foreign key to teachers table |
| department | STRING | Department name (e.g., "Computer Science") |
| subject | STRING | Subject name (e.g., "Data Structures") |
| year | INTEGER | Academic year (1, 2, 3, 4) |
| semester | INTEGER | Semester (1 or 2) |
| academicYear | STRING | Academic year period (e.g., "2024-2025") |
| status | ENUM | 'active', 'inactive', 'completed' |
| assignedBy | STRING | Admin who created the assignment |
| assignedDate | DATE | When the assignment was created |

### Relationships

- **One Teacher** → **Many Assignments**
- A teacher can have multiple active assignments across different departments, years, and semesters

## API Endpoints

### 1. Create Assignment
```http
POST /api/teacher-assignments
Authorization: Bearer <admin_token>

{
  "teacherId": "T001",
  "department": "Computer Science",
  "subject": "Data Structures",
  "year": 2,
  "semester": 1,
  "academicYear": "2024-2025"
}
```

**Response:**
```json
{
  "msg": "Teacher assignment created successfully",
  "assignment": {
    "id": 1,
    "teacherId": "T001",
    "department": "Computer Science",
    "subject": "Data Structures",
    "year": 2,
    "semester": 1,
    "academicYear": "2024-2025",
    "status": "active"
  }
}
```

### 2. Create Multiple Assignments (Bulk)
```http
POST /api/teacher-assignments/bulk
Authorization: Bearer <admin_token>

{
  "teacherId": "T001",
  "assignments": [
    {
      "department": "Computer Science",
      "subject": "Data Structures",
      "year": 2,
      "semester": 1
    },
    {
      "department": "Information Technology",
      "subject": "Database Systems",
      "year": 3,
      "semester": 2
    },
    {
      "department": "Computer Science",
      "subject": "Algorithms",
      "year": 3,
      "semester": 1
    }
  ]
}
```

**Response:**
```json
{
  "msg": "Created 3 assignments",
  "created": 3,
  "errors": null,
  "assignments": [...]
}
```

### 3. Get All Assignments for a Teacher
```http
GET /api/teacher-assignments/teacher/:teacherId
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": 1,
    "teacherId": "T001",
    "department": "Computer Science",
    "subject": "Data Structures",
    "year": 2,
    "semester": 1,
    "academicYear": "2024-2025",
    "status": "active",
    "teacher": {
      "teacherId": "T001",
      "name": "Dr. John Smith",
      "email": "john@university.edu",
      "specialization": "Algorithms"
    }
  },
  ...
]
```

### 4. Get All Teachers in a Department
```http
GET /api/teacher-assignments/department/:department
Authorization: Bearer <admin_token>
```

### 5. Get All Assignments (Admin)
```http
GET /api/teacher-assignments?status=active&academicYear=2024-2025
Authorization: Bearer <admin_token>
```

### 6. Update Assignment
```http
PUT /api/teacher-assignments/:id
Authorization: Bearer <admin_token>

{
  "status": "completed"
}
```

### 7. Delete Assignment
```http
DELETE /api/teacher-assignments/:id
Authorization: Bearer <admin_token>
```

## Usage Examples

### Example 1: Teacher Teaching Multiple Departments

**Scenario:** Dr. Smith teaches in both Computer Science and Information Technology

```javascript
// Create assignments
POST /api/teacher-assignments/bulk
{
  "teacherId": "T001",
  "assignments": [
    {
      "department": "Computer Science",
      "subject": "Data Structures",
      "year": 2,
      "semester": 1
    },
    {
      "department": "Information Technology",
      "subject": "Web Development",
      "year": 2,
      "semester": 1
    }
  ]
}
```

### Example 2: Teacher Teaching Multiple Years

**Scenario:** Prof. Johnson teaches Year 2 and Year 3 students

```javascript
POST /api/teacher-assignments/bulk
{
  "teacherId": "T002",
  "assignments": [
    {
      "department": "Mathematics",
      "subject": "Calculus II",
      "year": 2,
      "semester": 1
    },
    {
      "department": "Mathematics",
      "subject": "Advanced Calculus",
      "year": 3,
      "semester": 1
    }
  ]
}
```

### Example 3: Teacher Teaching Multiple Semesters

**Scenario:** Dr. Lee teaches in both semesters

```javascript
POST /api/teacher-assignments/bulk
{
  "teacherId": "T003",
  "assignments": [
    {
      "department": "Physics",
      "subject": "Mechanics",
      "year": 1,
      "semester": 1
    },
    {
      "department": "Physics",
      "subject": "Thermodynamics",
      "year": 1,
      "semester": 2
    }
  ]
}
```

## Frontend Integration

### Display Teacher's Assignments

```javascript
// Fetch teacher's assignments
const response = await fetch('/api/teacher-assignments/teacher/T001', {
  headers: {
    'x-auth-token': token
  }
});

const assignments = await response.json();

// Display in UI
assignments.forEach(assignment => {
  console.log(`${assignment.department} - ${assignment.subject}`);
  console.log(`Year ${assignment.year}, Semester ${assignment.semester}`);
});
```

### Admin: Assign Teacher to Multiple Classes

```javascript
const assignTeacher = async (teacherId, assignments) => {
  const response = await fetch('/api/teacher-assignments/bulk', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-auth-token': adminToken
    },
    body: JSON.stringify({
      teacherId,
      assignments
    })
  });

  return await response.json();
};

// Usage
await assignTeacher('T001', [
  { department: 'CS', subject: 'Algorithms', year: 3, semester: 1 },
  { department: 'IT', subject: 'Databases', year: 2, semester: 2 }
]);
```

## Migration from Old System

### Old System (Single Assignment)
```javascript
// Teacher model had single values
{
  teacherId: "T001",
  department: "Computer Science",
  subject: "Data Structures",
  year: 2,
  semester: 1
}
```

### New System (Multiple Assignments)
```javascript
// Teacher model remains the same (for primary department)
{
  teacherId: "T001",
  department: "Computer Science", // Primary department
  ...
}

// Assignments table stores all teaching assignments
[
  {
    teacherId: "T001",
    department: "Computer Science",
    subject: "Data Structures",
    year: 2,
    semester: 1
  },
  {
    teacherId: "T001",
    department: "Information Technology",
    subject: "Web Dev",
    year: 3,
    semester: 2
  }
]
```

## Benefits

✅ **Flexibility:** Teachers can teach across multiple departments  
✅ **Scalability:** Easy to add/remove assignments  
✅ **Historical Tracking:** Keep records of past assignments  
✅ **Academic Year Support:** Track assignments by academic year  
✅ **Admin Control:** Admins can manage all assignments  
✅ **No Data Duplication:** Single teacher record with multiple assignments  

## Next Steps

1. **Database Migration:** Run the server to auto-create the `teacher_assignments` table
2. **Admin UI:** Create interface for admins to manage teacher assignments
3. **Teacher Dashboard:** Show all assignments for logged-in teacher
4. **Grade Upload:** Update grade upload to select from teacher's assignments
5. **Reports:** Generate reports showing teacher workload across departments
