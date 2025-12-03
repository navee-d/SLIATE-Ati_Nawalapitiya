# SLIATE Nawalapitiya Campus Management System - Instructions

## Overview
The SLIATE Campus Management System is a comprehensive full-stack web application designed to manage all academic operations for the Advanced Technological Institute - Nawalapitiya. It includes role-based access control, QR-based attendance, library management, lab/PC management, exam applications, and payment processing.

---

## Getting Started

### Prerequisites
- Node.js 18+ installed
- PostgreSQL database (auto-configured on Replit)
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation & Setup

1. **Clone/Access the Repository**
   - Project is ready on Replit

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Setup Environment Variables**
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Edit `.env` and set the required environment variables:
     - `DATABASE_URL`: PostgreSQL connection string (Neon PostgreSQL)
     - `SESSION_SECRET`: Random string for session encryption (generate a strong random string)
     - `JWT_SECRET`: Random string for JWT token signing (generate a strong random string)
     - Optional Twilio credentials for SMS notifications (can be left commented out)
   
   **Example `.env` file:**
   ```env
   DATABASE_URL=postgresql://username:password@your-db-host.neon.tech/database?sslmode=require
   SESSION_SECRET=your-very-long-random-secret-key-here
   JWT_SECRET=your-jwt-secret-key-here
   ```

4. **Initialize Database**
   ```bash
   npm run db:push
   ```

5. **Seed the Database (Optional)**
   ```bash
   npx tsx server/seed.ts
   ```
   This creates sample departments, users, courses, books, and lab equipment.

