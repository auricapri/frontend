/**
 * AI Personal API Service
 * Comunicação com a API de IA pessoal para geração de conteúdo
 */

import { apiClient } from './client';

// ============================================================================
// Types
// ============================================================================

export interface PersonalChatRequest {
  user_id: string;
  message: string;
}

export interface PersonalChatEvent {
  type: 'text' | 'tool_start' | 'tool_result' | 'image' | 'done' | 'error';
  content?: string;
  tool?: string;
  tool_input?: Record<string, unknown>;
  result?: unknown;
  image_url?: string;
  error?: string;
}

export interface RefinePromptRequest {
  prompt: string;
  context?: string;
}

export interface RefinePromptResponse {
  suggestions: string[];
}

// ============================================================================
// SSE Parser
// ============================================================================

export function parseSSEEvent(line: string): PersonalChatEvent | null {
  if (!line.startsWith('data: ')) return null;

  const data = line.slice(6).trim();
  if (data === '[DONE]') {
    return { type: 'done' };
  }

  try {
    return JSON.parse(data);
  } catch {
    // Plain text content
    return { type: 'text', content: data };
  }
}

// ============================================================================
// API Class
// ============================================================================

export class AiPersonalApi {
  /**
   * Envia mensagem para o chat pessoal com streaming SSE
   * @param request - Dados da requisição
   * @param onEvent - Callback para eventos SSE
   * @param signal - AbortSignal para cancelamento
   */
  async chat(
    request: PersonalChatRequest,
    onEvent: (event: PersonalChatEvent) => void,
    signal?: AbortSignal
  ): Promise<void> {
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';

    // Get auth token
    const { supabase } = await import('../utils/supabase');
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const response = await fetch(`${API_BASE_URL}/ai/personal/chat`, {
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
            if (event.type === 'done' || event.type === 'error') {
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
   * Refina um prompt retornando 3 sugestões
   */
  async refine(request: RefinePromptRequest): Promise<RefinePromptResponse> {
    return apiClient.post<RefinePromptResponse>('/ai/personal/refine', request);
  }

  /**
   * Limpa a sessão do chat pessoal
   */
  async clearSession(userId: string): Promise<{ status: string; message: string }> {
    return apiClient.delete(`/ai/personal/session/${encodeURIComponent(userId)}`);
  }
}

export const aiPersonalApi = new AiPersonalApi();
