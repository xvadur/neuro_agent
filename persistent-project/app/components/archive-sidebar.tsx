'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Archive, 
  Calendar, 
  Clock, 
  Loader2, 
  RefreshCw, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  AlertCircle,
  Trash2,
  FileText,
  Timer,
  Hash
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { sk } from 'date-fns/locale'
import { toast } from 'sonner'
import { useDebounce } from 'react-use'

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

interface ReportsResponse {
  data: {
    reports: Report[]
    pagination: {
      currentPage: number
      totalPages: number
      totalCount: number
      limit: number
      offset: number
      hasNextPage: boolean
      hasPreviousPage: boolean
    }
    search: string | null
    processingTime: number
  }
  success: boolean
  timestamp: string
}

interface ArchiveSidebarProps {
  onReportSelect?: (report: Report) => void
  selectedReportId?: string
}

export function ArchiveSidebar({ onReportSelect, selectedReportId }: ArchiveSidebarProps) {
  const [reports, setReports] = useState<Report[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPreviousPage: false
  })

  // Debounce search query to avoid too many API calls
  useDebounce(
    () => {
      setDebouncedSearchQuery(searchQuery)
    },
    500,
    [searchQuery]
  )

  const fetchReports = useCallback(async (page: number = 1, search: string = '', loadMore: boolean = false) => {
    try {
      if (loadMore) {
        setIsLoadingMore(true)
      } else {
        setIsLoading(true)
        setError(null)
      }

      const params = new URLSearchParams({
        limit: '10',
        offset: ((page - 1) * 10).toString(),
        ...(search && { search })
      })

      const response = await fetch(`/api/reports?${params}`)
      
      if (!response.ok) {
        let errorMessage = 'Chyba pri načítavaní reportov'
        
        if (response.status === 401) {
          errorMessage = 'Relácia vypršala. Prosím prihláste sa znovu.'
        } else if (response.status === 429) {
          errorMessage = 'Príliš veľa požiadaviek. Skúste znovu za chvíľu.'
        } else if (response.status >= 500) {
          errorMessage = 'Služba je dočasne nedostupná. Skúste znovu.'
        }
        
        throw new Error(errorMessage)
      }

      const data: ReportsResponse = await response.json()

      if (!data.success) {
        throw new Error('Nepodarilo sa načítať reporty')
      }

      if (loadMore && page > 1) {
        // Append new reports for infinite scroll
        setReports(prev => [...prev, ...data.data.reports])
      } else {
        // Replace reports for new search or refresh
        setReports(data.data.reports)
      }

      setPagination({
        currentPage: data.data.pagination.currentPage,
        totalPages: data.data.pagination.totalPages,
        totalCount: data.data.pagination.totalCount,
        hasNextPage: data.data.pagination.hasNextPage,
        hasPreviousPage: data.data.pagination.hasPreviousPage
      })

    } catch (err) {
      console.error('Error fetching reports:', err)
      const errorMessage = err instanceof Error ? err.message : 'Neočakávaná chyba'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }, [])

  // Effect for initial load and search changes
  useEffect(() => {
    fetchReports(1, debouncedSearchQuery)
  }, [fetchReports, debouncedSearchQuery])

  const handleReportClick = (report: Report) => {
    onReportSelect?.(report)
  }

  const handleRefresh = () => {
    setSearchQuery('')
    setDebouncedSearchQuery('')
    fetchReports(1, '')
  }

  const handleLoadMore = () => {
    if (pagination.hasNextPage && !isLoadingMore) {
      fetchReports(pagination.currentPage + 1, debouncedSearchQuery, true)
    }
  }

  const handleDeleteReport = async (reportId: string, event: React.MouseEvent) => {
    event.stopPropagation() // Prevent report selection

    try {
      const response = await fetch(`/api/reports?id=${reportId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete report')
      }

      // Remove from local state
      setReports(prev => prev.filter(r => r.id !== reportId))
      setPagination(prev => ({ ...prev, totalCount: prev.totalCount - 1 }))
      
      toast.success('Report bol úspešne odstránený')
    } catch (error) {
      console.error('Error deleting report:', error)
      toast.error('Chyba pri odstraňovaní reportu')
    }
  }

  const truncateText = (text: string, maxLength: number = 80) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
  }

  const formatProcessingTime = (timeMs?: number) => {
    if (!timeMs) return null
    if (timeMs < 1000) return `${timeMs}ms`
    return `${(timeMs / 1000).toFixed(1)}s`
  }

  const getEmotionalStateColor = (state: string) => {
    if (!state) return 'border-muted'
    
    const lowerState = state.toLowerCase()
    if (lowerState.includes('pozitívn') || lowerState.includes('radostn')) return 'border-green-400 text-green-600'
    if (lowerState.includes('negatívn') || lowerState.includes('smutný')) return 'border-red-400 text-red-600'
    if (lowerState.includes('neutrál')) return 'border-blue-400 text-blue-600'
    if (lowerState.includes('úzkos') || lowerState.includes('stres')) return 'border-orange-400 text-orange-600'
    return 'border-primary/30 text-primary'
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="h-full"
    >
      <Card className="h-full shadow-lg border-primary/10">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Archive className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Archív Vedomia</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          <CardDescription className="flex items-center gap-2">
            História vašich analýz a poznatkov
            {pagination.totalCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {pagination.totalCount} záznamov
              </Badge>
            )}
          </CardDescription>
          
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Vyhľadať v analýzach..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-sm"
              disabled={isLoading}
            />
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-16rem)]">
            {isLoading && reports.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2 text-sm text-muted-foreground">
                  Načítavam históriu...
                </span>
              </div>
            ) : error ? (
              <div className="p-4">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="flex justify-between items-center">
                    <span>{error}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRefresh}
                    >
                      Skúsiť znovu
                    </Button>
                  </AlertDescription>
                </Alert>
              </div>
            ) : reports.length === 0 ? (
              <div className="p-4 text-center">
                <Archive className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? 'Žiadne výsledky pre vyhľadávanie' : 'Zatiaľ žiadne analýzy'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {searchQuery 
                    ? 'Skúste iné kľúčové slová'
                    : 'Vytvorte prvú analýzu svojho mindstreamu'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-1 p-2">
                <AnimatePresence>
                  {reports.map((report, index) => (
                    <motion.div
                      key={report.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ delay: index * 0.03 }}
                    >
                      <Card 
                        className={`cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/20 border-transparent group ${
                          selectedReportId === report.id ? 'border-primary/50 bg-primary/5' : ''
                        }`}
                        onClick={() => handleReportClick(report)}
                      >
                        <CardContent className="p-3">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                <span>
                                  {format(new Date(report.timestamp), 'dd.MM.yyyy', { locale: sk })}
                                </span>
                                <Clock className="h-3 w-3 ml-1" />
                                <span>
                                  {format(new Date(report.timestamp), 'HH:mm', { locale: sk })}
                                </span>
                              </div>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                                onClick={(e) => handleDeleteReport(report.id, e)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                            
                            <p className="text-sm leading-relaxed">
                              {truncateText(report.originalText)}
                            </p>
                            
                            <div className="flex items-center justify-between flex-wrap gap-1">
                              <div className="flex items-center gap-1">
                                <Badge variant="secondary" className="text-xs">
                                  <Hash className="h-2 w-2 mr-1" />
                                  {index + 1 + (pagination.currentPage - 1) * 10}
                                </Badge>

                                {report.textLength && (
                                  <Badge variant="outline" className="text-xs">
                                    <FileText className="h-2 w-2 mr-1" />
                                    {report.textLength} znakov
                                  </Badge>
                                )}

                                {report.processingTime && (
                                  <Badge variant="outline" className="text-xs">
                                    <Timer className="h-2 w-2 mr-1" />
                                    {formatProcessingTime(report.processingTime)}
                                  </Badge>
                                )}
                              </div>
                              
                              {report.analysisResult?.psychological_analysis?.emotional_state && (
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${getEmotionalStateColor(report.analysisResult.psychological_analysis.emotional_state)}`}
                                >
                                  {report.analysisResult.psychological_analysis.emotional_state}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Load More Button */}
                {pagination.hasNextPage && (
                  <div className="p-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleLoadMore}
                      disabled={isLoadingMore}
                      className="w-full"
                    >
                      {isLoadingMore ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Načítavam ďalšie...
                        </>
                      ) : (
                        <>
                          <ChevronRight className="h-4 w-4 mr-2" />
                          Načítať ďalšie ({pagination.totalCount - reports.length} zostáva)
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </motion.div>
  )
}
