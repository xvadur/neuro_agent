import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { reportQuerySchema, formatZodError } from '@/lib/validation'
import { createErrorResponse, createApiResponse, AppError } from '@/lib/errorHandler'
import { logApiCall, logError, logger } from '@/lib/logger'

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const startTime = Date.now()
  let userId: string | undefined

  try {
    // Authentication check
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      throw new AppError('Authentication required', 401)
    }

    userId = session.user.id

    // Parse and validate query parameters
    const { searchParams } = new URL(req.url)
    const queryParams = {
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
      search: searchParams.get('search') || undefined
    }

    const validationResult = reportQuerySchema.safeParse(queryParams)
    
    if (!validationResult.success) {
      throw new AppError(
        `Invalid query parameters: ${formatZodError(validationResult.error)}`,
        400
      )
    }

    const { limit, offset, search } = validationResult.data

    logger.info('Reports request', {
      userId,
      limit,
      offset,
      search,
      ip: req.ip || req.headers.get('x-forwarded-for')
    })

    // Build where clause with soft delete filtering
    const whereClause: any = {
      userId,
      isDeleted: false // Only show non-deleted reports
    }

    // Add search functionality if search term is provided
    if (search && search.trim().length > 0) {
      whereClause.OR = [
        {
          originalText: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          // Search in analysis results (JSON field)
          analysisResult: {
            path: ['summary'],
            string_contains: search
          }
        }
      ]
    }

    // Execute queries in parallel for better performance
    const [reports, totalCount] = await Promise.all([
      prisma.report.findMany({
        where: whereClause,
        orderBy: {
          timestamp: 'desc'
        },
        skip: offset,
        take: limit,
        select: {
          id: true,
          originalText: true,
          analysisResult: true,
          textLength: true,
          processingTime: true,
          timestamp: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      prisma.report.count({
        where: whereClause
      })
    ])

    // Calculate pagination metadata
    const hasNextPage = (offset + limit) < totalCount
    const hasPreviousPage = offset > 0
    const totalPages = Math.ceil(totalCount / limit)
    const currentPage = Math.floor(offset / limit) + 1

    const processingTime = Date.now() - startTime

    // Log successful API call
    logApiCall('GET', '/api/reports', userId, processingTime)

    logger.info('Reports retrieved', {
      userId,
      count: reports.length,
      totalCount,
      processingTime,
      search: search || 'none'
    })

    return createApiResponse({
      reports,
      pagination: {
        currentPage,
        totalPages,
        totalCount,
        limit,
        offset,
        hasNextPage,
        hasPreviousPage
      },
      search: search || null,
      processingTime
    })

  } catch (error) {
    const processingTime = Date.now() - startTime
    
    // Log API call with error
    logApiCall('GET', '/api/reports', userId, processingTime)
    logError(error as Error, { userId, processingTime })

    return createErrorResponse(error)
  }
}

// Soft delete a report
export async function DELETE(req: NextRequest) {
  const startTime = Date.now()
  let userId: string | undefined

  try {
    // Authentication check
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      throw new AppError('Authentication required', 401)
    }

    userId = session.user.id

    const { searchParams } = new URL(req.url)
    const reportId = searchParams.get('id')

    if (!reportId) {
      throw new AppError('Report ID is required', 400)
    }

    logger.info('Report deletion request', {
      userId,
      reportId,
      ip: req.ip || req.headers.get('x-forwarded-for')
    })

    // Check if report exists and belongs to user
    const existingReport = await prisma.report.findFirst({
      where: {
        id: reportId,
        userId,
        isDeleted: false
      }
    })

    if (!existingReport) {
      throw new AppError('Report not found or already deleted', 404)
    }

    // Soft delete the report
    const deletedReport = await prisma.report.update({
      where: {
        id: reportId
      },
      data: {
        isDeleted: true,
        deletedAt: new Date()
      }
    })

    const processingTime = Date.now() - startTime

    // Log successful API call
    logApiCall('DELETE', '/api/reports', userId, processingTime)

    logger.info('Report soft deleted', {
      userId,
      reportId,
      processingTime
    })

    return createApiResponse({
      message: 'Report deleted successfully',
      reportId: deletedReport.id,
      processingTime
    })

  } catch (error) {
    const processingTime = Date.now() - startTime
    
    // Log API call with error
    logApiCall('DELETE', '/api/reports', userId, processingTime)
    logError(error as Error, { userId, processingTime })

    return createErrorResponse(error)
  }
}
