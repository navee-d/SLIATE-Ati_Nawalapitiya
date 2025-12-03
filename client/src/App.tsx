import { Switch, Route } from 'wouter';
import { queryClient } from './lib/queryClient';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider, RequireAuth, useAuth } from '@/lib/auth-context';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import NotFound from '@/pages/not-found';
import LoginPage from '@/pages/login';
import UnauthorizedPage from '@/pages/unauthorized';

// Admin pages
import AdminDashboard from '@/pages/admin/dashboard';
import AdminStudentsPage from '@/pages/admin/students';
import AdminLibraryPage from '@/pages/admin/library';
import AdminLabsPage from '@/pages/admin/labs';
import AdminDepartmentsPage from '@/pages/admin/departments';
import AdminDepartmentDetailsPage from '@/pages/admin/department-details';
import AdminStudentDetailsPage from '@/pages/admin/student-details';
import AdminLecturersPage from '@/pages/admin/lecturers';
import AdminLecturerDetailsPage from '@/pages/admin/lecturer-details';
import AdminHODPage from '@/pages/admin/hod';
import AdminVisitingLecturersPage from '@/pages/admin/visiting-lecturers';
import AdminStaffPage from '@/pages/admin/staff';
import AdminCoursesPage from '@/pages/admin/courses';
import AdminAttendancePage from '@/pages/admin/attendance';
import AdminExamsPage from '@/pages/admin/exams';
import AdminPaymentsPage from '@/pages/admin/payments';
import AdminImportPage from '@/pages/admin/import';
import AdminExportPage from '@/pages/admin/export';
import AdminSettingsPage from '@/pages/admin/settings';
import AdminTimetablePage from '@/pages/admin/timetable';
import AdminTimetableLecturersPage from '@/pages/admin/timetable-lecturers';
import AdminTimetableLecturerDetailsPage from '@/pages/admin/timetable-lecturer-details';
import AdminTimetableStudentsPage from '@/pages/admin/timetable-students';
import AdminTimetableStudentDetailsPage from '@/pages/admin/timetable-student-details';

// Lecturer pages
import LecturerDashboard from '@/pages/lecturer/dashboard';
import LecturerAttendanceSessionPage from '@/pages/lecturer/attendance-session';
import LecturerCoursesPage from '@/pages/lecturer/courses';
import LecturerAttendancePage from '@/pages/lecturer/attendance';
import LecturerStudentsPage from '@/pages/lecturer/students';

// Student pages
import StudentDashboard from '@/pages/student/dashboard';
import StudentScanQRPage from '@/pages/student/scan-qr';
import StudentAttendancePage from '@/pages/student/attendance';
import StudentExamsPage from '@/pages/student/exams';
import StudentLibraryPage from '@/pages/student/library';

// Staff pages
import StaffDashboard from '@/pages/staff/dashboard';
import StaffLibraryPage from '@/pages/staff/library';
import StaffLabsPage from '@/pages/staff/labs';
import StaffPaymentsPage from '@/pages/staff/payments';

function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider style={{
      '--sidebar-width': '16rem',
      '--sidebar-width-icon': '3rem',
    } as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between p-4 border-b">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto p-6">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function DashboardRouter() {
  const { user } = useAuth();

  if (!user) {
    return <div>Loading...</div>;
  }

  // Route users to their appropriate dashboard based on role
  if (user.role === 'admin') {
    return (
      <Switch>
        <Route path="/" component={AdminDashboard} />
        <Route path="/admin/students" component={AdminStudentsPage} />
        <Route path="/admin/library" component={AdminLibraryPage} />
        <Route path="/admin/labs" component={AdminLabsPage} />
        <Route path="/admin/departments" component={AdminDepartmentsPage} />
        <Route path="/admin/departments/:code" component={AdminDepartmentDetailsPage} />
        <Route path="/admin/students/:id" component={AdminStudentDetailsPage} />
        <Route path="/admin/lecturers" component={AdminLecturersPage} />
        <Route path="/admin/lecturers/:id" component={AdminLecturerDetailsPage} />
        <Route path="/admin/hod" component={AdminHODPage} />
        <Route path="/admin/visiting-lecturers" component={AdminVisitingLecturersPage} />
        <Route path="/admin/staff" component={AdminStaffPage} />
        <Route path="/admin/courses" component={AdminCoursesPage} />
        <Route path="/admin/timetable" component={AdminTimetablePage} />
        <Route path="/admin/timetable-lecturers" component={AdminTimetableLecturersPage} />
        <Route path="/admin/timetable-lecturers/:id" component={AdminTimetableLecturerDetailsPage} />
        <Route path="/admin/timetable-students" component={AdminTimetableStudentsPage} />
        <Route path="/admin/timetable-students/:id" component={AdminTimetableStudentDetailsPage} />
        <Route path="/admin/attendance" component={AdminAttendancePage} />
        <Route path="/admin/exams" component={AdminExamsPage} />
        <Route path="/admin/payments" component={AdminPaymentsPage} />
        <Route path="/admin/import" component={AdminImportPage} />
        <Route path="/admin/export" component={AdminExportPage} />
        <Route path="/admin/settings" component={AdminSettingsPage} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  if (user.role === 'lecturer' || user.role === 'hod') {
    return (
      <Switch>
        <Route path="/" component={LecturerDashboard} />
        <Route path="/lecturer/attendance/new" component={LecturerAttendanceSessionPage} />
        <Route path="/lecturer/courses" component={LecturerCoursesPage} />
        <Route path="/lecturer/attendance" component={LecturerAttendancePage} />
        <Route path="/lecturer/students" component={LecturerStudentsPage} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  if (user.role === 'student') {
    return (
      <Switch>
        <Route path="/" component={StudentDashboard} />
        <Route path="/student/scan" component={StudentScanQRPage} />
        <Route path="/student/attendance" component={StudentAttendancePage} />
        <Route path="/student/exams" component={StudentExamsPage} />
        <Route path="/student/library" component={StudentLibraryPage} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  // Staff
  if (user.role === 'staff') {
    return (
      <Switch>
        <Route path="/" component={StaffDashboard} />
        <Route path="/staff/library" component={StaffLibraryPage} />
        <Route path="/staff/labs" component={StaffLabsPage} />
        <Route path="/staff/payments" component={StaffPaymentsPage} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  // Unknown role fallback
  return (
    <Switch>
      <Route path="/" component={() => <div className="text-center py-12">
        <h1 className="text-2xl font-bold">Welcome to SLIATE Nawalapitiya</h1>
        <p className="text-muted-foreground mt-2">Dashboard coming soon</p>
      </div>} />
      <Route component={NotFound} />
    </Switch>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/unauthorized" component={UnauthorizedPage} />
      <Route>
        <RequireAuth>
          <DashboardLayout>
            <DashboardRouter />
          </DashboardLayout>
        </RequireAuth>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="sliate-theme">
        <TooltipProvider>
          <AuthProvider>
            <Toaster />
            <Router />
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
