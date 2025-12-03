import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PaymentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Payments</h1>
        <p className="text-muted-foreground mt-2">View payment history</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Payment Records</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Payment information coming soon</p>
        </CardContent>
      </Card>
    </div>
  );
}
