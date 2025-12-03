import type { Express, Response, NextFunction } from 'express';
import type { Request } from 'express';
import { createServer, type Server } from 'http';
import { storage } from './storage';
import { db } from './db';
import { attendanceSessions } from '@shared/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import { generateStudentID } from '../shared/student-id-generator';
import multer from 'multer';
import * as XLSX from 'xlsx';
import { authLimiter } from './middleware/rateLimit';
import { notificationService } from './services/notification';
import { exportService } from './services/export';

// Extend Request type for multer
interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

if (!process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET environment variable must be set');
}
const JWT_SECRET = process.env.SESSION_SECRET;

// Setup multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Middleware for JWT authentication
function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1] || req.cookies?.token;

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  jwt.verify(token, JWT_SECRET, async (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }

    const user = await storage.getUser(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  });
}

// Middleware for role-based access
function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes with rate limiting
  app.post('/api/auth/register', authLimiter, async (req: Request, res: Response) => {
    try {
      const { email, password, name, role, departmentId } = req.body;

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        name,
        role: role || 'student',
        departmentId: departmentId ? parseInt(departmentId) : null,
        phone: req.body.phone || null,
        isActive: true,
      });

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
      res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });

      res.json({ user, token });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/auth/login', authLimiter, async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Get additional user data based on role
      let userData: any = { ...user };
      if (user.role === 'student') {
        const student = await storage.getStudentByUserId(user.id);
        if (student) {
          userData.studentId = student.studentId;
        }
      } else if (user.role === 'lecturer' || user.role === 'hod') {
        const lecturer = await storage.getLecturerByUserId(user.id);
        if (lecturer) {
          userData.lecturerId = lecturer.id;
        }
      }

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
      res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });

      // Remove password from response
      delete userData.password;

      res.json({ user: userData, token });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/auth/me', authenticateToken, async (req: Request, res: Response) => {
    const userData: any = { ...req.user };
    delete userData.password;

    // Get additional user data based on role
    if (req.user.role === 'student') {
      const student = await storage.getStudentByUserId(req.user.id);
      if (student) {
        userData.studentId = student.studentId;
      }
    } else if (req.user.role === 'lecturer' || req.user.role === 'hod') {
      const lecturer = await storage.getLecturerByUserId(req.user.id);
      if (lecturer) {
        userData.lecturerId = lecturer.id;
      }
    }

    res.json({ user: userData });
  });

  app.post('/api/auth/logout', (req: Request, res: Response) => {
    res.clearCookie('token');
    res.json({ message: 'Logged out successfully' });
  });

  // Change password with rate limiting
  app.post('/api/auth/change-password', authLimiter, authenticateToken, async (req: Request, res: Response) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) {
        return res.status(401).json({ message: 'Current password is incorrect' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await storage.updateUser(req.user.id, { password: hashedPassword });

      await storage.createAuditLog({
        userId: req.user.id,
        action: 'Changed password',
        entityType: 'user',
        entityId: req.user.id,
      });

      res.json({ message: 'Password changed successfully' });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Update user profile
  app.put('/api/users/:id', authenticateToken, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Users can only update their own profile unless they're admin
      if (req.user.id !== userId && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' });
      }

      // Don't allow password changes through this endpoint
      const { password, ...updateData } = req.body;
      
      const user = await storage.updateUser(userId, updateData);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      await storage.createAuditLog({
        userId: req.user.id,
        action: `Updated user profile: ${user.email}`,
        entityType: 'user',
        entityId: user.id,
      });

      const userData: any = { ...user };
      delete userData.password;
      res.json(userData);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin stats
  app.get('/api/admin/stats', authenticateToken, requireRole('admin'), async (req: Request, res: Response) => {
    try {
      const students = await storage.getAllStudents();
      const lecturers = await storage.getAllLecturers();
      const courses = await storage.getAllCourses();
      const departments = await storage.getAllDepartments();
      const pcs = await storage.getAllPCs();
      const books = await storage.getAllBooks();
      const loans = await storage.getAllBookLoans();
      const auditLogs = await storage.getAuditLogs(10);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const sessionsToday = await storage.getAttendanceSessionsByDate(today);
      const totalAttendanceMarks = await storage.countAttendanceMarks();

      res.json({
        totalStudents: students.length,
        totalLecturers: lecturers.length,
        totalCourses: courses.length,
        totalDepartments: departments.length,
        attendanceSessionsToday: sessionsToday.length,
        totalAttendanceMarks,
        totalPCs: pcs.length,
        availablePCs: pcs.filter((pc) => pc.status === 'available').length,
        totalBooks: books.reduce((sum, book) => sum + book.quantity, 0),
        availableBooks: books.reduce((sum, book) => sum + book.availableQuantity, 0),
        activeLoans: loans.filter((loan) => loan.status === 'active').length,
        recentActivities: auditLogs.map((log) => ({
          action: log.action,
          timestamp: new Date(log.createdAt).toLocaleString(),
        })),
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Department routes
  app.get('/api/departments', authenticateToken, async (req: Request, res: Response) => {
    try {
      const departments = await storage.getAllDepartments();
      res.json(departments);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/departments', authenticateToken, requireRole('admin'), async (req: Request, res: Response) => {
    try {
      const department = await storage.createDepartment(req.body);
      await storage.createAuditLog({
        userId: req.user.id,
        action: `Created department: ${department.code}`,
        entityType: 'department',
        entityId: department.id,
      });
      res.json(department);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Update a department
  app.put('/api/departments/:id', authenticateToken, requireRole('admin'), async (req: Request, res: Response) => {
    try {
      const departmentId = parseInt(req.params.id);
      const department = await storage.updateDepartment(departmentId, req.body);
      
      if (!department) {
        return res.status(404).json({ message: 'Department not found' });
      }

      await storage.createAuditLog({
        userId: req.user.id,
        action: `Updated department: ${department.code}`,
        entityType: 'department',
        entityId: department.id,
      });

      res.json(department);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Delete a department
  app.delete('/api/departments/:id', authenticateToken, requireRole('admin'), async (req: Request, res: Response) => {
    try {
      const departmentId = parseInt(req.params.id);
      const department = await storage.getDepartment(departmentId);
      
      if (!department) {
        return res.status(404).json({ message: 'Department not found' });
      }

      await storage.deleteDepartment(departmentId);

      await storage.createAuditLog({
        userId: req.user.id,
        action: `Deleted department: ${department.code}`,
        entityType: 'department',
        entityId: departmentId,
      });

      res.json({ message: 'Department deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Student routes
  app.get('/api/students', authenticateToken, async (req: Request, res: Response) => {
    try {
      const students = await storage.getAllStudents();
      res.json(students);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/students', authenticateToken, requireRole('admin'), async (req: Request, res: Response) => {
    try {
      const { name, email, password, phone, departmentId, programType, intakeYear, studentNumber } = req.body;

      // Create user first
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        name,
        role: 'student',
        departmentId: parseInt(departmentId),
        phone: phone || null,
        isActive: true,
      });

      // Get department code
      const department = await storage.getDepartment(parseInt(departmentId));
      if (!department) {
        throw new Error('Department not found');
      }

      // Generate student ID
      const studentId = generateStudentID(department.code, intakeYear, programType, parseInt(studentNumber));

      // Create student record
      const student = await storage.createStudent({
        userId: user.id,
        studentId,
        studentNumber,
        programType,
        intakeYear,
        departmentId: parseInt(departmentId),
      });

      await storage.createAuditLog({
        userId: req.user.id,
        action: `Created student: ${studentId}`,
        entityType: 'student',
        entityId: student.id,
      });

      const fullStudent = await storage.getStudent(student.id);
      res.json(fullStudent);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Update a student
  app.put('/api/students/:id', authenticateToken, requireRole('admin'), async (req: Request, res: Response) => {
    try {
      const studentId = parseInt(req.params.id);
      const student = await storage.updateStudent(studentId, req.body);
      
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }

      await storage.createAuditLog({
        userId: req.user.id,
        action: `Updated student: ${student.studentId}`,
        entityType: 'student',
        entityId: student.id,
      });

      res.json(student);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Delete a student
  app.delete('/api/students/:id', authenticateToken, requireRole('admin'), async (req: Request, res: Response) => {
    try {
      const studentId = parseInt(req.params.id);
      const student = await storage.getStudent(studentId);
      
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }

      await storage.deleteStudent(studentId);

      await storage.createAuditLog({
        userId: req.user.id,
        action: `Deleted student: ${student.studentId}`,
        entityType: 'student',
        entityId: studentId,
      });

      res.json({ message: 'Student deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Lecturer routes
  app.get('/api/lecturers', authenticateToken, async (req: Request, res: Response) => {
    try {
      const lecturers = await storage.getAllLecturers();
      res.json(lecturers);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Create a lecturer
  app.post('/api/lecturers', authenticateToken, requireRole('admin'), async (req: Request, res: Response) => {
    try {
      const { name, email, password, phone, departmentId, employeeId, designation, isHOD } = req.body;

      // Create user first
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        name,
        role: isHOD ? 'hod' : 'lecturer',
        departmentId: parseInt(departmentId),
        phone: phone || null,
        isActive: true,
      });

      // Create lecturer record
      const lecturer = await storage.createLecturer({
        userId: user.id,
        employeeId,
        designation: designation || null,
        isHOD: isHOD || false,
        departmentId: parseInt(departmentId),
      });

      await storage.createAuditLog({
        userId: req.user.id,
        action: `Created lecturer: ${employeeId}`,
        entityType: 'lecturer',
        entityId: lecturer.id,
      });

      const fullLecturer = await storage.getLecturer(lecturer.id);
      res.json(fullLecturer);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Update a lecturer
  app.put('/api/lecturers/:id', authenticateToken, requireRole('admin'), async (req: Request, res: Response) => {
    try {
      const lecturerId = parseInt(req.params.id);
      const lecturer = await storage.updateLecturer(lecturerId, req.body);
      
      if (!lecturer) {
        return res.status(404).json({ message: 'Lecturer not found' });
      }

      await storage.createAuditLog({
        userId: req.user.id,
        action: `Updated lecturer: ${lecturer.employeeId}`,
        entityType: 'lecturer',
        entityId: lecturer.id,
      });

      res.json(lecturer);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Delete a lecturer
  app.delete('/api/lecturers/:id', authenticateToken, requireRole('admin'), async (req: Request, res: Response) => {
    try {
      const lecturerId = parseInt(req.params.id);
      const lecturer = await storage.getLecturer(lecturerId);
      
      if (!lecturer) {
        return res.status(404).json({ message: 'Lecturer not found' });
      }

      await storage.deleteLecturer(lecturerId);

      await storage.createAuditLog({
        userId: req.user.id,
        action: `Deleted lecturer: ${lecturer.employeeId}`,
        entityType: 'lecturer',
        entityId: lecturerId,
      });

      res.json({ message: 'Lecturer deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/lecturer/stats', authenticateToken, requireRole('lecturer', 'hod'), async (req: Request, res: Response) => {
    try {
      const lecturer = await storage.getLecturerByUserId(req.user.id);
      if (!lecturer) {
        return res.status(404).json({ message: 'Lecturer not found' });
      }

      const courses = await storage.getCoursesByLecturer(lecturer.id);
      const students = await storage.getAllStudents();
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const sessionsToday = await storage.getAttendanceSessionsByDate(today);
      const lecturerSessionsToday = sessionsToday.filter(s => s.lecturerId === lecturer.id);

      res.json({
        totalCourses: courses.length,
        totalStudents: students.filter((s) => s.department?.id === lecturer.departmentId).length,
        sessionsToday: lecturerSessionsToday.length,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/lecturer/courses', authenticateToken, requireRole('lecturer', 'hod'), async (req: Request, res: Response) => {
    try {
      const lecturer = await storage.getLecturerByUserId(req.user.id);
      if (!lecturer) {
        return res.status(404).json({ message: 'Lecturer not found' });
      }

      const courses = await storage.getCoursesByLecturer(lecturer.id);
      res.json(courses);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Course routes
  app.get('/api/courses', authenticateToken, async (req: Request, res: Response) => {
    try {
      const courses = await storage.getAllCourses();
      res.json(courses);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Create a course
  app.post('/api/courses', authenticateToken, requireRole('admin', 'hod'), async (req: Request, res: Response) => {
    try {
      const course = await storage.createCourse(req.body);
      
      await storage.createAuditLog({
        userId: req.user.id,
        action: `Created course: ${course.code} - ${course.name}`,
        entityType: 'course',
        entityId: course.id,
      });

      res.json(course);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Update a course
  app.put('/api/courses/:id', authenticateToken, requireRole('admin', 'hod'), async (req: Request, res: Response) => {
    try {
      const courseId = parseInt(req.params.id);
      const course = await storage.updateCourse(courseId, req.body);
      
      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }

      await storage.createAuditLog({
        userId: req.user.id,
        action: `Updated course: ${course.code} - ${course.name}`,
        entityType: 'course',
        entityId: course.id,
      });

      res.json(course);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Delete a course
  app.delete('/api/courses/:id', authenticateToken, requireRole('admin'), async (req: Request, res: Response) => {
    try {
      const courseId = parseInt(req.params.id);
      const course = await storage.getCourse(courseId);
      
      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }

      await storage.deleteCourse(courseId);

      await storage.createAuditLog({
        userId: req.user.id,
        action: `Deleted course: ${course.code} - ${course.name}`,
        entityType: 'course',
        entityId: courseId,
      });

      res.json({ message: 'Course deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Attendance session routes
  app.post('/api/attendance/create-session', authenticateToken, requireRole('lecturer', 'hod'), async (req: Request, res: Response) => {
    try {
      const { courseId } = req.body;

      const lecturer = await storage.getLecturerByUserId(req.user.id);
      if (!lecturer) {
        return res.status(404).json({ message: 'Lecturer not found' });
      }

      const course = await storage.getCourse(courseId);
      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }

      // Generate token and set expiration (5 minutes)
      const token = nanoid(32);
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

      // Get anti-cheat settings for department
      const antiCheatSettings = course.department ? await storage.getAntiCheatSettings(course.department.id) : undefined;

      const session = await storage.createAttendanceSession({
        courseId,
        lecturerId: lecturer.id,
        sessionDate: new Date(),
        token,
        expiresAt,
        isActive: true,
        requirePhoto: antiCheatSettings?.requirePhoto ?? true,
        requireDeviceFingerprint: antiCheatSettings?.requireDeviceFingerprint ?? false,
      });

      await storage.createAuditLog({
        userId: req.user.id,
        action: `Created attendance session for course: ${course.code}`,
        entityType: 'attendance_session',
        entityId: session.id,
      });

      res.json(session);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/attendance/sessions/:id/close', authenticateToken, requireRole('lecturer', 'hod'), async (req: Request, res: Response) => {
    try {
      const sessionId = parseInt(req.params.id);
      await storage.closeAttendanceSession(sessionId);
      res.json({ message: 'Session closed' });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get all attendance sessions
  app.get('/api/attendance/sessions', authenticateToken, async (req: Request, res: Response) => {
    try {
      const activeSessions = await storage.getActiveSessions();
      res.json(activeSessions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Refresh QR token for a session
  app.post('/api/attendance/sessions/:id/refresh', authenticateToken, requireRole('lecturer', 'hod'), async (req: Request, res: Response) => {
    try {
      const sessionId = parseInt(req.params.id);
      const session = await storage.refreshAttendanceSessionToken(sessionId);
      
      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }
      
      res.json({ message: 'Token refreshed successfully', session });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/attendance/scan', authenticateToken, requireRole('student'), async (req: Request, res: Response) => {
    try {
      const { sessionId, token, selfieDataUrl } = req.body;

      const student = await storage.getStudentByUserId(req.user.id);
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }

      // Verify session
      const session = await storage.getAttendanceSession(sessionId);
      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }

      if (!session.isActive) {
        return res.status(400).json({ message: 'Session is no longer active' });
      }

      if (session.token !== token) {
        return res.status(400).json({ message: 'Invalid session token' });
      }

      if (new Date() > session.expiresAt) {
        return res.status(400).json({ message: 'Session has expired' });
      }

      // Check if already marked
      const alreadyMarked = await storage.checkAttendanceMarked(sessionId, student.id);
      if (alreadyMarked) {
        return res.status(400).json({ message: 'Attendance already marked for this session' });
      }

      // Create attendance mark
      const mark = await storage.createAttendanceMark({
        sessionId,
        studentId: student.id,
        selfieUrl: selfieDataUrl ? 'data:image/jpeg;base64,...' : null, // In production, save to storage
        isVerified: false, // Face verification placeholder
        ipAddress: req.ip || req.headers['x-forwarded-for'] as string || null,
        userAgent: req.headers['user-agent'] || null,
        deviceFingerprint: null,
      });

      await storage.createAuditLog({
        userId: req.user.id,
        action: `Marked attendance for session ${sessionId}`,
        entityType: 'attendance_mark',
        entityId: mark.id,
        ipAddress: mark.ipAddress || undefined,
      });

      res.json({ message: 'Attendance marked successfully', mark });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Student stats and attendance
  app.get('/api/student/stats', authenticateToken, requireRole('student'), async (req: Request, res: Response) => {
    try {
      const student = await storage.getStudentByUserId(req.user.id);
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }

      const attendanceMarks = await storage.getAttendanceMarksByStudent(student.id);
      const activeLoans = await storage.getActiveBookLoansByUser(req.user.id);
      const examApplications = await storage.getExamApplicationsByStudent(student.id);

      const attendanceRate = await storage.calculateAttendanceRate(student.id);

      res.json({
        attendanceRate,
        activeLoans: activeLoans.length,
        examApplications: examApplications.length,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Library routes
  app.get('/api/library/books', authenticateToken, async (req: Request, res: Response) => {
    try {
      const books = await storage.getAllBooks();
      res.json(books);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/library/books', authenticateToken, requireRole('admin', 'staff'), async (req: Request, res: Response) => {
    try {
      const book = await storage.createBook(req.body);
      await storage.createAuditLog({
        userId: req.user.id,
        action: `Added book: ${book.title}`,
        entityType: 'book',
        entityId: book.id,
      });
      res.json(book);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/library/loans', authenticateToken, async (req: Request, res: Response) => {
    try {
      const loans = await storage.getAllBookLoans();
      res.json(loans);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/library/loans', authenticateToken, async (req: Request, res: Response) => {
    try {
      const { bookId, userId, dueDate } = req.body;

      const book = await storage.getBook(bookId);
      if (!book) {
        return res.status(404).json({ message: 'Book not found' });
      }

      if (book.availableQuantity <= 0) {
        return res.status(400).json({ message: 'Book not available' });
      }

      const loan = await storage.createBookLoan({
        bookId,
        userId,
        dueDate: new Date(dueDate),
        status: 'active',
      });

      await storage.updateBookQuantity(bookId, -1);

      await storage.createAuditLog({
        userId: req.user.id,
        action: `Loaned book: ${book.title} to user ${userId}`,
        entityType: 'book_loan',
        entityId: loan.id,
      });

      res.json(loan);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Return a book
  app.post('/api/library/loans/:id/return', authenticateToken, requireRole('admin', 'staff'), async (req: Request, res: Response) => {
    try {
      const loanId = parseInt(req.params.id);
      const loan = await storage.getBookLoan(loanId);
      
      if (!loan) {
        return res.status(404).json({ message: 'Loan not found' });
      }

      if (loan.status === 'returned') {
        return res.status(400).json({ message: 'Book already returned' });
      }

      await storage.returnBook(loanId);
      await storage.updateBookQuantity(loan.bookId, 1);

      // Import export service to calculate fine
      
      const fine = exportService.calculateLoanFine(loan);

      await storage.createAuditLog({
        userId: req.user.id,
        action: `Book returned: ${loan.book?.title || 'Unknown'}, Fine: Rs. ${fine}`,
        entityType: 'book_loan',
        entityId: loanId,
      });

      res.json({ message: 'Book returned successfully', fine });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Update a book
  app.put('/api/library/books/:id', authenticateToken, requireRole('admin', 'staff'), async (req: Request, res: Response) => {
    try {
      const bookId = parseInt(req.params.id);
      const book = await storage.updateBook(bookId, req.body);
      
      if (!book) {
        return res.status(404).json({ message: 'Book not found' });
      }

      await storage.createAuditLog({
        userId: req.user.id,
        action: `Updated book: ${book.title}`,
        entityType: 'book',
        entityId: book.id,
      });

      res.json(book);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Delete a book
  app.delete('/api/library/books/:id', authenticateToken, requireRole('admin'), async (req: Request, res: Response) => {
    try {
      const bookId = parseInt(req.params.id);
      const book = await storage.getBook(bookId);
      
      if (!book) {
        return res.status(404).json({ message: 'Book not found' });
      }

      await storage.deleteBook(bookId);

      await storage.createAuditLog({
        userId: req.user.id,
        action: `Deleted book: ${book.title}`,
        entityType: 'book',
        entityId: bookId,
      });

      res.json({ message: 'Book deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Lab routes
  app.get('/api/labs', authenticateToken, async (req: Request, res: Response) => {
    try {
      const labs = await storage.getAllLabs();
      res.json(labs);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/labs', authenticateToken, requireRole('admin', 'staff'), async (req: Request, res: Response) => {
    try {
      const lab = await storage.createLab(req.body);
      await storage.createAuditLog({
        userId: req.user.id,
        action: `Created lab: ${lab.name}`,
        entityType: 'lab',
        entityId: lab.id,
      });
      res.json(lab);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Update a lab
  app.put('/api/labs/:id', authenticateToken, requireRole('admin', 'staff'), async (req: Request, res: Response) => {
    try {
      const labId = parseInt(req.params.id);
      const lab = await storage.updateLab(labId, req.body);
      
      if (!lab) {
        return res.status(404).json({ message: 'Lab not found' });
      }

      await storage.createAuditLog({
        userId: req.user.id,
        action: `Updated lab: ${lab.name}`,
        entityType: 'lab',
        entityId: lab.id,
      });

      res.json(lab);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Delete a lab
  app.delete('/api/labs/:id', authenticateToken, requireRole('admin'), async (req: Request, res: Response) => {
    try {
      const labId = parseInt(req.params.id);
      const lab = await storage.getLab(labId);
      
      if (!lab) {
        return res.status(404).json({ message: 'Lab not found' });
      }

      await storage.deleteLab(labId);

      await storage.createAuditLog({
        userId: req.user.id,
        action: `Deleted lab: ${lab.name}`,
        entityType: 'lab',
        entityId: labId,
      });

      res.json({ message: 'Lab deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/labs/pcs', authenticateToken, async (req: Request, res: Response) => {
    try {
      const pcs = await storage.getAllPCs();
      res.json(pcs);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/labs/pcs', authenticateToken, requireRole('admin', 'staff'), async (req: Request, res: Response) => {
    try {
      const pc = await storage.createPC(req.body);
      await storage.createAuditLog({
        userId: req.user.id,
        action: `Added PC: ${pc.pcNumber}`,
        entityType: 'pc',
        entityId: pc.id,
      });
      res.json(pc);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Update a PC
  app.put('/api/labs/pcs/:id', authenticateToken, requireRole('admin', 'staff'), async (req: Request, res: Response) => {
    try {
      const pcId = parseInt(req.params.id);
      const pc = await storage.updatePC(pcId, req.body);
      
      if (!pc) {
        return res.status(404).json({ message: 'PC not found' });
      }

      await storage.createAuditLog({
        userId: req.user.id,
        action: `Updated PC: ${pc.pcNumber}`,
        entityType: 'pc',
        entityId: pc.id,
      });

      res.json(pc);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Assign a PC to a user
  app.post('/api/labs/pcs/:id/assign', authenticateToken, requireRole('admin', 'staff'), async (req: Request, res: Response) => {
    try {
      const pcId = parseInt(req.params.id);
      const { userId } = req.body;
      
      const pc = await storage.updatePC(pcId, {
        assignedToUserId: userId,
        status: 'assigned',
      });
      
      if (!pc) {
        return res.status(404).json({ message: 'PC not found' });
      }

      await storage.createAuditLog({
        userId: req.user.id,
        action: `Assigned PC ${pc.pcNumber} to user ${userId}`,
        entityType: 'pc',
        entityId: pc.id,
      });

      res.json({ message: 'PC assigned successfully', pc });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Unassign a PC
  app.post('/api/labs/pcs/:id/unassign', authenticateToken, requireRole('admin', 'staff'), async (req: Request, res: Response) => {
    try {
      const pcId = parseInt(req.params.id);
      
      const pc = await storage.updatePC(pcId, {
        assignedToUserId: null,
        status: 'available',
      });
      
      if (!pc) {
        return res.status(404).json({ message: 'PC not found' });
      }

      await storage.createAuditLog({
        userId: req.user.id,
        action: `Unassigned PC ${pc.pcNumber}`,
        entityType: 'pc',
        entityId: pc.id,
      });

      res.json({ message: 'PC unassigned successfully', pc });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Exam application routes
  app.get('/api/exams/applications', authenticateToken, async (req: Request, res: Response) => {
    try {
      const applications = await storage.getAllExamApplications();
      res.json(applications);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/exams/applications', authenticateToken, requireRole('student'), async (req: Request, res: Response) => {
    try {
      const student = await storage.getStudentByUserId(req.user.id);
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }

      const application = await storage.createExamApplication({
        studentId: student.id,
        courseId: req.body.courseId,
        examType: req.body.examType,
        reason: req.body.reason || null,
        status: 'pending',
        reviewedBy: null,
        reviewedAt: null,
      });

      res.json(application);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Review (approve/reject) exam application
  app.put('/api/exams/applications/:id/review', authenticateToken, requireRole('admin', 'hod'), async (req: Request, res: Response) => {
    try {
      const applicationId = parseInt(req.params.id);
      const { status } = req.body; // 'approved' or 'rejected'
      
      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status. Must be "approved" or "rejected"' });
      }

      await storage.updateExamApplicationStatus(applicationId, status, req.user.id);

      await storage.createAuditLog({
        userId: req.user.id,
        action: `${status === 'approved' ? 'Approved' : 'Rejected'} exam application ${applicationId}`,
        entityType: 'exam_application',
        entityId: applicationId,
      });

      // Get application details to send notification
      const application = await storage.getExamApplication(applicationId);
      
      if (application?.student?.user?.phone) {
        
        await notificationService.sendExamApplicationUpdate(
          application.student.user.phone,
          application.student.user.name,
          application.course?.name || 'Unknown Course',
          status
        );
      }

      res.json({ message: `Application ${status}` });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get student's own exam applications
  app.get('/api/student/exam-applications', authenticateToken, requireRole('student'), async (req: Request, res: Response) => {
    try {
      const student = await storage.getStudentByUserId(req.user.id);
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }

      const applications = await storage.getExamApplicationsByStudent(student.id);
      res.json(applications);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Payment routes
  app.get('/api/payments', authenticateToken, async (req: Request, res: Response) => {
    try {
      const payments = await storage.getAllPayments();
      res.json(payments);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/payments', authenticateToken, requireRole('admin'), async (req: Request, res: Response) => {
    try {
      const payment = await storage.createPayment(req.body);
      res.json(payment);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/payments/:id/send-sms', authenticateToken, requireRole('admin'), async (req: Request, res: Response) => {
    try {
      const paymentId = parseInt(req.params.id);
      
      const payment = await storage.getPayment(paymentId);
      
      if (!payment) {
        return res.status(404).json({ message: 'Payment not found' });
      }

      if (payment.user?.phone) {
        
        await notificationService.sendPaymentConfirmation(
          payment.user.phone,
          payment.user.name,
          parseFloat(payment.amount),
          payment.description || 'Payment'
        );
      }

      await storage.markPaymentSMSSent(paymentId);

      res.json({ message: 'SMS notification sent' });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Import students from Excel/CSV
  app.post('/api/admin/import-students', authenticateToken, requireRole('admin'), upload.single('file'), async (req: MulterRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file provided' });
      }

      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      
      // Get raw data to find where headers actually start
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      let headerRow = 0;
      
      // Parse all rows to find the header row
      const rawData: any[] = [];
      for (let i = range.s.r; i <= range.e.r; i++) {
        const row: any = {};
        for (let j = range.s.c; j <= range.e.c; j++) {
          const cellAddress = XLSX.utils.encode_cell({ r: i, c: j });
          const cell = worksheet[cellAddress];
          row[j] = cell ? cell.v : null;
        }
        rawData.push(row);
      }
      
      // Find the header row (first row with email-like or name-like content)
      for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i];
        const rowStr = JSON.stringify(row).toLowerCase();
        if (rowStr.includes('email') || rowStr.includes('name') || rowStr.includes('student')) {
          headerRow = i;
          break;
        }
      }
      
      // Parse with the correct header row
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      const actualKeys = data[headerRow] as string[];
      const dataRows = data.slice(headerRow + 1);
      
      const success: number[] = [];
      const failed: any[] = [];

      // Get all departments for lookup
      const departments = await storage.getAllDepartments();
      const deptMap = new Map(departments.map((d) => [d.code.toUpperCase(), d]));

      // Helper function to normalize column names for flexible matching
      const normalizeKey = (key: string) => key.toLowerCase().replace(/\s+/g, '').replace(/[_-]/g, '').trim();
      
      // Create a mapping of normalized keys to actual keys
      const keyMap: Record<string, string> = {};
      
      if (actualKeys) {
        for (let i = 0; i < actualKeys.length; i++) {
          const key = String(actualKeys[i]);
          keyMap[normalizeKey(key)] = String(i);
        }
      }
      
      console.log('Excel header row:', headerRow, 'Columns found:', actualKeys);
      console.log('Normalized key map:', keyMap);

      // Helper to get value with flexible key matching
      const getValue = (row: any[], possibleKeys: string[]) => {
        for (const key of possibleKeys) {
          const normalizedKey = normalizeKey(key);
          const colIndex = keyMap[normalizedKey];
          if (colIndex !== undefined && row[parseInt(colIndex)]) {
            return row[parseInt(colIndex)];
          }
        }
        return null;
      };

      for (let i = 0; i < dataRows.length; i++) {
        try {
          const row: any[] = dataRows[i] as any[];
          if (!row || row.length === 0) continue;
          const rowNum = headerRow + i + 2;

          // Extract fields with flexible column name matching
          const email = getValue(row, ['email', 'Email', 'e-mail', 'email address']);
          const name = getValue(row, ['name', 'Name', 'full name', 'fullname', 'student name']);
          const studentNumber = getValue(row, ['studentnumber', 'student number', 'StudentNumber', 'student_number', 'reg number', 'registration no.', 'new reg. no']);
          const department = getValue(row, ['department', 'Department', 'dept', 'Dept', 'department code']) || 'ICT'; // Default to ICT
          const programType = getValue(row, ['programtype', 'program type', 'ProgramType', 'program_type', 'type']) || 'FT'; // Default to FT
          const intakeYear = getValue(row, ['intakeyear', 'intake year', 'IntakeYear', 'intake_year', 'year']) || new Date().getFullYear();
          const phone = getValue(row, ['phone', 'Phone', 'telephone', 'contact']) || null;

          // Validate required fields - only email and name are truly required
          if (!email || !name) {
            failed.push({
              row: rowNum,
              error: `Missing required fields: email=${email}, name=${name}`,
            });
            continue;
          }
          
          // Generate student number if missing and truncate to 10 chars
          let stuNum = studentNumber;
          if (!stuNum) {
            stuNum = String(i + 1).padStart(4, '0');
          } else {
            // Truncate to max 10 characters for database
            stuNum = String(stuNum).substring(0, 10);
          }

          // Validate and normalize department
          let dept = deptMap.get(String(department).toUpperCase());
          if (!dept) {
            // Try to find by partial match or use default
            const depts = Array.from(deptMap.values());
            dept = depts[0]; // Default to first department (ICT)
            if (!dept) {
              failed.push({
                row: rowNum,
                error: `No valid departments found in system`,
              });
              continue;
            }
          }

          // Validate and normalize program type
          let progType = String(programType).toUpperCase();
          if (!['FT', 'PT'].includes(progType)) {
            progType = 'FT'; // Default to FT
          }

          // Check if user already exists - skip if already imported
          const existingUser = await storage.getUserByEmail(String(email).toLowerCase());
          if (existingUser) {
            // Skip with info instead of counting as failure
            continue;
          }

          // Create user
          const hashedPassword = await bcrypt.hash('defaultPassword123', 10);
          const user = await storage.createUser({
            email: String(email).toLowerCase(),
            password: hashedPassword,
            name: String(name),
            role: 'student',
            departmentId: dept.id,
            phone: String(phone) || null,
            isActive: true,
          });

          // Create student
          const year = parseInt(String(intakeYear)) || new Date().getFullYear();
          const paddedStuNum = String(stuNum).padStart(4, '0');
          const studentId = generateStudentID(dept.code, year, progType as 'FT' | 'PT', parseInt(paddedStuNum));

          await storage.createStudent({
            userId: user.id,
            studentId,
            studentNumber: paddedStuNum,
            programType: progType as 'FT' | 'PT',
            intakeYear: year,
            departmentId: dept.id,
          });

          success.push(user.id);

          await storage.createAuditLog({
            userId: req.user.id,
            action: `Imported student: ${studentId}`,
            entityType: 'student',
            entityId: user.id,
          });
        } catch (error: any) {
          failed.push({
            row: i + 2,
            error: error.message || 'Unknown error',
          });
        }
      }

      res.json({
        success: success.length,
        failed: failed.length,
        columnsFound: actualKeys,
        errors: failed,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Anti-cheat settings routes
  app.get('/api/admin/anti-cheat/:departmentId', authenticateToken, requireRole('admin', 'hod'), async (req: Request, res: Response) => {
    try {
      const departmentId = parseInt(req.params.departmentId);
      const settings = await storage.getAntiCheatSettings(departmentId);
      
      if (!settings) {
        return res.status(404).json({ message: 'Anti-cheat settings not found for this department' });
      }

      res.json(settings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put('/api/admin/anti-cheat/:departmentId', authenticateToken, requireRole('admin', 'hod'), async (req: Request, res: Response) => {
    try {
      const departmentId = parseInt(req.params.departmentId);
      const settings = await storage.upsertAntiCheatSettings({
        departmentId,
        ...req.body,
      });

      await storage.createAuditLog({
        userId: req.user.id,
        action: `Updated anti-cheat settings for department ${departmentId}`,
        entityType: 'anti_cheat_settings',
        entityId: settings.id,
      });

      res.json(settings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Audit logs route
  app.get('/api/admin/audit-logs', authenticateToken, requireRole('admin'), async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const logs = await storage.getAuditLogs(limit);
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Export routes
  app.get('/api/export/students', authenticateToken, requireRole('admin'), async (req: Request, res: Response) => {
    try {
      const format = (req.query.format as string) || 'xlsx';
      const students = await storage.getAllStudents();
      
      
      const formattedData = exportService.formatStudentsForExport(students);
      const buffer = exportService.exportToFile(formattedData, { format: format as 'csv' | 'xlsx' });

      const filename = `students_export_${new Date().toISOString().split('T')[0]}.${format}`;
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/export/attendance/:courseId', authenticateToken, requireRole('admin', 'lecturer', 'hod'), async (req: Request, res: Response) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const format = (req.query.format as string) || 'xlsx';
      
      // Get all attendance sessions for this course
      const allSessions = await db
        .select()
        .from(attendanceSessions)
        .where(eq(attendanceSessions.courseId, courseId));
      
      // Get all attendance marks for these sessions
      const sessionIds = allSessions.map(s => s.id);
      const allMarks: any[] = [];
      for (const sessionId of sessionIds) {
        const marks = await storage.getAttendanceMarksBySession(sessionId);
        allMarks.push(...marks);
      }

      
      const formattedData = exportService.formatAttendanceForExport(allSessions, allMarks);
      const buffer = exportService.exportToFile(formattedData, { format: format as 'csv' | 'xlsx' });

      const filename = `attendance_course_${courseId}_${new Date().toISOString().split('T')[0]}.${format}`;
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/export/library/loans', authenticateToken, requireRole('admin', 'staff'), async (req: Request, res: Response) => {
    try {
      const format = (req.query.format as string) || 'xlsx';
      const loans = await storage.getAllBookLoans();
      
      
      const formattedData = exportService.formatLibraryLoansForExport(loans);
      const buffer = exportService.exportToFile(formattedData, { format: format as 'csv' | 'xlsx' });

      const filename = `library_loans_${new Date().toISOString().split('T')[0]}.${format}`;
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/export/payments', authenticateToken, requireRole('admin'), async (req: Request, res: Response) => {
    try {
      const format = (req.query.format as string) || 'xlsx';
      const payments = await storage.getAllPayments();
      
      
      const formattedData = exportService.formatPaymentsForExport(payments);
      const buffer = exportService.exportToFile(formattedData, { format: format as 'csv' | 'xlsx' });

      const filename = `payments_export_${new Date().toISOString().split('T')[0]}.${format}`;
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}
