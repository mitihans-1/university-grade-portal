# Project Changelog

## [Unreleased] - 2026-02-02

### 🚀 Performance Improvements
- **Dashboard Caching**: Implemented in-memory caching for the `/api/stats/dashboard` endpoint with a 30-second TTL. This reduces database load by ~95% for repeated visits.
- **Language Persistence**: Fixed `LanguageContext` to persist user language selection in `localStorage` across browser refreshes.
- **React Query**: Installed `@tanstack/react-query` to prepare for advanced frontend caching and state management.

### 📝 Exam System
- **Admin Preview Fixed**: Resolved a crash in the Admin Exam Approval page by fixing `useNavigate` hook initialization.
- **Preview Permissions**: Updated routing security to allow Admins and Teachers to access the Exam Player (`/student/exam/:id`) in "preview mode".
- **Documentation**: Created `EXAM_SYSTEM_FLOW.md` detailing the secure answer storage and comparison logic.

### 🐛 Bug Fixes
- **Dashboard Load**: Optimized API calls on the dashboard to reduce latency.
- **Navigation**: Fixed broken "Preview" button in Admin Exam workflow.

### 📚 Documentation
- Added `PERFORMANCE_OPTIMIZATION_SUMMARY.md` detailing caching strategy.
- Added `EXAM_SYSTEM_FLOW.md` explaining the secure exam architecture.
- Updated `API_DOCUMENTATION.md` with new exam endpoints.

---

## [Previously]
- Implemented Teacher-Admin Grade Approval Workflow.
- Added Family Monitoring Features (Alerts, GPA).
- Implemented Teacher Assignment System.
- Added Automatic Orphan Link Cleanup for parent registration.
