import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'wouter';
import { Search, Clock, BookOpen, MapPin, GraduationCap } from 'lucide-react';

export default function TimetableStudentsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: students = [], isLoading } = useQuery({
    queryKey: ['/api/students'],
  });

  const { data: timetable = [] } = useQuery({
    queryKey: ['/api/timetable'],
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ['/api/student-enrollments'],
  });

  const filteredStudents = students.filter((student: any) => {
    const nameMatch = student.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const studentIdMatch = student.studentId?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    return nameMatch || studentIdMatch;
  });

  const getStudentSchedules = (studentId: number) => {
    const studentEnrollments = enrollments.filter((e: any) => e.studentId === studentId);
    const courseIds = studentEnrollments.map((e: any) => e.courseId);
    return timetable.filter((entry: any) => courseIds.includes(entry.courseId));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <GraduationCap className="w-8 h-8 text-green-600" />
          Student Timetables
        </h1>
        <p className="text-muted-foreground mt-2">View and manage student schedules</p>
      </div>

      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or student ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
          data-testid="input-search-student-schedules"
        />
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-64 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredStudents && filteredStudents.length > 0 ? (
            filteredStudents.map((student: any) => {
              const schedules = getStudentSchedules(student.id);
              return (
                <Link key={student.id} href={`/admin/timetable-students/${student.id}`} className="no-underline">
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full" data-testid={`card-student-schedule-${student.id}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg" data-testid={`text-name-${student.id}`}>
                            {student.name}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">{student.studentId}</p>
                        </div>
                        <Badge variant="secondary" className="flex-shrink-0">
                          Student
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">Department</p>
                        <Badge variant="outline" data-testid={`badge-dept-${student.id}`}>
                          {student.department?.code}
                        </Badge>
                      </div>

                      <div className="space-y-1 text-xs">
                        <p className="text-muted-foreground">Program: <span className="font-medium">{student.programType === 'FT' ? 'Full-Time' : 'Part-Time'}</span></p>
                        <p className="text-muted-foreground">Year: <span className="font-medium">{student.intakeYear}</span></p>
                      </div>

                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {schedules.length} Schedule{schedules.length !== 1 ? 's' : ''}
                        </p>
                        {schedules.length > 0 && (
                          <div className="space-y-1">
                            {schedules.slice(0, 2).map((schedule: any, idx: number) => (
                              <div key={idx} className="text-xs bg-green-50 dark:bg-green-950 p-2 rounded">
                                <div className="flex items-center gap-1">
                                  <BookOpen className="w-3 h-3" />
                                  {schedule.course?.code}
                                </div>
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <MapPin className="w-3 h-3" />
                                  {schedule.room}
                                </div>
                                <div className="text-muted-foreground">{schedule.day} {schedule.startTime}-{schedule.endTime}</div>
                              </div>
                            ))}
                            {schedules.length > 2 && (
                              <p className="text-xs text-muted-foreground">+{schedules.length - 2} more...</p>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">No students found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
