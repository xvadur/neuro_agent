'use client'

import { useState, useRef, useEffect } from 'react'
import { ChatInterface } from '@/components/chat-interface'
import { ChatMessage } from '@/components/chat-message'
import { Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Scroll to the bottom of the chat container when new messages are added
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages])

  const handleNewMessage = async (newMessage: Message) => {
    const updatedMessages = [...messages, newMessage]
    setMessages(updatedMessages)
    setIsLoading(true)

    try {
      const response = await fetch('/api/analyze-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newMessage.content }),
      })

      if (!response.ok || !response.body) {
        throw new Error('Failed to get response from server.')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let assistantResponse = ''

      setMessages(prev => [...prev, { role: 'assistant', content: '' }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        assistantResponse += chunk

        setMessages(prev => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1].content = assistantResponse;
            return newMessages;
        });
      }
    } catch (error) {
      console.error('Error during chat:', error)
      toast.error('Nastala chyba pri komunikácii s AI. Skúste to prosím znova.')
      setMessages(prev => prev.slice(0, -1)); // Remove the empty assistant message
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-background via-background to-muted flex flex-col items-center p-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-4 flex-shrink-0"
      >
        <div className="inline-block p-3 rounded-full bg-primary/10">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold mt-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Adam Rudavský: AI Architekt
        </h1>
        <p className="text-muted-foreground mt-1">
          Som digitálny dvojník Adama. Pýtajte sa ma na jeho projekty, filozofiu, alebo začnite konverzáciu.
        </p>
      </motion.div>

      {/* Chat Area */}
      <div className="w-full max-w-3xl flex-grow flex flex-col bg-background/50 border rounded-lg shadow-lg overflow-hidden">
        <div ref={chatContainerRef} className="flex-grow p-6 space-y-4 overflow-y-auto">
          {messages.map((msg, index) => (
            <ChatMessage key={index} message={msg} />
          ))}
          {isLoading && messages[messages.length -1].role === 'user' && (
             <ChatMessage message={{role: 'assistant', content: '...'}} />
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-background/80 border-t">
          <ChatInterface
            onNewMessage={handleNewMessage}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
        </div>
      </div>
    </div>
  )
}
