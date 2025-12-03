import { useQuery } from '@tanstack/react-query';
import { useParams, useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Clock, BookOpen, MapPin } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { StudentWithUser } from '@shared/schema';

export default function TimetableStudentDetailsPage() {
  const { id } = useParams();
  const [, navigate] = useLocation();

  const studentId = parseInt(id || '0');

  const { data: student, isLoading: studentLoading } = useQuery<StudentWithUser>({
    queryKey: ['/api/students', studentId],
    enabled: studentId > 0,
  });

  const { data: timetable = [], isLoading: timetableLoading } = useQuery<any[]>({
    queryKey: ['/api/timetable'],
  });

  const { data: enrollments = [] } = useQuery<any[]>({
    queryKey: ['/api/student-enrollments'],
  });

  if (studentLoading) {
    return <Skeleton className="h-96 w-full rounded-lg" />;
  }

  if (!student) {
    return <div className="text-center py-12">Student not found</div>;
  }

  const studentEnrollments = enrollments.filter((e: any) => e.studentId === studentId);
  const courseIds = studentEnrollments.map((e: any) => e.courseId);
  const studentSchedules = timetable.filter((entry: any) => courseIds.includes(entry.courseId));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate('/admin/timetable-students')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{student.user?.name}</h1>
          <p className="text-muted-foreground">{student.studentId} • {student.department?.code}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground mb-1">Program</p>
            <p className="font-semibold">{student.programType === 'FT' ? 'Full-Time' : 'Part-Time'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground mb-1">Year</p>
            <p className="font-semibold">{student.intakeYear}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground mb-1">Courses</p>
            <p className="font-semibold">{studentEnrollments.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground mb-1">Schedules</p>
            <p className="font-semibold">{studentSchedules.length}</p>
          </CardContent>
        </Card>
      </div>

      {timetableLoading ? (
        <Skeleton className="h-96 w-full rounded-lg" />
      ) : studentSchedules.length > 0 ? (
        <div className="grid gap-3">
          {studentSchedules.map((schedule: any) => (
            <Card key={schedule.id} className="hover:shadow-lg transition-shadow" data-testid={`card-schedule-${schedule.id}`}>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                  <div>
                    <p className="text-xs text-muted-foreground">Day</p>
                    <p className="font-semibold">{schedule.day}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Time
                    </p>
                    <p className="font-mono text-sm">{schedule.startTime} - {schedule.endTime}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <BookOpen className="w-3 h-3" /> Course
                    </p>
                    <p className="font-semibold text-sm">{schedule.course?.code}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Lecturer</p>
                    <p className="text-sm">{schedule.lecturer?.user?.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> Room
                    </p>
                    <p className="font-semibold text-sm">{schedule.room}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-muted rounded-lg">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-muted-foreground">No schedules assigned yet</p>
        </div>
      )}
    </div>
  );
}
