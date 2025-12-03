import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Users, ArrowRight } from 'lucide-react';

interface Course {
  id: number;
  code: string;
  name: string;
  departmentId: number;
  lecturerId?: number;
  credits?: number;
  createdAt: string;
  department?: { name: string; code: string };
  lecturer?: { name: string };
}

interface Student {
  id: number;
  userId: number;
  studentId: string;
  name: string;
  email: string;
}

export default function CoursesPage() {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  const { data: courses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ['/api/courses'],
    enabled: true,
  });

  const { data: examApps = [] } = useQuery({
    queryKey: ['/api/exam-applications'],
    enabled: true,
  });

  const { data: students = [] } = useQuery({
    queryKey: ['/api/students'],
    enabled: true,
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['/api/departments'],
    enabled: true,
  });

  const { data: lecturers = [] } = useQuery({
    queryKey: ['/api/lecturers'],
    enabled: true,
  });

  // Enrich courses with department and lecturer info
  const enrichedCourses = courses.map((course: any) => ({
    ...course,
    department: departments.find((d: any) => d.id === course.departmentId),
    lecturer: lecturers.find((l: any) => l.id === course.lecturerId),
  }));

  // Get students for selected course - show all students in the course's department
  const courseStudents = selectedCourse
    ? students
        .filter((s: any) => {
          if (!s) return false;
          // Debug: log to see what's happening
          if (!window.courseDebugLogged && students.length > 0) {
            console.log('First student:', students[0]);
            console.log('Selected course dept ID:', selectedCourse.departmentId);
            console.log('All students:', students);
            window.courseDebugLogged = true;
          }
          return s.departmentId === selectedCourse.departmentId;
        })
        .sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''))
    : [];

  if (coursesLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Courses</h1>
          <p className="text-muted-foreground mt-2">Manage courses across departments</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(6)].map((_, i) => (
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
        <h1 className="text-3xl font-bold tracking-tight">Courses</h1>
        <p className="text-muted-foreground mt-2">Manage courses across departments</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Courses List */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Courses ({enrichedCourses.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {enrichedCourses.length === 0 ? (
                <p className="text-sm text-muted-foreground">No courses found</p>
              ) : (
                enrichedCourses.map((course: Course) => (
                  <button
                    key={course.id}
                    onClick={() => setSelectedCourse(course)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedCourse?.id === course.id
                        ? 'bg-primary/10 border-primary'
                        : 'hover:bg-muted border-border'
                    }`}
                    data-testid={`button-course-${course.code}`}
                  >
                    <div className="font-semibold text-sm">{course.code}</div>
                    <div className="text-xs text-muted-foreground line-clamp-2">
                      {course.name}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {course.department?.code || 'N/A'}
                    </div>
                  </button>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Course Details */}
        <div className="md:col-span-2">
          {selectedCourse ? (
            <Card>
              <CardHeader>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" data-testid={`badge-course-${selectedCourse.code}`}>
                      {selectedCourse.code}
                    </Badge>
                    {selectedCourse.credits && (
                      <Badge variant="secondary">{selectedCourse.credits} Credits</Badge>
                    )}
                  </div>
                  <CardTitle>{selectedCourse.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Course Info */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Department
                    </p>
                    <p className="font-semibold" data-testid="text-course-dept">
                      {selectedCourse.department?.name || 'N/A'}
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Lecturer
                    </p>
                    <p className="font-semibold" data-testid="text-course-lecturer">
                      {selectedCourse.lecturer?.name || 'Unassigned'}
                    </p>
                  </div>
                </div>

                {/* Enrolled Students */}
                <div>
                  <h3 className="font-semibold flex items-center gap-2 mb-3">
                    <Users className="w-4 h-4" />
                    Enrolled Students ({courseStudents.length})
                  </h3>
                  {courseStudents.length === 0 ? (
                    <p className="text-sm text-muted-foreground bg-muted rounded p-3">
                      No students enrolled in this course
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {courseStudents.map((student: Student) => (
                        <div
                          key={student.id}
                          className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                          data-testid={`row-student-${student.id}`}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm" data-testid={`text-student-name-${student.id}`}>
                              {student.name}
                            </p>
                            <p className="text-xs text-muted-foreground" data-testid={`text-student-id-${student.id}`}>
                              {student.studentId}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {student.email}
                            </p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground py-8">
                  Select a course to view details and enrolled students
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
