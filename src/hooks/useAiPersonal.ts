/**
 * useAiPersonal - Hook for AI Personal chat with streaming
 * Updated to match api_ia_integration.pdf format
 */

import { useState, useCallback, useRef } from 'react';
import {
  aiPersonalApi,
  PersonalChatEvent,
  PersonalChatRequest,
  getEventType,
} from '../api/ai-personal.api';
import { useAuth } from './useAuth';

export interface UseAiPersonalOptions {
  /** Callback when generation completes */
  onComplete?: (text: string) => void;
  /** Callback for each text chunk */
  onChunk?: (chunk: string) => void;
  /** Callback when an image is generated */
  onImage?: (imageUrl: string) => void;
  /** Callback for status updates */
  onStatus?: (status: string, data?: Record<string, unknown>) => void;
  /** Callback for errors */
  onError?: (error: string) => void;
}

export interface UseAiPersonalReturn {
  /** Current generated text */
  text: string;
  /** Whether generation is in progress */
  isGenerating: boolean;
  /** Current status (thinking, searching, etc.) */
  currentStatus: string | null;
  /** Error message if any */
  error: string | null;
  /** Generated images */
  images: string[];
  /** Start generating content */
  generate: (prompt: string) => Promise<void>;
  /** Generate with full request options */
  generateWithOptions: (request: Partial<PersonalChatRequest>) => Promise<void>;
  /** Generate description from image URL */
  generateFromImage: (imageUrl: string, prompt?: string) => Promise<void>;
  /** Generate description from image file */
  generateFromImageFile: (file: File, prompt?: string) => Promise<void>;
  /** Abort current generation */
  abort: () => void;
  /** Clear current state */
  clear: () => void;
  /** Get refined prompt suggestions */
  refine: (prompt: string, context?: string) => Promise<string[]>;
}

