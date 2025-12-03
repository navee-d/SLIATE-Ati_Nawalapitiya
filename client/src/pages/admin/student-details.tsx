import { useRoute } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail, Phone, BookOpen, Calendar, Award } from 'lucide-react';
import { Link } from 'wouter';
import type { StudentWithUser, Department, ExamApplication, Course } from '@shared/schema';

export default function StudentDetailsPage() {
  const [, params] = useRoute('/admin/students/:id');
  const studentId = parseInt(params?.id as string);

  const { data: students = [] } = useQuery<StudentWithUser[]>({
    queryKey: ['/api/students'],
  });

  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ['/api/departments'],
  });

  const { data: examApps = [] } = useQuery<ExamApplication[]>({
    queryKey: ['/api/exam-applications'],
  });

  const { data: courses = [] } = useQuery<Course[]>({
    queryKey: ['/api/courses'],
  });

  const student = students.find((s) => s.id === studentId);

  if (!student) {
    return (
      <div className="space-y-6">
        <div>
          <Link href="/admin/departments">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Student not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const enrolledCourses = examApps
    .filter((app) => {
      const appStudent = students.find((s) => s.id === app.studentId);
      return appStudent?.id === studentId;
    })
    .map((app) => courses.find((c) => c.id === app.courseId))
    .filter(Boolean);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/departments">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Departments
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight" data-testid="text-student-name">
          {student.user?.name}
        </h1>
        <p className="text-muted-foreground mt-2" data-testid="text-student-id">
          {student.studentId}
        </p>
      </div>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm text-muted-foreground">Email</label>
              <div className="flex items-center gap-2 mt-1">
                <Mail className="w-4 h-4" />
                <p className="font-medium" data-testid="text-email">
                  {student.user?.email}
                </p>
              </div>
            </div>
            {student.user?.phone && (
              <div>
                <label className="text-sm text-muted-foreground">Phone</label>
                <div className="flex items-center gap-2 mt-1">
                  <Phone className="w-4 h-4" />
                  <p className="font-medium" data-testid="text-phone">
                    {student.user?.phone}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Academic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Academic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm text-muted-foreground">Student Number</label>
              <p className="font-medium mt-1" data-testid="text-student-number">
                {student.studentNumber}
              </p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Department</label>
              <p className="font-medium mt-1" data-testid="text-dept">
                {student.department?.name || 'N/A'}
              </p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Program Type</label>
              <div className="mt-1">
                <Badge
                  variant={student.programType === 'FT' ? 'default' : 'secondary'}
                  data-testid="badge-program-type"
                >
                  {student.programType === 'FT' ? 'Full-Time' : 'Part-Time'}
                </Badge>
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Intake Year</label>
              <p className="font-medium mt-1" data-testid="text-intake-year">
                {student.intakeYear}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enrolled Courses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Enrolled Courses ({enrolledCourses.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {enrolledCourses.length === 0 ? (
            <p className="text-sm text-muted-foreground">No courses enrolled</p>
          ) : (
            <div className="space-y-2">
              {enrolledCourses.map((course: any) => (
                <div
                  key={course.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50"
                  data-testid={`row-course-${course.id}`}
                >
                  <div>
                    <p className="font-medium text-sm" data-testid={`text-course-name-${course.id}`}>
                      {course.code} - {course.name}
                    </p>
                    {course.credits && (
                      <p className="text-xs text-muted-foreground">
                        {course.credits} Credits
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
