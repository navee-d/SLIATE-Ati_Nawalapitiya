import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Loader2, Calendar, Clock, MapPin, Users, BookOpen, UserCog, ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { Course, LecturerWithUser } from '@shared/schema';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIME_SLOTS = ['07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'];

export default function TimetablePage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [deletingEntry, setDeletingEntry] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'lecturers' | 'courses'>('lecturers');

  // Lecturer tab state
  const [lecturerCategory, setLecturerCategory] = useState<'permanent' | 'visiting' | null>(null);
  const [lecturerSearchTerm, setLecturerSearchTerm] = useState('');
  const [selectedLecturer, setSelectedLecturer] = useState<number | null>(null);

  // Courses tab state
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [courseSearchTerm, setCourseSearchTerm] = useState('');

  const { toast } = useToast();

  const { data: timetable = [], isLoading: loadingTimetable } = useQuery<any[]>({
    queryKey: ['/api/timetable'],
  });

  const { data: courses = [] } = useQuery<Course[]>({
    queryKey: ['/api/courses'],
  });

  const { data: lecturers = [] } = useQuery<LecturerWithUser[]>({
    queryKey: ['/api/lecturers'],
  });

  // Filter courses by search term
  const filteredCourses = courses.filter((course) => {
    const codeMatch = course.code?.toLowerCase().includes(courseSearchTerm.toLowerCase()) || false;
    const nameMatch = course.name?.toLowerCase().includes(courseSearchTerm.toLowerCase()) || false;
    return codeMatch || nameMatch;
  });

  // Display max 5 courses at a time
  const displayedCourses = filteredCourses.slice(0, 5);

  // Filter lecturers by category
  const filteredLecturersByCategory = lecturers.filter((lecturer) => {
    if (lecturerCategory === 'permanent') return lecturer.isHOD;
    if (lecturerCategory === 'visiting') return !lecturer.isHOD;
    return true;
  });

  // Filter lecturers by search term (from category filtered list)
  const filteredLecturers = filteredLecturersByCategory.filter((lecturer) => {
    const nameMatch = lecturer.user?.name?.toLowerCase().includes(lecturerSearchTerm.toLowerCase()) || false;
    const emailMatch = lecturer.user?.email?.toLowerCase().includes(lecturerSearchTerm.toLowerCase()) || false;
    return nameMatch || emailMatch;
  });

  // Get timetable for selected lecturer
  const getLecturerSchedules = (lecturerId: number) => {
    return timetable.filter((entry: any) => entry.lecturerId === lecturerId);
  };

  // Get timetable for selected course
  const getCourseSchedules = (courseId: number) => {
    return timetable.filter((entry: any) => entry.courseId === courseId);
  };

  const handleEditClick = (entry: any) => {
    setEditingEntry(entry);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingEntry(null);
  };

  const isLoading = loadingTimetable;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Calendar className="w-8 h-8 text-blue-600" />
            Class Timetable
          </h1>
          <p className="text-muted-foreground mt-2">View and manage timetables</p>
        </div>
        <Dialog open={isDialogOpen && !editingEntry} onOpenChange={(open) => !open && handleCloseDialog()}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-timetable" onClick={() => setEditingEntry(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Schedule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-screen overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Class Schedule</DialogTitle>
              <DialogDescription>Create a new timetable entry</DialogDescription>
            </DialogHeader>
            <TimetableForm
              courses={courses}
              lecturers={lecturers}
              onSuccess={handleCloseDialog}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b">
        <Button
          variant={activeTab === 'lecturers' ? 'default' : 'ghost'}
          onClick={() => {
            setActiveTab('lecturers');
            setLecturerCategory(null);
            setSelectedLecturer(null);
            setLecturerSearchTerm('');
          }}
          className="rounded-b-none"
          data-testid="tab-lecturers"
        >
          <UserCog className="w-4 h-4 mr-2" />
          Lecturer Schedules
        </Button>
        <Button
          variant={activeTab === 'courses' ? 'default' : 'ghost'}
          onClick={() => {
            setActiveTab('courses');
            setSelectedCourse(null);
            setCourseSearchTerm('');
          }}
          className="rounded-b-none"
          data-testid="tab-courses"
        >
          <BookOpen className="w-4 h-4 mr-2" />
          Course Schedules
        </Button>
      </div>

      {/* LECTURERS TAB */}
      {activeTab === 'lecturers' && (
        <div className="space-y-4">
          {!selectedLecturer ? (
            <>
              {/* Category Selection */}
              {!lecturerCategory ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card 
                    className="hover:shadow-lg transition-shadow cursor-pointer" 
                    onClick={() => setLecturerCategory('permanent')}
                    data-testid="card-permanent-lecturers"
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-100 dark:bg-blue-950 rounded-lg">
                          <UserCog className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-lg">Permanent Lecturers</p>
                          <p className="text-sm text-muted-foreground">
                            {lecturers.filter((l: any) => !l.isVisiting).length} lecturers
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card 
                    className="hover:shadow-lg transition-shadow cursor-pointer" 
                    onClick={() => setLecturerCategory('visiting')}
                    data-testid="card-visiting-lecturers"
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-green-100 dark:bg-green-950 rounded-lg">
                          <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-lg">Visiting Lecturers</p>
                          <p className="text-sm text-muted-foreground">
                            {lecturers.filter((l: any) => l.isVisiting).length} lecturers
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <>
                  {/* Search for lecturer */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setLecturerCategory(null);
                        setLecturerSearchTerm('');
                      }}
                      data-testid="button-back-lecturer-category"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div className="relative flex-1">
                      <Input
                        placeholder="Search lecturer by name..."
                        value={lecturerSearchTerm}
                        onChange={(e) => setLecturerSearchTerm(e.target.value)}
                        data-testid="input-search-lecturer"
                      />
                    </div>
                  </div>

                  {/* Lecturer list */}
                  {isLoading ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-32 w-full rounded-lg" />
                      ))}
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {filteredLecturers.length > 0 ? (
                        filteredLecturers.map((lecturer: any) => (
                          <Card
                            key={lecturer.id}
                            className="hover:shadow-lg transition-shadow cursor-pointer"
                            onClick={() => setSelectedLecturer(lecturer.id)}
                            data-testid={`card-lecturer-select-${lecturer.id}`}
                          >
                            <CardHeader className="pb-3">
                              <CardTitle className="text-lg">{lecturer.user?.name}</CardTitle>
                              <p className="text-sm text-muted-foreground">{lecturer.employeeId}</p>
                            </CardHeader>
                            <CardContent>
                              <Badge variant="outline">{lecturer.department?.code}</Badge>
                            </CardContent>
                          </Card>
                        ))
                      ) : (
                        <div className="col-span-full text-center py-12">
                          <p className="text-muted-foreground">No lecturers found</p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            <>
              {/* Lecturer Timetable */}
              <div className="flex items-center gap-2 mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedLecturer(null)}
                  data-testid="button-back-lecturer-schedule"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <h2 className="text-lg font-semibold">
                  {lecturers.find((l: any) => l.id === selectedLecturer)?.user?.name} - Schedule
                </h2>
              </div>

              {isLoading ? (
                <div className="grid gap-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-32 w-full rounded-lg" />
                  ))}
                </div>
              ) : (
                <TimetableDisplay
                  schedules={getLecturerSchedules(selectedLecturer)}
                  editingEntry={editingEntry}
                  isDialogOpen={isDialogOpen}
                  deletingEntry={deletingEntry}
                  onEditClick={handleEditClick}
                  onDeleteClick={(entry: any) => setDeletingEntry(entry)}
                  onCloseDelete={() => setDeletingEntry(null)}
                  onCloseDialog={handleCloseDialog}
                  courses={courses}
                  lecturers={lecturers}
                />
              )}
            </>
          )}
        </div>
      )}

      {/* COURSES TAB */}
      {activeTab === 'courses' && (
        <div className="space-y-4">
          {!selectedCourse ? (
            <>
              {/* Search for course */}
              <div className="relative w-full">
                <Input
                  placeholder="Search course by code or name..."
                  value={courseSearchTerm}
                  onChange={(e) => setCourseSearchTerm(e.target.value)}
                  data-testid="input-search-course"
                />
              </div>

              {isLoading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-48 w-full rounded-lg" />
                  ))}
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                  {displayedCourses.length > 0 ? (
                    displayedCourses.map((course: any) => (
                      <Card
                        key={course.id}
                        className="hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => setSelectedCourse(course.id)}
                        data-testid={`card-course-select-${course.id}`}
                      >
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">{course.code}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <p className="text-sm text-muted-foreground line-clamp-2">{course.name}</p>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">
                              {timetable.filter((t: any) => t.courseId === course.id).length} classes
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-12">
                      <p className="text-muted-foreground">No courses found</p>
                    </div>
                  )}
                </div>
              )}
              
              {filteredCourses.length > 5 && (
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Showing 5 of {filteredCourses.length} courses</p>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Course Timetable */}
              <div className="flex items-center gap-2 mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedCourse(null)}
                  data-testid="button-back-course-schedule"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <h2 className="text-lg font-semibold">
                  {courses.find((c: any) => c.id === selectedCourse)?.code} - Schedule
                </h2>
              </div>

              {isLoading ? (
                <div className="grid gap-4">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-32 w-full rounded-lg" />
                  ))}
                </div>
              ) : (
                <TimetableDisplay
                  schedules={getCourseSchedules(selectedCourse)}
                  editingEntry={editingEntry}
                  isDialogOpen={isDialogOpen}
                  deletingEntry={deletingEntry}
                  onEditClick={handleEditClick}
                  onDeleteClick={(entry: any) => setDeletingEntry(entry)}
                  onCloseDelete={() => setDeletingEntry(null)}
                  onCloseDialog={handleCloseDialog}
                  courses={courses}
                  lecturers={lecturers}
                />
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function TimetableDisplay({
  schedules,
  editingEntry,
  isDialogOpen,
  deletingEntry,
  onEditClick,
  onDeleteClick,
  onCloseDelete,
  onCloseDialog,
  courses,
  lecturers,
}: any) {
  // Build grid: for each time slot and day, find matching schedule
  const getScheduleForTimeDay = (time: string, day: string) => {
    return schedules.find((entry: any) => {
      // Check if schedule overlaps with this time slot
      return entry.day === day && 
             entry.startTime <= time && 
             entry.endTime > time;
    });
  };

  return (
    <div className="space-y-4">
      {schedules.length > 0 ? (
        <>
          {/* Grid View */}
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-900 border-b border-border">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground w-20">Time</th>
                  {DAYS.map((day) => (
                    <th key={day} className="px-3 py-2 text-center text-xs font-semibold text-muted-foreground">
                      {day.substring(0, 3).toUpperCase()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TIME_SLOTS.map((time) => (
                  <tr key={time} className="border-b border-border hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <td className="px-3 py-2 text-xs font-mono font-semibold text-muted-foreground bg-slate-50 dark:bg-slate-900/50">
                      {time}
                    </td>
                    {DAYS.map((day) => {
                      const schedule = getScheduleForTimeDay(time, day);
                      return (
                        <td key={`${day}-${time}`} className="px-2 py-2 text-center text-xs">
                          {schedule ? (
                            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded p-1">
                              <p className="font-semibold text-blue-900 dark:text-blue-100">{schedule.course?.code}</p>
                              <p className="text-xs text-blue-700 dark:text-blue-300">{schedule.room}</p>
                              <p className="text-xs text-blue-600 dark:text-blue-400">{schedule.lecturer?.user?.name}</p>
                            </div>
                          ) : null}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Details List */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Schedule Details:</h3>
            <div className="grid gap-2">
              {schedules.map((entry: any) => (
                <Card key={entry.id} className="hover:shadow-lg transition-shadow" data-testid={`card-timetable-${entry.id}`}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-100">{entry.course?.code}</Badge>
                          <span className="text-sm font-medium">{entry.day}</span>
                          <span className="text-xs text-muted-foreground">{entry.startTime} - {entry.endTime}</span>
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {entry.room} • {entry.lecturer?.user?.name}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Dialog open={editingEntry?.id === entry.id && isDialogOpen} onOpenChange={(open) => {
                          if (!open) onCloseDialog();
                        }}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => onEditClick(entry)} data-testid={`button-edit-timetable-${entry.id}`}>
                              <Pencil className="h-3 w-3" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-screen overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Edit Class Schedule</DialogTitle>
                              <DialogDescription>Update timetable details</DialogDescription>
                            </DialogHeader>
                            <TimetableForm
                              courses={courses}
                              lecturers={lecturers}
                              initialData={editingEntry}
                              onSuccess={onCloseDialog}
                            />
                          </DialogContent>
                        </Dialog>
                        <AlertDialog open={deletingEntry?.id === entry.id} onOpenChange={(open) => !open && onCloseDelete()}>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Schedule</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this schedule? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <DeleteTimetableButton entryId={entry.id} onSuccess={() => onCloseDelete()} />
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        <Button variant="outline" size="sm" onClick={() => onDeleteClick(entry)} data-testid={`button-delete-timetable-${entry.id}`}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-muted-foreground">No schedules available</p>
        </div>
      )}
    </div>
  );
}

function DeleteTimetableButton({ entryId, onSuccess }: { entryId: number; onSuccess: () => void }) {
  const { toast } = useToast();
  const deleteMutation = useMutation({
    mutationFn: () => apiRequest('DELETE', `/api/timetable/${entryId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/timetable'] });
      toast({ title: 'Success', description: 'Schedule deleted successfully' });
      onSuccess();
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to delete schedule', variant: 'destructive' });
    },
  });

  return (
    <AlertDialogAction onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>
      {deleteMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      Delete
    </AlertDialogAction>
  );
}

function TimetableForm({
  courses,
  lecturers,
  initialData,
  onSuccess,
}: {
  courses: any[];
  lecturers: any[];
  initialData?: any;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    courseId: initialData?.courseId?.toString() || '',
    lecturerId: initialData?.lecturerId?.toString() || '',
    day: initialData?.day || 'Monday',
    startTime: initialData?.startTime || '08:00',
    endTime: initialData?.endTime || '09:00',
    room: initialData?.room || '',
  });
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/timetable', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/timetable'] });
      toast({ title: 'Success', description: 'Schedule added successfully' });
      onSuccess();
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to create schedule', variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => apiRequest('PUT', `/api/timetable/${initialData.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/timetable'] });
      toast({ title: 'Success', description: 'Schedule updated successfully' });
      onSuccess();
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to update schedule', variant: 'destructive' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.courseId || !formData.lecturerId || !formData.room) {
      toast({ title: 'Validation Error', description: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }
    const submitData = {
      courseId: parseInt(formData.courseId),
      lecturerId: parseInt(formData.lecturerId),
      day: formData.day,
      startTime: formData.startTime,
      endTime: formData.endTime,
      room: formData.room,
    };
    if (initialData) {
      updateMutation.mutate(submitData);
    } else {
      createMutation.mutate(submitData);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="course">Course *</Label>
          <Select
            value={formData.courseId}
            onValueChange={(value) => setFormData({ ...formData, courseId: value })}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select course" />
            </SelectTrigger>
            <SelectContent>
              {courses.map((course: any) => (
                <SelectItem key={course.id} value={course.id.toString()}>
                  {course.code} - {course.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="lecturer">Lecturer *</Label>
          <Select
            value={formData.lecturerId}
            onValueChange={(value) => setFormData({ ...formData, lecturerId: value })}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select lecturer" />
            </SelectTrigger>
            <SelectContent>
              {lecturers.map((lecturer: any) => (
                <SelectItem key={lecturer.id} value={lecturer.id.toString()}>
                  {lecturer.user?.name} ({lecturer.department?.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="day">Day *</Label>
          <Select
            value={formData.day}
            onValueChange={(value) => setFormData({ ...formData, day: value })}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select day" />
            </SelectTrigger>
            <SelectContent>
              {DAYS.map((day) => (
                <SelectItem key={day} value={day}>
                  {day}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="room">Room/Location *</Label>
          <Input
            id="room"
            value={formData.room}
            onChange={(e) => setFormData({ ...formData, room: e.target.value })}
            required
            placeholder="e.g., Lab 101, Room A3"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startTime">Start Time *</Label>
          <Select
            value={formData.startTime}
            onValueChange={(value) => setFormData({ ...formData, startTime: value })}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Start time" />
            </SelectTrigger>
            <SelectContent>
              {TIME_SLOTS.map((time) => (
                <SelectItem key={time} value={time}>
                  {time}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="endTime">End Time *</Label>
          <Select
            value={formData.endTime}
            onValueChange={(value) => setFormData({ ...formData, endTime: value })}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="End time" />
            </SelectTrigger>
            <SelectContent>
              {TIME_SLOTS.map((time) => (
                <SelectItem key={time} value={time}>
                  {time}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <DialogFooter>
        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {initialData ? 'Update Schedule' : 'Add Schedule'}
        </Button>
      </DialogFooter>
    </form>
  );
}
