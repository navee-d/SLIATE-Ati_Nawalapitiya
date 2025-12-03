import { db } from './db';
import { eq, and, desc, gte, lte } from 'drizzle-orm';
import {
  users,
  students,
  lecturers,
  departments,
  courses,
  attendanceSessions,
  attendanceMarks,
  labs,
  pcs,
  books,
  bookLoans,
  examApplications,
  payments,
  auditLogs,
  antiCheatSettings,
  type User,
  type InsertUser,
  type Student,
  type InsertStudent,
  type Lecturer,
  type InsertLecturer,
  type Department,
  type InsertDepartment,
  type Course,
  type InsertCourse,
  type AttendanceSession,
  type InsertAttendanceSession,
  type AttendanceMark,
  type InsertAttendanceMark,
  type Lab,
  type InsertLab,
  type PC,
  type InsertPC,
  type Book,
  type InsertBook,
  type BookLoan,
  type InsertBookLoan,
  type ExamApplication,
  type InsertExamApplication,
  type Payment,
  type InsertPayment,
  type InsertAuditLog,
  type AntiCheatSettings,
  type InsertAntiCheatSettings,
} from '@shared/schema';

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  getAllUsers(): Promise<User[]>;

  // Students
  getStudent(id: number): Promise<any | undefined>;
  getStudentByUserId(userId: number): Promise<Student | undefined>;
  getStudentByStudentId(studentId: string): Promise<Student | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;
  getAllStudents(): Promise<any[]>;
  deleteStudent(id: number): Promise<boolean>;

  // Lecturers
  getLecturer(id: number): Promise<any | undefined>;
  getLecturerByUserId(userId: number): Promise<Lecturer | undefined>;
  createLecturer(lecturer: InsertLecturer): Promise<Lecturer>;
  getAllLecturers(): Promise<any[]>;

  // Departments
  getDepartment(id: number): Promise<Department | undefined>;
  getDepartmentByCode(code: string): Promise<Department | undefined>;
  createDepartment(department: InsertDepartment): Promise<Department>;
  getAllDepartments(): Promise<Department[]>;

  // Courses
  getCourse(id: number): Promise<any | undefined>;
  createCourse(course: InsertCourse): Promise<Course>;
  getAllCourses(): Promise<any[]>;
  getCoursesByLecturer(lecturerId: number): Promise<any[]>;

  // Attendance Sessions
  getAttendanceSession(id: number): Promise<AttendanceSession | undefined>;
  getAttendanceSessionByToken(token: string): Promise<AttendanceSession | undefined>;
  createAttendanceSession(session: InsertAttendanceSession): Promise<AttendanceSession>;
  closeAttendanceSession(id: number): Promise<boolean>;
  getActiveSessions(): Promise<AttendanceSession[]>;

  // Attendance Marks
  createAttendanceMark(mark: InsertAttendanceMark): Promise<AttendanceMark>;
  getAttendanceMarksBySession(sessionId: number): Promise<any[]>;
  getAttendanceMarksByStudent(studentId: number): Promise<any[]>;
  checkAttendanceMarked(sessionId: number, studentId: number): Promise<boolean>;

  // Labs
  getLab(id: number): Promise<Lab | undefined>;
  createLab(lab: InsertLab): Promise<Lab>;
  getAllLabs(): Promise<Lab[]>;

  // PCs
  getPC(id: number): Promise<PC | undefined>;
  createPC(pc: InsertPC): Promise<PC>;
  getAllPCs(): Promise<PC[]>;
  updatePC(id: number, pc: Partial<InsertPC>): Promise<PC | undefined>;

  // Books
  getBook(id: number): Promise<Book | undefined>;
  createBook(book: InsertBook): Promise<Book>;
  getAllBooks(): Promise<Book[]>;
  updateBookQuantity(id: number, change: number): Promise<void>;

  // Book Loans
  createBookLoan(loan: InsertBookLoan): Promise<BookLoan>;
  getBookLoan(id: number): Promise<any | undefined>;
  getAllBookLoans(): Promise<any[]>;
  getActiveBookLoansByUser(userId: number): Promise<any[]>;
  returnBook(loanId: number): Promise<boolean>;

  // Exam Applications
  createExamApplication(application: InsertExamApplication): Promise<ExamApplication>;
  getAllExamApplications(): Promise<any[]>;
  getExamApplicationsByStudent(studentId: number): Promise<any[]>;
  updateExamApplicationStatus(id: number, status: string, reviewerId: number): Promise<boolean>;

  // Payments
  createPayment(payment: InsertPayment): Promise<Payment>;
  getAllPayments(): Promise<any[]>;
  getPaymentsByUser(userId: number): Promise<Payment[]>;
  markPaymentSMSSent(id: number): Promise<boolean>;

  // Audit Logs
  createAuditLog(log: InsertAuditLog): Promise<void>;
  getAuditLogs(limit?: number): Promise<any[]>;

  // Anti-cheat Settings
  getAntiCheatSettings(departmentId: number): Promise<AntiCheatSettings | undefined>;
  upsertAntiCheatSettings(settings: InsertAntiCheatSettings): Promise<AntiCheatSettings>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, updateData: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db.update(users).set(updateData).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  async deleteUser(id: number): Promise<boolean> {
    await db.delete(users).where(eq(users.id, id));
    return true;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  // Students
  async getStudent(id: number) {
    const [result] = await db
      .select()
      .from(students)
      .leftJoin(users, eq(students.userId, users.id))
      .leftJoin(departments, eq(students.departmentId, departments.id))
      .where(eq(students.id, id));
    
    if (!result) return undefined;
    return { ...result.students, user: result.users, department: result.departments };
  }

  async getStudentByUserId(userId: number): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.userId, userId));
    return student || undefined;
  }

  async getStudentByStudentId(studentId: string): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.studentId, studentId));
    return student || undefined;
  }

  async createStudent(insertStudent: InsertStudent): Promise<Student> {
    const [student] = await db.insert(students).values(insertStudent).returning();
    return student;
  }

  async getAllStudents() {
    const results = await db
      .select()
      .from(students)
      .leftJoin(users, eq(students.userId, users.id))
      .leftJoin(departments, eq(students.departmentId, departments.id));
    
    return results.map((r) => ({ 
      ...r.students,
      name: r.users?.name,
      email: r.users?.email,
      user: r.users, 
      department: r.departments 
    }));
  }

  async deleteStudent(id: number): Promise<boolean> {
    await db.delete(students).where(eq(students.id, id));
    return true;
  }

  // Lecturers
  async getLecturer(id: number) {
    const [result] = await db
      .select()
      .from(lecturers)
      .leftJoin(users, eq(lecturers.userId, users.id))
      .leftJoin(departments, eq(lecturers.departmentId, departments.id))
      .where(eq(lecturers.id, id));
    
    if (!result) return undefined;
    return { ...result.lecturers, user: result.users, department: result.departments };
  }

  async getLecturerByUserId(userId: number): Promise<Lecturer | undefined> {
    const [lecturer] = await db.select().from(lecturers).where(eq(lecturers.userId, userId));
    return lecturer || undefined;
  }

  async createLecturer(insertLecturer: InsertLecturer): Promise<Lecturer> {
    const [lecturer] = await db.insert(lecturers).values(insertLecturer).returning();
    return lecturer;
  }

  async getAllLecturers() {
    const results = await db
      .select()
      .from(lecturers)
      .leftJoin(users, eq(lecturers.userId, users.id))
      .leftJoin(departments, eq(lecturers.departmentId, departments.id));
    
    return results.map((r) => ({ ...r.lecturers, user: r.users, department: r.departments }));
  }

  // Departments
  async getDepartment(id: number): Promise<Department | undefined> {
    const [dept] = await db.select().from(departments).where(eq(departments.id, id));
    return dept || undefined;
  }

  async getDepartmentByCode(code: string): Promise<Department | undefined> {
    const [dept] = await db.select().from(departments).where(eq(departments.code, code));
    return dept || undefined;
  }

  async createDepartment(insertDepartment: InsertDepartment): Promise<Department> {
    const [dept] = await db.insert(departments).values(insertDepartment).returning();
    return dept;
  }

  async getAllDepartments(): Promise<Department[]> {
    return db.select().from(departments);
  }

  // Courses
  async getCourse(id: number) {
    const [result] = await db
      .select()
      .from(courses)
      .leftJoin(departments, eq(courses.departmentId, departments.id))
      .leftJoin(lecturers, eq(courses.lecturerId, lecturers.id))
      .where(eq(courses.id, id));
    
    if (!result) return undefined;
    return { ...result.courses, department: result.departments, lecturer: result.lecturers };
  }

  async createCourse(insertCourse: InsertCourse): Promise<Course> {
    const [course] = await db.insert(courses).values(insertCourse).returning();
    return course;
  }

  async getAllCourses() {
    const results = await db
      .select()
      .from(courses)
      .leftJoin(departments, eq(courses.departmentId, departments.id))
      .leftJoin(lecturers, eq(courses.lecturerId, lecturers.id));
    
    return results.map((r) => ({ ...r.courses, department: r.departments, lecturer: r.lecturers }));
  }

  async getCoursesByLecturer(lecturerId: number) {
    const results = await db
      .select()
      .from(courses)
      .leftJoin(departments, eq(courses.departmentId, departments.id))
      .where(eq(courses.lecturerId, lecturerId));
    
    return results.map((r) => ({ ...r.courses, department: r.departments }));
  }

  // Attendance Sessions
  async getAttendanceSession(id: number): Promise<AttendanceSession | undefined> {
    const [session] = await db.select().from(attendanceSessions).where(eq(attendanceSessions.id, id));
    return session || undefined;
  }

  async getAttendanceSessionByToken(token: string): Promise<AttendanceSession | undefined> {
    const [session] = await db.select().from(attendanceSessions).where(eq(attendanceSessions.token, token));
    return session || undefined;
  }

  async createAttendanceSession(insertSession: InsertAttendanceSession): Promise<AttendanceSession> {
    const [session] = await db.insert(attendanceSessions).values(insertSession).returning();
    return session;
  }

  async closeAttendanceSession(id: number): Promise<boolean> {
    await db.update(attendanceSessions).set({ isActive: false }).where(eq(attendanceSessions.id, id));
    return true;
  }

  async getActiveSessions(): Promise<AttendanceSession[]> {
    return db
      .select()
      .from(attendanceSessions)
      .where(and(eq(attendanceSessions.isActive, true), gte(attendanceSessions.expiresAt, new Date())));
  }

  // Attendance Marks
  async createAttendanceMark(insertMark: InsertAttendanceMark): Promise<AttendanceMark> {
    const [mark] = await db.insert(attendanceMarks).values(insertMark).returning();
    return mark;
  }

  async getAttendanceMarksBySession(sessionId: number) {
    const results = await db
      .select()
      .from(attendanceMarks)
      .leftJoin(students, eq(attendanceMarks.studentId, students.id))
      .leftJoin(users, eq(students.userId, users.id))
      .where(eq(attendanceMarks.sessionId, sessionId));
    
    return results.map((r) => ({
      ...r.attendance_marks,
      student: r.students ? { ...r.students, user: r.users } : null,
    }));
  }

  async getAttendanceMarksByStudent(studentId: number) {
    const results = await db
      .select()
      .from(attendanceMarks)
      .leftJoin(attendanceSessions, eq(attendanceMarks.sessionId, attendanceSessions.id))
      .leftJoin(courses, eq(attendanceSessions.courseId, courses.id))
      .where(eq(attendanceMarks.studentId, studentId))
      .orderBy(desc(attendanceMarks.markedAt));
    
    return results.map((r) => ({
      ...r.attendance_marks,
      session: r.attendance_sessions ? { ...r.attendance_sessions, course: r.courses } : null,
    }));
  }

  async checkAttendanceMarked(sessionId: number, studentId: number): Promise<boolean> {
    const [mark] = await db
      .select()
      .from(attendanceMarks)
      .where(and(eq(attendanceMarks.sessionId, sessionId), eq(attendanceMarks.studentId, studentId)));
    return !!mark;
  }

  // Labs
  async getLab(id: number): Promise<Lab | undefined> {
    const [lab] = await db.select().from(labs).where(eq(labs.id, id));
    return lab || undefined;
  }

  async createLab(insertLab: InsertLab): Promise<Lab> {
    const [lab] = await db.insert(labs).values(insertLab).returning();
    return lab;
  }

  async getAllLabs(): Promise<Lab[]> {
    return db.select().from(labs);
  }

  // PCs
  async getPC(id: number): Promise<PC | undefined> {
    const [pc] = await db.select().from(pcs).where(eq(pcs.id, id));
    return pc || undefined;
  }

  async createPC(insertPC: InsertPC): Promise<PC> {
    const [pc] = await db.insert(pcs).values(insertPC).returning();
    return pc;
  }

  async getAllPCs(): Promise<PC[]> {
    return db.select().from(pcs);
  }

  async updatePC(id: number, updateData: Partial<InsertPC>): Promise<PC | undefined> {
    const [pc] = await db.update(pcs).set(updateData).where(eq(pcs.id, id)).returning();
    return pc || undefined;
  }

  // Books
  async getBook(id: number): Promise<Book | undefined> {
    const [book] = await db.select().from(books).where(eq(books.id, id));
    return book || undefined;
  }

  async createBook(insertBook: InsertBook): Promise<Book> {
    const bookData = {
      ...insertBook,
      availableQuantity: insertBook.availableQuantity || insertBook.quantity,
    };
    const [book] = await db.insert(books).values(bookData).returning();
    return book;
  }

  async getAllBooks(): Promise<Book[]> {
    return db.select().from(books);
  }

  async updateBookQuantity(id: number, change: number): Promise<void> {
    const book = await this.getBook(id);
    if (book) {
      await db
        .update(books)
        .set({ availableQuantity: book.availableQuantity + change })
        .where(eq(books.id, id));
    }
  }

  // Book Loans
  async createBookLoan(insertLoan: InsertBookLoan): Promise<BookLoan> {
    const [loan] = await db.insert(bookLoans).values(insertLoan).returning();
    return loan;
  }

  async getBookLoan(id: number) {
    const [result] = await db
      .select()
      .from(bookLoans)
      .leftJoin(books, eq(bookLoans.bookId, books.id))
      .leftJoin(users, eq(bookLoans.userId, users.id))
      .where(eq(bookLoans.id, id));
    
    if (!result) return undefined;
    return { ...result.book_loans, book: result.books, user: result.users };
  }

  async getAllBookLoans() {
    const results = await db
      .select()
      .from(bookLoans)
      .leftJoin(books, eq(bookLoans.bookId, books.id))
      .leftJoin(users, eq(bookLoans.userId, users.id))
      .orderBy(desc(bookLoans.loanDate));
    
    return results.map((r) => ({ ...r.book_loans, book: r.books, user: r.users }));
  }

  async getActiveBookLoansByUser(userId: number) {
    const results = await db
      .select()
      .from(bookLoans)
      .leftJoin(books, eq(bookLoans.bookId, books.id))
      .where(and(eq(bookLoans.userId, userId), eq(bookLoans.status, 'active')));
    
    return results.map((r) => ({ ...r.book_loans, book: r.books }));
  }

  async returnBook(loanId: number): Promise<boolean> {
    await db
      .update(bookLoans)
      .set({ status: 'returned', returnDate: new Date() })
      .where(eq(bookLoans.id, loanId));
    return true;
  }

  // Exam Applications
  async createExamApplication(insertApplication: InsertExamApplication): Promise<ExamApplication> {
    const [application] = await db.insert(examApplications).values(insertApplication).returning();
    return application;
  }

  async getAllExamApplications() {
    const results = await db
      .select()
      .from(examApplications)
      .leftJoin(students, eq(examApplications.studentId, students.id))
      .leftJoin(users, eq(students.userId, users.id))
      .leftJoin(courses, eq(examApplications.courseId, courses.id))
      .orderBy(desc(examApplications.appliedAt));
    
    return results.map((r) => ({
      ...r.exam_applications,
      student: r.students ? { ...r.students, user: r.users } : null,
      course: r.courses,
    }));
  }

  async getExamApplicationsByStudent(studentId: number) {
    const results = await db
      .select()
      .from(examApplications)
      .leftJoin(courses, eq(examApplications.courseId, courses.id))
      .where(eq(examApplications.studentId, studentId))
      .orderBy(desc(examApplications.appliedAt));
    
    return results.map((r) => ({ ...r.exam_applications, course: r.courses }));
  }

  async updateExamApplicationStatus(id: number, status: string, reviewerId: number): Promise<boolean> {
    await db
      .update(examApplications)
      .set({ status, reviewedBy: reviewerId, reviewedAt: new Date() })
      .where(eq(examApplications.id, id));
    return true;
  }

  // Payments
  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const [payment] = await db.insert(payments).values(insertPayment).returning();
    return payment;
  }

  async getAllPayments() {
    const results = await db
      .select()
      .from(payments)
      .leftJoin(users, eq(payments.userId, users.id))
      .orderBy(desc(payments.paymentDate));
    
    return results.map((r) => ({ ...r.payments, user: r.users }));
  }

  async getPaymentsByUser(userId: number): Promise<Payment[]> {
    return db.select().from(payments).where(eq(payments.userId, userId)).orderBy(desc(payments.paymentDate));
  }

  async markPaymentSMSSent(id: number): Promise<boolean> {
    await db
      .update(payments)
      .set({ smsSent: true, smsTimestamp: new Date() })
      .where(eq(payments.id, id));
    return true;
  }

  // Audit Logs
  async createAuditLog(insertLog: InsertAuditLog): Promise<void> {
    await db.insert(auditLogs).values(insertLog);
  }

  async getAuditLogs(limit: number = 100) {
    const results = await db
      .select()
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);
    
    return results.map((r) => ({ ...r.audit_logs, user: r.users }));
  }

  // Anti-cheat Settings
  async getAntiCheatSettings(departmentId: number): Promise<AntiCheatSettings | undefined> {
    const [settings] = await db
      .select()
      .from(antiCheatSettings)
      .where(eq(antiCheatSettings.departmentId, departmentId));
    return settings || undefined;
  }

  async upsertAntiCheatSettings(insertSettings: InsertAntiCheatSettings): Promise<AntiCheatSettings> {
    const existing = await this.getAntiCheatSettings(insertSettings.departmentId);
    
    if (existing) {
      const [settings] = await db
        .update(antiCheatSettings)
        .set({ ...insertSettings, updatedAt: new Date() })
        .where(eq(antiCheatSettings.departmentId, insertSettings.departmentId))
        .returning();
      return settings;
    } else {
      const [settings] = await db.insert(antiCheatSettings).values(insertSettings).returning();
      return settings;
    }
  }
}

export const storage = new DatabaseStorage();
