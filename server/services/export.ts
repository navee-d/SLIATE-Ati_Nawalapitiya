/**
 * Export Service - Data export to CSV/XLSX formats
 */
import * as XLSX from 'xlsx';

export interface ExportOptions {
  format: 'csv' | 'xlsx';
}

class ExportService {
  /**
   * Export data to CSV or XLSX
   */
  exportToFile(data: any[], options: ExportOptions = { format: 'xlsx' }): Buffer {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

    const buffer = XLSX.write(workbook, {
      type: 'buffer',
      bookType: options.format === 'csv' ? 'csv' : 'xlsx',
    });

    return buffer as Buffer;
  }

  /**
   * Format students data for export
   */
  formatStudentsForExport(students: any[]): any[] {
    return students.map((student) => ({
      'Student ID': student.studentId,
      'Student Number': student.studentNumber,
      'Name': student.user?.name || student.name,
      'Email': student.user?.email || student.email,
      'Phone': student.user?.phone || '',
      'Department': student.department?.name || '',
      'Program Type': student.programType,
      'Intake Year': student.intakeYear,
      'Status': student.user?.isActive ? 'Active' : 'Inactive',
      'Created At': student.createdAt ? new Date(student.createdAt).toLocaleDateString() : '',
    }));
  }

  /**
   * Format attendance records for export
   */
  formatAttendanceForExport(sessions: any[], marks: any[]): any[] {
    const marksMap = new Map();
    marks.forEach((mark) => {
      const key = `${mark.sessionId}-${mark.studentId}`;
      marksMap.set(key, mark);
    });

    const records: any[] = [];
    
    sessions.forEach((session) => {
      marks
        .filter((mark) => mark.sessionId === session.id)
        .forEach((mark) => {
          records.push({
            'Session Date': session.sessionDate ? new Date(session.sessionDate).toLocaleDateString() : '',
            'Course Code': session.course?.code || '',
            'Course Name': session.course?.name || '',
            'Student ID': mark.student?.studentId || '',
            'Student Name': mark.student?.user?.name || '',
            'Marked At': mark.markedAt ? new Date(mark.markedAt).toLocaleString() : '',
            'Verified': mark.isVerified ? 'Yes' : 'No',
          });
        });
    });

    return records;
  }

  /**
   * Format library loans for export
   */
  formatLibraryLoansForExport(loans: any[]): any[] {
    return loans.map((loan) => ({
      'Loan ID': loan.id,
      'Book Title': loan.book?.title || '',
      'Book ISBN': loan.book?.isbn || '',
      'Borrower Name': loan.user?.name || '',
      'Borrower Email': loan.user?.email || '',
      'Loan Date': loan.loanDate ? new Date(loan.loanDate).toLocaleDateString() : '',
      'Due Date': loan.dueDate ? new Date(loan.dueDate).toLocaleDateString() : '',
      'Return Date': loan.returnDate ? new Date(loan.returnDate).toLocaleDateString() : 'Not Returned',
      'Status': loan.status,
      'Fine': this.calculateFine(loan) || 0,
    }));
  }

  /**
   * Format payments for export
   */
  formatPaymentsForExport(payments: any[]): any[] {
    return payments.map((payment) => ({
      'Payment ID': payment.id,
      'Student Name': payment.user?.name || '',
      'Student Email': payment.user?.email || '',
      'Amount': payment.amount,
      'Description': payment.description || '',
      'Payment Date': payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : '',
      'SMS Sent': payment.smsSent ? 'Yes' : 'No',
      'SMS Timestamp': payment.smsTimestamp ? new Date(payment.smsTimestamp).toLocaleString() : '',
    }));
  }

  /**
   * Calculate fine for overdue books
   * Fine rate: Rs. 5 per day (configurable via LIBRARY_FINE_PER_DAY env var)
   */
  private calculateFine(loan: any): number {
    if (loan.status === 'returned' || !loan.dueDate) return 0;

    const dueDate = new Date(loan.dueDate);
    const today = loan.returnDate ? new Date(loan.returnDate) : new Date();
    
    if (today <= dueDate) return 0;

    const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    const finePerDay = parseInt(process.env.LIBRARY_FINE_PER_DAY || '5'); // Default Rs. 5 per day
    
    return daysOverdue * finePerDay;
  }

  /**
   * Calculate fine for a loan (public method)
   */
  calculateLoanFine(loan: any): number {
    return this.calculateFine(loan);
  }
}

export const exportService = new ExportService();