6. **Start the Application**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5000`

---

## Login Credentials

### Default Admin Account
- **Email:** admin@sliate.ac.lk
- **Password:** admin123

---

## Features & How to Use

### 1. Dashboard
- **Location:** Home page after login
- **What you see:**
  - Total count of students, lecturers, departments
  - Quick statistics overview
  - Navigation to all management sections
- **Action:** Click any section to navigate to detailed management page

### 2. Student Management
- **Location:** Sidebar → Students
- **Features:**
  - View all enrolled students with their details
  - Search by name or student ID
  - Add new student (single entry)
  - Bulk import students via Excel/CSV
  - View individual student profile with enrollment history
  - Edit/Delete student information
  
- **How to Add a Student:**
  1. Click "Add Student" button
  2. Fill in personal and academic details
  3. System auto-generates Student ID in format: `DEPT-NAW-YEAR-F/P-NUMBER`
  4. Click Submit

- **How to Bulk Import Students:**
  1. Click "Import Students" button
  2. Upload Excel/CSV file with student data
  3. System auto-detects columns and matches them
  4. Review validation report
  5. Confirm import

### 3. Lecturer Management
- **Location:** Sidebar → Lecturers/HODs/Visiting Lecturers/Staff
- **Features:**
  - View all lecturers by category (HOD, Permanent, Visiting, Staff)
  - Search by name or employee ID
  - Add new lecturer with department assignment
  - Edit lecturer details
  - Delete lecturer records
  - View assigned courses and timetable

- **How to Add a Lecturer:**
  1. Go to appropriate category (HODs, Visiting Lecturers, or Staff)
  2. Click "Add" button
  3. Fill in name, email, employee ID, department
  4. Click Save

### 4. Course Management
- **Location:** Sidebar → Courses
- **Features:**
  - View all available courses
  - Add new courses for departments
  - Assign courses to students via enrollment
  - Manage course details (code, name, credits)

### 5. Timetable Management
- **Location:** Sidebar → Timetable
- **Features:**
  - Two main views:
    1. **Lecturer Schedules:** View schedules by lecturer
    2. **Course Schedules:** View schedules by course

- **How to View Lecturer Schedule:**
  1. Click "Lecturer Schedules" tab
  2. Choose "Permanent Lecturers" or "Visiting Lecturers"
  3. Search for lecturer by name
  4. Click on lecturer card to view their timetable
  5. Grid shows all class times across the week
  6. Details section below shows full schedule information

- **How to View Course Schedule:**
  1. Click "Course Schedules" tab
  2. Search course by code or name
  3. Click on course card (max 5 displayed)
  4. Grid shows class times with course codes, rooms, and lecturers
  5. Details section shows full schedule breakdown

- **How to Add a Schedule:**
  1. Click "Add Schedule" button (top right)
  2. Select course and lecturer
  3. Choose day of week
  4. Set start and end time
  5. Enter room/location
  6. Click Save

- **Grid View Explanation:**
  - **Rows:** Time slots (7:00 AM to 5:00 PM, 30-minute intervals)
  - **Columns:** Days (Monday to Sunday)
  - **Cells:** Display course code, room, and lecturer name when occupied
  - **Blue highlights:** Indicate scheduled classes
  - **Scrollable:** Horizontally for different time ranges

### 6. Attendance Management
- **Location:** Sidebar → Attendance
- **Features:**
  - QR-based attendance system (Coming Soon)
  - Manual attendance marking
  - Attendance history and reports
  - Anti-cheat mechanisms (selfie verification, device fingerprinting)

### 7. Library Management
- **Location:** Sidebar → Library
- **Features:**
  - Book inventory management
  - Student book loans and returns
  - Automatic fine calculation
  - Overdue tracking
- **Status:** Coming Soon

### 8. Labs & PCs Management
- **Location:** Sidebar → Labs & PCs
- **Features:**
  - Manage lab rooms and PC inventory
  - Assign PCs to students
  - Track lab usage
- **Status:** Coming Soon

### 9. Exam Applications
- **Location:** Sidebar → Exam Applications
- **Features:**
  - Student exam registration
  - Multi-step wizard interface
  - Exam timetable management
- **Status:** Coming Soon

### 10. Payments
- **Location:** Sidebar → Payments
- **Features:**
  - Payment tracking
  - Fee management
  - SMS notifications
- **Status:** Coming Soon

### 11. Import/Export Data
- **Location:** Sidebar → Import Data / Export Data
- **Features:**
  - Bulk import students, courses, lecturers via Excel/CSV
  - Export student lists, timetables, reports
  - Drag-and-drop upload interface
  - Validation reports with error details

---

## Data Structure & IDs

### Student ID Format
All students are assigned unique IDs in this format:
```
DEPT-NAW-YEAR-F/P-NUMBER
```
Example: `HNDIT-NAW-2024-F-0001`
- **DEPT:** Department code (HNDIT, HNDMG, HNDTHM, HNDE, HNDBF)
- **NAW:** Nawalapitiya (fixed)
- **YEAR:** Year of enrollment (e.g., 2024)
- **F/P:** Full-Time (F) or Part-Time (P)
- **NUMBER:** Sequential number within cohort

### Departments
1. **HNDIT** - Higher National Diploma in Information Technology
2. **HNDMG** - Higher National Diploma in Management
3. **HNDTHM** - Higher National Diploma in Tourism & Hospitality Management
4. **HNDE** - Higher National Diploma in Engineering
5. **HNDBF** - Higher National Diploma in Business Finance

---

## User Roles & Permissions

### Admin
- Full access to all features
- Can manage all users (students, lecturers, staff)
- Can manage courses, timetables, departments
- Can view all reports and analytics

### Lecturer (HOD/Permanent/Visiting)
- View own courses and timetable
- Mark attendance
- View student lists for assigned courses
- Submit grades (Coming Soon)

### Staff
- Manage library operations
- Manage lab/PC assignments
- Process payments
- Manage attendance sessions

### Student
- View own timetable and courses
- Participate in attendance (scan QR)
- Apply for exams
- Borrow library books
- View own payment status

---

## Common Tasks

### Adding Multiple Students
1. Prepare Excel file with columns: Name, Email, StudentID, Department, Program Type, Intake Year
2. Go to Students → Import Students
3. Upload file and confirm import
4. System validates and creates all records

### Creating a Weekly Timetable
1. Go to Timetable → Add Schedule
2. For each course:
   - Select course and lecturer
   - Add Monday time slot (e.g., 08:00-09:00, Lab 101)
   - Add Wednesday time slot
   - Add Friday time slot
3. Repeat for all courses
4. View complete grid with all populated slots

### Assigning Students to Courses
1. Go to Courses
2. Click on course
3. Add students to enrollment list
4. Students can now view course in their schedule

---

## Troubleshooting

### Issue: Can't login
- **Solution:** Ensure you're using correct credentials. Default: admin@sliate.ac.lk / admin123

### Issue: Timetable grid is empty
- **Solution:** Add schedules first using "Add Schedule" button. Schedules must have valid course, lecturer, day, time, and room.

### Issue: Student ID not generating
- **Solution:** Ensure student has valid department assigned. ID generation is automatic.

### Issue: Import fails
- **Solution:** Check file format (Excel/CSV). Ensure column headers match system expectations. Review validation report for specific errors.

---

## Data Backup & Recovery

### Automatic Backups
- Database is auto-backed up on Replit
- Use Replit checkpoints feature to recover to previous states

### Manual Export
- Export students, courses, and timetables via "Export Data" section
- Keep regular exports for external backup

---

## Best Practices

1. **Regular Backups:** Export critical data weekly
2. **Consistent Naming:** Use standardized department and room codes
3. **Timetable Planning:** Plan semester timetables in advance, then batch add all schedules
4. **Student Data:** Verify imported student data before confirming bulk import
5. **Lecturer Assignment:** Always assign lecturers to departments correctly
6. **Room Management:** Document room codes clearly (e.g., "Lab 101", "Room A1")

---

## Support & Contact

For issues or feature requests:
- Contact: admin@sliate.ac.lk
- System Administrator: SLIATE IT Department

---

## Version Info
- **App Name:** SLIATE Campus Management System
- **Version:** 1.0.0
- **Institution:** Advanced Technological Institute - Nawalapitiya
- **Technology Stack:** React, Express, PostgreSQL, TypeScript

---

Last Updated: December 2024
