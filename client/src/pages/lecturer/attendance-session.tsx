import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { QRCodeSVG } from 'qrcode.react';
import { Loader2, RefreshCw, X, Clock } from 'lucide-react';
import type { Course, AttendanceSession } from '@shared/schema';

export default function AttendanceSessionPage() {
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [activeSession, setActiveSession] = useState<AttendanceSession | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const { toast } = useToast();

  const { data: courses } = useQuery<Course[]>({
    queryKey: ['/api/lecturer/courses'],
  });

  const createSessionMutation = useMutation({
    mutationFn: (courseId: number) => apiRequest('POST', '/api/attendance/create-session', { courseId }),
    onSuccess: (data: AttendanceSession) => {
      setActiveSession(data);
      toast({ title: 'Success', description: 'Attendance session created' });
      queryClient.invalidateQueries({ queryKey: ['/api/attendance/sessions'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create session',
        variant: 'destructive',
      });
    },
  });

  const closeSessionMutation = useMutation({
    mutationFn: (sessionId: number) => apiRequest('POST', `/api/attendance/sessions/${sessionId}/close`),
    onSuccess: () => {
      setActiveSession(null);
      toast({ title: 'Success', description: 'Session closed' });
    },
  });

  useEffect(() => {
    if (!activeSession) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const expiresAt = new Date(activeSession.expiresAt).getTime();
      const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
      setTimeRemaining(remaining);

      if (remaining === 0) {
        setActiveSession(null);
        toast({
          title: 'Session Expired',
          description: 'The attendance session has expired',
          variant: 'destructive',
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSession, toast]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const qrData = activeSession
    ? JSON.stringify({
        sessionId: activeSession.id,
        token: activeSession.token,
        expiresAt: activeSession.expiresAt,
      })
    : '';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Attendance Session</h1>
        <p className="text-muted-foreground mt-2">Create QR code for student attendance</p>
      </div>

      {!activeSession ? (
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Create New Session</CardTitle>
            <CardDescription>Select a course to start an attendance session</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="course">Course</Label>
              <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                <SelectTrigger data-testid="select-course">
                  <SelectValue placeholder="Select a course" />
                </SelectTrigger>
                <SelectContent>
                  {courses?.map((course) => (
                    <SelectItem key={course.id} value={course.id.toString()}>
                      {course.code} - {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={() => createSessionMutation.mutate(parseInt(selectedCourseId))}
              disabled={!selectedCourseId || createSessionMutation.isPending}
              className="w-full"
              data-testid="button-create-session"
            >
              {createSessionMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Session...
                </>
              ) : (
                'Create Attendance Session'
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="max-w-2xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Active Session</CardTitle>
                  <CardDescription>Students can scan this QR code</CardDescription>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => closeSessionMutation.mutate(activeSession.id)}
                  data-testid="button-close-session"
                >
                  <X className="h-4 w-4 mr-2" />
                  Close Session
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-center p-8 bg-white rounded-lg">
                <QRCodeSVG
                  value={qrData}
                  size={300}
                  level="H"
                  includeMargin
                  data-testid="qr-code"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 bg-accent/50 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground">Session ID</p>
                  <p className="text-sm font-mono font-medium">{activeSession.id}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Time Remaining</p>
                  <p className="text-sm font-mono font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {formatTime(timeRemaining)}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <RefreshCw className="h-4 w-4" />
                QR code auto-expires in {formatTime(timeRemaining)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Session Stats</CardTitle>
              <CardDescription>Real-time attendance tracking</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <div className="text-4xl font-bold text-primary">0</div>
                <p className="text-sm text-muted-foreground mt-2">Students marked present</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
