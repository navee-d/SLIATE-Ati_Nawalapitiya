import { useRoute } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail, Phone, BookOpen, GraduationCap } from 'lucide-react';
import { Link } from 'wouter';
import type { LecturerWithUser, Department, Course } from '@shared/schema';

export default function LecturerDetailsPage() {
  const [, params] = useRoute('/admin/lecturers/:id');
  const lecturerId = parseInt(params?.id as string);

  const { data: lecturers = [] } = useQuery<LecturerWithUser[]>({
    queryKey: ['/api/lecturers'],
  });

  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ['/api/departments'],
  });

  const { data: courses = [] } = useQuery<Course[]>({
    queryKey: ['/api/courses'],
  });

  const lecturer = lecturers.find((l) => l.id === lecturerId);
  const lecturerWithDetails = lecturer ? {
    ...lecturer,
    department: departments.find((d) => d.id === lecturer.departmentId),
  } : null;

  const taughtCourses = courses.filter((c) => c.lecturerId === lecturerId);

  if (!lecturerWithDetails) {
    return (
      <div className="space-y-6">
        <Link href="/admin/lecturers">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Lecturer not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/lecturers">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Lecturers
          </Button>
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight" data-testid="text-lecturer-name">
              {lecturerWithDetails.user?.name}
            </h1>
            <p className="text-muted-foreground mt-2" data-testid="text-designation">
              {lecturerWithDetails.designation || 'Lecturer'}
            </p>
          </div>
          <Badge
            variant={lecturerWithDetails.isHOD ? 'default' : 'secondary'}
            className="text-base px-3 py-1"
            data-testid="badge-hod-status"
          >
            {lecturerWithDetails.isHOD ? 'Head of Department' : 'Lecturer'}
          </Badge>
        </div>
      </div>

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
                  {lecturerWithDetails.user?.email}
                </p>
              </div>
            </div>
            {lecturerWithDetails.user?.phone && (
              <div>
                <label className="text-sm text-muted-foreground">Phone</label>
                <div className="flex items-center gap-2 mt-1">
                  <Phone className="w-4 h-4" />
                  <p className="font-medium" data-testid="text-phone">
                    {lecturerWithDetails.user?.phone}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Professional Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm text-muted-foreground">Employee ID</label>
              <p className="font-mono text-sm font-medium mt-1" data-testid="text-emp-id">
                {lecturerWithDetails.employeeId}
              </p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Designation</label>
              <p className="font-medium mt-1" data-testid="text-prof-designation">
                {lecturerWithDetails.designation || 'Lecturer'}
              </p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Department</label>
              <p className="font-medium mt-1" data-testid="text-dept">
                {lecturerWithDetails.department?.name || 'N/A'}
              </p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Status</label>
              <div className="mt-1">
                <Badge
                  variant={lecturerWithDetails.isHOD ? 'default' : 'secondary'}
                  data-testid="badge-status"
                >
                  {lecturerWithDetails.isHOD ? 'HOD' : 'Lecturer'}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Courses Taught ({taughtCourses.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {taughtCourses.length === 0 ? (
            <p className="text-sm text-muted-foreground">No courses assigned yet</p>
          ) : (
            <div className="space-y-2">
              {taughtCourses.map((course: any) => (
                <div
                  key={course.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50"
                  data-testid={`row-course-${course.id}`}
                >
                  <div>
                    <p className="font-medium text-sm" data-testid={`text-course-${course.id}`}>
                      {course.code} - {course.name}
                    </p>
                    {course.credits && (
                      <p className="text-xs text-muted-foreground">
                        {course.credits} Credits
                      </p>
                    )}
                  </div>
                  <GraduationCap className="w-4 h-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
