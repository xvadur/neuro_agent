import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { textAnalysisSchema, sanitizeText, formatZodError } from '@/lib/validation'
import { createErrorResponse, AppError, ExternalServiceError } from '@/lib/errorHandler'
import { logApiCall, logError, logger } from '@/lib/logger'

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const startTime = Date.now()
  let userId: string | undefined
  let sanitizedText: string = ''

  try {
    // Authentication check
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      throw new AppError('Authentication required', 401)
    }

    userId = session.user.id

    // Parse and validate request body
    const body = await req.json()
    const validationResult = textAnalysisSchema.safeParse(body)
    
    if (!validationResult.success) {
      throw new AppError(
        `Validation failed: ${formatZodError(validationResult.error)}`,
        400
      )
    }

    const { text } = validationResult.data
    sanitizedText = sanitizeText(text)
    const textLength = sanitizedText.length

    logger.info('Text analysis streaming request', {
      userId,
      textLength,
      ip: req.ip || req.headers.get('x-forwarded-for')
    })

    // Call Abacus AI API with streaming
    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: [
          {
            role: 'system',
            content: `Ste AI Dvojník - osobný analytický agent pre hlbokú analýzu vedomia. Analyzujte poskytnutý text z týchto perspektív:

1. PSYCHOLOGICKÁ ANALÝZA:
- Emocionálny stav autora
- Kognitívne vzorce a myšlienkové procesy  
- Motivačné faktory a pohonné sily
- Indikátory stresu alebo úzkosti

2. LOGICKÁ ANALÝZA:
- Štruktúra argumentácie
- Validita logického uvažovania
- Identifikácia logických chýb
- Sila záverov

3. SYNTAKTICKÁ ANALÝZA:
- Komplexnosť jazyka
- Štýl písania
- Štruktúra viet
- Úroveň slovnej zásoby

Vráťte výsledok vo formáte JSON so štruktúrou:
{
  "psychological_analysis": {
    "emotional_state": "popis",
    "cognitive_patterns": ["vzorec1", "vzorec2"],
    "motivation_drivers": ["faktor1", "faktor2"],
    "stress_indicators": ["indikátor1", "indikátor2"]
  },
  "logical_analysis": {
    "reasoning_structure": "popis",
    "argument_validity": "hodnotenie",
    "logical_fallacies": ["chyba1", "chyba2"],
    "conclusion_strength": "hodnotenie"
  },
  "syntactic_analysis": {
    "language_complexity": "úroveň",
    "writing_style": "popis",
    "sentence_structure": ["typ1", "typ2"],
    "vocabulary_level": "úroveň"
  },
  "summary": "celkové zhrnutie",
  "insights": ["pozorenie1", "pozorenie2"],
  "recommendations": ["odporúčanie1", "odporúčanie2"]
}

Odpovedajte iba čistým JSON bez ďalšieho formátovania.`
          },
          {
            role: 'user',
            content: sanitizedText
          }
        ],
        response_format: { type: "json_object" },
        stream: true,
        max_tokens: 3000,
        temperature: 0.7
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      logger.error('AI streaming service error', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        userId
      })
      throw new ExternalServiceError('AI Analysis Service', 'Streaming analysis service temporarily unavailable')
    }

    const encoder = new TextEncoder()
    let buffer = ''
    let streamError: Error | null = null

    const readable = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader()
        if (!reader) {
          const error = new Error('No reader available from AI service')
          logger.error('Stream reader error', { userId, error: error.message })
          throw error
        }

        try {
          // Set up timeout for streaming operations
          const timeoutId = setTimeout(() => {
            streamError = new Error('Streaming timeout - operation took too long')
            controller.error(streamError)
          }, 120000) // 2 minute timeout

          while (true) {
            const { done, value } = await reader.read()
            if (done) {
              clearTimeout(timeoutId)
              break
            }

            const chunk = new TextDecoder().decode(value)
            const lines = chunk.split('\n')

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6).trim()
                if (data === '[DONE]') {
                  clearTimeout(timeoutId)
                  
                  // Save complete result to database with enhanced data
                  try {
                    const analysisResult = JSON.parse(buffer)
                    const processingTime = Date.now() - startTime
                    
                    if (!userId) {
                      throw new Error('User ID is required')
                    }

                    await prisma.report.create({
                      data: {
                        userId,
                        originalText: sanitizedText,
                        analysisResult,
                        textLength,
                        processingTime,
                      }
                    })

                    // Log successful streaming operation
                    logApiCall('POST', '/api/analyze-stream', userId, processingTime)
                    logger.info('Streaming analysis completed', {
                      userId,
                      textLength,
                      processingTime,
                      bufferLength: buffer.length
                    })
                  } catch (dbError) {
                    logger.error('Database save error during streaming', {
                      userId,
                      error: dbError,
                      bufferLength: buffer.length
                    })
                  }
                  
                  controller.enqueue(encoder.encode('data: [DONE]\n\n'))
                  controller.close()
                  return
                }
                
                if (data && data !== '') {
                  try {
                    const parsed = JSON.parse(data)
                    const content = parsed.choices?.[0]?.delta?.content || ''
                    if (content) {
                      buffer += content
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({content})}\n\n`))
                    }
                  } catch (parseError) {
                    // Skip invalid JSON chunks, but log if it's not an empty chunk
                    if (data.length > 0) {
                      logger.warn('Invalid JSON chunk in stream', {
                        userId,
                        chunk: data.substring(0, 100), // Log first 100 chars
                        error: parseError
                      })
                    }
                  }
                }
              }
            }
          }
        } catch (error) {
          streamError = error as Error
          logger.error('Streaming processing error', {
            userId,
            error: error,
            bufferLength: buffer.length,
            processingTime: Date.now() - startTime
          })
          controller.error(error)
        }
      }
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable nginx buffering for real-time streaming
      },
    })

  } catch (error) {
    const processingTime = Date.now() - startTime
    
    // Log API call with error
    logApiCall('POST', '/api/analyze-stream', userId, processingTime)
    logError(error as Error, { 
      userId, 
      processingTime, 
      textLength: sanitizedText.length 
    })

    return createErrorResponse(error)
  }
}
