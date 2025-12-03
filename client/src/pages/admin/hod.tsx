import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Eye, Pencil, Trash2, Loader2, Crown, Mail, Phone } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'wouter';
import type { LecturerWithUser, Department } from '@shared/schema';

export default function HODPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingHOD, setEditingHOD] = useState<LecturerWithUser | null>(null);
  const [deletingHOD, setDeletingHOD] = useState<any>(null);
  const { toast } = useToast();

  const { data: lecturers = [], isLoading } = useQuery<LecturerWithUser[]>({
    queryKey: ['/api/lecturers'],
  });

  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ['/api/departments'],
  });

  const hods = lecturers.filter((l) => l.isHOD);

  const filteredHODs = hods.filter((hod) => {
    const lastNameMatch = hod.user?.name?.split(' ').pop()?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const nameMatch = hod.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const emailMatch = hod.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    return lastNameMatch || nameMatch || emailMatch;
  });

  const handleEditClick = (hod: any) => {
    setEditingHOD(hod);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingHOD(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Crown className="w-8 h-8 text-amber-600" />
            Heads of Department
          </h1>
          <p className="text-muted-foreground mt-2">Manage department heads (HODs)</p>
        </div>
        <Dialog open={isDialogOpen && !editingHOD} onOpenChange={(open) => !open && handleCloseDialog()}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-hod" onClick={() => setEditingHOD(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Add HOD
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-screen overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Head of Department</DialogTitle>
              <DialogDescription>Create a new HOD account</DialogDescription>
            </DialogHeader>
            <HODForm
              departments={departments}
              onSuccess={handleCloseDialog}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or last name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
          data-testid="input-search-hods"
        />
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredHODs && filteredHODs.length > 0 ? (
            filteredHODs.map((hod: any) => (
              <Card key={hod.id} className="hover:shadow-lg transition-shadow" data-testid={`card-hod-${hod.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg" data-testid={`text-name-${hod.id}`}>
                        {hod.user?.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1" data-testid={`text-emp-id-${hod.id}`}>
                        {hod.employeeId}
                      </p>
                    </div>
                    <Badge variant="default" className="flex-shrink-0">
                      HOD
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground" data-testid={`text-email-${hod.id}`}>
                      <Mail className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{hod.user?.email}</span>
                    </div>
                    {hod.user?.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground" data-testid={`text-phone-${hod.id}`}>
                        <Phone className="w-4 h-4 flex-shrink-0" />
                        <span>{hod.user?.phone}</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Department</p>
                    <Badge variant="outline" data-testid={`badge-dept-${hod.id}`}>
                      {hod.department?.code || '-'}
                    </Badge>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Link href={`/admin/lecturers/${hod.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </Link>
                    <Dialog open={editingHOD?.id === hod.id && isDialogOpen} onOpenChange={(open) => {
                      if (!open) handleCloseDialog();
                    }}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => handleEditClick(hod)} data-testid={`button-edit-hod-${hod.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-screen overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Edit Head of Department</DialogTitle>
                          <DialogDescription>Update HOD details</DialogDescription>
                        </DialogHeader>
                        <HODForm
                          departments={departments}
                          initialData={editingHOD}
                          onSuccess={handleCloseDialog}
                        />
                      </DialogContent>
                    </Dialog>
                    <AlertDialog open={deletingHOD?.id === hod.id} onOpenChange={(open) => !open && setDeletingHOD(null)}>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete HOD</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete {hod.user?.name}? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <DeleteHODButton hodId={hod.id} onSuccess={() => setDeletingHOD(null)} />
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    <Button variant="outline" size="sm" onClick={() => setDeletingHOD(hod)} data-testid={`button-delete-hod-${hod.id}`}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">No HODs found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DeleteHODButton({ hodId, onSuccess }: { hodId: number; onSuccess: () => void }) {
  const { toast } = useToast();
  const deleteMutation = useMutation({
    mutationFn: () => apiRequest('DELETE', `/api/lecturers/${hodId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/lecturers'] });
      toast({ title: 'Success', description: 'HOD deleted successfully' });
      onSuccess();
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to delete HOD', variant: 'destructive' });
    },
  });

  return (
    <AlertDialogAction onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>
      {deleteMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      Delete
    </AlertDialogAction>
  );
}

function HODForm({
  departments,
  initialData,
  onSuccess,
}: {
  departments: any[];
  initialData?: any;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: initialData?.user?.name || '',
    email: initialData?.user?.email || '',
    phone: initialData?.user?.phone || '',
    password: '',
    employeeId: initialData?.employeeId || '',
    departmentId: initialData?.departmentId?.toString() || '',
  });
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/lecturers', { ...data, isHOD: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/lecturers'] });
      toast({ title: 'Success', description: 'HOD added successfully' });
      onSuccess();
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to create HOD', variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => apiRequest('PUT', `/api/lecturers/${initialData.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/lecturers'] });
      toast({ title: 'Success', description: 'HOD updated successfully' });
      onSuccess();
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to update HOD', variant: 'destructive' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.employeeId || !formData.departmentId) {
      toast({ title: 'Validation Error', description: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }
    if (initialData && !formData.password) {
      const updateData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        employeeId: formData.employeeId,
        departmentId: parseInt(formData.departmentId),
      };
      updateMutation.mutate(updateData);
    } else if (!initialData && !formData.password) {
      toast({ title: 'Validation Error', description: 'Password is required for new HODs', variant: 'destructive' });
      return;
    } else {
      const submitData = initialData ? { ...formData, departmentId: parseInt(formData.departmentId) } : { ...formData, departmentId: parseInt(formData.departmentId) };
      if (initialData) {
        updateMutation.mutate(submitData);
      } else {
        createMutation.mutate(submitData);
      }
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="Dr. John Smith"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            placeholder="john@sliate.ac.lk"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+94 71 234 5678"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password {initialData ? '(leave blank to keep current)' : '*'}</Label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required={!initialData}
            placeholder="••••••••"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="employeeId">Employee ID *</Label>
          <Input
            id="employeeId"
            value={formData.employeeId}
            onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
            required
            placeholder="HOD-001"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="department">Department *</Label>
          <Select
            value={formData.departmentId}
            onValueChange={(value) => setFormData({ ...formData, departmentId: value })}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              {departments.map((dept: any) => (
                <SelectItem key={dept.id} value={dept.id.toString()}>
                  {dept.code} - {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <DialogFooter>
        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {initialData ? 'Update HOD' : 'Add HOD'}
        </Button>
      </DialogFooter>
    </form>
  );
}
