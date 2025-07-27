
import { RateLimiterMemory } from 'rate-limiter-flexible'
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'

// Rate limiter configuration
const rateLimiter = new RateLimiterMemory({
  points: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '10'), // Number of requests
  duration: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000') / 1000, // Per 60 seconds
})

// Authenticated user rate limiter (more generous)
const authRateLimiter = new RateLimiterMemory({
  points: 30, // 30 requests per minute for authenticated users
  duration: 60,
})

// API-specific rate limiter (more restrictive for heavy operations)
const apiRateLimiter = new RateLimiterMemory({
  points: 5, // 5 analysis requests per minute
  duration: 60,
})

export const rateLimit = async (
  request: NextRequest,
  type: 'general' | 'auth' | 'api' = 'general'
) => {
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'anonymous'
  
  try {
    // Check if user is authenticated for better rate limits
    const session = await getServerSession(authOptions)
    
    if (session?.user && type !== 'api') {
      // Use user-based rate limiting for authenticated users
      await authRateLimiter.consume(session.user.id!)
      return { success: true, remaining: authRateLimiter.points }
    }
    
    // Choose appropriate rate limiter
    const limiter = type === 'api' ? apiRateLimiter : rateLimiter
    const key = type === 'api' ? `${ip}-api` : ip
    
    await limiter.consume(key)
    return { success: true, remaining: limiter.points }
    
  } catch (rateLimiterRes: any) {
    // Rate limit exceeded
    const secs = Math.round(rateLimiterRes.msBeforeNext / 1000) || 1
    
    return {
      success: false,
      error: 'Too many requests',
      retryAfter: secs,
      remaining: 0
    }
  }
}

export const createRateLimitResponse = (retryAfter: number) => {
  return new Response(
    JSON.stringify({
      error: 'Rate limit exceeded',
      message: `Too many requests. Please try again in ${retryAfter} seconds.`,
      retryAfter
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': retryAfter.toString(),
        'X-RateLimit-Limit': process.env.RATE_LIMIT_MAX_REQUESTS || '10',
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': new Date(Date.now() + retryAfter * 1000).toISOString()
      }
    }
  )
}
