import { z } from 'zod'

// Helper function for formatting Zod errors
export const formatZodError = (error: z.ZodError): string => {
  return error.issues.map(issue => issue.message).join(', ')
}

// Simple text validation for the chatbot
export const textAnalysisSchema = z.object({
  text: z.string()
    .min(1, 'Text cannot be empty')
    .max(10000, 'Text cannot exceed 10,000 characters')
    .trim(),
})

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
