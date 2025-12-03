import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, decimal, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const roleEnum = pgEnum("role", ["admin", "lecturer", "hod", "staff", "student"]);
export const programTypeEnum = pgEnum("program_type", ["FT", "PT"]); // Full-time / Part-time
export const examTypeEnum = pgEnum("exam_type", ["regular", "repeat", "medical", "assignment_only"]);
export const loanStatusEnum = pgEnum("loan_status", ["active", "returned", "overdue"]);
export const pcStatusEnum = pgEnum("pc_status", ["available", "assigned", "maintenance", "unavailable"]);

// Departments
export const departments = pgTable("departments", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  code: varchar("code", { length: 10 }).notNull().unique(), // e.g., "ICT", "ENG", "BSM", "AGR", "ACT"
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Users (authentication and base user info)
export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password").notNull(),
  role: roleEnum("role").notNull(),
  name: text("name").notNull(),
  phone: varchar("phone", { length: 20 }),
  departmentId: integer("department_id").references(() => departments.id),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Students (extends users with student-specific info)
export const students = pgTable("students", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").references(() => users.id).notNull().unique(),
  studentId: varchar("student_id", { length: 50 }).notNull().unique(), // DEPT-NAW-YEAR-F/P-NUMBER
  studentNumber: varchar("student_number", { length: 10 }).notNull(),
  programType: programTypeEnum("program_type").notNull(),
  intakeYear: integer("intake_year").notNull(),
  departmentId: integer("department_id").references(() => departments.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Lecturers (extends users with lecturer-specific info)
export const lecturers = pgTable("lecturers", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").references(() => users.id).notNull().unique(),
  employeeId: varchar("employee_id", { length: 50 }).notNull().unique(),
  designation: text("designation"),
  isHOD: boolean("is_hod").default(false).notNull(),
  departmentId: integer("department_id").references(() => departments.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Courses
export const courses = pgTable("courses", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  name: text("name").notNull(),
  departmentId: integer("department_id").references(() => departments.id).notNull(),
  lecturerId: integer("lecturer_id").references(() => lecturers.id),
  credits: integer("credits"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Attendance Sessions (QR-based attendance)
export const attendanceSessions = pgTable("attendance_sessions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  lecturerId: integer("lecturer_id").references(() => lecturers.id).notNull(),
  sessionDate: timestamp("session_date").notNull(),
  token: text("token").notNull().unique(), // Time-limited token for QR
  expiresAt: timestamp("expires_at").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  requirePhoto: boolean("require_photo").default(true).notNull(),
  requireDeviceFingerprint: boolean("require_device_fingerprint").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Attendance Marks
export const attendanceMarks = pgTable("attendance_marks", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  sessionId: integer("session_id").references(() => attendanceSessions.id).notNull(),
  studentId: integer("student_id").references(() => students.id).notNull(),
  markedAt: timestamp("marked_at").defaultNow().notNull(),
  selfieUrl: text("selfie_url"),
  isVerified: boolean("is_verified").default(false).notNull(),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  deviceFingerprint: text("device_fingerprint"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Labs
export const labs = pgTable("labs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  location: text("location"),
  capacity: integer("capacity"),
  departmentId: integer("department_id").references(() => departments.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// PCs
export const pcs = pgTable("pcs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  pcNumber: varchar("pc_number", { length: 50 }).notNull().unique(),
  labId: integer("lab_id").references(() => labs.id).notNull(),
  status: pcStatusEnum("status").default("available").notNull(),
  assignedToUserId: integer("assigned_to_user_id").references(() => users.id),
  specifications: text("specifications"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Books
export const books = pgTable("books", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  isbn: varchar("isbn", { length: 20 }).unique(),
  title: text("title").notNull(),
  author: text("author"),
  publisher: text("publisher"),
  quantity: integer("quantity").default(1).notNull(),
  availableQuantity: integer("available_quantity").default(1).notNull(),
  departmentId: integer("department_id").references(() => departments.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Book Loans
export const bookLoans = pgTable("book_loans", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  bookId: integer("book_id").references(() => books.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  loanDate: timestamp("loan_date").defaultNow().notNull(),
  dueDate: timestamp("due_date").notNull(),
  returnDate: timestamp("return_date"),
  status: loanStatusEnum("status").default("active").notNull(),
  fineAmount: decimal("fine_amount", { precision: 10, scale: 2 }).default("0.00"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Exam Applications
export const examApplications = pgTable("exam_applications", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  studentId: integer("student_id").references(() => students.id).notNull(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  examType: examTypeEnum("exam_type").notNull(),
  reason: text("reason"),
  status: varchar("status", { length: 20 }).default("pending").notNull(), // pending, approved, rejected
  appliedAt: timestamp("applied_at").defaultNow().notNull(),
  reviewedBy: integer("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Payments (staff payroll)
export const payments = pgTable("payments", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").references(() => users.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentDate: timestamp("payment_date").notNull(),
  description: text("description"),
  smsSent: boolean("sms_sent").default(false).notNull(),
  smsTimestamp: timestamp("sms_timestamp"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Audit Logs
export const auditLogs = pgTable("audit_logs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").references(() => users.id),
  action: text("action").notNull(),
  entityType: text("entity_type"),
  entityId: integer("entity_id"),
  details: text("details"),
  ipAddress: varchar("ip_address", { length: 45 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Anti-cheat Settings (per department)
export const antiCheatSettings = pgTable("anti_cheat_settings", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  departmentId: integer("department_id").references(() => departments.id).notNull().unique(),
  requirePhoto: boolean("require_photo").default(true).notNull(),
  requireDeviceFingerprint: boolean("require_device_fingerprint").default(false).notNull(),
  requireOTP: boolean("require_otp").default(false).notNull(),
  sessionTimeout: integer("session_timeout").default(300).notNull(), // seconds
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const departmentsRelations = relations(departments, ({ many }) => ({
  users: many(users),
  students: many(students),
  lecturers: many(lecturers),
  courses: many(courses),
  labs: many(labs),
  books: many(books),
  antiCheatSettings: many(antiCheatSettings),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  department: one(departments, {
    fields: [users.departmentId],
    references: [departments.id],
  }),
  student: one(students, {
    fields: [users.id],
    references: [students.userId],
  }),
  lecturer: one(lecturers, {
    fields: [users.id],
    references: [lecturers.userId],
  }),
  bookLoans: many(bookLoans),
  payments: many(payments),
  auditLogs: many(auditLogs),
  assignedPCs: many(pcs),
}));

export const studentsRelations = relations(students, ({ one, many }) => ({
  user: one(users, {
    fields: [students.userId],
    references: [users.id],
  }),
  department: one(departments, {
    fields: [students.departmentId],
    references: [departments.id],
  }),
  attendanceMarks: many(attendanceMarks),
  examApplications: many(examApplications),
}));

export const lecturersRelations = relations(lecturers, ({ one, many }) => ({
  user: one(users, {
    fields: [lecturers.userId],
    references: [users.id],
  }),
  department: one(departments, {
    fields: [lecturers.departmentId],
    references: [departments.id],
  }),
  courses: many(courses),
  attendanceSessions: many(attendanceSessions),
}));

export const coursesRelations = relations(courses, ({ one, many }) => ({
  department: one(departments, {
    fields: [courses.departmentId],
    references: [departments.id],
  }),
  lecturer: one(lecturers, {
    fields: [courses.lecturerId],
    references: [lecturers.id],
  }),
  attendanceSessions: many(attendanceSessions),
  examApplications: many(examApplications),
}));

export const attendanceSessionsRelations = relations(attendanceSessions, ({ one, many }) => ({
  course: one(courses, {
    fields: [attendanceSessions.courseId],
    references: [courses.id],
  }),
  lecturer: one(lecturers, {
    fields: [attendanceSessions.lecturerId],
    references: [lecturers.id],
  }),
  attendanceMarks: many(attendanceMarks),
}));

export const attendanceMarksRelations = relations(attendanceMarks, ({ one }) => ({
  session: one(attendanceSessions, {
    fields: [attendanceMarks.sessionId],
    references: [attendanceSessions.id],
  }),
  student: one(students, {
    fields: [attendanceMarks.studentId],
    references: [students.id],
  }),
}));

export const labsRelations = relations(labs, ({ one, many }) => ({
  department: one(departments, {
    fields: [labs.departmentId],
    references: [departments.id],
  }),
  pcs: many(pcs),
}));

export const pcsRelations = relations(pcs, ({ one }) => ({
  lab: one(labs, {
    fields: [pcs.labId],
    references: [labs.id],
  }),
  assignedToUser: one(users, {
    fields: [pcs.assignedToUserId],
    references: [users.id],
  }),
}));

export const booksRelations = relations(books, ({ one, many }) => ({
  department: one(departments, {
    fields: [books.departmentId],
    references: [departments.id],
  }),
  loans: many(bookLoans),
}));

export const bookLoansRelations = relations(bookLoans, ({ one }) => ({
  book: one(books, {
    fields: [bookLoans.bookId],
    references: [books.id],
  }),
  user: one(users, {
    fields: [bookLoans.userId],
    references: [users.id],
  }),
}));

export const examApplicationsRelations = relations(examApplications, ({ one }) => ({
  student: one(students, {
    fields: [examApplications.studentId],
    references: [students.id],
  }),
  course: one(courses, {
    fields: [examApplications.courseId],
    references: [courses.id],
  }),
  reviewer: one(users, {
    fields: [examApplications.reviewedBy],
    references: [users.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  user: one(users, {
    fields: [payments.userId],
    references: [users.id],
  }),
}));

export const antiCheatSettingsRelations = relations(antiCheatSettings, ({ one }) => ({
  department: one(departments, {
    fields: [antiCheatSettings.departmentId],
    references: [departments.id],
  }),
}));

// Insert schemas and types using Drizzle's $inferInsert
export type Department = typeof departments.$inferSelect;
export type InsertDepartment = typeof departments.$inferInsert;

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type Student = typeof students.$inferSelect;
export type InsertStudent = typeof students.$inferInsert;

export type Lecturer = typeof lecturers.$inferSelect;
export type InsertLecturer = typeof lecturers.$inferInsert;

export type Course = typeof courses.$inferSelect;
export type InsertCourse = typeof courses.$inferInsert;

export type AttendanceSession = typeof attendanceSessions.$inferSelect;
export type InsertAttendanceSession = typeof attendanceSessions.$inferInsert;

export type AttendanceMark = typeof attendanceMarks.$inferSelect;
export type InsertAttendanceMark = typeof attendanceMarks.$inferInsert;

export type Lab = typeof labs.$inferSelect;
export type InsertLab = typeof labs.$inferInsert;

export type PC = typeof pcs.$inferSelect;
export type InsertPC = typeof pcs.$inferInsert;

export type Book = typeof books.$inferSelect;
export type InsertBook = typeof books.$inferInsert;

export type BookLoan = typeof bookLoans.$inferSelect;
export type InsertBookLoan = typeof bookLoans.$inferInsert;

export type ExamApplication = typeof examApplications.$inferSelect;
export type InsertExamApplication = typeof examApplications.$inferInsert;

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

export type AntiCheatSettings = typeof antiCheatSettings.$inferSelect;
export type InsertAntiCheatSettings = typeof antiCheatSettings.$inferInsert;

// Additional types for API responses with joined data
export type StudentWithUser = Student & { user: User; department: Department };
export type LecturerWithUser = Lecturer & { user: User; department: Department };
export type AttendanceMarkWithDetails = AttendanceMark & { 
  student: Student & { user: User }; 
  session: AttendanceSession & { course: Course };
};
export type BookLoanWithDetails = BookLoan & { book: Book; user: User };
export type ExamApplicationWithDetails = ExamApplication & { 
  student: Student & { user: User };
  course: Course;
};
