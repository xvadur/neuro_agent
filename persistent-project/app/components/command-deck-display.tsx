'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Brain, 
  Target, 
  FileText, 
  Lightbulb, 
  TrendingUp, 
  Clock,
  Hash,
  Timer,
  AlertCircle,
  CheckCircle2,
  Zap
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { AnalysisResult } from '@/lib/abacusClient'

interface CommandDeckDisplayProps {
  analysisResult?: AnalysisResult | null
  metadata?: {
    processingTime?: number
    textLength?: number
    reportId?: string
  }
  isLoading?: boolean
}

export function CommandDeckDisplay({ 
  analysisResult, 
  metadata,
  isLoading = false 
}: CommandDeckDisplayProps) {
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        ease: "easeOut"
      }
    })
  }

  const formatProcessingTime = (timeMs?: number) => {
    if (!timeMs) return 'N/A'
    if (timeMs < 1000) return `${timeMs}ms`
    return `${(timeMs / 1000).toFixed(2)}s`
  }

  const formatTextLength = (length?: number) => {
    if (!length) return 'N/A'
    if (length < 1000) return `${length} znakov`
    return `${(length / 1000).toFixed(1)}k znakov`
  }

  // Empty state when no analysis is available
  if (!analysisResult && !isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-center h-64"
      >
        <div className="text-center">
          <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-muted-foreground mb-2">
            Žiadna analýza
          </h3>
          <p className="text-sm text-muted-foreground">
            Zadajte text pre analýzu svojho mindstreamu
          </p>
        </div>
      </motion.div>
    )
  }

  // Loading state
  if (isLoading || !analysisResult) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Zap className="h-6 w-6 text-primary animate-pulse" />
            <h2 className="text-2xl font-bold text-primary">
              Spracúvam analýzu...
            </h2>
          </div>
          <p className="text-muted-foreground">
            AI Dvojník analyzuje váš mindstream
          </p>
        </div>
        
        {/* Loading skeleton */}
        <div className="grid grid-cols-1 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <Card className="shadow-lg">
                <CardHeader className="bg-muted/50">
                  <div className="h-6 bg-muted rounded w-48"></div>
                  <div className="h-4 bg-muted rounded w-64"></div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="h-4 bg-muted rounded w-full"></div>
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </motion.div>
    )
  }

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {/* Header with metadata */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-3"
        >
          <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Command Deck - Analýza Vedomia
          </h2>
          <p className="text-muted-foreground">
            Výsledky hlbokej analýzy vášho mindstreamu
          </p>
          
          {/* Analysis metadata */}
          {(metadata?.processingTime || metadata?.textLength || metadata?.reportId) && (
            <div className="flex items-center justify-center gap-4 flex-wrap">
              {metadata?.processingTime && (
                <Badge variant="outline" className="gap-1">
                  <Timer className="h-3 w-3" />
                  {formatProcessingTime(metadata.processingTime)}
                </Badge>
              )}
              {metadata?.textLength && (
                <Badge variant="outline" className="gap-1">
                  <FileText className="h-3 w-3" />
                  {formatTextLength(metadata.textLength)}
                </Badge>
              )}
              {metadata?.reportId && (
                <Badge variant="outline" className="gap-1">
                  <Hash className="h-3 w-3" />
                  {metadata.reportId.slice(-8)}
                </Badge>
              )}
              <Badge variant="secondary" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Analýza dokončená
              </Badge>
            </div>
          )}
        </motion.div>

        <div className="grid grid-cols-1 gap-6">
          {/* Psychological Analysis */}
          <motion.div
            custom={0}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
          >
            <Card className="shadow-lg border-blue-200/50 hover:shadow-xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
                <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                  <Brain className="h-5 w-5" />
                  Psychologická Analýza
                </CardTitle>
                <CardDescription>Hlbočka analýza vášho emocionálneho a kognitívneho stavu</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {analysisResult?.psychological_analysis?.emotional_state ? (
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-2">Emocionálny stav</h4>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {analysisResult.psychological_analysis.emotional_state}
                    </Badge>
                  </div>
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Emocionálny stav nie je k dispozícii v tejto analýze
                    </AlertDescription>
                  </Alert>
                )}
                
                {analysisResult?.psychological_analysis?.cognitive_patterns && Array.isArray(analysisResult.psychological_analysis.cognitive_patterns) && analysisResult.psychological_analysis.cognitive_patterns.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-2">Kognitívne vzorce</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysisResult.psychological_analysis.cognitive_patterns.map((pattern, idx) => (
                        <Badge key={idx} variant="outline" className="border-blue-200 text-blue-700">
                          {pattern}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {analysisResult?.psychological_analysis?.motivation_drivers && Array.isArray(analysisResult.psychological_analysis.motivation_drivers) && analysisResult.psychological_analysis.motivation_drivers.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-2">Motivačné faktory</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysisResult.psychological_analysis.motivation_drivers.map((driver, idx) => (
                        <Badge key={idx} variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          {driver}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {analysisResult?.psychological_analysis?.stress_indicators && Array.isArray(analysisResult.psychological_analysis.stress_indicators) && analysisResult.psychological_analysis.stress_indicators.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-2">Indikátory stresu</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysisResult.psychological_analysis.stress_indicators.map((indicator, idx) => (
                        <Badge key={idx} variant="destructive" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                          {indicator}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Logical Analysis */}
          <motion.div
            custom={1}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
          >
            <Card className="shadow-lg border-purple-200/50 hover:shadow-xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
                <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                  <Target className="h-5 w-5" />
                  Logická Analýza
                </CardTitle>
                <CardDescription>Hodnotenie logickej štruktúry a argumentácie</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {analysisResult?.logical_analysis?.reasoning_structure && (
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-2">Štruktúra uvažovania</h4>
                    <p className="text-sm bg-muted p-3 rounded-md">{analysisResult.logical_analysis.reasoning_structure}</p>
                  </div>
                )}

                {analysisResult?.logical_analysis?.argument_validity && (
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-2">Validita argumentov</h4>
                    <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                      {analysisResult.logical_analysis.argument_validity}
                    </Badge>
                  </div>
                )}

                {analysisResult?.logical_analysis?.logical_fallacies && Array.isArray(analysisResult.logical_analysis.logical_fallacies) && analysisResult.logical_analysis.logical_fallacies.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-2">Logické chyby</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysisResult.logical_analysis.logical_fallacies.map((fallacy, idx) => (
                        <Badge key={idx} variant="outline" className="border-red-200 text-red-700">
                          {fallacy}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {analysisResult?.logical_analysis?.conclusion_strength && (
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-2">Sila záverov</h4>
                    <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      {analysisResult.logical_analysis.conclusion_strength}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Syntactic Analysis */}
          <motion.div
            custom={2}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
          >
            <Card className="shadow-lg border-orange-200/50 hover:shadow-xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
                <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
                  <FileText className="h-5 w-5" />
                  Syntaktická Analýza
                </CardTitle>
                <CardDescription>Analýza jazykového štýlu a štruktúry</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {analysisResult?.syntactic_analysis?.language_complexity && (
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-2">Komplexnosť jazyka</h4>
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                      {analysisResult.syntactic_analysis.language_complexity}
                    </Badge>
                  </div>
                )}

                {analysisResult?.syntactic_analysis?.writing_style && (
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-2">Štýl písania</h4>
                    <p className="text-sm bg-muted p-3 rounded-md">{analysisResult.syntactic_analysis.writing_style}</p>
                  </div>
                )}

                {analysisResult?.syntactic_analysis?.sentence_structure && Array.isArray(analysisResult.syntactic_analysis.sentence_structure) && analysisResult.syntactic_analysis.sentence_structure.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-2">Štruktúra viet</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysisResult.syntactic_analysis.sentence_structure.map((structure, idx) => (
                        <Badge key={idx} variant="outline" className="border-orange-200 text-orange-700">
                          {structure}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {analysisResult?.syntactic_analysis?.vocabulary_level && (
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-2">Úroveň slovnej zásoby</h4>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {analysisResult.syntactic_analysis.vocabulary_level}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Summary & Insights */}
          <motion.div
            custom={3}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
          >
            <Card className="shadow-lg border-green-200/50 hover:shadow-xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
                <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
                  <Lightbulb className="h-5 w-5" />
                  Zhrnutie a Poznatky
                </CardTitle>
                <CardDescription>Kľúčové poznatky a odporúčania</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {analysisResult?.summary && (
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-2">Celkové zhrnutie</h4>
                    <p className="text-sm bg-muted p-4 rounded-md leading-relaxed">{analysisResult.summary}</p>
                  </div>
                )}

                {analysisResult?.insights && Array.isArray(analysisResult.insights) && analysisResult.insights.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-2">Kľúčové poznatky</h4>
                    <ul className="space-y-2">
                      {analysisResult.insights.map((insight, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <TrendingUp className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysisResult?.recommendations && Array.isArray(analysisResult.recommendations) && analysisResult.recommendations.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-2">Odporúčania</h4>
                    <ul className="space-y-2">
                      {analysisResult.recommendations.map((recommendation, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <Lightbulb className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                          <span>{recommendation}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {(!analysisResult?.summary && (!analysisResult?.insights || analysisResult.insights.length === 0) && (!analysisResult?.recommendations || analysisResult.recommendations.length === 0)) && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Zhrnutie a odporúčania nie sú k dispozícii v tejto analýze
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </AnimatePresence>
    </div>
  )
}
