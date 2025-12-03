# SLIATE Nawalapitiya Campus Management System

A comprehensive full-stack web application for managing all academic operations at the Advanced Technological Institute - Nawalapitiya. Features include role-based access control, QR-based attendance, library management, lab/PC management, exam applications, and payment processing.

## Features

- **Role-Based Access Control**: Separate dashboards and functionality for Admin, Lecturer, Staff, and Student roles
- **Student Management**: Add, edit, search, and bulk import students with auto-generated student IDs
- **Lecturer Management**: Manage HODs, permanent lecturers, visiting lecturers, and staff
- **Course Management**: Create and manage courses with lecturer assignments
- **Timetable Management**: Visual timetable grid for lecturers and courses
- **Attendance System**: QR code-based attendance with anti-cheat features
- **Library Management**: Book inventory, loans, and fine tracking
- **Lab & PC Management**: Track lab equipment and PC assignments
- **Exam Applications**: Student exam registration system
- **Payment Tracking**: Fee management and SMS notifications
- **Data Import/Export**: Bulk import via Excel/CSV and export capabilities

## Technology Stack

- **Frontend**: React 18, TypeScript, TailwindCSS, Wouter (routing), TanStack Query
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT tokens with bcrypt password hashing
- **UI Components**: Radix UI, shadcn/ui
- **File Upload**: Multer
- **Excel Processing**: XLSX

## Prerequisites

