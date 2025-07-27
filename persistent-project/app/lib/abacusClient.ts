
// AI Dvojník API Client for Abacus AI
export interface AnalysisResult {
  psychological_analysis?: {
    emotional_state?: string
    cognitive_patterns?: string[]
    motivation_drivers?: string[]
    stress_indicators?: string[]
  }
  logical_analysis?: {
    reasoning_structure?: string
    argument_validity?: string
    logical_fallacies?: string[]
    conclusion_strength?: string
  }
  syntactic_analysis?: {
    language_complexity?: string
    writing_style?: string
    sentence_structure?: string[]
    vocabulary_level?: string
  }
  summary?: string
  insights?: string[]
  recommendations?: string[]
}

export async function getAnalysis(text: string): Promise<AnalysisResult> {
  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Error in getAnalysis:', error)
    throw error
  }
}

export async function getAnalysisStream(text: string): Promise<ReadableStream> {
  const response = await fetch('/api/analyze-stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return response.body!
}
