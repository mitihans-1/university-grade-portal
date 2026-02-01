# Parent Registration - Automatic Orphan Link Cleanup

## Problem
When a parent was deleted from the database, the `parent_student_links` table still contained references to the deleted parent. This prevented new parents from registering with the same student ID, showing the error:
```
This student ID is already linked to a family account. Only one parent account can be linked to a student.
```

## Solution
Modified the parent registration route (`backend/routes/parents.js`) to automatically detect and clean up orphan links during the registration process.

### How It Works
1. When a parent tries to register with a student ID, the system checks if that student is already linked to a parent.
2. If a link is found, the system verifies whether the parent still exists in the database.
3. If the parent no longer exists (orphan link), the system automatically deletes the orphan link and allows the new registration to proceed.
4. If the parent still exists, the registration is rejected with an appropriate error message.

### Code Changes
**File:** `backend/routes/parents.js`

**Before:**
```javascript
const existingLinkForStudent = await ParentStudentLink.findOne({
  where: { studentId }
});

if (existingLinkForStudent) {
  return res.status(400).json({ msg: 'This student ID is already linked...' });
}
```

**After:**
```javascript
const existingLinkForStudent = await ParentStudentLink.findOne({
  where: { studentId }
});

if (existingLinkForStudent) {
  // Verify that the parent still exists
  const parentExists = await Parent.findByPk(existingLinkForStudent.parentId);
  
  if (!parentExists) {
    // Parent was deleted but link remains - clean it up
    console.log(`DEBUG: Cleaning up orphan link for StudentID ${studentId} -> ParentID ${existingLinkForStudent.parentId}`);
    await existingLinkForStudent.destroy();
    console.log('DEBUG: Orphan link removed, allowing new registration');
  } else {
    // Parent exists, so student is truly linked
    return res.status(400).json({ msg: 'This student ID is already linked...' });
  }
}
```

## Testing
The automatic cleanup was tested and verified:
1. Created an orphan link manually (ParentID 999, which doesn't exist)
2. Attempted to register a new parent with the same student ID
3. The system automatically detected and removed the orphan link
4. Registration succeeded

**Server logs confirmed:**
```
DEBUG: Cleaning up orphan link for StudentID 1501463 -> ParentID 999
DEBUG: Orphan link removed, allowing new registration
DEBUG: Creating parent record...
DEBUG: Parent created with ID: 9
```

## Benefits
- **Automatic Recovery:** No manual database cleanup needed when parents are deleted
- **Better User Experience:** Parents can register immediately after a previous parent is removed
- **Data Integrity:** Ensures the database stays clean without orphan references
- **Transparent:** Logs all cleanup actions for debugging

## Manual Cleanup (If Needed)
If you need to manually clean up orphan links, you can run:
```bash
node cleanup_orphans.js
```

This script will find and remove all orphan links in the database.
