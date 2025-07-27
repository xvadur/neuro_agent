'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Brain, Send, AlertCircle, Zap, Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { AnalysisResult } from '@/lib/abacusClient'
import { toast } from 'sonner'

interface ChatInterfaceProps {
  onAnalysisResult: (result: AnalysisResult) => void
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

interface AnalysisError {
  message: string
  code?: number
  retryAfter?: number
  type: 'validation' | 'rate_limit' | 'service' | 'network' | 'unknown'
}

export function ChatInterface({ onAnalysisResult, isLoading, setIsLoading }: ChatInterfaceProps) {
  const [inputText, setInputText] = useState('')
  const [error, setError] = useState<AnalysisError | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [streamProgress, setStreamProgress] = useState<string>('')

  // Input validation
  const validateInput = (text: string): string | null => {
    const trimmed = text.trim()
    
    if (trimmed.length === 0) {
      return 'Prosím zadajte nejaký text pre analýzu'
    }
    
    if (trimmed.length < 10) {
      return 'Text musí obsahovať aspoň 10 znakov'
    }
    
    if (trimmed.length > 10000) {
      return 'Text nemôže presiahnuť 10,000 znakov'
    }
    
    return null
  }

  const parseApiError = (response: Response, errorData?: any): AnalysisError => {
    const status = response.status
    
    if (status === 429) {
      const retryAfter = parseInt(response.headers.get('Retry-After') || '60')
      return {
        message: `Príliš veľa požiadaviek. Skúste znovu za ${retryAfter} sekúnd.`,
        code: status,
        retryAfter,
        type: 'rate_limit'
      }
    }
    
    if (status === 400) {
      return {
        message: errorData?.error || 'Neplatné údaje. Skontrolujte váš vstup.',
        code: status,
        type: 'validation'
      }
    }
    
    if (status === 401) {
      return {
        message: 'Relácia vypršala. Prosím prihláste sa znovu.',
        code: status,
        type: 'service'
      }
    }
    
    if (status === 502 || status === 503) {
      return {
        message: 'Analytická služba je dočasne nedostupná. Prosím skúste znovu.',
        code: status,
        type: 'service'
      }
    }
    
    return {
      message: errorData?.error || 'Neočakávaná chyba. Prosím skúste znovu.',
      code: status,
      type: 'unknown'
    }
  }

  const handleAnalyze = async (isRetry: boolean = false) => {
    if (isLoading) return
    
    // Clear previous error
    setError(null)
    setStreamProgress('')
    
    // Validate input
    const validationError = validateInput(inputText)
    if (validationError) {
      setError({
        message: validationError,
        type: 'validation'
      })
      toast.error(validationError)
      return
    }

    setIsLoading(true)
    
    if (!isRetry) {
      setRetryCount(0)
    }
    
    try {
      const response = await fetch('/api/analyze-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: inputText }),
      })

      if (!response.ok) {
        let errorData
        try {
          errorData = await response.json()
        } catch {
          // Response body might not be JSON
        }
        
        const apiError = parseApiError(response, errorData)
        setError(apiError)
        
        if (apiError.type === 'rate_limit') {
          toast.error(`Rate limit exceeded. Retry in ${apiError.retryAfter} seconds.`)
        } else if (apiError.type === 'validation') {
          toast.error(apiError.message)
        } else {
          toast.error(apiError.message)
        }
        
        setIsLoading(false)
        return
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('Streaming not supported')
      }

      const decoder = new TextDecoder()
      let buffer = ''
      let partialRead = ''
      let lastProgressUpdate = Date.now()

      setStreamProgress('Pripájam sa na analytickú službu...')

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        partialRead += decoder.decode(value, { stream: true })
        let lines = partialRead.split('\n')
        partialRead = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim()
            if (data === '[DONE]') {
              // Stream finished - process complete response
              try {
                const finalResponse = JSON.parse(buffer)
                onAnalysisResult(finalResponse)
                
                toast.success('Analýza úspešne dokončená!')
                setInputText('') // Clear input after successful analysis
                setStreamProgress('')
                
              } catch (parseError) {
                console.error('Error parsing final JSON:', parseError)
                setError({
                  message: 'Chyba pri spracovaní výsledkov analýzy',
                  type: 'service'
                })
                toast.error('Chyba pri spracovaní výsledkov')
              }
              setIsLoading(false)
              return
            }
            
            if (data && data !== '') {
              try {
                const parsed = JSON.parse(data)
                if (parsed.content) {
                  buffer += parsed.content
                  
                  // Update progress periodically
                  const now = Date.now()
                  if (now - lastProgressUpdate > 1000) { // Update every second
                    const progress = Math.min((buffer.length / 2000) * 100, 95) // Estimate progress
                    setStreamProgress(`Spracúvam analýzu... ${Math.round(progress)}%`)
                    lastProgressUpdate = now
                  }
                }
              } catch (parseError) {
                // Skip invalid JSON chunks
                console.warn('Invalid JSON chunk:', data.substring(0, 50))
              }
            }
          }
        }
      }
    } catch (networkError) {
      console.error('Network error:', networkError)
      
      const error: AnalysisError = {
        message: 'Problém s pripojením. Skontrolujte internetové pripojenie.',
        type: 'network'
      }
      
      setError(error)
      toast.error(error.message)
      setIsLoading(false)
    }
  }

  const handleRetry = () => {
    if (retryCount < 3) {
      setRetryCount(prev => prev + 1)
      handleAnalyze(true)
    } else {
      toast.error('Maximálny počet pokusov dosiahnutý. Skúste to neskôr.')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleAnalyze()
    }
  }

  const getCharacterCountColor = () => {
    const length = inputText.length
    if (length < 10) return 'text-red-500'
    if (length > 9000) return 'text-orange-500'
    if (length > 10000) return 'text-red-500'
    return 'text-muted-foreground'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="shadow-lg border-primary/10">
        <CardHeader className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Brain className="h-5 w-5 text-primary" />
            Denný Cyklus Vedomia
          </CardTitle>
          <CardDescription>
            Zadajte váš denný mindstream pre hlbokú analýzu osobného operačného systému vedomia
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Textarea
              placeholder="Opíšte vaše dnešné myšlienky, pocity, pozorovania alebo reflexie..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-[120px] resize-none focus:ring-primary/50"
              disabled={isLoading}
            />
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">
                Tip: Stlačte Ctrl+Enter pre rýchlu analýzu
              </span>
              <span className={getCharacterCountColor()}>
                {inputText.length}/10,000 znakov
              </span>
            </div>
          </div>
          
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Alert variant={error.type === 'validation' ? 'default' : 'destructive'}>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="flex justify-between items-center">
                    <span>{error.message}</span>
                    {error.type !== 'validation' && retryCount < 3 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRetry}
                        disabled={isLoading}
                      >
                        Skúsiť znovu
                      </Button>
                    )}
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {isLoading && streamProgress && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <Zap className="h-4 w-4 animate-pulse" />
                {streamProgress}
              </motion.div>
            )}
          </AnimatePresence>
          
          <Button 
            onClick={() => handleAnalyze()}
            disabled={!inputText.trim() || isLoading || !!error}
            className="w-full bg-primary hover:bg-primary/90 transition-all duration-200"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {streamProgress || 'Analyzujem váš mindstream...'}
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Analyzovať {retryCount > 0 && `(Pokus ${retryCount + 1})`}
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  )
}
