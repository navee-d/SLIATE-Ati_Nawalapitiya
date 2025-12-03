import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function StudentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Students</h1>
        <p className="text-muted-foreground mt-2">Students in your courses</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Student List</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Student list coming soon</p>
        </CardContent>
      </Card>
    </div>
  );
}
