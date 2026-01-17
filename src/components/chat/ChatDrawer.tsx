import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, MessageCircle, Loader2, Trash2, AlertCircle } from 'lucide-react';
import { aiChatApi, ChatProduct, ChatResponse } from '../../api/ai-chat.api';
import { ChatMessage, ChatMessageData } from './ChatMessage';
import { ChatProductCard } from './ChatProductCard';
import { Locale } from '../../i18n';
import { CartItem } from '../../types';

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (product: ChatProduct) => void;
  onAddToCart: (item: CartItem) => void;
  locale: Locale;
  userId?: string;
}

const WELCOME_MESSAGE = `Ola! Sou a assistente virtual da Auricapri.

Posso te ajudar a encontrar o produto perfeito! Me conte:
- Que tipo de peca voce procura?
- Para qual ocasiao?
- Qual seu estilo preferido?`;

const SESSION_KEY = 'auricapri_chat_session';

export const ChatDrawer: React.FC<ChatDrawerProps> = ({
  isOpen,
  onClose,
  onSelectProduct,
  onAddToCart,
  locale,
  userId
}) => {
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [queuePosition, setQueuePosition] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<Map<string, ChatProduct[]>>(new Map());

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const queuePollRef = useRef<NodeJS.Timeout | null>(null);

  // Get or create session ID
  const getSessionId = useCallback(() => {
    let sessionId = localStorage.getItem(SESSION_KEY);
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem(SESSION_KEY, sessionId);
    }
    return sessionId;
  }, []);

  const effectiveUserId = userId || `guest_${getSessionId()}`;

  // Initialize with welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          type: 'bot',
          content: WELCOME_MESSAGE,
          timestamp: new Date()
        }
      ]);
    }
  }, [isOpen, messages.length]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, products]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Cleanup queue polling on unmount
  useEffect(() => {
    return () => {
      if (queuePollRef.current) {
        clearInterval(queuePollRef.current);
      }
    };
  }, []);

  // Poll queue status
  const pollQueueStatus = useCallback(async () => {
    try {
      const status = await aiChatApi.getQueueStatus(effectiveUserId);
      setQueuePosition(status.position);

      if (status.position === 0) {
        // No longer in queue, stop polling
        if (queuePollRef.current) {
          clearInterval(queuePollRef.current);
          queuePollRef.current = null;
        }
        setQueuePosition(null);
      }
    } catch {
      // Ignore polling errors
    }
  }, [effectiveUserId]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessageData = {
      id: `user_${Date.now()}`,
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    // Add loading message
    const loadingId = `loading_${Date.now()}`;
    setMessages(prev => [
      ...prev,
      {
        id: loadingId,
        type: 'bot',
        content: '',
        timestamp: new Date(),
        isLoading: true
      }
    ]);

    try {
      const response: ChatResponse = await aiChatApi.sendMessage({
        user_id: effectiveUserId,
        message: userMessage.content,
        session_id: getSessionId()
      });

      // Remove loading message
      setMessages(prev => prev.filter(m => m.id !== loadingId));

      if (response.status === 'queued') {
        // Start queue polling
        setQueuePosition(response.position || 1);

        if (!queuePollRef.current) {
          queuePollRef.current = setInterval(pollQueueStatus, 3000);
        }

        setMessages(prev => [
          ...prev,
          {
            id: `queue_${Date.now()}`,
            type: 'bot',
            content: `Estou processando sua mensagem. Voce esta na posicao ${response.position} da fila. Aguarde um momento...`,
            timestamp: new Date()
          }
        ]);
      } else if (response.status === 'success' && response.message) {
        const botMessage: ChatMessageData = {
          id: `bot_${Date.now()}`,
          type: 'bot',
          content: response.message,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, botMessage]);

        // Store products if any
        if (response.products && response.products.length > 0) {
          setProducts(prev => new Map(prev).set(botMessage.id, response.products!));
        }
      } else if (response.status === 'error') {
        setError(response.error || 'Erro ao processar mensagem');
        setMessages(prev => [
          ...prev,
          {
            id: `error_${Date.now()}`,
            type: 'bot',
            content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.',
            timestamp: new Date()
          }
        ]);
      }
    } catch (err) {
      // Remove loading message
      setMessages(prev => prev.filter(m => m.id !== loadingId));

      setError('Servico indisponivel. Tente novamente mais tarde.');
      setMessages(prev => [
        ...prev,
        {
          id: `error_${Date.now()}`,
          type: 'bot',
          content: 'Desculpe, o servico esta temporariamente indisponivel. Tente novamente em alguns instantes.',
          timestamp: new Date()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = async () => {
    try {
      await aiChatApi.clearSession(effectiveUserId);
      localStorage.removeItem(SESSION_KEY);
    } catch {
      // Ignore clear errors
    }

    setMessages([
      {
        id: 'welcome',
        type: 'bot',
        content: WELCOME_MESSAGE,
        timestamp: new Date()
      }
    ]);
    setProducts(new Map());
    setError(null);
    setQueuePosition(null);
  };

  const handleProductView = (product: ChatProduct) => {
    onSelectProduct(product);
    onClose();
  };

  const handleProductAddToCart = (product: ChatProduct) => {
    const variant = product.variants?.[0];
    if (!variant) return;

    const cartItem: CartItem = {
      variant_id: `${product.id}_${variant.sku}`,
      product_id: product.id,
      name: { pt: product.name, en: product.name, es: product.name, fr: product.name },
      image: product.images?.[0] || '',
      size: variant.size,
      color_name: { pt: variant.color, en: variant.color, es: variant.color, fr: variant.color },
      color_hex: variant.color_hex,
      price: variant.retail_price,
      quantity: 1,
      sku: variant.sku
    };

    onAddToCart(cartItem);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[300]"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-[301] flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-100 bg-black text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider">Assistente Auricapri</h2>
              <p className="text-[10px] text-white/70">Online agora</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleClearChat}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
              title="Limpar conversa"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Queue Status */}
        {queuePosition !== null && queuePosition > 0 && (
          <div className="px-4 py-2 bg-amber-50 border-b border-amber-100 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
            <span className="text-xs text-amber-700">
              Posicao na fila: <strong>{queuePosition}</strong>
            </span>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="px-4 py-2 bg-red-50 border-b border-red-100 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span className="text-xs text-red-700">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto p-1 hover:bg-red-100 rounded-full"
            >
              <X className="w-3 h-3 text-red-600" />
            </button>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(message => (
            <React.Fragment key={message.id}>
              <ChatMessage message={message} />

              {/* Products Grid */}
              {products.get(message.id) && (
                <div className="grid grid-cols-2 gap-2 mt-3 ml-11 max-w-[calc(100%-44px)]">
                  {products.get(message.id)!.map(product => (
                    <ChatProductCard
                      key={product.id}
                      product={product}
                      locale={locale}
                      onView={() => handleProductView(product)}
                      onAddToCart={() => handleProductAddToCart(product)}
                    />
                  ))}
                </div>
              )}
            </React.Fragment>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-neutral-100 bg-white">
          <div className="flex items-center gap-3">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua mensagem..."
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-neutral-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading}
              className="p-3 bg-black text-white rounded-xl hover:bg-neutral-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
          <p className="text-[9px] text-neutral-400 text-center mt-2">
            Assistente com IA para ajudar nas suas compras
          </p>
        </div>
      </div>
    </>
  );
};