- **Node.js**: Version 18 or higher
- **npm**: Version 9 or higher (comes with Node.js)
- **PostgreSQL**: A PostgreSQL database instance (we recommend [Neon](https://neon.tech) for easy cloud hosting)
- **Modern Web Browser**: Chrome, Firefox, Safari, or Edge

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/navee-d/SLIATE-Ati_Nawalapitiya.git
cd SLIATE-Ati_Nawalapitiya
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env` file in the root directory by copying the example:

```bash
cp .env.example .env
```

Edit the `.env` file and configure the following required variables:

```env
# Database connection string (PostgreSQL)
# Example for Neon: postgresql://username:password@hostname.neon.tech/database?sslmode=require
DATABASE_URL=postgresql://username:password@hostname/database?sslmode=require

# Session secret for express-session (generate a strong random string)
SESSION_SECRET=your-very-long-random-secret-key-here

# JWT secret for authentication tokens (generate a strong random string)
JWT_SECRET=your-jwt-secret-key-here

# Optional: Twilio credentials for SMS notifications (can be left commented out)
# TWILIO_ACCOUNT_SID=your-twilio-account-sid
# TWILIO_AUTH_TOKEN=your-twilio-auth-token
# TWILIO_PHONE_NUMBER=your-twilio-phone-number
```

**Important**: Replace the placeholder values with actual secrets. For `SESSION_SECRET` and `JWT_SECRET`, you can generate strong random strings using:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Initialize the Database

Push the database schema to your PostgreSQL database:

```bash
npm run db:push
```

This will create all necessary tables in your database.

### 5. Seed the Database (Optional)

To populate the database with sample data including departments, users, courses, books, and lab equipment:

```bash
npx tsx server/seed.ts
```

This creates:
- Sample departments (HNDIT, HNDMG, HNDTHM, HNDE, HNDBF)
- An admin user
- Sample courses, books, and lab equipment

## Running the Application

### Development Mode

Start the development server with hot-reload:

```bash
npm run dev
```

The application will be available at `http://localhost:5000`

### Production Build

Build the application for production:

```bash
npm run build
```

This creates optimized production files in the `dist` directory.

### Production Mode

After building, start the production server:

```bash
npm start
```

## Default Login Credentials

After seeding the database, you can log in with:

- **Email**: admin@sliate.ac.lk
- **Password**: admin123

**Important**: Change this password immediately after first login in a production environment.

## User Roles

### Admin
- Full access to all features
- Manage students, lecturers, staff, courses, departments
- View all reports and analytics
- Manage system settings

### Lecturer (including HOD)
- View assigned courses and timetables
- Mark attendance for classes
- View enrolled students
- Access lecturer-specific reports

### Staff
- Manage library operations
- Manage lab/PC assignments
- Process payments
- Handle attendance sessions

### Student
- View own timetable and courses
- Scan QR codes for attendance
- Apply for exams
- Borrow library books
- View own payment status

## Student ID Format

All students are assigned unique IDs in this format:

```
DEPT-NAW-YEAR-F/P-NUMBER
```

Example: `HNDIT-NAW-2024-F-0001`

- **DEPT**: Department code (HNDIT, HNDMG, HNDTHM, HNDE, HNDBF)
- **NAW**: Nawalapitiya (fixed)
- **YEAR**: Year of enrollment (e.g., 2024)
- **F/P**: Full-Time (F) or Part-Time (P)
- **NUMBER**: Sequential number within cohort

## Departments

1. **HNDIT** - Higher National Diploma in Information Technology
2. **HNDMG** - Higher National Diploma in Management
3. **HNDTHM** - Higher National Diploma in Tourism & Hospitality Management
4. **HNDE** - Higher National Diploma in Engineering
5. **HNDBF** - Higher National Diploma in Business Finance

## Development

### Type Checking

Run TypeScript type checking:

```bash
npm run check
```

### Database Migrations

When you make changes to the schema in `shared/schema.ts`, push them to the database:

```bash
npm run db:push
```

### Project Structure

```
SLIATE-Ati_Nawalapitiya/
├── client/              # Frontend React application
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Page components (admin, lecturer, student, staff)
│   │   ├── lib/         # Utility functions and hooks
│   │   └── App.tsx      # Main app component with routing
│   └── index.html
├── server/              # Backend Express application
│   ├── index-dev.ts     # Development server entry
│   ├── index-prod.ts    # Production server entry
│   ├── routes.ts        # API routes
│   ├── storage.ts       # Database operations
│   ├── db.ts            # Database connection
│   ├── seed.ts          # Database seeding script
│   ├── middleware/      # Express middleware
│   └── services/        # Business logic services
├── shared/              # Shared code between client and server
│   ├── schema.ts        # Database schema and types
│   └── student-id-generator.ts
├── .env.example         # Environment variables template
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
├── vite.config.ts       # Vite build configuration
└── tailwind.config.ts   # TailwindCSS configuration
```

## Common Tasks

### Adding a New Student

1. Navigate to Students page from the sidebar
2. Click "Add Student" button
3. Fill in personal and academic details
4. System auto-generates the Student ID
5. Click Submit

### Bulk Importing Students

1. Prepare an Excel file with columns: Name, Email, Student ID, Department, Program Type, Intake Year
2. Go to Students → Import Students
3. Upload file and confirm import
4. System validates and creates all records

### Creating a Timetable

1. Go to Timetable page
2. Click "Add Schedule"
3. Select course, lecturer, day, time, and room
4. Click Save
5. View the populated timetable grid

## Troubleshooting

### Can't Login
- Ensure you're using the correct credentials (admin@sliate.ac.lk / admin123)
- Check that the database has been seeded

### Database Connection Error
- Verify `DATABASE_URL` in `.env` is correct
- Ensure PostgreSQL server is running
- Check network connectivity to database

### Build Errors
- Run `npm install` to ensure all dependencies are installed
- Run `npm run check` to see TypeScript errors
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`

### Port Already in Use
- The default port is 5000. If it's in use, you can change it by setting `PORT=3000 npm run dev`

## Security Notes

- Always use strong, randomly generated secrets for `SESSION_SECRET` and `JWT_SECRET`
- Change default admin password immediately after first login
- Never commit `.env` file to version control
- Use HTTPS in production
- Regularly update dependencies for security patches

## License

MIT

## Support

For issues or questions:
- Create an issue on GitHub
- Contact: admin@sliate.ac.lk

## Version

- **Version**: 1.0.0
- **Last Updated**: December 2024
- **Institution**: Advanced Technological Institute - Nawalapitiya
