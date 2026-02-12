import React, { useState, useEffect } from 'react';
import { HelpCircle, Plus, Trash2, Edit3, Save, X, GripVertical, Loader2, Eye, EyeOff, Globe } from 'lucide-react';
import { FAQItem, LocalizedText } from '../../types';
import { faqApi } from '../../api/instances';
import { Locale } from '../../i18n';

interface AdminFAQProps {
  locale: Locale;
}

const LOCALES: { code: Locale; label: string }[] = [
  { code: 'pt', label: 'Português' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
];

const AdminFAQ: React.FC<AdminFAQProps> = ({ locale }) => {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLocale, setEditLocale] = useState<Locale>(locale);
  const [formData, setFormData] = useState<Partial<FAQItem>>({});
  const [saving, setSaving] = useState(false);

  // Helper to get/set localized text
  const getLoc = (obj: LocalizedText | undefined, loc: Locale): string => {
    if (!obj) return '';
    if (typeof obj === 'string') return obj;
    return obj[loc] || obj['pt'] || '';
  };

  const setLoc = (obj: LocalizedText | undefined, loc: Locale, value: string): LocalizedText => {
    const base = typeof obj === 'object' ? { ...obj } : {};
    return { ...base, [loc]: value };
  };

  // Load FAQs
  useEffect(() => {
    loadFAQs();
  }, []);

  const loadFAQs = async () => {
    setLoading(true);
    try {
      const data = await faqApi.getAllAdmin();
      setFaqs(data);
    } catch (err) {
      console.error('Error loading FAQs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingId('new');
    setFormData({
      question: { pt: '', en: '', es: '' },
      answer: { pt: '', en: '', es: '' },
      is_active: true,
      sort_order: faqs.length,
    });
    setEditLocale('pt');
  };

  const handleEdit = (faq: FAQItem) => {
    setEditingId(faq.id);
    setFormData({ ...faq });
    setEditLocale('pt');
  };

  const handleSave = async () => {
    const question = formData.question;
    const answer = formData.answer;

    // Validate at least Portuguese content
    if (!getLoc(question, 'pt') || !getLoc(answer, 'pt')) {
      alert('Pergunta e resposta em Português são obrigatórias.');
      return;
    }

    setSaving(true);
    try {
      if (editingId === 'new') {
        const created = await faqApi.create(formData);
        setFaqs(prev => [...prev, created]);
      } else if (editingId) {
        const updated = await faqApi.update(editingId, formData);
        setFaqs(prev => prev.map(f => f.id === editingId ? updated : f));
      }
      setEditingId(null);
      setFormData({});
    } catch (err: any) {
      alert(`Erro ao salvar: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta pergunta?')) return;
    try {
      await faqApi.delete(id);
      setFaqs(prev => prev.filter(f => f.id !== id));
    } catch (err: any) {
      alert(`Erro ao excluir: ${err.message}`);
    }
  };

  const handleToggleActive = async (faq: FAQItem) => {
    try {
      const updated = await faqApi.update(faq.id, { is_active: !faq.is_active });
      setFaqs(prev => prev.map(f => f.id === faq.id ? updated : f));
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    }
  };

  const handleReorder = async (draggedId: string, targetId: string) => {
    const draggedIndex = faqs.findIndex(f => f.id === draggedId);
    const targetIndex = faqs.findIndex(f => f.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newFaqs = [...faqs];
    const [removed] = newFaqs.splice(draggedIndex, 1);
    newFaqs.splice(targetIndex, 0, removed);

    setFaqs(newFaqs);

    try {
      await faqApi.reorder(newFaqs.map(f => f.id));
    } catch (err: any) {
      console.error('Error reordering:', err);
      loadFAQs(); // Reload on error
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-24">
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-3xl font-black uppercase italic tracking-tighter flex items-center gap-4">
            <HelpCircle className="w-8 h-8" /> Perguntas Frequentes
          </h3>
          <p className="text-[10px] font-bold uppercase text-neutral-400 tracking-widest mt-2">
            Gerencie as FAQs exibidas no site. Suporte multilíngue (PT, EN, ES).
          </p>
        </div>
        {!editingId && (
          <button
            onClick={handleCreate}
            className="px-8 py-4 bg-black text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 shadow-xl hover:scale-105 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" /> Nova Pergunta
          </button>
        )}
      </div>

      {/* Editor Panel */}
      {editingId && (
        <div className="bg-white p-8 md:p-12 rounded-[3rem] border border-neutral-100 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-500 mb-12 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-black" />

          <div className="flex justify-between items-center mb-10">
            <h4 className="text-xl font-black uppercase italic tracking-tighter">
              {editingId === 'new' ? 'Nova Pergunta' : 'Editar Pergunta'}
            </h4>
            <button
              onClick={() => setEditingId(null)}
              className="p-3 bg-neutral-50 rounded-full hover:bg-neutral-100 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Language Tabs */}
          <div className="flex gap-2 mb-8">
            {LOCALES.map(loc => (
              <button
                key={loc.code}
                onClick={() => setEditLocale(loc.code)}
                className={`px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                  editLocale === loc.code
                    ? 'bg-black text-white'
                    : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                }`}
              >
                <Globe className="w-3 h-3" />
                {loc.label}
              </button>
            ))}
          </div>

          <div className="space-y-8">
            {/* Question Field */}
            <div className="space-y-4">
              <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400">
                Pergunta ({editLocale.toUpperCase()})
              </label>
              <input
                className="w-full p-6 bg-neutral-50 border border-neutral-100 rounded-[1.5rem] text-lg font-bold outline-none focus:bg-white focus:border-black transition-all placeholder:text-neutral-300"
                placeholder="Digite a pergunta..."
                value={getLoc(formData.question as LocalizedText, editLocale)}
                onChange={e => setFormData({
                  ...formData,
                  question: setLoc(formData.question as LocalizedText, editLocale, e.target.value)
                })}
                autoFocus
              />
            </div>

            {/* Answer Field */}
            <div className="space-y-4">
              <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400">
                Resposta ({editLocale.toUpperCase()})
              </label>
              <textarea
                className="w-full p-6 bg-neutral-50 border border-neutral-100 rounded-[1.5rem] text-base outline-none focus:bg-white focus:border-black transition-all placeholder:text-neutral-300 min-h-[200px] resize-y"
                placeholder="Digite a resposta..."
                value={getLoc(formData.answer as LocalizedText, editLocale)}
                onChange={e => setFormData({
                  ...formData,
                  answer: setLoc(formData.answer as LocalizedText, editLocale, e.target.value)
                })}
              />
            </div>

            {/* Active Toggle */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                className={`px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                  formData.is_active
                    ? 'bg-green-100 text-green-700'
                    : 'bg-neutral-100 text-neutral-400'
                }`}
              >
                {formData.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                {formData.is_active ? 'Visível' : 'Oculto'}
              </button>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-4 pt-6 border-t border-neutral-50 mt-auto">
              <button
                onClick={() => setEditingId(null)}
                className="px-8 py-5 border border-neutral-200 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-neutral-50 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !getLoc(formData.question as LocalizedText, 'pt') || !getLoc(formData.answer as LocalizedText, 'pt')}
                className="px-12 py-5 bg-black text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:scale-105 transition-all flex items-center gap-3 disabled:opacity-50 disabled:hover:scale-100"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAQ List */}
      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <div
            key={faq.id}
            draggable
            onDragStart={(e) => e.dataTransfer.setData('text/plain', faq.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const draggedId = e.dataTransfer.getData('text/plain');
              handleReorder(draggedId, faq.id);
            }}
            className={`group bg-white rounded-[2rem] border transition-all duration-300 p-6 flex items-start gap-4 shadow-sm hover:shadow-lg cursor-move ${
              faq.is_active ? 'border-neutral-100 hover:border-black' : 'border-neutral-100 opacity-50'
            }`}
          >
            {/* Drag Handle */}
            <div className="flex-none pt-1 text-neutral-300 group-hover:text-neutral-500 transition-colors">
              <GripVertical className="w-5 h-5" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-[9px] font-black uppercase tracking-widest text-neutral-300">
                  #{index + 1}
                </span>
                {!faq.is_active && (
                  <span className="px-2 py-0.5 bg-neutral-100 text-neutral-400 text-[8px] font-black uppercase tracking-widest rounded-full">
                    Oculto
                  </span>
                )}
              </div>
              <h4 className="text-base font-bold text-neutral-900 mb-2 line-clamp-2">
                {getLoc(faq.question, locale)}
              </h4>
              <p className="text-sm text-neutral-500 line-clamp-2">
                {getLoc(faq.answer, locale)}
              </p>
            </div>

            {/* Actions */}
            <div className="flex-none flex items-center gap-2">
              <button
                onClick={() => handleToggleActive(faq)}
                className={`p-2.5 rounded-xl transition-all ${
                  faq.is_active
                    ? 'bg-green-50 text-green-600 hover:bg-green-100'
                    : 'bg-neutral-100 text-neutral-400 hover:bg-neutral-200'
                }`}
                title={faq.is_active ? 'Ocultar' : 'Mostrar'}
              >
                {faq.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
              <button
                onClick={() => handleEdit(faq)}
                className="p-2.5 bg-neutral-100 rounded-xl hover:bg-black hover:text-white transition-all"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(faq.id)}
                className="p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {!editingId && faqs.length === 0 && (
          <div className="py-20 text-center flex flex-col items-center justify-center text-neutral-300 space-y-6 border-2 border-dashed border-neutral-100 rounded-[3rem]">
            <div className="w-20 h-20 bg-neutral-50 rounded-full flex items-center justify-center">
              <HelpCircle className="w-8 h-8 opacity-20" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-black uppercase tracking-widest text-neutral-400">
                Nenhuma pergunta cadastrada
              </p>
              <p className="text-[10px] text-neutral-300 uppercase tracking-widest">
                Adicione perguntas frequentes para ajudar seus clientes
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminFAQ;
