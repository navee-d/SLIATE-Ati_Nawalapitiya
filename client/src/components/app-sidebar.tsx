import { useAuth } from '@/lib/auth-context';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Users,
  UserCog,
  BookOpen,
  Calendar,
  Monitor,
  Library,
  FileText,
  DollarSign,
  Settings,
  Upload,
  Download,
  QrCode,
  LogOut,
  GraduationCap,
  Building2,
  Clock,
} from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export function AppSidebar() {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20',
      lecturer: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20',
      hod: 'bg-blue-600/10 text-blue-800 dark:text-blue-200 border-blue-600/20',
      student: 'bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/20',
      staff: 'bg-gray-500/10 text-gray-700 dark:text-gray-300 border-gray-500/20',
    };
    return colors[role] || colors.staff;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const adminMenuItems = [
    { title: 'Dashboard', url: '/', icon: LayoutDashboard },
    { title: 'Departments', url: '/admin/departments', icon: Building2 },
    { title: 'Students', url: '/admin/students', icon: Users },
    { title: 'Lecturers', url: '/admin/lecturers', icon: UserCog },
    { title: 'HODs', url: '/admin/hod', icon: Users },
    { title: 'Visiting Lecturers', url: '/admin/visiting-lecturers', icon: Users },
    { title: 'Staff', url: '/admin/staff', icon: Users },
    { title: 'Courses', url: '/admin/courses', icon: BookOpen },
    { title: 'Timetable', url: '/admin/timetable', icon: Clock },
    { title: 'Attendance', url: '/admin/attendance', icon: Calendar },
    { title: 'Labs & PCs', url: '/admin/labs', icon: Monitor },
    { title: 'Library', url: '/admin/library', icon: Library },
    { title: 'Exam Applications', url: '/admin/exams', icon: FileText },
    { title: 'Payments', url: '/admin/payments', icon: DollarSign },
    { title: 'Import Data', url: '/admin/import', icon: Upload },
    { title: 'Export Data', url: '/admin/export', icon: Download },
    { title: 'Settings', url: '/admin/settings', icon: Settings },
  ];

  const lecturerMenuItems = [
    { title: 'Dashboard', url: '/', icon: LayoutDashboard },
    { title: 'My Courses', url: '/lecturer/courses', icon: BookOpen },
    { title: 'Attendance', url: '/lecturer/attendance', icon: QrCode },
    { title: 'Students', url: '/lecturer/students', icon: Users },
  ];

  const studentMenuItems = [
    { title: 'Dashboard', url: '/', icon: LayoutDashboard },
    { title: 'My Attendance', url: '/student/attendance', icon: Calendar },
    { title: 'Scan QR', url: '/student/scan', icon: QrCode },
    { title: 'Exam Applications', url: '/student/exams', icon: FileText },
    { title: 'Library', url: '/student/library', icon: Library },
  ];

  const staffMenuItems = [
    { title: 'Dashboard', url: '/', icon: LayoutDashboard },
    { title: 'Library', url: '/staff/library', icon: Library },
    { title: 'Labs', url: '/staff/labs', icon: Monitor },
    { title: 'Payments', url: '/staff/payments', icon: DollarSign },
  ];

  const getMenuItems = () => {
    if (!user) return [];
    switch (user.role) {
      case 'admin':
        return adminMenuItems;
      case 'lecturer':
      case 'hod':
        return lecturerMenuItems;
      case 'student':
        return studentMenuItems;
      case 'staff':
        return staffMenuItems;
      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
            <GraduationCap className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-sm">SLIATE Nawalapitiya</h2>
            <p className="text-xs text-muted-foreground truncate">Campus Management</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wide font-semibold">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild className={isActive ? 'bg-sidebar-accent' : ''}>
                      <Link href={item.url} data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                        <Icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t">
        {user && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <Badge className={`text-xs ${getRoleBadgeColor(user.role)}`} variant="outline">
                  {user.role.toUpperCase()}
                </Badge>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={logout}
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