export function useAiPersonal(options: UseAiPersonalOptions = {}): UseAiPersonalReturn {
  const { onComplete, onChunk, onImage, onStatus, onError } = options;
  const { user } = useAuth();

  const [text, setText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);

  const abortControllerRef = useRef<AbortController | null>(null);
  const accumulatedTextRef = useRef('');

  const handleEvent = useCallback((event: PersonalChatEvent) => {
    const eventType = getEventType(event);

    switch (eventType) {
      case 'text':
        if (event.text) {
          accumulatedTextRef.current += event.text;
          setText(accumulatedTextRef.current);
          onChunk?.(event.text);
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
        setCurrentStatus(null);
        onComplete?.(accumulatedTextRef.current);
        break;

      case 'error':
        setIsGenerating(false);
        setCurrentStatus(null);
        const errorMsg = event.error || 'Unknown error';
        setError(errorMsg);
        onError?.(errorMsg);
        break;

      case 'status':
        if (event.status) {
          setCurrentStatus(event.status);
          onStatus?.(event.status, event.data);

          // Handle image generation status
          if (event.status === 'image_gen' && event.data) {
            const imgData = event.data as { status?: string; image_url?: string; supabase_url?: string };
            if (imgData.status === 'complete') {
              const imgUrl = imgData.image_url || imgData.supabase_url;
              if (imgUrl) {
                setImages(prev => [...prev, imgUrl]);
                onImage?.(imgUrl);
              }
            }
          }
        }
        break;
    }
  }, [onComplete, onChunk, onImage, onStatus, onError]);

  const getUserId = useCallback(() => {
    return user?.id || `anon-${Date.now()}`;
  }, [user?.id]);

  const generate = useCallback(async (prompt: string) => {
    // Reset state
    setText('');
    setError(null);
    setImages([]);
    setCurrentStatus('thinking');
    accumulatedTextRef.current = '';
    setIsGenerating(true);

    // Create abort controller
    abortControllerRef.current = new AbortController();

    try {
      await aiPersonalApi.chat(
        { user_id: getUserId(), message: prompt },
        handleEvent,
        abortControllerRef.current.signal
      );
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        setIsGenerating(false);
        setCurrentStatus(null);
        return;
      }
      const errorMsg = err instanceof Error ? err.message : 'Failed to generate';
      setError(errorMsg);
      onError?.(errorMsg);
      setIsGenerating(false);
      setCurrentStatus(null);
    }
  }, [getUserId, handleEvent, onError]);

  const generateWithOptions = useCallback(async (request: Partial<PersonalChatRequest>) => {
    // Reset state
    setText('');
    setError(null);
    setImages([]);
    setCurrentStatus('thinking');
    accumulatedTextRef.current = '';
    setIsGenerating(true);

    // Create abort controller
    abortControllerRef.current = new AbortController();

    try {
      await aiPersonalApi.chat(
        {
          user_id: getUserId(),
          message: request.message || '',
          ...request,
        },
        handleEvent,
        abortControllerRef.current.signal
      );
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        setIsGenerating(false);
        setCurrentStatus(null);
        return;
      }
      const errorMsg = err instanceof Error ? err.message : 'Failed to generate';
      setError(errorMsg);
      onError?.(errorMsg);
      setIsGenerating(false);
      setCurrentStatus(null);
    }
  }, [getUserId, handleEvent, onError]);

  const generateFromImage = useCallback(async (imageUrl: string, prompt?: string) => {
    // Reset state
    setText('');
    setError(null);
    setImages([]);
    setCurrentStatus('analyzing_image');
    accumulatedTextRef.current = '';
    setIsGenerating(true);

    // Create abort controller
    abortControllerRef.current = new AbortController();

    const defaultPrompt = prompt || 'Descreva este produto em detalhes para uso em um anúncio de e-commerce. Inclua: características visuais, materiais aparentes, cores, estilo, e possíveis usos. Responda apenas com a descrição, sem introduções.';

    try {
      await aiPersonalApi.chatWithImageUrl(
        getUserId(),
        defaultPrompt,
        imageUrl,
        handleEvent,
        abortControllerRef.current.signal
      );
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        setIsGenerating(false);
        setCurrentStatus(null);
        return;
      }
      const errorMsg = err instanceof Error ? err.message : 'Failed to analyze image';
      setError(errorMsg);
      onError?.(errorMsg);
      setIsGenerating(false);
      setCurrentStatus(null);
    }
  }, [getUserId, handleEvent, onError]);

  const generateFromImageFile = useCallback(async (file: File, prompt?: string) => {
    // Reset state
    setText('');
    setError(null);
    setImages([]);
    setCurrentStatus('analyzing_image');
    accumulatedTextRef.current = '';
    setIsGenerating(true);

    // Create abort controller
    abortControllerRef.current = new AbortController();

    const defaultPrompt = prompt || 'Descreva este produto em detalhes para uso em um anúncio de e-commerce. Inclua: características visuais, materiais aparentes, cores, estilo, e possíveis usos. Responda apenas com a descrição, sem introduções.';

    try {
      await aiPersonalApi.chatWithImage(
        getUserId(),
        defaultPrompt,
        file,
        handleEvent,
        abortControllerRef.current.signal
      );
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        setIsGenerating(false);
        setCurrentStatus(null);
        return;
      }
      const errorMsg = err instanceof Error ? err.message : 'Failed to analyze image';
      setError(errorMsg);
      onError?.(errorMsg);
      setIsGenerating(false);
      setCurrentStatus(null);
    }
  }, [getUserId, handleEvent, onError]);

  const abort = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsGenerating(false);
    setCurrentStatus(null);
  }, []);

  const clear = useCallback(() => {
    setText('');
    setError(null);
    setImages([]);
    setCurrentStatus(null);
    accumulatedTextRef.current = '';
  }, []);

  const refine = useCallback(async (prompt: string, context?: string): Promise<string[]> => {
    try {
      const response = await aiPersonalApi.refine({
        prompt: prompt,
        user_id: getUserId(),
      });
      return response?.suggestions || [];
    } catch (err) {
      console.error('Failed to refine prompt:', err);
      return [];
    }
  }, [getUserId]);

  return {
    text,
    isGenerating,
    currentStatus,
    error,
    images,
    generate,
    generateWithOptions,
    generateFromImage,
    generateFromImageFile,
    abort,
    clear,
    refine,
  };
}
