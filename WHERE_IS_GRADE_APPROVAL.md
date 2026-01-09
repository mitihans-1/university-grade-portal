# 📍 How to Access Grade Approval Page

## 🎯 Three Ways to Access:

### **Method 1: Admin Dashboard Quick Actions** ⭐ EASIEST
1. Login as admin
2. You'll see the Admin Dashboard
3. Look for the **"Quick Actions"** section
4. Click the purple **"✅ Grade Approvals"** button
5. Done! You're on the approval page

### **Method 2: Hamburger Menu**
1. Login as admin
2. Click the **☰** hamburger icon (top left corner)
3. Scroll down in the menu
4. Find **"✅ Grade Approvals"** (between "Link Requests" and "Grade Appeals")
5. Click it

### **Method 3: Direct URL**
Simply navigate to:
```
http://localhost:5174/admin/grade-approval
```

---

## 🖼️ What You'll See:

### **If No Pending Grades:**
```
┌─────────────────────────────────────┐
│         ✅ All Caught Up!           │
│                                     │
│  There are no pending grade         │
│  submissions to review.             │
└─────────────────────────────────────┘
```

### **If There Are Pending Grades:**
```
┌───────────────────────────────────────────────────────────────┐
│  📋 Teacher Grade Approvals                    🔄 Refresh     │
├───────────────────────────────────────────────────────────────┤
│  Pending Approvals (3)                                        │
├─────────┬──────────┬───────┬───────┬──────────┬──────────────┤
│ Student │  Course  │ Grade │ Score │ Teacher  │   Actions    │
├─────────┼──────────┼───────┼───────┼──────────┼──────────────┤
│ John    │ Math 101 │   A   │  95%  │ Dr. Smith│ ✓ Approve    │
│ Doe     │ MATH101  │       │       │ T-001    │ ✗ Reject     │
├─────────┼──────────┼───────┼───────┼──────────┼──────────────┤
│ Jane    │ Physics  │   B   │  85%  │ Prof. Lee│ ✓ Approve    │
│ Smith   │ PHYS201  │       │       │ T-002    │ ✗ Reject     │
└─────────┴──────────┴───────┴───────┴──────────┴──────────────┘
```

---

## 🧪 Quick Test:

### **To See It In Action:**

1. **First, create a teacher account:**
   - Go to: `http://localhost:5174/teacher/register`
   - Use secret code: `TEACH-2025-X`
   - Fill in teacher details and register

2. **Login as that teacher:**
   - Email: (the one you just registered)
   - Password: (the one you set)

3. **Upload a test grade:**
   - Go to "Upload Grades"
   - Fill in a student ID (e.g., `STU-001`)
   - Enter course details
   - Submit the grade

4. **Now login as admin:**
   - Email: `admin@university.edu`
   - Password: `admin`

5. **Go to Grade Approvals:**
   - Click **"✅ Grade Approvals"** in Quick Actions
   - You should see the grade you just submitted!

---

## 🎨 Visual Location on Dashboard:

```
┌─────────────────────────────────────────────────────┐
│  Admin Dashboard                                    │
│  Welcome back, University Admin                     │
├─────────────────────────────────────────────────────┤
│  [Stats Cards: Students | Parents | Grades | etc]  │
├─────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌──────────────────────────┐ │
│  │ Quick Actions   │  │  Recent Grades           │ │
│  ├─────────────────┤  └──────────────────────────┘ │
│  │ 📤 Upload       │                               │
│  │ 📝 Attendance   │                               │
│  │ 🔗 Link Reqs    │                               │
│  │ ✅ Grade Appr.  │  ← HERE! Purple button        │
│  │ 📢 Announce     │                               │
│  │ 📈 Analytics    │                               │
│  └─────────────────┘                               │
└─────────────────────────────────────────────────────┘
```

---

## ✅ Current Status:

- ✅ Page created: `AdminGradeApproval.jsx`
- ✅ Route added: `/admin/grade-approval`
- ✅ Navigation link in hamburger menu
- ✅ Quick action button on dashboard
- ✅ API endpoints working
- ✅ Ready to use!

---

**You can now access the Grade Approval page from the Admin Dashboard!** 🎉
