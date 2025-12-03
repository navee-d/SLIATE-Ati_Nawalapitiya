import type { Express, Request, Response, NextFunction } from 'express';
import { createServer, type Server } from 'http';
import { storage } from './storage';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import { generateStudentID } from '../shared/student-id-generator';
import multer from 'multer';
import * as XLSX from 'xlsx';

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
  // Authentication routes
  app.post('/api/auth/register', async (req: Request, res: Response) => {
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

  app.post('/api/auth/login', async (req: Request, res: Response) => {
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

      res.json({
        totalStudents: students.length,
        totalLecturers: lecturers.length,
        totalCourses: courses.length,
        totalDepartments: departments.length,
        attendanceSessionsToday: 0, // TODO: Filter by today
        totalAttendanceMarks: 0, // TODO: Get count
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

  // Lecturer routes
  app.get('/api/lecturers', authenticateToken, async (req: Request, res: Response) => {
    try {
      const lecturers = await storage.getAllLecturers();
      res.json(lecturers);
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

      res.json({
        totalCourses: courses.length,
        totalStudents: students.filter((s) => s.department.id === lecturer.departmentId).length,
        sessionsToday: 0, // TODO: Filter by today
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
      const antiCheatSettings = await storage.getAntiCheatSettings(course.department.id);

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

      res.json({
        attendanceRate: 85, // TODO: Calculate actual rate
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
      
      // TODO: Integrate with Twilio/WhatsApp
      // This is a placeholder for SMS sending functionality
      await storage.markPaymentSMSSent(paymentId);

      res.json({ message: 'SMS notification sent (placeholder)' });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Import students from Excel/CSV
  app.post('/api/admin/import-students', authenticateToken, requireRole('admin'), upload.single('file'), async (req: Request, res: Response) => {
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
