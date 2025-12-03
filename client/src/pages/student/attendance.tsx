import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AttendancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Attendance</h1>
        <p className="text-muted-foreground mt-2">Your attendance history</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Attendance History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Attendance history coming soon</p>
        </CardContent>
      </Card>
    </div>
  );
}
