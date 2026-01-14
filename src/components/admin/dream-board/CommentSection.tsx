import React, { useState, useEffect } from 'react';
import { Send, Loader2, User } from 'lucide-react';
import { DreamComment } from '../../../types';
import { Locale } from '../../../i18n';
import { DreamApi } from '../../../api/dream.api';
import { supabase } from '../../../utils/supabase';

interface CommentSectionProps {
  cardId: string;
  locale: Locale;
}

const CommentSection: React.FC<CommentSectionProps> = ({ cardId, locale: _locale }) => {
  const [comments, setComments] = useState<DreamComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string } | null>(null);

  const dreamApi = new DreamApi();

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const data = await dreamApi.getCommentsByCardId(cardId);
        setComments(data);
      } catch (error) {
        console.error('Error fetching comments:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('full_name')
          .eq('id', user.id)
          .single();
        
        setCurrentUser({
          id: user.id,
          name: profile?.full_name || user.email || 'Usuario',
        });
      }
    };

    fetchComments();
    fetchUser();
  }, [cardId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser) return;

    setIsSending(true);
    try {
      const comment = await dreamApi.createComment(cardId, {
        content: newComment,
        user_id: currentUser.id,
        user_name: currentUser.name,
      });
      setComments(prev => [...prev, comment]);
      setNewComment('');
    } catch (error) {
      console.error('Error creating comment:', error);
    } finally {
      setIsSending(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'agora';
    if (diffMins < 60) return `${diffMins}min atras`;
    if (diffHours < 24) return `${diffHours}h atras`;
    if (diffDays < 7) return `${diffDays}d atras`;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-12 bg-neutral-50 rounded-xl">
            <p className="text-neutral-400">Nenhum comentario ainda</p>
            <p className="text-xs text-neutral-300 mt-1">Seja o primeiro a comentar!</p>
          </div>
        ) : (
          comments.map(comment => (
            <div key={comment.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-neutral-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">{comment.user_name}</span>
                  <span className="text-xs text-neutral-400">{formatDate(comment.created_at)}</span>
                </div>
                <p className="text-sm text-neutral-600 bg-neutral-50 rounded-xl px-4 py-3">
                  {comment.content}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Escreva um comentario..."
            className="flex-1 px-4 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black"
            disabled={isSending}
          />
          <button
            type="submit"
            disabled={!newComment.trim() || isSending}
            className="px-4 py-2 bg-black text-white rounded-xl hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CommentSection;
