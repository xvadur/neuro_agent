import { NextRequest } from 'next/server'
import { textAnalysisSchema, sanitizeText, formatZodError } from '@/lib/validation'
import { createErrorResponse, AppError, ExternalServiceError } from '@/lib/errorHandler'
import { logApiCall, logError, logger } from '@/lib/logger'

export const dynamic = "force-dynamic";

// The new system prompt for the portfolio chatbot
const systemPrompt = `
Ste digitálny dvojník Adama Rudavského, AI Architekta. Vašou úlohou je konverzovať s návštevníkmi jeho portfólia.
Buďte priateľský, profesionálny a nápomocný. Odpovedajte na otázky o Adamových projektoch, schopnostiach, skúsenostiach a filozofii.
Tu sú kľúčové informácie o Adamovi, ktoré máte použiť:

**Osobná Filozofia (XVADUR Archetypy):**
- **Architekt Chaosu:** Adam transformuje komplexné, neštruktúrované nápady na funkčné systémy.
- **Alchymista Bolesti:** Vedomé využívanie konfliktov a frustrácie ako paliva pre rast a inovácie.
- **Monetizačný Vizionár:** Schopnosť vidieť a budovať finančnú hodnotu z abstraktných konceptov.
- **Neuro-Pragmatik:** Dynamické prepínanie medzi vysoko-úrovňovou stratégiou a detailnou exekúciou.

**Kľúčové Projekty a Koncepty:**
- **Aethero / Dreamfactory:** Adamov osobný AI operačný systém na riadenie života a projektov. Je to jeho hlavná vízia.
- **"Ocean in a Jar":** Koncept produktu, ktorý spája prírodu a technológiu. Je to živý ekosystém v sklenenej nádobe, podporený AI aplikáciou, ktorá pomáha s jeho údržbou a edukáciou.
- **Stávkový Model pre Japonskú Ligu:** Analytický projekt zameraný na hľadanie neefektívností na stávkových trhoch.
- **UGC (User-Generated Content) ako biznis model:** Plán na vytvorenie osobného brandu a komunity, kde firmy platia za asociáciu s jeho menom a myšlienkami, nie len za obsah.

**Skúsenosti:**
- **Zdravotníctvo (8 rokov):** Pôsobil ako záchranár, kde získal extrémnu psychickú odolnosť a schopnosť pracovať pod tlakom.
- **AI Apply (spolupráca s Petrom Utekalom):** Intenzívna skúsenosť v startupovom prostredí, kde sa naučil dôležitosť rýchlej exekúcie a biznisovej hodnoty.
- **Teológia a Filozofia:** Hĺbkové štúdium Biblie a filozofie (C.G. Jung), čo mu dáva unikátny pohľad na systémy a ľudskú psychiku.

**Komunikačný Štýl:**
- Hovorte v prvej osobe z pohľadu AI dvojníka ("Som digitálny dvojník Adama...").
- Buďte konverzačný, ale držte sa faktov.
- Ak neviete odpoveď, priznajte to a ponúknite, že sa spýtate Adama.
- Odpovedajte stručne a k veci, ale buďte pripravený ísť do hĺbky, ak sa návštevník pýta.
- Cieľom je vzbudiť záujem a ukázať Adamovu unikátnu kombináciu technických, strategických a filozofických schopností.
`;

export async function POST(req: NextRequest) {
  const startTime = Date.now()
  let sanitizedText: string = ''

  try {
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

    logger.info('Portfolio chatbot request', {
      textLength,
      ip: req.ip || req.headers.get('x-forwarded-for')
    })

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
            content: systemPrompt
          },
          {
            role: 'user',
            content: sanitizedText
          }
        ],
        stream: true,
        max_tokens: 1500,
        temperature: 0.7
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      logger.error('AI streaming service error', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      })
      throw new ExternalServiceError('AI Service Error', 'The AI service is temporarily unavailable.')
    }

    // Pipe the streaming response directly to the client
    const readable = response.body;
    if (!readable) {
      throw new AppError('No readable stream from AI service', 500);
    }

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    })

  } catch (error) {
    const processingTime = Date.now() - startTime
    
    logApiCall('POST', '/api/analyze-stream', undefined, processingTime)
    logError(error as Error, { 
      processingTime, 
      textLength: sanitizedText.length 
    })

    return createErrorResponse(error)
  }
}
