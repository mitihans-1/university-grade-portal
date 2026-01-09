# Teacher-Admin Grade Approval Workflow

## Current Issues
1. ❌ Teachers can upload grades that go directly to "published" status
2. ❌ No admin review/approval process for teacher-submitted grades
3. ❌ No distinction between admin-uploaded and teacher-uploaded grades

## Proposed Solution

### Workflow Steps:
```
Teacher Uploads Grade → Pending Status → Admin Reviews → Admin Approves/Rejects → Published/Rejected
```

### Implementation Plan:

#### 1. **Teacher Uploads Grade** (Status: `pending_approval`)
   - Teacher fills out grade form
   - Grade is saved with `status = 'pending_approval'`
   - Grade is linked to teacher via `uploadedBy` field
   - Admin receives notification of new grade submission

#### 2. **Admin Reviews Pending Grades**
   - Admin dashboard shows count of pending teacher grades
   - Admin can view all pending grades in a dedicated page
   - Admin can see which teacher submitted each grade
   - Admin can approve or reject with optional comments

#### 3. **Admin Approves Grade** (Status: `approved` → `published`)
   - Grade status changes to `published`
   - Students and parents can now see the grade
   - Notifications sent to student and linked parents
   - Teacher receives confirmation notification

#### 4. **Admin Rejects Grade** (Status: `rejected`)
   - Grade status changes to `rejected`
   - Grade is NOT visible to students/parents
   - Teacher receives rejection notification with reason
   - Teacher can resubmit corrected grade

### Database Schema Changes:

```sql
ALTER TABLE grades ADD COLUMN approvedBy INT NULL;
ALTER TABLE grades ADD COLUMN approvalDate DATETIME NULL;
ALTER TABLE grades ADD COLUMN rejectionReason TEXT NULL;
ALTER TABLE grades ADD COLUMN submittedDate DATETIME DEFAULT CURRENT_TIMESTAMP;
```

### New API Endpoints:

1. `GET /api/grades/pending-approval` - Get all grades pending admin approval
2. `POST /api/grades/:id/approve` - Approve a pending grade
3. `POST /api/grades/:id/reject` - Reject a pending grade with reason
4. `GET /api/grades/my-submissions` - Teacher views their submitted grades

### Status Flow:

```
pending_approval → approved → published (visible to students/parents)
pending_approval → rejected (teacher can resubmit)
```

### Permissions:

- **Teachers**: Can upload grades (status: pending_approval), view their submissions
- **Admins**: Can upload grades (status: published directly), approve/reject teacher grades
- **Students/Parents**: Can only see grades with status = 'published'
