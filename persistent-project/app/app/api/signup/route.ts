import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { userSignupSchema, sanitizeText, formatZodError } from '@/lib/validation'
import { createErrorResponse, createApiResponse, AppError, ValidationError } from '@/lib/errorHandler'
import { logApiCall, logError, logger, logSecurityEvent } from '@/lib/logger'

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const startTime = Date.now()
  let userEmail: string | undefined

  try {
    // Parse and validate request body
    const body = await req.json()
    const validationResult = userSignupSchema.safeParse(body)
    
    if (!validationResult.success) {
      const validationErrors = formatZodError(validationResult.error)
      
      // Log validation failure for security monitoring
      logSecurityEvent('Signup validation failed', {
        ip: req.ip || req.headers.get('x-forwarded-for'),
        userAgent: req.headers.get('user-agent'),
        errors: validationErrors,
        submittedFields: Object.keys(body)
      })
      
      throw new ValidationError(`Registration failed: ${validationErrors}`)
    }

    const { email, password, name } = validationResult.data
    userEmail = email

    // Sanitize inputs
    const sanitizedEmail = email.toLowerCase().trim()
    const sanitizedName = name ? sanitizeText(name).trim() : null

    logger.info('User signup attempt', {
      email: sanitizedEmail,
      hasName: !!sanitizedName,
      ip: req.ip || req.headers.get('x-forwarded-for'),
      userAgent: req.headers.get('user-agent')
    })

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: sanitizedEmail },
      select: { id: true, email: true, isActive: true }
    })

    if (existingUser) {
      // Log potential duplicate signup attempt
      logSecurityEvent('Duplicate signup attempt', {
        email: sanitizedEmail,
        existingUserId: existingUser.id,
        existingUserActive: existingUser.isActive,
        ip: req.ip || req.headers.get('x-forwarded-for')
      })
      
      throw new AppError('A user with this email address already exists', 409)
    }

    // Enhanced password hashing with higher salt rounds for better security
    const saltRounds = process.env.NODE_ENV === 'production' ? 14 : 12
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Create user with enhanced security fields
    const user = await prisma.user.create({
      data: {
        email: sanitizedEmail,
        password: hashedPassword,
        name: sanitizedName,
        role: 'user', // Default role
        isActive: true,
        lastLoginAt: null // Will be set on first login
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    })

    const processingTime = Date.now() - startTime

    // Log successful signup
    logApiCall('POST', '/api/signup', user.id, processingTime)
    
    logger.info('User signup successful', {
      userId: user.id,
      email: sanitizedEmail,
      hasName: !!sanitizedName,
      processingTime,
      ip: req.ip || req.headers.get('x-forwarded-for')
    })

    // Log security event for successful user creation
    logSecurityEvent('New user registered', {
      userId: user.id,
      email: sanitizedEmail,
      ip: req.ip || req.headers.get('x-forwarded-for'),
      userAgent: req.headers.get('user-agent')
    })

    return createApiResponse({
      message: 'Account created successfully! You can now sign in.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt
      },
      processingTime
    }, 201)

  } catch (error) {
    const processingTime = Date.now() - startTime
    
    // Enhanced error logging with context
    logApiCall('POST', '/api/signup', undefined, processingTime)
    logError(error as Error, { 
      email: userEmail,
      processingTime,
      ip: req.ip || req.headers.get('x-forwarded-for'),
      userAgent: req.headers.get('user-agent')
    })

    // Log security event for failed signup
    if (userEmail) {
      logSecurityEvent('Signup failed', {
        email: userEmail,
        error: (error as Error).message,
        ip: req.ip || req.headers.get('x-forwarded-for'),
        userAgent: req.headers.get('user-agent')
      })
    }

    return createErrorResponse(error)
  }
}
