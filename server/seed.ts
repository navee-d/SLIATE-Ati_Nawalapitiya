import { db } from './db';
import { storage } from './storage';
import bcrypt from 'bcryptjs';
import { generateStudentID } from '../shared/student-id-generator';

async function seed() {
  console.log('🌱 Seeding database...');

  try {
    // Create departments
    console.log('Creating departments...');
    const departments = [
      { code: 'ICT', name: 'Information & Communication Technology' },
      { code: 'ENG', name: 'Engineering' },
      { code: 'BSM', name: 'Business & Management' },
      { code: 'AGR', name: 'Agriculture' },
      { code: 'ACT', name: 'Accountancy' },
    ];

    const createdDepts = [];
    for (const dept of departments) {
      const created = await storage.createDepartment(dept);
      createdDepts.push(created);
      console.log(`✓ Created department: ${dept.code}`);
    }

    // Create admin user
    console.log('Creating admin user...');
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await storage.createUser({
      email: 'admin@sliate.ac.lk',
      password: adminPassword,
      name: 'System Administrator',
      role: 'admin',
      phone: '+94712345678',
      departmentId: null,
      isActive: true,
    });
    console.log(`✓ Created admin: ${admin.email}`);

    // Create lecturers (1 HOD per department + 2 regular lecturers)
    console.log('Creating lecturers...');
    const lecturers = [];
    for (let i = 0; i < createdDepts.length; i++) {
      const dept = createdDepts[i];
      
      // HOD
      const hodPassword = await bcrypt.hash('lecturer123', 10);
      const hodUser = await storage.createUser({
        email: `hod.${dept.code.toLowerCase()}@sliate.ac.lk`,
        password: hodPassword,
        name: `${dept.code} HOD`,
        role: 'hod',
        phone: `+9471234${5000 + i}`,
        departmentId: dept.id,
        isActive: true,
      });
      
      const hod = await storage.createLecturer({
        userId: hodUser.id,
        employeeId: `HOD-${dept.code}-001`,
        designation: 'Head of Department',
        isHOD: true,
        departmentId: dept.id,
      });
      lecturers.push(hod);
      console.log(`✓ Created HOD: ${hodUser.name}`);
    }

    // Add 3 additional lecturers
    for (let i = 0; i < 3; i++) {
      const dept = createdDepts[i % createdDepts.length];
      const lecturerPassword = await bcrypt.hash('lecturer123', 10);
      const lecturerUser = await storage.createUser({
        email: `lecturer${i + 1}@sliate.ac.lk`,
        password: lecturerPassword,
        name: `Lecturer ${i + 1}`,
        role: 'lecturer',
        phone: `+9471234${6000 + i}`,
        departmentId: dept.id,
        isActive: true,
      });
      
      const lecturer = await storage.createLecturer({
        userId: lecturerUser.id,
        employeeId: `LEC-${dept.code}-${String(i + 1).padStart(3, '0')}`,
        designation: 'Senior Lecturer',
        isHOD: false,
        departmentId: dept.id,
      });
      lecturers.push(lecturer);
      console.log(`✓ Created lecturer: ${lecturerUser.name}`);
    }

    // Create students (10 total across 5 departments, mix of FT and PT)
    console.log('Creating students...');
    const students = [];
    const studentData = [
      { deptIndex: 0, programType: 'FT' as const, number: 208 },
      { deptIndex: 0, programType: 'PT' as const, number: 104 },
      { deptIndex: 1, programType: 'FT' as const, number: 315 },
      { deptIndex: 1, programType: 'PT' as const, number: 202 },
      { deptIndex: 2, programType: 'FT' as const, number: 425 },
      { deptIndex: 2, programType: 'PT' as const, number: 308 },
      { deptIndex: 3, programType: 'FT' as const, number: 512 },
      { deptIndex: 3, programType: 'PT' as const, number: 405 },
      { deptIndex: 4, programType: 'FT' as const, number: 618 },
      { deptIndex: 4, programType: 'PT' as const, number: 501 },
    ];

    for (let i = 0; i < studentData.length; i++) {
      const { deptIndex, programType, number } = studentData[i];
      const dept = createdDepts[deptIndex];
      const intakeYear = 2024;
      
      const studentPassword = await bcrypt.hash('student123', 10);
      const studentUser = await storage.createUser({
        email: `student${i + 1}@sliate.ac.lk`,
        password: studentPassword,
        name: `Student ${i + 1}`,
        role: 'student',
        phone: `+9477123${4000 + i}`,
        departmentId: dept.id,
        isActive: true,
      });
      
      const studentId = generateStudentID(dept.code, intakeYear, programType, number);
      
      const student = await storage.createStudent({
        userId: studentUser.id,
        studentId,
        studentNumber: String(number).padStart(4, '0'),
        programType,
        intakeYear,
        departmentId: dept.id,
      });
      students.push(student);
      console.log(`✓ Created student: ${studentId}`);
    }

    // Create staff
    console.log('Creating staff...');
    const staffPassword = await bcrypt.hash('staff123', 10);
    const staff = await storage.createUser({
      email: 'staff@sliate.ac.lk',
      password: staffPassword,
      name: 'Library Staff',
      role: 'staff',
      phone: '+94712347777',
      departmentId: null,
      isActive: true,
    });
    console.log(`✓ Created staff: ${staff.email}`);

    // Create courses
    console.log('Creating courses...');
    const courses = [];
    const courseData = [
      { code: 'ICT101', name: 'Introduction to Programming', deptIndex: 0 },
      { code: 'ICT201', name: 'Database Management', deptIndex: 0 },
      { code: 'ENG101', name: 'Engineering Mathematics', deptIndex: 1 },
      { code: 'BSM101', name: 'Business Fundamentals', deptIndex: 2 },
      { code: 'AGR101', name: 'Agricultural Science', deptIndex: 3 },
    ];

    for (const courseInfo of courseData) {
      const dept = createdDepts[courseInfo.deptIndex];
      const deptLecturers = lecturers.filter((l) => l.departmentId === dept.id);
      const lecturer = deptLecturers[0];

      const course = await storage.createCourse({
        code: courseInfo.code,
        name: courseInfo.name,
        departmentId: dept.id,
        lecturerId: lecturer.id,
        credits: 3,
      });
      courses.push(course);
      console.log(`✓ Created course: ${courseInfo.code}`);
    }

    // Create lab and PCs
    console.log('Creating lab and PCs...');
    const lab = await storage.createLab({
      name: 'Main Computer Lab',
      location: 'Building A, Floor 2',
      capacity: 30,
      departmentId: createdDepts[0].id, // ICT department
    });
    console.log(`✓ Created lab: ${lab.name}`);

    for (let i = 1; i <= 10; i++) {
      const pc = await storage.createPC({
        pcNumber: `PC-${String(i).padStart(3, '0')}`,
        labId: lab.id,
        status: i <= 8 ? 'available' : 'maintenance',
        specifications: `Intel i5, 8GB RAM, 256GB SSD`,
        assignedToUserId: null,
      });
      console.log(`✓ Created PC: ${pc.pcNumber}`);
    }

    // Create books
    console.log('Creating books...');
    const bookData = [
      { isbn: '978-0134685991', title: 'Effective Java', author: 'Joshua Bloch', publisher: 'Addison-Wesley', quantity: 5 },
      { isbn: '978-0135957059', title: 'Clean Code', author: 'Robert C. Martin', publisher: 'Prentice Hall', quantity: 3 },
      { isbn: '978-0596517748', title: 'JavaScript: The Good Parts', author: 'Douglas Crockford', publisher: "O'Reilly", quantity: 4 },
      { isbn: '978-0201633610', title: 'Design Patterns', author: 'Gang of Four', publisher: 'Addison-Wesley', quantity: 2 },
      { isbn: '978-0134494166', title: 'Clean Architecture', author: 'Robert C. Martin', publisher: 'Prentice Hall', quantity: 3 },
      { isbn: '978-1449355739', title: 'Learning Python', author: 'Mark Lutz', publisher: "O'Reilly", quantity: 5 },
      { isbn: '978-0136083238', title: 'Database Systems', author: 'Ramez Elmasri', publisher: 'Pearson', quantity: 4 },
      { isbn: '978-0262033848', title: 'Introduction to Algorithms', author: 'CLRS', publisher: 'MIT Press', quantity: 3 },
      { isbn: '978-0321573513', title: 'Algorithms', author: 'Robert Sedgewick', publisher: 'Addison-Wesley', quantity: 3 },
      { isbn: '978-1593279509', title: 'Eloquent JavaScript', author: 'Marijn Haverbeke', publisher: 'No Starch Press', quantity: 4 },
      { isbn: '978-0132350884', title: 'Clean Code Handbook', author: 'Robert C. Martin', publisher: 'Prentice Hall', quantity: 2 },
      { isbn: '978-0596805524', title: 'Head First Design Patterns', author: 'Eric Freeman', publisher: "O'Reilly", quantity: 3 },
      { isbn: '978-1449344856', title: 'You Don\'t Know JS', author: 'Kyle Simpson', publisher: "O'Reilly", quantity: 5 },
      { isbn: '978-0134494314', title: 'The Pragmatic Programmer', author: 'Hunt & Thomas', publisher: 'Addison-Wesley', quantity: 3 },
      { isbn: '978-0596007126', title: 'Head First Java', author: 'Kathy Sierra', publisher: "O'Reilly", quantity: 4 },
      { isbn: '978-1617294136', title: 'Microservices Patterns', author: 'Chris Richardson', publisher: 'Manning', quantity: 2 },
      { isbn: '978-1491950357', title: 'Building Microservices', author: 'Sam Newman', publisher: "O'Reilly", quantity: 3 },
      { isbn: '978-1449373321', title: 'Designing Data-Intensive Applications', author: 'Martin Kleppmann', publisher: "O'Reilly", quantity: 2 },
      { isbn: '978-0321127426', title: 'Patterns of Enterprise', author: 'Martin Fowler', publisher: 'Addison-Wesley', quantity: 2 },
      { isbn: '978-0321125217', title: 'Domain-Driven Design', author: 'Eric Evans', publisher: 'Addison-Wesley', quantity: 2 },
    ];

    for (const bookInfo of bookData) {
      const book = await storage.createBook({
        isbn: bookInfo.isbn,
        title: bookInfo.title,
        author: bookInfo.author,
        publisher: bookInfo.publisher,
        quantity: bookInfo.quantity,
        departmentId: createdDepts[0].id, // ICT department
      });
      console.log(`✓ Created book: ${book.title}`);
    }

    console.log('✅ Database seeded successfully!');
    console.log('\n📝 Login credentials:');
    console.log('Admin: admin@sliate.ac.lk / admin123');
    console.log('HOD (ICT): hod.ict@sliate.ac.lk / lecturer123');
    console.log('Lecturer: lecturer1@sliate.ac.lk / lecturer123');
    console.log('Student: student1@sliate.ac.lk / student123');
    console.log('Staff: staff@sliate.ac.lk / staff123');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

seed()
  .then(() => {
    console.log('Seed completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });
