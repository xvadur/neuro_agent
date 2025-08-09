'use client'

import { Bot, User } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ChatMessageProps {
  message: Message
}

export function ChatMessage({ message }: ChatMessageProps) {
  const { role, content } = message
  const isUser = role === 'user'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex items-start gap-4 p-4 rounded-lg my-2',
        isUser ? 'chat-message-user' : 'chat-message-assistant',
      )}
    >
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
        )}
      >
        {isUser ? <User size={20} /> : <Bot size={20} />}
      </div>
      <div className="flex-grow pt-1">
        <p className="leading-relaxed whitespace-pre-wrap">{content}</p>
      </div>
    </motion.div>
  )
}
