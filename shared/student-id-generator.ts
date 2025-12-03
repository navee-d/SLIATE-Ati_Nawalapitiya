/**
 * Student ID Generator for SLIATE Nawalapitiya
 * Format: DEPT-NAW-YEAR-F/P-NUMBER
 * Example: HNDIT-NAW-2024-F-0208
 */

export interface StudentIDComponents {
  deptCode: string;
  campus: string;
  year: number;
  programType: 'F' | 'P'; // F = Full-time, P = Part-time
  number: string;
}

export function generateStudentID(
  deptCode: string,
  intakeYear: number,
  programType: 'FT' | 'PT',
  studentNumber: number
): string {
  const programCode = programType === 'FT' ? 'F' : 'P';
  const paddedNumber = studentNumber.toString().padStart(4, '0');
  return `${deptCode}-NAW-${intakeYear}-${programCode}-${paddedNumber}`;
}

export function parseStudentID(studentId: string): StudentIDComponents | null {
  const parts = studentId.split('-');
  
  if (parts.length !== 5) {
    return null;
  }

  const [deptCode, campus, yearStr, programType, number] = parts;

  if (campus !== 'NAW') {
    return null;
  }

  const year = parseInt(yearStr, 10);
  if (isNaN(year)) {
    return null;
  }

  if (programType !== 'F' && programType !== 'P') {
    return null;
  }

  if (!/^\d{4}$/.test(number)) {
    return null;
  }

  return {
    deptCode,
    campus,
    year,
    programType: programType as 'F' | 'P',
    number,
  };
}

export function validateStudentID(studentId: string): boolean {
  return parseStudentID(studentId) !== null;
}

export function getDepartmentCodes(): string[] {
  return ['HNDIT', 'HNDMG', 'HNDTHM', 'HNDE', 'HNDBF'];
}

export function getDepartmentName(code: string): string {
  const names: Record<string, string> = {
    HNDIT: 'Higher National Diploma in Information Technology',
    HNDMG: 'Higher National Diploma in Management',
    HNDTHM: 'Higher National Diploma in Tourism & Hospitality Management',
    HNDE: 'Higher National Diploma in Engineering',
    HNDBF: 'Higher National Diploma in Business Finance',
  };
  return names[code] || code;
}
