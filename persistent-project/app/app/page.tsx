'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ChatInterface } from '@/components/chat-interface'
import { CommandDeckDisplay } from '@/components/command-deck-display'
import { ArchiveSidebar } from '@/components/archive-sidebar'
import { LogOut, User, Sparkles, Shield, Zap, Database } from 'lucide-react'
import { motion } from 'framer-motion'
import { AnalysisResult } from '@/lib/abacusClient'
import { toast } from 'sonner'

interface Report {
  id: string
  originalText: string
  analysisResult: any
  textLength?: number
  processingTime?: number
  timestamp: string
  createdAt: string
  updatedAt: string
}

interface AnalysisMetadata {
  processingTime?: number
  textLength?: number
  reportId?: string
}

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [analysisMetadata, setAnalysisMetadata] = useState<AnalysisMetadata | null>(null)
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  const handleSignOut = async () => {
    try {
      await signOut({ redirect: false })
      router.push('/auth/signin')
    } catch (error) {
      console.error('Sign out error:', error)
      toast.error('Chyba pri odhlasovaní')
    }
  }

  const handleAnalysisResult = (result: any) => {
    try {
      // Handle both old and new API response formats
      if (result.analysis) {
        // New API format
        setAnalysisResult(result.analysis)
        setAnalysisMetadata({
          processingTime: result.processingTime,
          textLength: result.textLength,
          reportId: result.reportId
        })
      } else {
        // Legacy format
        setAnalysisResult(result)
        setAnalysisMetadata(null)
      }
      
      setSelectedReportId(result.reportId || null)
      setError(null)
      
    } catch (error) {
      console.error('Error processing analysis result:', error)
      setError('Chyba pri spracovaní výsledkov analýzy')
      toast.error('Chyba pri spracovaní výsledkov')
    }
  }

  const handleReportSelect = (report: Report) => {
    try {
      setAnalysisResult(report.analysisResult)
      setAnalysisMetadata({
        processingTime: report.processingTime,
        textLength: report.textLength,
        reportId: report.id
      })
      setSelectedReportId(report.id)
      setError(null)
      
    } catch (error) {
      console.error('Error selecting report:', error)
      setError('Chyba pri načítavaní reportu')
      toast.error('Chyba pri načítavaní reportu')
    }
  }

  const clearAnalysis = () => {
    setAnalysisResult(null)
    setAnalysisMetadata(null)
    setSelectedReportId(null)
    setError(null)
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <div className="text-center">
          <Sparkles className="h-8 w-8 animate-pulse text-primary mx-auto mb-2" />
          <p className="text-muted-foreground">Načítavam Aethero Command Interface...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <div className="p-2 rounded-lg bg-primary/10">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Aethero Command Interface
                </h1>
                <p className="text-xs text-muted-foreground">v0.1 - Osobný operačný systém vedomia</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {session.user?.name || session.user?.email}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                Odhlásiť
              </Button>
            </motion.div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-8rem)]">
          {/* Left Column - Archive (25%) */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-1"
          >
            <ArchiveSidebar 
              onReportSelect={handleReportSelect}
              selectedReportId={selectedReportId || undefined}
            />
          </motion.div>

          {/* Right Column - Main Workspace (75%) */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-3 space-y-6 overflow-y-auto"
          >
            {/* Chat Interface */}
            <ChatInterface
              onAnalysisResult={handleAnalysisResult}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
            />

            {/* Command Deck Display */}
            <CommandDeckDisplay 
              analysisResult={analysisResult}
              metadata={analysisMetadata || undefined}
              isLoading={isLoading}
            />

            {/* Enhanced Welcome State */}
            {!analysisResult && !isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-center py-16 space-y-8"
              >
                <div className="space-y-4">
                  <div className="p-4 rounded-full bg-primary/10 w-24 h-24 flex items-center justify-center mx-auto">
                    <Sparkles className="h-12 w-12 text-primary" />
                  </div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    Vítajte v Aethero Command Interface
                  </h2>
                  <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                    Váš osobný operačný systém vedomia je pripravený na analýzu vášho denného mindstreamu.
                    Zadajte vaše myšlienky, pocity a pozorovania do rozhrania vyššie a nechajte AI Dvojník
                    vykonať hlbokú psychologickú, logickú a syntaktickú analýzu.
                  </p>
                </div>
                
                {/* Analysis Type Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200/50 hover:border-blue-300/50 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="h-4 w-4 text-blue-600" />
                      <h3 className="font-semibold text-blue-700 dark:text-blue-300">
                        Psychologická Analýza
                      </h3>
                    </div>
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      Identifikácia emocionálneho stavu, kognitívnych vzorov a motivačných faktorov
                    </p>
                  </motion.div>
                  
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200/50 hover:border-purple-300/50 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="h-4 w-4 text-purple-600" />
                      <h3 className="font-semibold text-purple-700 dark:text-purple-300">
                        Logická Analýza
                      </h3>
                    </div>
                    <p className="text-sm text-purple-600 dark:text-purple-400">
                      Hodnotenie štruktúry argumentácie a validity logického uvažovania
                    </p>
                  </motion.div>
                  
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="p-4 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200/50 hover:border-orange-300/50 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Database className="h-4 w-4 text-orange-600" />
                      <h3 className="font-semibold text-orange-700 dark:text-orange-300">
                        Syntaktická Analýza
                      </h3>
                    </div>
                    <p className="text-sm text-orange-600 dark:text-orange-400">
                      Analýza jazykového štýlu, komplexnosti a štruktúry výrazu
                    </p>
                  </motion.div>
                </div>

                {/* Security & Features Notice */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="max-w-2xl mx-auto"
                >
                  <div className="p-4 rounded-lg bg-muted/50 border">
                    <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        <span>Zabezpečené</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Database className="h-3 w-3" />
                        <span>Archivované</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        <span>Real-time AI</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  )
}
