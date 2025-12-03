import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Plus, Monitor, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { Lab, PC } from '@shared/schema';

export default function LabsPage() {
  const [isLabDialogOpen, setIsLabDialogOpen] = useState(false);
  const [isPCDialogOpen, setIsPCDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: labs, isLoading: labsLoading } = useQuery<Lab[]>({
    queryKey: ['/api/labs'],
  });

  const { data: pcs, isLoading: pcsLoading } = useQuery<PC[]>({
    queryKey: ['/api/labs/pcs'],
  });

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      available: 'bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/20',
      assigned: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20',
      maintenance: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 border-yellow-500/20',
      unavailable: 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/20',
    };
    return (
      <Badge variant="outline" className={colors[status] || colors.unavailable}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Labs & PCs</h1>
          <p className="text-muted-foreground mt-2">Manage lab facilities and computer inventory</p>
        </div>
      </div>

      <Tabs defaultValue="pcs" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pcs" data-testid="tab-pcs">PCs</TabsTrigger>
          <TabsTrigger value="labs" data-testid="tab-labs">Labs</TabsTrigger>
        </TabsList>

        <TabsContent value="pcs" className="space-y-6">
          <div className="flex justify-end">
            <Dialog open={isPCDialogOpen} onOpenChange={setIsPCDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-pc">
                  <Plus className="h-4 w-4 mr-2" />
                  Add PC
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New PC</DialogTitle>
                  <DialogDescription>Enter PC details</DialogDescription>
                </DialogHeader>
                <PCForm
                  labs={labs || []}
                  onSuccess={() => {
                    setIsPCDialogOpen(false);
                    queryClient.invalidateQueries({ queryKey: ['/api/labs/pcs'] });
                    toast({ title: 'Success', description: 'PC added successfully' });
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pcsLoading ? (
              [1, 2, 3].map((i) => <Skeleton key={i} className="h-40" />)
            ) : pcs && pcs.length > 0 ? (
              pcs.map((pc) => (
                <Card key={pc.id} data-testid={`card-pc-${pc.id}`}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-base font-mono">{pc.pcNumber}</CardTitle>
                    <Monitor className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Status</span>
                      {getStatusBadge(pc.status)}
                    </div>
                    {pc.specifications && (
                      <p className="text-xs text-muted-foreground">{pc.specifications}</p>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                No PCs found
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="labs" className="space-y-6">
          <div className="flex justify-end">
            <Dialog open={isLabDialogOpen} onOpenChange={setIsLabDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-lab">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Lab
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Lab</DialogTitle>
                  <DialogDescription>Enter lab details</DialogDescription>
                </DialogHeader>
                <LabForm
                  onSuccess={() => {
                    setIsLabDialogOpen(false);
                    queryClient.invalidateQueries({ queryKey: ['/api/labs'] });
                    toast({ title: 'Success', description: 'Lab added successfully' });
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {labsLoading ? (
              [1, 2].map((i) => <Skeleton key={i} className="h-48" />)
            ) : labs && labs.length > 0 ? (
              labs.map((lab) => (
                <Card key={lab.id} data-testid={`card-lab-${lab.id}`}>
                  <CardHeader>
                    <CardTitle>{lab.name}</CardTitle>
                    <CardDescription>{lab.location}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Capacity</span>
                        <span className="text-sm font-medium">{lab.capacity || 'N/A'} seats</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">PCs</span>
                        <span className="text-sm font-medium">
                          {pcs?.filter((pc) => pc.labId === lab.id).length || 0}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                No labs found
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function LabForm({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    capacity: 0,
  });
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/labs', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/labs'] });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add lab',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Lab Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          data-testid="input-lab-name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          data-testid="input-location"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="capacity">Capacity</Label>
        <Input
          id="capacity"
          type="number"
          min="0"
          value={formData.capacity}
          onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
          data-testid="input-capacity"
        />
      </div>

      <DialogFooter>
        <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-lab">
          {createMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Adding...
            </>
          ) : (
            'Add Lab'
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}

function PCForm({ labs, onSuccess }: { labs: Lab[]; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    pcNumber: '',
    labId: '',
    status: 'available' as 'available' | 'assigned' | 'maintenance' | 'unavailable',
    specifications: '',
  });
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/labs/pcs', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/labs/pcs'] });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add PC',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="pcNumber">PC Number</Label>
        <Input
          id="pcNumber"
          value={formData.pcNumber}
          onChange={(e) => setFormData({ ...formData, pcNumber: e.target.value })}
          required
          placeholder="e.g., PC-001"
          data-testid="input-pc-number"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="lab">Lab</Label>
        <Select
          value={formData.labId}
          onValueChange={(value) => setFormData({ ...formData, labId: value })}
          required
        >
          <SelectTrigger data-testid="select-lab">
            <SelectValue placeholder="Select lab" />
          </SelectTrigger>
          <SelectContent>
            {labs.map((lab) => (
              <SelectItem key={lab.id} value={lab.id.toString()}>
                {lab.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="specifications">Specifications</Label>
        <Input
          id="specifications"
          value={formData.specifications}
          onChange={(e) => setFormData({ ...formData, specifications: e.target.value })}
          placeholder="e.g., Intel i5, 8GB RAM"
          data-testid="input-specifications"
        />
      </div>

      <DialogFooter>
        <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-pc">
          {createMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Adding...
            </>
          ) : (
            'Add PC'
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}
