import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MessageCircle, GitBranch, Sparkles, Image as ImageIcon } from 'lucide-react';
import { DreamCard, Category, LocalizedText } from '../../../types';
import { Locale } from '../../../i18n';

interface DreamCardComponentProps {
  card: DreamCard;
  category?: Category;
  locale: Locale;
  onClick: () => void;
  isDragging?: boolean;
  isLastColumn?: boolean;
}

const getLocalizedText = (text: LocalizedText | string | undefined, locale: Locale): string => {
  if (!text) return '';
  if (typeof text === 'string') return text;
  return text[locale] || text.pt || text.en || '';
};

const DreamCardComponent: React.FC<DreamCardComponentProps> = ({
  card,
  category,
  locale,
  onClick,
  isDragging,
  isLastColumn,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const hasDiagram = card.metadata?.diagram?.nodes?.length > 0;
  const hasAssets = card.metadata?.associated_assets?.length > 0;
  const hasDraft = card.metadata?.draft_product_id;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`
        bg-white rounded-xl border border-neutral-100 shadow-sm cursor-pointer
        hover:shadow-md hover:border-neutral-200 transition-all
        ${isDragging || isSortableDragging ? 'opacity-50 shadow-lg rotate-2' : ''}
      `}
    >
      {card.image_url && (
        <div className="relative h-32 rounded-t-xl overflow-hidden bg-neutral-100">
          <img
            src={card.image_url}
            alt={card.title}
            className="w-full h-full object-cover"
          />
          {isLastColumn && !hasDraft && (
            <div className="absolute top-2 right-2 px-2 py-1 bg-emerald-500 text-white text-[10px] font-bold uppercase rounded-md flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Pronto
            </div>
          )}
          {hasDraft && (
            <div className="absolute top-2 right-2 px-2 py-1 bg-blue-500 text-white text-[10px] font-bold uppercase rounded-md">
              Rascunho
            </div>
          )}
        </div>
      )}

      {!card.image_url && (
        <div className="h-20 rounded-t-xl bg-gradient-to-br from-neutral-100 to-neutral-50 flex items-center justify-center">
          <ImageIcon className="w-8 h-8 text-neutral-300" />
        </div>
      )}

      <div className="p-3">
        <h4 className="font-bold text-sm text-neutral-900 line-clamp-2 mb-2">
          {card.title}
        </h4>

        {card.description && (
          <p className="text-xs text-neutral-500 line-clamp-2 mb-3">
            {card.description}
          </p>
        )}

        {category && (
          <span className="inline-block px-2 py-1 bg-neutral-100 text-neutral-600 text-[10px] font-medium rounded-md mb-3">
            {getLocalizedText(category.name, locale)}
          </span>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-neutral-50">
          <div className="flex items-center gap-3">
            {(card.comments_count ?? 0) > 0 && (
              <div className="flex items-center gap-1 text-neutral-400">
                <MessageCircle className="w-3.5 h-3.5" />
                <span className="text-[10px] font-medium">{card.comments_count}</span>
              </div>
            )}
            {hasDiagram && (
              <div className="flex items-center gap-1 text-indigo-400">
                <GitBranch className="w-3.5 h-3.5" />
              </div>
            )}
            {hasAssets && (
              <div className="flex items-center gap-1 text-amber-400">
                <span className="text-[10px] font-medium">
                  {card.metadata?.associated_assets?.length} insumos
                </span>
              </div>
            )}
          </div>

          {card.created_at && (
            <span className="text-[10px] text-neutral-300">
              {new Date(card.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default DreamCardComponent;

