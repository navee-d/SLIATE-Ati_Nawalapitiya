import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function LabsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Labs & PCs</h1>
        <p className="text-muted-foreground mt-2">Manage laboratory and PCs</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Lab Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Lab management coming soon</p>
        </CardContent>
      </Card>
    </div>
  );
}
