
import winston from 'winston'

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
}

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white'
}

// Tell winston that you want to link the colors
winston.addColors(colors)

// Create the logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'aethero-command-interface'
  },
  transports: [
    // Write all logs with importance level of `error` or less to `error.log`
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // Write all logs with importance level of `info` or less to `combined.log`
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
})

// If we're not in production, add console transport
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize({ all: true }),
        winston.format.simple()
      )
    })
  )
}

// Create logs directory if it doesn't exist
import { mkdirSync } from 'fs'
try {
  mkdirSync('logs', { recursive: true })
} catch (error) {
  // Directory might already exist
}

export { logger }

// Helper functions for structured logging
export const logApiCall = (method: string, path: string, userId?: string, duration?: number) => {
  logger.info('API Call', {
    method,
    path,
    userId,
    duration,
    timestamp: new Date().toISOString()
  })
}

export const logError = (error: Error, context?: Record<string, any>) => {
  logger.error('Application Error', {
    message: error.message,
    stack: error.stack,
    name: error.name,
    context,
    timestamp: new Date().toISOString()
  })
}

export const logSecurityEvent = (event: string, details?: Record<string, any>) => {
  logger.warn('Security Event', {
    event,
    details,
    timestamp: new Date().toISOString()
  })
}
