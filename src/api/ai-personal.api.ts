/**
 * AI Personal API Service
 * Comunicação com a API de IA pessoal para geração de conteúdo
 * Baseado em api_ia_integration.pdf
 */

import { apiClient } from './client';

// ============================================================================
// Types - Request
// ============================================================================

export interface PersonalChatFile {
  name: string;
  content: string; // base64
}

export interface PersonalChatRequest {
  user_id: string;
  message: string;
  files?: PersonalChatFile[];
  force_web_search?: boolean;
  force_image_gen?: boolean;
  force_map?: boolean;
  user_location?: { lat: number; lng: number };
  persona?: 'professional' | 'creative' | 'tutor' | null;
}

// ============================================================================
// Types - SSE Events (api_ia_integration.pdf page 9-10)
// ============================================================================

/**
 * All possible status values from the API
 */
export type SSEStatusType =
  | 'thinking'
  | 'searching'
  | 'warning'
  | 'queued'
  | 'tool_call'
  | 'tool_executing'
  | 'tool_result'
  | 'map_data'
  | 'diagram_data'
  | 'table_data'
  | 'task_list_data'
  | 'image_gen'
  | 'file_analysis_data'
  | 'price_comparison_data'
  | 'movie_data'
  | 'weather_data'
  | 'finance_data'
  | 'wikipedia_data'
  | 'book_analysis_started'
  | 'enrichment_ready'
  | 'quick_response_data'
  | 'analyzing_image'
  | 'mood_selector'
  | 'speaker_identified'
  | 'emotion_update'
  | 'guardian_greeting'
  | 'sandbox_progress';

/**
 * SSE Event from AI API
 * Events are identified by their fields (text, done, error, status)
 */
export interface PersonalChatEvent {
  // Text chunk: { "text": "..." }
  text?: string;

  // Done: { "done": true, "tools_used": [...], "message_id": "uuid" }
  done?: boolean;
  tools_used?: string[];
  message_id?: string;

  // Error: { "error": "message" }
  error?: string;

  // Status events: { "status": "thinking" | "tool_call" | "map_data" | etc., ... }
  status?: SSEStatusType;

  // Tool call data (when status = "tool_call" or "tool_executing")
  tool?: string;
  display?: string;
  args?: Record<string, unknown>;

  // Tool result data (when status = "tool_result")
  summary?: string;

  // Widget data (when status = "map_data", "image_gen", etc.)
  data?: Record<string, unknown>;

  // Status-specific fields
  message?: string;
  position?: number;
  step?: string;
  detail?: string;

  // Image generation specific
  image_url?: string;
  supabase_url?: string;
  image_id?: string;

  // Mood selector
  mood_selector?: boolean;
  emojis?: Record<string, string>;

  // Speaker/emotion
  speaker_name?: string;
  confidence?: number;
  emotion?: string;
  source?: string;

  // Guardian greeting
  greeting?: string;
  question?: string;
}

export interface RefinePromptRequest {
  prompt: string;
  user_id: string;
}

export interface RefinePromptResponse {
  original: string;
  suggestions: string[];
}

// ============================================================================
// SSE Parser
// ============================================================================

/**
 * Parse SSE event line according to api_ia_integration.pdf format
 * Format: data: {JSON} + padding to 2048 bytes for Cloudflare
 */
export function parseSSEEvent(line: string): PersonalChatEvent | null {
  if (!line.startsWith('data: ')) return null;

  const data = line.slice(6).trim();

  // Handle special [DONE] marker (legacy compatibility)
  if (data === '[DONE]') {
    return { done: true };
  }

  // Empty data
  if (!data) return null;

  try {
    const parsed = JSON.parse(data) as PersonalChatEvent;
    return parsed;
  } catch {
    // If not valid JSON, treat as plain text chunk
    return { text: data };
  }
}

/**
 * Helper to identify event type from parsed event
 */
export type EventType =
  | 'text'
  | 'done'
  | 'error'
  | 'status'
  | 'image'
  | 'unknown';

export function getEventType(event: PersonalChatEvent): EventType {
  if (event.text !== undefined) return 'text';
  if (event.done) return 'done';
  if (event.error) return 'error';
  if (event.status) return 'status';
  if (event.image_url) return 'image';
  return 'unknown';
}

/**
 * Check if event is a terminal event (done or error)
 */
export function isTerminalEvent(event: PersonalChatEvent): boolean {
  return Boolean(event.done || event.error);
}

// ============================================================================
// API Class
// ============================================================================

export class AiPersonalApi {
  private getApiBaseUrl(): string {
    return import.meta.env.VITE_API_URL || 'http://localhost:3002/api';
  }

  private async getAuthToken(): Promise<string | null> {
    const { supabase } = await import('../utils/supabase');
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  }

  /**
   * Envia mensagem para o chat pessoal com streaming SSE
   * POST /personal/chat
   */
  async chat(
    request: PersonalChatRequest,
    onEvent: (event: PersonalChatEvent) => void,
    signal?: AbortSignal
  ): Promise<void> {
    const token = await this.getAuthToken();

    const response = await fetch(`${this.getApiBaseUrl()}/ai/personal/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify(request),
      signal,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(error.error || error.message || 'Failed to connect to AI service');
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(':')) continue;

          const event = parseSSEEvent(trimmed);
          if (event) {
            onEvent(event);
            if (isTerminalEvent(event)) {
              return;
            }
          }
        }
      }

      // Process remaining buffer
      if (buffer.trim()) {
        const event = parseSSEEvent(buffer.trim());
        if (event) onEvent(event);
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Chat com arquivo (imagem para análise/vision)
   * Converte imagem para base64 e envia
   */
  async chatWithImage(
    userId: string,
    message: string,
    imageFile: File,
    onEvent: (event: PersonalChatEvent) => void,
    signal?: AbortSignal
  ): Promise<void> {
    // Convert file to base64
    const base64 = await this.fileToBase64(imageFile);

    const request: PersonalChatRequest = {
      user_id: userId,
      message,
      files: [{
        name: imageFile.name,
        content: base64,
      }],
    };

    return this.chat(request, onEvent, signal);
  }

  /**
   * Chat com URL de imagem (converte para base64)
   */
  async chatWithImageUrl(
    userId: string,
    message: string,
    imageUrl: string,
    onEvent: (event: PersonalChatEvent) => void,
    signal?: AbortSignal
  ): Promise<void> {
    // Fetch image and convert to base64
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const base64 = await this.blobToBase64(blob);
    const fileName = imageUrl.split('/').pop() || 'image.jpg';

    const request: PersonalChatRequest = {
      user_id: userId,
      message,
      files: [{
        name: fileName,
        content: base64,
      }],
    };

    return this.chat(request, onEvent, signal);
  }

  /**
   * Refina um prompt retornando 3 sugestões
   * POST /personal/refine
   */
  async refine(request: RefinePromptRequest): Promise<RefinePromptResponse> {
    return apiClient.post<RefinePromptResponse>('/ai/personal/refine', request);
  }

  /**
   * Limpa a sessão do chat pessoal
   * DELETE /personal/session/{user_id}
   */
  async clearSession(userId: string): Promise<{ status: string; message: string }> {
    return apiClient.delete(`/ai/personal/session/${encodeURIComponent(userId)}`);
  }

  // ============================================================================
  // Helpers
  // ============================================================================

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix (data:image/jpeg;base64,)
        const base64 = result.split(',')[1] || result;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1] || result;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}

export const aiPersonalApi = new AiPersonalApi();
