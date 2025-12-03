import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'wouter';
import { Search, Clock, BookOpen, MapPin } from 'lucide-react';
import type { LecturerWithUser } from '@shared/schema';

export default function TimetableLecturersPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: lecturers = [], isLoading } = useQuery<LecturerWithUser[]>({
    queryKey: ['/api/lecturers'],
  });

  const { data: timetable = [] } = useQuery<any[]>({
    queryKey: ['/api/timetable'],
  });

  const filteredLecturers = lecturers.filter((lecturer) => {
    const nameMatch = lecturer.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const emailMatch = lecturer.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    return nameMatch || emailMatch;
  });

  const getLecturerSchedules = (lecturerId: number) => {
    return timetable.filter((entry: any) => entry.lecturerId === lecturerId);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Lecturer Timetables</h1>
        <p className="text-muted-foreground mt-2">View and manage lecturer schedules</p>
      </div>

      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
          data-testid="input-search-lecturer-schedules"
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
          {filteredLecturers && filteredLecturers.length > 0 ? (
            filteredLecturers.map((lecturer: any) => {
              const schedules = getLecturerSchedules(lecturer.id);
              return (
                <Link key={lecturer.id} href={`/admin/timetable-lecturers/${lecturer.id}`} className="no-underline">
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full" data-testid={`card-lecturer-schedule-${lecturer.id}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg" data-testid={`text-name-${lecturer.id}`}>
                            {lecturer.user?.name}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">{lecturer.employeeId}</p>
                        </div>
                        <Badge variant="default" className="flex-shrink-0">
                          {lecturer.isHOD ? 'HOD' : 'Lecturer'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Department</p>
                        <Badge variant="outline" data-testid={`badge-dept-${lecturer.id}`}>
                          {lecturer.department?.code}
                        </Badge>
                      </div>

                      <div className="space-y-2 text-sm">
                        <p className="text-xs text-muted-foreground mb-2">📧 {lecturer.user?.email}</p>
                        {lecturer.user?.phone && <p className="text-xs text-muted-foreground">📞 {lecturer.user?.phone}</p>}
                      </div>

                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {schedules.length} Schedule{schedules.length !== 1 ? 's' : ''}
                        </p>
                        {schedules.length > 0 && (
                          <div className="space-y-1">
                            {schedules.slice(0, 2).map((schedule: any, idx: number) => (
                              <div key={idx} className="text-xs bg-blue-50 dark:bg-blue-950 p-2 rounded">
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
              <p className="text-muted-foreground">No lecturers found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
