import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, QrCode, FileText, Library, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'wouter';
import type { StudentStats } from '@/lib/api-types';

export default function StudentDashboard() {
  const { user } = useAuth();
  const { data: stats, isLoading } = useQuery<StudentStats>({
    queryKey: ['/api/student/stats'],
  });

  const statCards = [
    {
      title: 'Attendance Rate',
      value: `${stats?.attendanceRate || 0}%`,
      icon: Calendar,
      description: 'This semester',
      href: '/student/attendance',
    },
    {
      title: 'Active Loans',
      value: stats?.activeLoans || 0,
      icon: Library,
      description: 'Library books',
      href: '/student/library',
    },
    {
      title: 'Exam Applications',
      value: stats?.examApplications || 0,
      icon: FileText,
      description: 'Pending/approved',
      href: '/student/exams',
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
          Student ID: <span className="font-mono">{user?.studentId}</span>
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
            <Link href="/student/scan">
              <div className="flex items-center gap-4 p-4 rounded-md bg-accent/50 hover-elevate active-elevate-2 cursor-pointer transition-colors">
                <div className="h-12 w-12 rounded-md bg-primary/10 flex items-center justify-center">
                  <QrCode className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Scan QR Code</h3>
                  <p className="text-xs text-muted-foreground">Mark attendance</p>
                </div>
              </div>
            </Link>

            <Link href="/student/exams">
              <div className="flex items-center gap-4 p-4 rounded-md bg-accent/50 hover-elevate active-elevate-2 cursor-pointer transition-colors">
                <div className="h-12 w-12 rounded-md bg-primary/10 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Apply for Exam</h3>
                  <p className="text-xs text-muted-foreground">Submit application</p>
                </div>
              </div>
            </Link>

            <Link href="/student/library">
              <div className="flex items-center gap-4 p-4 rounded-md bg-accent/50 hover-elevate active-elevate-2 cursor-pointer transition-colors">
                <div className="h-12 w-12 rounded-md bg-primary/10 flex items-center justify-center">
                  <Library className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Browse Library</h3>
                  <p className="text-xs text-muted-foreground">Find books</p>
                </div>
              </div>
            </Link>

            <Link href="/student/attendance">
              <div className="flex items-center gap-4 p-4 rounded-md bg-accent/50 hover-elevate active-elevate-2 cursor-pointer transition-colors">
                <div className="h-12 w-12 rounded-md bg-primary/10 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">View Attendance</h3>
                  <p className="text-xs text-muted-foreground">Check history</p>
                </div>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
