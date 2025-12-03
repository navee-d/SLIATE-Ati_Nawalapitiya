import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Pencil, Trash2, FileUp, FileDown, Loader2, Eye } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'wouter';
import type { StudentWithUser, Department } from '@shared/schema';

export default function StudentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentWithUser | null>(null);
  const { toast } = useToast();

  const { data: students, isLoading } = useQuery<StudentWithUser[]>({
    queryKey: ['/api/students'],
  });

  const { data: departments } = useQuery<Department[]>({
    queryKey: ['/api/departments'],
  });

  const filteredStudents = students?.filter((student) =>
    student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.studentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.user?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getProgramBadgeColor = (type: string) => {
    return type === 'FT'
      ? 'bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/20'
      : 'bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/20';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Students</h1>
          <p className="text-muted-foreground mt-2">Manage student records and information</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" data-testid="button-import">
            <FileUp className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" size="sm" data-testid="button-export">
            <FileDown className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-student">
                <Plus className="h-4 w-4 mr-2" />
                Add Student
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-screen overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Student</DialogTitle>
                <DialogDescription>Enter all student details to create a new account</DialogDescription>
              </DialogHeader>
              <StudentForm
                departments={departments || []}
                onSuccess={() => {
                  setIsDialogOpen(false);
                  queryClient.invalidateQueries({ queryKey: ['/api/students'] });
                  toast({ title: 'Success', description: 'Student added successfully' });
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>All Students</CardTitle>
              <CardDescription>A complete list of all registered students with full details</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                data-testid="input-search-students"
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
                    <TableHead>Student ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Student #</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents && filteredStudents.length > 0 ? (
                    filteredStudents.map((student) => (
                      <TableRow key={student.id} data-testid={`row-student-${student.id}`}>
                        <TableCell className="font-mono text-sm font-semibold" data-testid={`text-id-${student.id}`}>
                          {student.studentId}
                        </TableCell>
                        <TableCell className="font-medium" data-testid={`text-name-${student.id}`}>
                          {student.name || student.user?.name || '-'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground" data-testid={`text-email-${student.id}`}>
                          {student.email || student.user?.email || '-'}
                        </TableCell>
                        <TableCell className="text-sm" data-testid={`text-phone-${student.id}`}>
                          {student.user?.phone || '-'}
                        </TableCell>
                        <TableCell className="font-mono text-sm" data-testid={`text-number-${student.id}`}>
                          {student.studentNumber}
                        </TableCell>
                        <TableCell data-testid={`text-dept-${student.id}`}>
                          <Badge variant="outline">{student.department?.code || '-'}</Badge>
                        </TableCell>
                        <TableCell data-testid={`text-program-${student.id}`}>
                          <Badge variant="outline" className={getProgramBadgeColor(student.programType)}>
                            {student.programType}
                          </Badge>
                        </TableCell>
                        <TableCell data-testid={`text-year-${student.id}`}>
                          {student.intakeYear}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/admin/students/${student.id}`}>
                              <Button variant="ghost" size="icon" data-testid={`button-view-${student.id}`}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button variant="ghost" size="icon" data-testid={`button-edit-${student.id}`}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" data-testid={`button-delete-${student.id}`}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                        No students found
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

function StudentForm({
  departments,
  onSuccess,
}: {
  departments: Department[];
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    departmentId: '',
    programType: 'FT' as 'FT' | 'PT',
    intakeYear: new Date().getFullYear(),
    studentNumber: '',
  });
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/students', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create student',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.password || !formData.departmentId || !formData.studentNumber) {
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
            data-testid="input-student-name"
            placeholder="John Doe"
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
            data-testid="input-student-email"
            placeholder="john@example.com"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            data-testid="input-student-phone"
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
            data-testid="input-student-password"
            placeholder="••••••••"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="studentNumber">Student Number *</Label>
          <Input
            id="studentNumber"
            value={formData.studentNumber}
            onChange={(e) => setFormData({ ...formData, studentNumber: e.target.value })}
            required
            data-testid="input-student-number"
            placeholder="0001"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="intakeYear">Intake Year *</Label>
          <Input
            id="intakeYear"
            type="number"
            value={formData.intakeYear}
            onChange={(e) => setFormData({ ...formData, intakeYear: parseInt(e.target.value) })}
            required
            data-testid="input-intake-year"
            min="2020"
            max={new Date().getFullYear()}
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
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id.toString()}>
                  {dept.code} - {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="programType">Program Type *</Label>
          <Select
            value={formData.programType}
            onValueChange={(value: 'FT' | 'PT') => setFormData({ ...formData, programType: value })}
          >
            <SelectTrigger data-testid="select-program-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="FT">Full-Time (FT)</SelectItem>
              <SelectItem value="PT">Part-Time (PT)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DialogFooter>
        <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-student">
          {createMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            'Add Student'
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}
