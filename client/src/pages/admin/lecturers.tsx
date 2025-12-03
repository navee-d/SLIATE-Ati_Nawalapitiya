import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Eye, Pencil, Trash2, Loader2, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'wouter';
import type { LecturerWithUser, Department, Course } from '@shared/schema';

export default function LecturersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: lecturers = [], isLoading } = useQuery<LecturerWithUser[]>({
    queryKey: ['/api/lecturers'],
  });

  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ['/api/departments'],
  });

  const { data: courses = [] } = useQuery<Course[]>({
    queryKey: ['/api/courses'],
  });

  const filteredLecturers = lecturers.filter((lecturer: any) =>
    lecturer.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lecturer.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lecturer.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getLecturerCourseCount = (lecturerId: number) => {
    return courses.filter((c: any) => c.lecturerId === lecturerId).length;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lecturers</h1>
          <p className="text-muted-foreground mt-2">Manage lecturers and HODs</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-lecturer">
              <Plus className="h-4 w-4 mr-2" />
              Add Lecturer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-screen overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Lecturer</DialogTitle>
              <DialogDescription>Enter lecturer details to create a new account</DialogDescription>
            </DialogHeader>
            <LecturerForm
              departments={departments}
              onSuccess={() => {
                setIsDialogOpen(false);
                queryClient.invalidateQueries({ queryKey: ['/api/lecturers'] });
                toast({ title: 'Success', description: 'Lecturer added successfully' });
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                All Lecturers ({filteredLecturers.length})
              </CardTitle>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search lecturers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                data-testid="input-search-lecturers"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead>Courses</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLecturers && filteredLecturers.length > 0 ? (
                    filteredLecturers.map((lecturer: any) => (
                      <TableRow key={lecturer.id} data-testid={`row-lecturer-${lecturer.id}`}>
                        <TableCell className="font-mono text-sm" data-testid={`text-emp-id-${lecturer.id}`}>
                          {lecturer.employeeId}
                        </TableCell>
                        <TableCell className="font-medium" data-testid={`text-name-${lecturer.id}`}>
                          {lecturer.user?.name}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground" data-testid={`text-email-${lecturer.id}`}>
                          {lecturer.user?.email}
                        </TableCell>
                        <TableCell className="text-sm" data-testid={`text-phone-${lecturer.id}`}>
                          {lecturer.user?.phone || '-'}
                        </TableCell>
                        <TableCell data-testid={`text-dept-${lecturer.id}`}>
                          <Badge variant="outline">{lecturer.department?.code || '-'}</Badge>
                        </TableCell>
                        <TableCell className="text-sm" data-testid={`text-designation-${lecturer.id}`}>
                          {lecturer.designation || 'Lecturer'}
                        </TableCell>
                        <TableCell data-testid={`text-courses-${lecturer.id}`}>
                          <Badge variant="secondary">{getLecturerCourseCount(lecturer.id)}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={lecturer.isHOD ? 'default' : 'outline'}
                            data-testid={`badge-status-${lecturer.id}`}
                          >
                            {lecturer.isHOD ? 'HOD' : 'Lecturer'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/admin/lecturers/${lecturer.id}`}>
                              <Button variant="ghost" size="icon" data-testid={`button-view-${lecturer.id}`}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button variant="ghost" size="icon" data-testid={`button-edit-${lecturer.id}`}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" data-testid={`button-delete-${lecturer.id}`}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                        No lecturers found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function LecturerForm({
  departments,
  onSuccess,
}: {
  departments: any[];
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    employeeId: '',
    designation: '',
    departmentId: '',
    isHOD: false,
  });
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/lecturers', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/lecturers'] });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create lecturer',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.password || !formData.employeeId || !formData.departmentId) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    createMutation.mutate(formData);
  };

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
            data-testid="input-lecturer-name"
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
            data-testid="input-lecturer-email"
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
            data-testid="input-lecturer-phone"
            placeholder="+94 71 234 5678"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password *</Label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            data-testid="input-lecturer-password"
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
            data-testid="input-emp-id"
            placeholder="LEC-001"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="designation">Designation</Label>
          <Input
            id="designation"
            value={formData.designation}
            onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
            data-testid="input-designation"
            placeholder="Senior Lecturer"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="department">Department *</Label>
          <Select
            value={formData.departmentId}
            onValueChange={(value) => setFormData({ ...formData, departmentId: value })}
            required
          >
            <SelectTrigger data-testid="select-department">
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
        <div className="space-y-2">
          <Label htmlFor="isHOD" className="flex items-center gap-2 mt-7">
            <input
              id="isHOD"
              type="checkbox"
              checked={formData.isHOD}
              onChange={(e) => setFormData({ ...formData, isHOD: e.target.checked })}
              data-testid="checkbox-hod"
              className="w-4 h-4"
            />
            Head of Department
          </Label>
        </div>
      </div>

      <DialogFooter>
        <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-lecturer">
          {createMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            'Add Lecturer'
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}
