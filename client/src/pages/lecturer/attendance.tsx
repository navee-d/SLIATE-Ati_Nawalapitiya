import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AttendancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
        <p className="text-muted-foreground mt-2">Manage attendance sessions</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Attendance Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Attendance management coming soon</p>
        </CardContent>
      </Card>
    </div>
  );
}
