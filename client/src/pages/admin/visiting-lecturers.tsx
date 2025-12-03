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
import { Plus, Search, Eye, Pencil, Trash2, Loader2, Mail, Phone } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'wouter';
import type { LecturerWithUser, Department } from '@shared/schema';

export default function VisitingLecturersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLecturer, setEditingLecturer] = useState<LecturerWithUser | null>(null);
  const [deletingLecturer, setDeletingLecturer] = useState<LecturerWithUser | null>(null);
  const { toast } = useToast();

  const { data: lecturers = [], isLoading } = useQuery<LecturerWithUser[]>({
    queryKey: ['/api/lecturers'],
  });

  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ['/api/departments'],
  });

  const visitingLecturers = lecturers.filter((l) => !l.isHOD);

  const filteredLecturers = visitingLecturers.filter((lecturer) => {
    const lastNameMatch = lecturer.user?.name?.split(' ').pop()?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const nameMatch = lecturer.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const emailMatch = lecturer.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    return lastNameMatch || nameMatch || emailMatch;
  });

  const handleEditClick = (lecturer: any) => {
    setEditingLecturer(lecturer);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingLecturer(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Visiting Lecturers</h1>
          <p className="text-muted-foreground mt-2">Manage visiting and regular lecturers</p>
        </div>
        <Dialog open={isDialogOpen && !editingLecturer} onOpenChange={(open) => !open && handleCloseDialog()}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-visiting-lecturer" onClick={() => setEditingLecturer(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Lecturer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-screen overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Visiting Lecturer</DialogTitle>
              <DialogDescription>Enter lecturer details</DialogDescription>
            </DialogHeader>
            <LecturerForm
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
          data-testid="input-search-lecturers"
        />
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-64 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredLecturers && filteredLecturers.length > 0 ? (
            filteredLecturers.map((lecturer: any) => (
              <Card key={lecturer.id} className="hover:shadow-lg transition-shadow" data-testid={`card-lecturer-${lecturer.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg" data-testid={`text-name-${lecturer.id}`}>
                        {lecturer.user?.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1" data-testid={`text-emp-id-${lecturer.id}`}>
                        {lecturer.employeeId}
                      </p>
                    </div>
                    <Badge variant="outline" className="flex-shrink-0">
                      Lecturer
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground" data-testid={`text-email-${lecturer.id}`}>
                      <Mail className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{lecturer.user?.email}</span>
                    </div>
                    {lecturer.user?.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground" data-testid={`text-phone-${lecturer.id}`}>
                        <Phone className="w-4 h-4 flex-shrink-0" />
                        <span>{lecturer.user?.phone}</span>
                      </div>
                    )}
                  </div>
                  {lecturer.designation && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Designation</p>
                      <p className="text-sm font-medium">{lecturer.designation}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Department</p>
                    <Badge variant="outline" data-testid={`badge-dept-${lecturer.id}`}>
                      {lecturer.department?.code || '-'}
                    </Badge>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Link href={`/admin/lecturers/${lecturer.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </Link>
                    <Dialog open={editingLecturer?.id === lecturer.id && isDialogOpen} onOpenChange={(open) => {
                      if (!open) handleCloseDialog();
                    }}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => handleEditClick(lecturer)} data-testid={`button-edit-lecturer-${lecturer.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-screen overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Edit Visiting Lecturer</DialogTitle>
                          <DialogDescription>Update lecturer details</DialogDescription>
                        </DialogHeader>
                        <LecturerForm
                          departments={departments}
                          initialData={editingLecturer}
                          onSuccess={handleCloseDialog}
                        />
                      </DialogContent>
                    </Dialog>
                    <AlertDialog open={deletingLecturer?.id === lecturer.id} onOpenChange={(open) => !open && setDeletingLecturer(null)}>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Lecturer</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete {lecturer.user?.name}? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <DeleteLecturerButton lecturerId={lecturer.id} onSuccess={() => setDeletingLecturer(null)} />
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    <Button variant="outline" size="sm" onClick={() => setDeletingLecturer(lecturer)} data-testid={`button-delete-lecturer-${lecturer.id}`}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">No lecturers found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DeleteLecturerButton({ lecturerId, onSuccess }: { lecturerId: number; onSuccess: () => void }) {
  const { toast } = useToast();
  const deleteMutation = useMutation({
    mutationFn: () => apiRequest('DELETE', `/api/lecturers/${lecturerId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/lecturers'] });
      toast({ title: 'Success', description: 'Lecturer deleted successfully' });
      onSuccess();
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to delete lecturer', variant: 'destructive' });
    },
  });

  return (
    <AlertDialogAction onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>
      {deleteMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      Delete
    </AlertDialogAction>
  );
}

function LecturerForm({
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
    designation: initialData?.designation || '',
    departmentId: initialData?.departmentId?.toString() || '',
  });
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/lecturers', { ...data, isHOD: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/lecturers'] });
      toast({ title: 'Success', description: 'Lecturer added successfully' });
      onSuccess();
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to create lecturer', variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => apiRequest('PUT', `/api/lecturers/${initialData.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/lecturers'] });
      toast({ title: 'Success', description: 'Lecturer updated successfully' });
      onSuccess();
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to update lecturer', variant: 'destructive' });
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
        designation: formData.designation,
        departmentId: parseInt(formData.departmentId),
      };
      updateMutation.mutate(updateData);
    } else if (!initialData && !formData.password) {
      toast({ title: 'Validation Error', description: 'Password is required for new lecturers', variant: 'destructive' });
      return;
    } else {
      const submitData = { ...formData, departmentId: parseInt(formData.departmentId) };
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
          <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required placeholder="Dr. John Smith" />
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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="employeeId">Employee ID *</Label>
          <Input id="employeeId" value={formData.employeeId} onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })} required placeholder="LEC-001" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="designation">Designation</Label>
          <Input id="designation" value={formData.designation} onChange={(e) => setFormData({ ...formData, designation: e.target.value })} placeholder="Senior Lecturer" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="department">Department *</Label>
        <Select value={formData.departmentId} onValueChange={(value) => setFormData({ ...formData, departmentId: value })} required>
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

      <DialogFooter>
        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {initialData ? 'Update Lecturer' : 'Add Lecturer'}
        </Button>
      </DialogFooter>
    </form>
  );
}
