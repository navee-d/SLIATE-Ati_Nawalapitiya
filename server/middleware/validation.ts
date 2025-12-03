/**
 * Validation Middleware - Request validation using Zod
 */
import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { fromZodError } from 'zod-validation-error';

/**
 * Middleware to validate request body against a Zod schema
 */
export function validateBody<T extends ZodSchema>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({
          message: 'Validation error',
          errors: validationError.details,
        });
      }
      return res.status(400).json({ message: 'Invalid request body' });
    }
  };
}

/**
 * Middleware to validate request query parameters against a Zod schema
 */
export function validateQuery<T extends ZodSchema>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.query);
      next();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({
          message: 'Validation error',
          errors: validationError.details,
        });
      }
      return res.status(400).json({ message: 'Invalid query parameters' });
    }
  };
}

/**
 * Middleware to validate request params against a Zod schema
 */
export function validateParams<T extends ZodSchema>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.params);
      next();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({
          message: 'Validation error',
          errors: validationError.details,
        });
      }
      return res.status(400).json({ message: 'Invalid route parameters' });
    }
  };
}

// Common validation schemas
export const schemas = {
  // ID parameter validation
  idParam: z.object({
    id: z.string().regex(/^\d+$/, 'ID must be a number').transform(Number),
  }),

  // Login validation
  login: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),

  // Change password validation
  changePassword: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  }),

  // Student creation validation
  createStudent: z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    phone: z.string().optional(),
    departmentId: z.number().int().positive(),
    programType: z.enum(['FT', 'PT']),
    intakeYear: z.number().int().min(2000).max(2100),
    studentNumber: z.string().min(1, 'Student number is required'),
  }),

  // Course creation validation
  createCourse: z.object({
    code: z.string().min(1, 'Course code is required'),
    name: z.string().min(1, 'Course name is required'),
    departmentId: z.number().int().positive(),
    lecturerId: z.number().int().positive().optional(),
    credits: z.number().int().positive().optional(),
  }),

  // Book creation validation
  createBook: z.object({
    title: z.string().min(1, 'Title is required'),
    author: z.string().min(1, 'Author is required'),
    isbn: z.string().optional(),
    publisher: z.string().optional(),
    publishedYear: z.number().int().optional(),
    category: z.string().optional(),
    quantity: z.number().int().positive('Quantity must be positive'),
    availableQuantity: z.number().int().min(0).optional(),
  }),

  // Export format validation
  exportFormat: z.object({
    format: z.enum(['csv', 'xlsx']).optional().default('xlsx'),
  }),
};
