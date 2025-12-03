import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ExportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Export Data</h1>
        <p className="text-muted-foreground mt-2">Export data to Excel/CSV files</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Export Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Export functionality coming soon</p>
        </CardContent>
      </Card>
    </div>
  );
}
