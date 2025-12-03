import { useRoute } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, BookOpen, Calendar } from 'lucide-react';
import { Link } from 'wouter';
import type { Course, Department, LecturerWithUser, StudentWithUser, ExamApplication } from '@shared/schema';

interface Subject {
  id: number;
  name: string;
  topics: string[];
}

export default function CourseDetailsPage() {
  const [, params] = useRoute('/admin/courses/:id');
  const courseId = parseInt(params?.id as string);

  const { data: courses = [] } = useQuery<Course[]>({
    queryKey: ['/api/courses'],
  });

  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ['/api/departments'],
  });

  const { data: lecturers = [] } = useQuery<LecturerWithUser[]>({
    queryKey: ['/api/lecturers'],
  });

  const { data: students = [] } = useQuery<StudentWithUser[]>({
    queryKey: ['/api/students'],
  });

  const { data: examApps = [] } = useQuery<ExamApplication[]>({
    queryKey: ['/api/exam-applications'],
  });

  const course = courses.find((c) => c.id === courseId);
  const courseWithDetails = course ? {
    ...course,
    department: departments.find((d) => d.id === course.departmentId),
    lecturer: lecturers.find((l) => l.id === course.lecturerId),
  } : null;

  // Fetch enrolled students
  const enrolledStudents = examApps
    .filter((app) => app.courseId === courseId)
    .map((app) => students.find((s) => s.id === app.studentId))
    .filter(Boolean);

  // Sample subjects based on course
  const courseSubjects: Record<number, Subject[]> = {
    1: [
      { id: 1, name: 'Web Development Fundamentals', topics: ['HTML', 'CSS', 'JavaScript Basics'] },
      { id: 2, name: 'Backend Development', topics: ['Node.js', 'Express', 'REST APIs'] },
      { id: 3, name: 'Database Design', topics: ['SQL', 'PostgreSQL', 'Data Modeling'] },
    ],
    2: [
      { id: 4, name: 'Data Structures', topics: ['Arrays', 'Linked Lists', 'Trees', 'Graphs'] },
      { id: 5, name: 'Algorithms', topics: ['Sorting', 'Searching', 'Dynamic Programming'] },
      { id: 6, name: 'Complexity Analysis', topics: ['Big O Notation', 'Space Complexity'] },
    ],
    3: [
      { id: 7, name: 'Business Management', topics: ['Strategy', 'Operations', 'Leadership'] },
      { id: 8, name: 'Financial Management', topics: ['Budgeting', 'Analysis', 'Planning'] },
      { id: 9, name: 'Project Management', topics: ['Planning', 'Execution', 'Monitoring'] },
    ],
    4: [
      { id: 10, name: 'Structural Design', topics: ['Load Analysis', 'Materials', 'Design Codes'] },
      { id: 11, name: 'Civil Engineering', topics: ['Concrete', 'Steel', 'Foundations'] },
      { id: 12, name: 'CAD & Modeling', topics: ['AutoCAD', '3D Design', 'BIM'] },
    ],
    5: [
      { id: 13, name: 'Crop Management', topics: ['Soil Science', 'Irrigation', 'Crop Varieties'] },
      { id: 14, name: 'Pest Management', topics: ['Integrated Pest Control', 'Pesticides'] },
      { id: 15, name: 'Sustainable Agriculture', topics: ['Organic Farming', 'Conservation'] },
    ],
  };

  const subjects = courseWithDetails ? courseSubjects[courseWithDetails.id] || [] : [];

  if (!courseWithDetails) {
    return (
      <div className="space-y-6">
        <Link href="/admin/courses">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Course not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/courses">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Courses
          </Button>
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight" data-testid="text-course-name">
              {courseWithDetails.name}
            </h1>
            <p className="text-muted-foreground mt-2" data-testid="text-course-code">
              {courseWithDetails.code}
            </p>
          </div>
          <Badge data-testid="badge-credits">
            {courseWithDetails.credits} Credits
          </Badge>
        </div>
      </div>

      {/* Course Overview */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Course Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground">Department</label>
              <p className="font-medium mt-1" data-testid="text-dept">
                {courseWithDetails.department?.name || 'N/A'}
              </p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Lecturer</label>
              <p className="font-medium mt-1" data-testid="text-lecturer">
                {courseWithDetails.lecturer?.user?.name || 'Unassigned'}
              </p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Course Code</label>
              <p className="font-mono text-sm font-medium mt-1" data-testid="text-code">
                {courseWithDetails.code}
              </p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Credits</label>
              <p className="font-medium mt-1" data-testid="text-credit-count">
                {courseWithDetails.credits}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Course Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground">Enrolled Students</label>
              <p className="text-2xl font-bold mt-1" data-testid="text-enrolled-count">
                {enrolledStudents.length}
              </p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Total Subjects</label>
              <p className="text-2xl font-bold mt-1" data-testid="text-subjects-count">
                {subjects.length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Course Subjects */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Course Subjects & Topics
          </CardTitle>
        </CardHeader>
        <CardContent>
          {subjects.length === 0 ? (
            <p className="text-sm text-muted-foreground">No subjects defined for this course</p>
          ) : (
            <div className="space-y-4">
              {subjects.map((subject) => (
                <div
                  key={subject.id}
                  className="border rounded-lg p-4 space-y-3 hover:bg-muted/50 transition-colors"
                  data-testid={`card-subject-${subject.id}`}
                >
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-muted-foreground" />
                    <h3 className="font-semibold" data-testid={`text-subject-${subject.id}`}>
                      {subject.name}
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {subject.topics.map((topic, idx) => (
                      <Badge
                        key={idx}
                        variant="outline"
                        className="text-xs"
                        data-testid={`badge-topic-${subject.id}-${idx}`}
                      >
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enrolled Students */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Enrolled Students ({enrolledStudents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {enrolledStudents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No students enrolled in this course</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {enrolledStudents.map((student: any) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50"
                  data-testid={`row-student-${student.id}`}
                >
                  <div>
                    <p className="font-medium text-sm" data-testid={`text-name-${student.id}`}>
                      {student.name}
                    </p>
                    <p className="text-xs text-muted-foreground" data-testid={`text-id-${student.id}`}>
                      {student.studentId}
                    </p>
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
