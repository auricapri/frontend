/**
 * DescriptionEditor - Marketplace description editor with templates
 */

import React, { useState } from 'react';
import { AiAssistButton } from '../../../ui/ai';
import type { MarketplaceBrand } from '../types';

// ============================================================================
// Component Props
// ============================================================================

export interface DescriptionEditorProps {
  brand: MarketplaceBrand;
  value: string;
  originalDescription?: string;
  productMetrics?: {
    sales?: number;
    views?: number;
    rating?: number;
  };
  productContext?: {
    name?: string;
    category?: string;
    price?: number;
    tags?: string[];
  };
  onChange: (value: string) => void;
}

// ============================================================================
// Component
// ============================================================================

export const DescriptionEditor: React.FC<DescriptionEditorProps> = ({
  brand,
  value,
  originalDescription,
  productMetrics,
  productContext,
  onChange,
}) => {
  const [showPreview, setShowPreview] = useState(false);

  // Build AI context for description generation
  const aiContext = {
    marketplace: brand.name,
    productName: productContext?.name || 'Produto',
    category: productContext?.category || '',
    price: productContext?.price || 0,
    tags: productContext?.tags?.join(', ') || '',
    originalDescription: originalDescription || '',
    metrics: productMetrics
      ? `${productMetrics.sales || 0} vendidos, ${productMetrics.views || 0} visualizações, ${productMetrics.rating || 0}/5 avaliação`
      : '',
  };

  const descriptionPrompt = `Crie uma descrição de produto otimizada para o marketplace {{marketplace}}.

Dados do produto:
- Nome: {{productName}}
- Categoria: {{category}}
- Preço: R$ {{price}}
- Tags: {{tags}}
- Descrição original: {{originalDescription}}
- Métricas: {{metrics}}

Requisitos:
1. Use emojis estrategicamente para chamar atenção
2. Destaque benefícios e diferenciais
3. Inclua bullet points com características
4. Otimize para SEO do marketplace
5. Mantenha tom profissional mas atraente
6. Máximo 1500 caracteres

Retorne APENAS a descrição, sem explicações.`;

  // Template placeholders
  const insertMetrics = () => {
    const metricsText = `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 MÉTRICAS DO PRODUTO
${productMetrics?.sales ? `✅ ${productMetrics.sales}+ vendidos` : '✅ Produto mais vendido'}
${productMetrics?.views ? `👁️ ${productMetrics.views}+ visualizações` : '👁️ Alta visibilidade'}
${productMetrics?.rating ? `⭐ ${productMetrics.rating}/5 avaliação` : '⭐ Alta satisfação'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
    onChange(value + metricsText);
  };

  const insertEmojiBullets = () => {
    const bullets = `

✓ Qualidade premium
✓ Frete grátis
✓ Garantia de 30 dias
✓ Entrega rápida
`;
    onChange(value + bullets);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium">
          Descrição para {brand.name}
        </label>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="px-2 py-1 text-xs bg-neutral-100 hover:bg-neutral-200 rounded"
          >
            {showPreview ? 'Editar' : 'Preview'}
          </button>
        </div>
      </div>

      {showPreview ? (
        <div className="bg-neutral-50 border rounded-xl p-4 min-h-[200px] whitespace-pre-wrap text-sm">
          {value || 'Sem descrição'}
        </div>
      ) : (
        <>
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Descrição personalizada para o marketplace..."
            rows={8}
            className="w-full px-4 py-3 border rounded-xl resize-none text-sm"
          />

          {/* Quick Insert Buttons */}
          <div className="flex flex-wrap gap-2">
            <AiAssistButton
              label="Gerar descrição"
              variant="small"
              promptTemplate={descriptionPrompt}
              context={aiContext}
              onAccept={onChange}
              systemInstruction="Você é um especialista em copywriting para e-commerce e marketplaces brasileiros. Crie descrições que convertem vendas."
            />
            <button
              type="button"
              onClick={() => onChange(originalDescription || '')}
              className="px-3 py-1.5 text-xs bg-neutral-100 hover:bg-neutral-200 rounded-lg"
            >
              📋 Usar descrição original
            </button>
            <button
              type="button"
              onClick={insertMetrics}
              className="px-3 py-1.5 text-xs bg-neutral-100 hover:bg-neutral-200 rounded-lg"
            >
              📊 Inserir métricas
            </button>
            <button
              type="button"
              onClick={insertEmojiBullets}
              className="px-3 py-1.5 text-xs bg-neutral-100 hover:bg-neutral-200 rounded-lg"
            >
              ✓ Inserir bullets
            </button>
          </div>
        </>
      )}

      <p className="text-xs text-neutral-500">
        Dica: Use emojis e formatação para destacar seu anúncio no {brand.name}.
      </p>
    </div>
  );
};
