import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ExamsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Exam Applications</h1>
        <p className="text-muted-foreground mt-2">Apply for exams</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>My Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Exam applications coming soon</p>
        </CardContent>
      </Card>
    </div>
  );
}
