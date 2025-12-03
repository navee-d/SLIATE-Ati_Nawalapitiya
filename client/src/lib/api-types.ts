// Type definitions for API responses

export interface AdminStats {
  totalStudents: number;
  totalLecturers: number;
  totalCourses: number;
  totalDepartments: number;
  attendanceSessionsToday: number;
  totalAttendanceMarks: number;
  availablePCs: number;
  totalPCs: number;
  availableBooks: number;
  totalBooks: number;
  activeLoans: number;
  recentActivities?: Array<{
    action: string;
    timestamp: string;
  }>;
}

export interface LecturerStats {
  totalCourses: number;
  totalStudents: number;
  sessionsToday: number;
}

export interface StudentStats {
  attendanceRate: number;
  activeLoans: number;
  examApplications: number;
}

export interface DepartmentWithStats {
  departments: any[];
  students: any[];
  lecturers: any[];
  courses: any[];
}

export interface CourseDetails {
  courses: any;
  departments: any;
  lecturers: any;
  students: any;
  examApps: any;
}

export interface TimetableData {
  timetable: any[];
  lecturers?: any[];
  courses?: any[];
  enrollments?: any[];
}
