import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ExamsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Exam Applications</h1>
        <p className="text-muted-foreground mt-2">Manage exam applications</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Exam Application Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Exam management coming soon</p>
        </CardContent>
      </Card>
    </div>
  );
}
