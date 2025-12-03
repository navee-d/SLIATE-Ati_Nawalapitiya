import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, GraduationCap, BookOpen, Calendar, Monitor, Library, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['/api/admin/stats'],
  });

  const statCards = [
    {
      title: 'Total Students',
      value: stats?.totalStudents || 0,
      icon: Users,
      description: 'Enrolled students',
      trend: '+12% from last month',
    },
    {
      title: 'Lecturers',
      value: stats?.totalLecturers || 0,
      icon: GraduationCap,
      description: 'Teaching staff',
      trend: '5 departments',
    },
    {
      title: 'Active Courses',
      value: stats?.totalCourses || 0,
      icon: BookOpen,
      description: 'Current semester',
      trend: `${stats?.totalDepartments || 0} departments`,
    },
    {
      title: 'Attendance Sessions',
      value: stats?.attendanceSessionsToday || 0,
      icon: Calendar,
      description: 'Today',
      trend: `${stats?.totalAttendanceMarks || 0} total marks`,
    },
  ];

  const quickStats = [
    {
      title: 'Lab PCs',
      value: `${stats?.availablePCs || 0}/${stats?.totalPCs || 0}`,
      icon: Monitor,
      description: 'Available PCs',
    },
    {
      title: 'Library Books',
      value: `${stats?.availableBooks || 0}/${stats?.totalBooks || 0}`,
      icon: Library,
      description: 'Available books',
    },
    {
      title: 'Active Loans',
      value: stats?.activeLoans || 0,
      icon: TrendingUp,
      description: 'Book loans',
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Overview of campus activities and statistics
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} data-testid={`card-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold" data-testid={`stat-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
                  {stat.value}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-2 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {stat.trend}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {quickStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
                <div>
                  <CardTitle className="text-base">{stat.title}</CardTitle>
                  <CardDescription className="text-xs mt-1">{stat.description}</CardDescription>
                </div>
                <Icon className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest system activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.recentActivities?.slice(0, 5).map((activity: any, i: number) => (
                <div key={i} className="flex items-start gap-3 border-b last:border-0 pb-3 last:pb-0">
                  <div className="h-2 w-2 bg-primary rounded-full mt-2"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                  </div>
                </div>
              )) || (
                <p className="text-sm text-muted-foreground">No recent activities</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <a
                href="/admin/students/new"
                className="flex flex-col items-center gap-2 p-4 rounded-md bg-accent/50 hover-elevate active-elevate-2 transition-colors"
                data-testid="link-add-student"
              >
                <Users className="h-6 w-6 text-primary" />
                <span className="text-xs font-medium text-center">Add Student</span>
              </a>
              <a
                href="/lecturer/attendance/new"
                className="flex flex-col items-center gap-2 p-4 rounded-md bg-accent/50 hover-elevate active-elevate-2 transition-colors"
                data-testid="link-create-session"
              >
                <Calendar className="h-6 w-6 text-primary" />
                <span className="text-xs font-medium text-center">Create Session</span>
              </a>
              <a
                href="/admin/import"
                className="flex flex-col items-center gap-2 p-4 rounded-md bg-accent/50 hover-elevate active-elevate-2 transition-colors"
                data-testid="link-import-data"
              >
                <TrendingUp className="h-6 w-6 text-primary" />
                <span className="text-xs font-medium text-center">Import Data</span>
              </a>
              <a
                href="/admin/library"
                className="flex flex-col items-center gap-2 p-4 rounded-md bg-accent/50 hover-elevate active-elevate-2 transition-colors"
                data-testid="link-manage-library"
              >
                <Library className="h-6 w-6 text-primary" />
                <span className="text-xs font-medium text-center">Manage Library</span>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
