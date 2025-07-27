import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { textAnalysisSchema, sanitizeText, formatZodError } from '@/lib/validation'
import { createErrorResponse, createApiResponse, AppError, ExternalServiceError } from '@/lib/errorHandler'
import { logApiCall, logError, logger } from '@/lib/logger'

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const startTime = Date.now()
  let userId: string | undefined

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
    const sanitizedText = sanitizeText(text)
    const textLength = sanitizedText.length

    logger.info('Text analysis request', {
      userId,
      textLength,
      ip: req.ip || req.headers.get('x-forwarded-for')
    })

    // Call Abacus AI API with error handling
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
        max_tokens: 3000,
        temperature: 0.7
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      logger.error('AI service error', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        userId
      })
      throw new ExternalServiceError('AI Analysis Service', 'Analysis service temporarily unavailable')
    }

    const data = await response.json()
    let analysisResult

    try {
      analysisResult = JSON.parse(data.choices[0]?.message?.content || '{}')
    } catch (parseError) {
      logger.error('AI response parsing error', {
        response: data.choices[0]?.message?.content || '',
        userId,
        error: parseError
      })
      throw new AppError('Invalid analysis response format', 502)
    }

    const processingTime = Date.now() - startTime

    // Save to database with enhanced data
    if (!userId) {
      throw new AppError('User ID is required', 500)
    }

    const report = await prisma.report.create({
      data: {
        userId,
        originalText: sanitizedText,
        analysisResult,
        textLength,
        processingTime,
      }
    })

    // Log successful API call
    logApiCall('POST', '/api/analyze', userId, processingTime)

    return createApiResponse({
      analysis: analysisResult,
      reportId: report.id,
      processingTime,
      textLength
    })

  } catch (error) {
    const processingTime = Date.now() - startTime
    
    // Log API call with error
    logApiCall('POST', '/api/analyze', userId, processingTime)
    logError(error as Error, { userId, processingTime })

    return createErrorResponse(error)
  }
}
