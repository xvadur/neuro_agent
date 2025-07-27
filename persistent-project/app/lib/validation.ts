
import { z } from 'zod'

// Helper function for formatting Zod errors
export const formatZodError = (error: z.ZodError): string => {
  return error.issues.map(issue => issue.message).join(', ')
}

// Text Analysis Validation
export const textAnalysisSchema = z.object({
  text: z.string()
    .min(10, 'Text must be at least 10 characters long')
    .max(10000, 'Text cannot exceed 10,000 characters')
    .trim()
    .refine((text) => text.length > 0, 'Text cannot be empty after trimming')
})

// User Authentication Validation
export const userSignupSchema = z.object({
  email: z.string()
    .email('Please enter a valid email address')
    .min(1, 'Email is required')
    .max(255, 'Email is too long'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters long')
    .max(128, 'Password is too long')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one lowercase letter, one uppercase letter, and one number'
    ),
  name: z.string()
    .min(2, 'Name must be at least 2 characters long')
    .max(50, 'Name cannot exceed 50 characters')
    .optional()
})

export const userSigninSchema = z.object({
  email: z.string()
    .email('Please enter a valid email address')
    .min(1, 'Email is required'),
  password: z.string()
    .min(1, 'Password is required')
})

// Report Query Validation
export const reportQuerySchema = z.object({
  limit: z.number().min(1).max(100).optional().default(20),
  offset: z.number().min(0).optional().default(0),
  search: z.string().max(255).optional()
})

// Generic ID Validation
export const idSchema = z.string().cuid('Invalid ID format')

// Sanitization helper
export const sanitizeText = (text: string): string => {
  // Remove potential XSS characters while preserving legitimate content
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .trim()
}

export type TextAnalysisInput = z.infer<typeof textAnalysisSchema>
export type UserSignupInput = z.infer<typeof userSignupSchema>
export type UserSigninInput = z.infer<typeof userSigninSchema>
export type ReportQueryInput = z.infer<typeof reportQuerySchema>
