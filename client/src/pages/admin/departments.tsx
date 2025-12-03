import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, BookOpen, Grid3x3 } from 'lucide-react';
import { Link } from 'wouter';

interface Department {
  id: number;
  code: string;
  name: string;
  createdAt: string;
}

interface DeptStats {
  dept: Department;
  studentCount: number;
  lecturerCount: number;
  courseCount: number;
}

export default function DepartmentsPage() {
  const { data: departments = [], isLoading } = useQuery({
    queryKey: ['/api/departments'],
    enabled: true,
  });

  const { data: students = [] } = useQuery({
    queryKey: ['/api/students'],
    enabled: true,
  });

  const { data: lecturers = [] } = useQuery({
    queryKey: ['/api/lecturers'],
    enabled: true,
  });

  const { data: courses = [] } = useQuery({
    queryKey: ['/api/courses'],
    enabled: true,
  });

  const deptStats: DeptStats[] = departments.map((dept: Department) => ({
    dept,
    studentCount: students.filter((s: any) => s.departmentId === dept.id).length,
    lecturerCount: lecturers.filter((l: any) => l.departmentId === dept.id).length,
    courseCount: courses.filter((c: any) => c.departmentId === dept.id).length,
  }));

  const deptColors: Record<string, string> = {
    ICT: 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100',
    ENG: 'bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-100',
    BSM: 'bg-purple-100 text-purple-900 dark:bg-purple-900 dark:text-purple-100',
    AGR: 'bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-100',
    ACT: 'bg-red-100 text-red-900 dark:bg-red-900 dark:text-red-100',
  };

  const deptFullNames: Record<string, string> = {
    ICT: 'Information & Communications Technology',
    ENG: 'Engineering',
    BSM: 'Business Studies & Management',
    AGR: 'Agriculture & Environmental Science',
    ACT: 'Accounting & Finance',
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Departments</h1>
          <p className="text-muted-foreground mt-2">Manage academic departments</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6 h-32 bg-muted/50 rounded" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Departments</h1>
        <p className="text-muted-foreground mt-2">Manage academic departments</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {deptStats.map(({ dept, studentCount, lecturerCount, courseCount }) => (
          <Link key={dept.id} href={`/admin/departments/${dept.code}`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <Badge
                      className={`${deptColors[dept.code] || 'bg-gray-100'} mb-2`}
                      data-testid={`badge-dept-${dept.code}`}
                    >
                      {dept.code}
                    </Badge>
                    <CardTitle className="text-lg">{deptFullNames[dept.code] || dept.name}</CardTitle>
                  </div>
                </div>
              </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Users className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-muted-foreground">Students</p>
                    <p className="font-semibold text-lg" data-testid={`text-students-${dept.code}`}>
                      {studentCount}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <BookOpen className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-muted-foreground">Lecturers</p>
                    <p className="font-semibold text-lg" data-testid={`text-lecturers-${dept.code}`}>
                      {lecturerCount}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <Grid3x3 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-muted-foreground">Courses</p>
                    <p className="font-semibold text-lg" data-testid={`text-courses-${dept.code}`}>
                      {courseCount}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Department Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm text-muted-foreground">Total Students</p>
                <p className="text-2xl font-bold" data-testid="text-total-students">
                  {students.length}
                </p>
              </div>
              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm text-muted-foreground">Total Lecturers</p>
                <p className="text-2xl font-bold" data-testid="text-total-lecturers">
                  {lecturers.length}
                </p>
              </div>
              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm text-muted-foreground">Total Courses</p>
                <p className="text-2xl font-bold" data-testid="text-total-courses">
                  {courses.length}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
