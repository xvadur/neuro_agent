
export class AppError extends Error {
  public readonly statusCode: number
  public readonly isOperational: boolean
  public readonly timestamp: string

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message)
    this.name = this.constructor.name
    this.statusCode = statusCode
    this.isOperational = isOperational
    this.timestamp = new Date().toISOString()

    // Maintain proper stack trace
    Error.captureStackTrace(this, this.constructor)
  }
}

// Specific error types
export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, true)
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, true)
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, true)
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, true)
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter: number) {
    super(`Rate limit exceeded. Try again in ${retryAfter} seconds.`, 429, true)
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message: string = 'External service unavailable') {
    super(`${service}: ${message}`, 502, true)
  }
}

// Error handler for API routes
export const handleApiError = (error: unknown): {
  error: string
  code: number
  timestamp: string
  details?: any
} => {
  console.error('API Error:', error)

  if (error instanceof AppError) {
    return {
      error: error.message,
      code: error.statusCode,
      timestamp: error.timestamp
    }
  }

  if (error instanceof Error) {
    // Handle known error types
    if (error.name === 'ValidationError') {
      return {
        error: error.message,
        code: 400,
        timestamp: new Date().toISOString()
      }
    }

    if (error.name === 'PrismaClientKnownRequestError') {
      return {
        error: 'Database operation failed',
        code: 500,
        timestamp: new Date().toISOString()
      }
    }
  }

  // Default error response
  return {
    error: 'Internal server error',
    code: 500,
    timestamp: new Date().toISOString()
  }
}

// Create standardized API response
export const createApiResponse = (data: any, status: number = 200) => {
  return new Response(
    JSON.stringify({
      success: status < 400,
      data,
      timestamp: new Date().toISOString()
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  )
}

export const createErrorResponse = (error: unknown) => {
  const errorData = handleApiError(error)
  
  return new Response(
    JSON.stringify({
      success: false,
      ...errorData
    }),
    {
      status: errorData.code,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  )
}
