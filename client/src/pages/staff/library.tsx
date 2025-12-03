import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function LibraryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Library Management</h1>
        <p className="text-muted-foreground mt-2">Manage book loans and returns</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Loans & Returns</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Library management coming soon</p>
        </CardContent>
      </Card>
    </div>
  );
}
