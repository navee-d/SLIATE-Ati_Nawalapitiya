import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Calendar, Users, QrCode } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'wouter';

export default function LecturerDashboard() {
  const { user } = useAuth();
  const { data: stats, isLoading } = useQuery({
    queryKey: ['/api/lecturer/stats'],
  });

  const statCards = [
    {
      title: 'My Courses',
      value: stats?.totalCourses || 0,
      icon: BookOpen,
      description: 'Active courses',
      href: '/lecturer/courses',
    },
    {
      title: 'Students',
      value: stats?.totalStudents || 0,
      icon: Users,
      description: 'Enrolled students',
      href: '/lecturer/students',
    },
    {
      title: 'Sessions Today',
      value: stats?.sessionsToday || 0,
      icon: Calendar,
      description: 'Attendance sessions',
      href: '/lecturer/attendance',
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user?.name}</h1>
        <p className="text-muted-foreground mt-2">
          {user?.role === 'hod' ? 'Head of Department' : 'Lecturer'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.title} href={stat.href}>
              <Card className="hover-elevate active-elevate-2 cursor-pointer transition-all">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/lecturer/attendance/new">
              <div className="flex items-center gap-4 p-4 rounded-md bg-accent/50 hover-elevate active-elevate-2 cursor-pointer transition-colors">
                <div className="h-12 w-12 rounded-md bg-primary/10 flex items-center justify-center">
                  <QrCode className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Create Attendance Session</h3>
                  <p className="text-xs text-muted-foreground">Display QR code</p>
                </div>
              </div>
            </Link>

            <Link href="/lecturer/courses">
              <div className="flex items-center gap-4 p-4 rounded-md bg-accent/50 hover-elevate active-elevate-2 cursor-pointer transition-colors">
                <div className="h-12 w-12 rounded-md bg-primary/10 flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">View Courses</h3>
                  <p className="text-xs text-muted-foreground">Manage courses</p>
                </div>
              </div>
            </Link>

            <Link href="/lecturer/attendance">
              <div className="flex items-center gap-4 p-4 rounded-md bg-accent/50 hover-elevate active-elevate-2 cursor-pointer transition-colors">
                <div className="h-12 w-12 rounded-md bg-primary/10 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">View Attendance</h3>
                  <p className="text-xs text-muted-foreground">Check records</p>
                </div>
              </div>
            </Link>

            <Link href="/lecturer/students">
              <div className="flex items-center gap-4 p-4 rounded-md bg-accent/50 hover-elevate active-elevate-2 cursor-pointer transition-colors">
                <div className="h-12 w-12 rounded-md bg-primary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">View Students</h3>
                  <p className="text-xs text-muted-foreground">Class list</p>
                </div>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
