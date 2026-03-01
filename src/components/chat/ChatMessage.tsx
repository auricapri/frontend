import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, User } from 'lucide-react';

export interface ChatMessageData {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

interface ChatMessageProps {
  message: ChatMessageData;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.type === 'user';
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const hasAnimated = useRef(false);

  // Typing animation effect for bot messages
  useEffect(() => {
    // Only animate bot messages that haven't been animated yet
    if (!isUser && message.content && !message.isLoading && !hasAnimated.current) {
      hasAnimated.current = true;
      setIsTyping(true);
      setDisplayedText('');

      let index = 0;
      const content = message.content;

      const interval = setInterval(() => {
        if (index < content.length) {
          setDisplayedText(content.slice(0, index + 1));
          index++;
        } else {
          clearInterval(interval);
          setIsTyping(false);
        }
      }, 15); // 15ms per character for smooth animation

      return () => clearInterval(interval);
    } else if (isUser || hasAnimated.current) {
      // User messages or already animated: show full text immediately
      setDisplayedText(message.content);
    }
  }, [message.content, message.isLoading, isUser]);

  return (
    <div
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} animate-in slide-in-from-bottom-2 duration-300`}
    >
      {/* Avatar */}
      <div
        className={`flex-none w-8 h-8 rounded-full flex items-center justify-center ${
          isUser
            ? 'bg-neutral-900 text-white'
            : 'bg-black text-white'
        }`}
      >
        {isUser ? (
          <User className="w-4 h-4" />
        ) : (
          <MessageCircle className="w-4 h-4" />
        )}
      </div>

      {/* Message Bubble */}
      <div
        className={`max-w-[80%] px-4 py-3 rounded-2xl ${
          isUser
            ? 'bg-neutral-900 text-white rounded-tr-sm'
            : 'bg-neutral-100 text-neutral-800 rounded-tl-sm'
        }`}
      >
        {message.isLoading ? (
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        ) : (
          <>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {displayedText}
              {isTyping && (
                <span className="inline-block w-0.5 h-4 bg-current ml-0.5 animate-pulse" />
              )}
            </p>
            {!isTyping && (
              <span
                className={`text-[10px] mt-1 block ${
                  isUser ? 'text-white/50' : 'text-neutral-400'
                }`}
              >
                {message.timestamp.toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
};
