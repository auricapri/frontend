/**
 * QuestionsTab - Marketplace buyer questions with answer functionality
 */

import React, { useState, useEffect } from 'react';
import { MessageCircle, Loader2 } from 'lucide-react';
import { marketplaceApi } from '../../../../api/marketplace.api';
import { logger } from '../../../../utils/logger';
import type { MarketplaceBrand } from '../types';

// ============================================================================
// Component Props
// ============================================================================

export interface QuestionsTabProps {
  brand: MarketplaceBrand;
  configId?: string;
}

// ============================================================================
// Component
// ============================================================================

export const QuestionsTab: React.FC<QuestionsTabProps> = ({ brand, configId }) => {
  const [questions, setQuestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [answeringId, setAnsweringId] = useState<number | null>(null);
  const [answerText, setAnswerText] = useState('');

  useEffect(() => {
    loadQuestions();
  }, [configId]);

  const loadQuestions = async () => {
    if (!configId) return;
    try {
      const result = await marketplaceApi.getQuestions(configId, { limit: 50 });
      setQuestions(result.questions || []);
    } catch (err) {
      logger.error('Failed to load questions', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswer = async (questionId: number) => {
    if (!configId || !answerText.trim()) return;
    try {
      await marketplaceApi.answerQuestion(configId, String(questionId), answerText);
      setAnsweringId(null);
      setAnswerText('');
      loadQuestions();
    } catch (err) {
      logger.error('Failed to answer question', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-16">
        <MessageCircle className="w-12 h-12 mx-auto mb-4 text-neutral-300" />
        <h3 className="text-lg font-bold mb-2">Nenhuma pergunta</h3>
        <p className="text-neutral-500">As perguntas dos compradores aparecerão aqui</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {questions.map((q: any) => (
        <div key={q.id} className="bg-white rounded-xl border p-4">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    q.status === 'ANSWERED'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {q.status === 'ANSWERED' ? 'Respondida' : 'Pendente'}
                </span>
                <span className="text-xs text-neutral-500">{q.from?.nickname}</span>
              </div>
              <p className="text-sm bg-neutral-50 p-3 rounded-lg">{q.text}</p>

              {q.answer && (
                <div
                  className="mt-3 pl-4 border-l-2"
                  style={{ borderColor: brand.accentColor }}
                >
                  <p className="text-sm">{q.answer.text}</p>
                </div>
              )}
            </div>

            {q.status !== 'ANSWERED' && (
              <div>
                {answeringId === q.id ? (
                  <div className="w-64 space-y-2">
                    <textarea
                      value={answerText}
                      onChange={(e) => setAnswerText(e.target.value)}
                      placeholder="Sua resposta..."
                      className="w-full px-3 py-2 text-sm border rounded-lg resize-none"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => setAnsweringId(null)}
                        className="flex-1 px-3 py-1.5 text-xs border rounded-lg hover:bg-neutral-50"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => handleAnswer(q.id)}
                        className={`flex-1 px-3 py-1.5 text-xs rounded-lg ${brand.bgColor} ${brand.textColor}`}
                      >
                        Enviar
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setAnsweringId(q.id)}
                    className={`px-4 py-2 text-xs font-medium rounded-lg ${brand.bgColor} ${brand.textColor}`}
                  >
                    Responder
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
