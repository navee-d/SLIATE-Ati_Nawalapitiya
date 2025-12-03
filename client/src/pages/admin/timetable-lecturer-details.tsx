import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, useLocation } from 'wouter';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Clock, BookOpen, MapPin, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { LecturerWithUser, Course } from '@shared/schema';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_SLOTS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

export default function TimetableLecturerDetailsPage() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const lecturerId = parseInt(id || '0');

  const { data: lecturer, isLoading: lecturerLoading } = useQuery<LecturerWithUser>({
    queryKey: ['/api/lecturers', lecturerId],
    enabled: lecturerId > 0,
  });

  const { data: timetable = [], isLoading: timetableLoading } = useQuery<any[]>({
    queryKey: ['/api/timetable'],
  });

  const { data: courses = [] } = useQuery<Course[]>({
    queryKey: ['/api/courses'],
  });

  const lecturerSchedules = timetable.filter((entry: any) => entry.lecturerId === lecturerId);

  if (lecturerLoading) {
    return <Skeleton className="h-96 w-full rounded-lg" />;
  }

  if (!lecturer) {
    return <div className="text-center py-12">Lecturer not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate('/admin/timetable-lecturers')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{lecturer.user?.name}</h1>
          <p className="text-muted-foreground">{lecturer.employeeId} • {lecturer.department?.code}</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Schedule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Schedule for {lecturer.user?.name}</DialogTitle>
            </DialogHeader>
            <AddScheduleForm lecturerId={lecturerId} courses={courses} onSuccess={() => setIsDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {timetableLoading ? (
        <Skeleton className="h-96 w-full rounded-lg" />
      ) : lecturerSchedules.length > 0 ? (
        <div className="grid gap-3">
          {lecturerSchedules.map((schedule: any) => (
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
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> Room
                    </p>
                    <p className="font-semibold text-sm">{schedule.room}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      Delete
                    </Button>
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

function AddScheduleForm({
  lecturerId,
  courses,
  onSuccess,
}: {
  lecturerId: number;
  courses: any[];
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    courseId: '',
    day: 'Monday',
    startTime: '08:00',
    endTime: '09:00',
    room: '',
  });
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: (data: any) =>
      apiRequest('POST', '/api/timetable', {
        ...data,
        lecturerId,
        courseId: parseInt(data.courseId),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/timetable'] });
      toast({ title: 'Success', description: 'Schedule added' });
      onSuccess();
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.courseId || !formData.room) {
      toast({ title: 'Error', description: 'Please fill all fields', variant: 'destructive' });
      return;
    }
    createMutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="course">Course *</Label>
        <Select value={formData.courseId} onValueChange={(v) => setFormData({ ...formData, courseId: v })}>
          <SelectTrigger>
            <SelectValue placeholder="Select course" />
          </SelectTrigger>
          <SelectContent>
            {courses.map((c: any) => (
              <SelectItem key={c.id} value={c.id.toString()}>
                {c.code} - {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="day">Day *</Label>
          <Select value={formData.day} onValueChange={(v) => setFormData({ ...formData, day: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DAYS.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="room">Room *</Label>
          <Input
            id="room"
            value={formData.room}
            onChange={(e) => setFormData({ ...formData, room: e.target.value })}
            placeholder="Lab 101"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Start Time *</Label>
          <Select value={formData.startTime} onValueChange={(v) => setFormData({ ...formData, startTime: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIME_SLOTS.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>End Time *</Label>
          <Select value={formData.endTime} onValueChange={(v) => setFormData({ ...formData, endTime: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIME_SLOTS.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <DialogFooter>
        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Add Schedule
        </Button>
      </DialogFooter>
    </form>
  );
}
