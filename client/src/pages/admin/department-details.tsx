import { useRoute } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, ArrowLeft, Mail, Award } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import type { Department, StudentWithUser } from '@shared/schema';

const deptFullNames: Record<string, string> = {
  ICT: 'Information & Communications Technology',
  ENG: 'Engineering',
  BSM: 'Business Studies & Management',
  AGR: 'Agriculture & Environmental Science',
  ACT: 'Accounting & Finance',
};

const deptColors: Record<string, string> = {
  ICT: 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100',
  ENG: 'bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-100',
  BSM: 'bg-purple-100 text-purple-900 dark:bg-purple-900 dark:text-purple-100',
  AGR: 'bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-100',
  ACT: 'bg-red-100 text-red-900 dark:bg-red-900 dark:text-red-100',
};

export default function DepartmentDetailsPage() {
  const [, params] = useRoute('/admin/departments/:code');
  const deptCode = params?.code as string;

  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ['/api/departments'],
  });

  const { data: students = [] } = useQuery<StudentWithUser[]>({
    queryKey: ['/api/students'],
  });

  const department = departments.find((d) => d.code === deptCode);
  if (!department) {
    return <div>Department not found</div>;
  }

  const deptStudents = students
    .filter((s) => {
      return s.departmentId === department.id;
    })
    .sort((a, b) => (a.user?.name || '').localeCompare(b.user?.name || ''));

  const ftCount = deptStudents.filter((s) => s.programType === 'FT').length;
  const ptCount = deptStudents.filter((s) => s.programType === 'PT').length;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/departments">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Departments
          </Button>
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <Badge className={deptColors[deptCode] || 'bg-gray-100'}>
            {deptCode}
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight">
            {deptFullNames[deptCode] || department.name}
          </h1>
        </div>
        <p className="text-muted-foreground mt-2">
          Manage students in this department
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Students</p>
            <p className="text-3xl font-bold mt-2" data-testid="text-total-students">
              {deptStudents.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Full-Time (FT)</p>
            <p className="text-3xl font-bold mt-2" data-testid="text-ft-students">
              {ftCount}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Part-Time (PT)</p>
            <p className="text-3xl font-bold mt-2" data-testid="text-pt-students">
              {ptCount}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Students List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            All Students ({deptStudents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {deptStudents.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No students in this department
            </p>
          ) : (
            <div className="space-y-3">
              {deptStudents.map((student: Student) => (
                <Link key={student.id} href={`/admin/students/${student.id}`}>
                  <div
                    className="flex items-start justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                    data-testid={`row-student-${student.id}`}
                  >
                    <div className="flex-1">
                      <p className="font-semibold" data-testid={`text-name-${student.id}`}>
                        {student.name}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {student.studentId}
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <Mail className="w-3 h-3" />
                        {student.email}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge
                        variant={student.programType === 'FT' ? 'default' : 'secondary'}
                        data-testid={`badge-type-${student.id}`}
                      >
                        {student.programType}
                      </Badge>
                      <Badge
                        variant="outline"
                        data-testid={`badge-year-${student.id}`}
                      >
                        {student.intakeYear}
                      </Badge>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
