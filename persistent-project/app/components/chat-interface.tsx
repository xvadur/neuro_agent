'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Bot, Send, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ChatInterfaceProps {
  onNewMessage: (message: Message) => Promise<void>
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

interface ChatError {
  message: string
}

export function ChatInterface({ onNewMessage, isLoading, setIsLoading }: ChatInterfaceProps) {
  const [inputText, setInputText] = useState('')
  const [error, setError] = useState<ChatError | null>(null)

  const handleSubmit = async () => {
    if (isLoading || !inputText.trim()) return
    
    setError(null)
    const message: Message = { role: 'user', content: inputText }
    await onNewMessage(message)
    setInputText('')

    // The actual API call logic will be handled in the parent component
    // For now, we just pass the message up.
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
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
            <Bot className="h-5 w-5 text-primary" />
            Konverzácia s digitálnym dvojníkom
          </CardTitle>
          <CardDescription>
            Opýtajte sa čokoľvek o mojich projektoch, skúsenostiach alebo filozofii.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Textarea
              placeholder="Napríklad: 'Povedz mi o tvojom projekte Aethero...'"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-[100px] resize-none focus:ring-primary/50"
              disabled={isLoading}
            />
          </div>
          
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <span>{error.message}</span>
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>
          
          <Button 
            onClick={handleSubmit}
            disabled={!inputText.trim() || isLoading}
            className="w-full bg-primary hover:bg-primary/90 transition-all duration-200"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Odosielam...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Odoslať správu
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  )
}
