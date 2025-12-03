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
import { Plus, Search, Pencil, Trash2, Loader2, Mail, Phone } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { User, Department } from '@shared/schema';

interface StaffMember extends User {
  department?: Department;
}

export default function StaffPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [deletingStaff, setDeletingStaff] = useState<StaffMember | null>(null);
  const { toast } = useToast();

  const { data: users = [], isLoading } = useQuery<StaffMember[]>({
    queryKey: ['/api/users'],
  });

  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ['/api/departments'],
  });

  const staffMembers = users.filter((u) => u.role === 'staff');

  const filteredStaff = staffMembers.filter((staff) => {
    const lastNameMatch = staff.name?.split(' ').pop()?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const nameMatch = staff.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const emailMatch = staff.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    return lastNameMatch || nameMatch || emailMatch;
  });

  const handleEditClick = (staff: any) => {
    setEditingStaff(staff);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingStaff(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Staff Management</h1>
          <p className="text-muted-foreground mt-2">Manage support staff members</p>
        </div>
        <Dialog open={isDialogOpen && !editingStaff} onOpenChange={(open) => !open && handleCloseDialog()}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-staff" onClick={() => setEditingStaff(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Staff
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-screen overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Staff Member</DialogTitle>
              <DialogDescription>Create a new staff account</DialogDescription>
            </DialogHeader>
            <StaffForm
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
          data-testid="input-search-staff"
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
          {filteredStaff && filteredStaff.length > 0 ? (
            filteredStaff.map((staff) => (
              <Card key={staff.id} className="hover:shadow-lg transition-shadow" data-testid={`card-staff-${staff.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg" data-testid={`text-name-${staff.id}`}>
                        {staff.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">Staff Member</p>
                    </div>
                    <Badge variant="secondary" className="flex-shrink-0">
                      Staff
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground" data-testid={`text-email-${staff.id}`}>
                      <Mail className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{staff.email}</span>
                    </div>
                    {staff.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground" data-testid={`text-phone-${staff.id}`}>
                        <Phone className="w-4 h-4 flex-shrink-0" />
                        <span>{staff.phone}</span>
                      </div>
                    )}
                  </div>
                  {staff.departmentId && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Department</p>
                      <Badge variant="outline" data-testid={`badge-dept-${staff.id}`}>
                        {departments.find((d: any) => d.id === staff.departmentId)?.code || '-'}
                      </Badge>
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Dialog open={editingStaff?.id === staff.id && isDialogOpen} onOpenChange={(open) => {
                      if (!open) handleCloseDialog();
                    }}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEditClick(staff)} data-testid={`button-edit-staff-${staff.id}`}>
                          <Pencil className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-screen overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Edit Staff Member</DialogTitle>
                          <DialogDescription>Update staff details</DialogDescription>
                        </DialogHeader>
                        <StaffForm
                          departments={departments}
                          initialData={editingStaff}
                          onSuccess={handleCloseDialog}
                        />
                      </DialogContent>
                    </Dialog>
                    <AlertDialog open={deletingStaff?.id === staff.id} onOpenChange={(open) => !open && setDeletingStaff(null)}>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Staff</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete {staff.name}? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <DeleteStaffButton staffId={staff.id} onSuccess={() => setDeletingStaff(null)} />
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    <Button variant="outline" size="sm" onClick={() => setDeletingStaff(staff)} data-testid={`button-delete-staff-${staff.id}`}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">No staff members found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DeleteStaffButton({ staffId, onSuccess }: { staffId: number; onSuccess: () => void }) {
  const { toast } = useToast();
  const deleteMutation = useMutation({
    mutationFn: () => apiRequest('DELETE', `/api/users/${staffId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({ title: 'Success', description: 'Staff member deleted successfully' });
      onSuccess();
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to delete staff', variant: 'destructive' });
    },
  });

  return (
    <AlertDialogAction onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>
      {deleteMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      Delete
    </AlertDialogAction>
  );
}

function StaffForm({
  departments,
  initialData,
  onSuccess,
}: {
  departments: any[];
  initialData?: any;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    password: '',
    departmentId: initialData?.departmentId?.toString() || '',
  });
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/users', { ...data, role: 'staff' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({ title: 'Success', description: 'Staff member added successfully' });
      onSuccess();
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to create staff', variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => apiRequest('PUT', `/api/users/${initialData.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({ title: 'Success', description: 'Staff member updated successfully' });
      onSuccess();
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to update staff', variant: 'destructive' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      toast({ title: 'Validation Error', description: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }
    if (initialData && !formData.password) {
      const updateData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        departmentId: formData.departmentId ? parseInt(formData.departmentId) : undefined,
      };
      updateMutation.mutate(updateData);
    } else if (!initialData && !formData.password) {
      toast({ title: 'Validation Error', description: 'Password is required for new staff', variant: 'destructive' });
      return;
    } else {
      const submitData = { ...formData, departmentId: formData.departmentId ? parseInt(formData.departmentId) : undefined };
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
          <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required placeholder="John Doe" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required placeholder="john@sliate.ac.lk" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+94 71 234 5678" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password {initialData ? '(leave blank to keep current)' : '*'}</Label>
          <Input id="password" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required={!initialData} placeholder="••••••••" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="department">Department</Label>
        <Select value={formData.departmentId} onValueChange={(value) => setFormData({ ...formData, departmentId: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select department (optional)" />
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

      <DialogFooter>
        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {initialData ? 'Update Staff' : 'Add Staff'}
        </Button>
      </DialogFooter>
    </form>
  );
}
