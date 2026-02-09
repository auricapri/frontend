/**
 * useAiPersonal - Hook for AI Personal chat with streaming
 */

import { useState, useCallback, useRef } from 'react';
import { aiPersonalApi, PersonalChatEvent } from '../api/ai-personal.api';
import { useAuth } from './useAuth';

export interface UseAiPersonalOptions {
  /** Callback when generation completes */
  onComplete?: (text: string) => void;
  /** Callback for each text chunk */
  onChunk?: (chunk: string) => void;
  /** Callback when an image is generated */
  onImage?: (imageUrl: string) => void;
  /** Callback for errors */
  onError?: (error: string) => void;
}

export interface UseAiPersonalReturn {
  /** Current generated text */
  text: string;
  /** Whether generation is in progress */
  isGenerating: boolean;
  /** Error message if any */
  error: string | null;
  /** Generated images */
  images: string[];
  /** Start generating content */
  generate: (prompt: string) => Promise<void>;
  /** Generate with context (better for descriptions) */
  generateWithContext: (prompt: string, context: Record<string, unknown>) => Promise<void>;
  /** Abort current generation */
  abort: () => void;
  /** Clear current state */
  clear: () => void;
  /** Get refined prompt suggestions */
  refine: (prompt: string, context?: string) => Promise<string[]>;
}

export function useAiPersonal(options: UseAiPersonalOptions = {}): UseAiPersonalReturn {
  const { onComplete, onChunk, onImage, onError } = options;
  const { user } = useAuth();

  const [text, setText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);

  const abortControllerRef = useRef<AbortController | null>(null);
  const accumulatedTextRef = useRef('');

  const handleEvent = useCallback((event: PersonalChatEvent) => {
    switch (event.type) {
      case 'text':
        if (event.content) {
          accumulatedTextRef.current += event.content;
          setText(accumulatedTextRef.current);
          onChunk?.(event.content);
        }
        break;
      case 'image':
        if (event.image_url) {
          setImages(prev => [...prev, event.image_url!]);
          onImage?.(event.image_url);
        }
        break;
      case 'done':
        setIsGenerating(false);
        onComplete?.(accumulatedTextRef.current);
        break;
      case 'error':
        setIsGenerating(false);
        const errorMsg = event.error || 'Unknown error';
        setError(errorMsg);
        onError?.(errorMsg);
        break;
    }
  }, [onComplete, onChunk, onImage, onError]);

  const generate = useCallback(async (prompt: string) => {
    // Reset state
    setText('');
    setError(null);
    setImages([]);
    accumulatedTextRef.current = '';
    setIsGenerating(true);

    // Create abort controller
    abortControllerRef.current = new AbortController();

    const userId = user?.id || `anon-${Date.now()}`;

    try {
      await aiPersonalApi.chat(
        { user_id: userId, message: prompt },
        handleEvent,
        abortControllerRef.current.signal
      );
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        // User cancelled
        setIsGenerating(false);
        return;
      }
      const errorMsg = err instanceof Error ? err.message : 'Failed to generate';
      setError(errorMsg);
      onError?.(errorMsg);
      setIsGenerating(false);
    }
  }, [user?.id, handleEvent, onError]);

  const generateWithContext = useCallback(async (prompt: string, context: Record<string, unknown>) => {
    // Build enhanced prompt with context
    const contextStr = Object.entries(context)
      .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
      .join('\n');

    const enhancedPrompt = `Context:\n${contextStr}\n\nTask: ${prompt}`;
    return generate(enhancedPrompt);
  }, [generate]);

  const abort = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsGenerating(false);
  }, []);

  const clear = useCallback(() => {
    setText('');
    setError(null);
    setImages([]);
    accumulatedTextRef.current = '';
  }, []);

  const refine = useCallback(async (prompt: string, context?: string): Promise<string[]> => {
    try {
      const response = await aiPersonalApi.refine({ prompt, context });
      return response.suggestions || [];
    } catch (err) {
      console.error('Failed to refine prompt:', err);
      return [];
    }
  }, []);

  return {
    text,
    isGenerating,
    error,
    images,
    generate,
    generateWithContext,
    abort,
    clear,
    refine,
  };
}
