import React, { useCallback, useState, useRef, useEffect } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Youtube from '@tiptap/extension-youtube';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Image as ImageIcon,
  Youtube as YoutubeIcon,
  Link as LinkIcon,
  Quote,
  Undo,
  Redo,
  Upload,
  X,
  Loader2,
  Type,
  Minus,
} from 'lucide-react';
import { supabase } from '../../utils/supabase';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  mode: 'simple' | 'full';
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

// Compress image before upload
const compressImage = async (file: File, maxWidth = 1200, quality = 0.8): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = document.createElement('img');
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Could not compress image'));
            }
          },
          'image/webp',
          quality
        );
      };
      img.onerror = () => reject(new Error('Could not load image'));
    };
    reader.onerror = () => reject(new Error('Could not read file'));
  });
};

// Upload image to Supabase Storage
const uploadImageToStorage = async (file: File): Promise<string> => {
  try {
    // Compress image
    const compressedBlob = await compressImage(file);

    // Generate unique filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const fileName = `richtext/${timestamp}-${randomId}.webp`;

    // Upload to Supabase Storage (using 'products' bucket which already exists)
    const { data, error } = await supabase.storage
      .from('products')
      .upload(fileName, compressedBlob, {
        contentType: 'image/webp',
        cacheControl: '31536000',
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('products')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  mode,
  placeholder = 'Digite aqui...',
  className = '',
  minHeight = '200px',
}) => {
  const [showImageModal, setShowImageModal] = useState(false);
  const [showYoutubeModal, setShowYoutubeModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'url' | 'upload'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const extensions = [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3],
        HTMLAttributes: {
          class: 'font-bold',
        },
      },
      paragraph: {
        HTMLAttributes: {
          class: 'mb-2',
        },
      },
      bulletList: {
        HTMLAttributes: {
          class: 'list-disc pl-6 mb-4',
        },
      },
      orderedList: {
        HTMLAttributes: {
          class: 'list-decimal pl-6 mb-4',
        },
      },
      blockquote: {
        HTMLAttributes: {
          class: 'border-l-4 border-neutral-300 pl-4 italic my-4 text-neutral-600',
        },
      },
      horizontalRule: {
        HTMLAttributes: {
          class: 'my-6 border-t border-neutral-200',
        },
      },
    }),
    Underline,
    TextAlign.configure({
      types: ['heading', 'paragraph'],
    }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: 'text-blue-600 underline hover:text-blue-800 cursor-pointer',
      },
    }),
    Placeholder.configure({
      placeholder,
      emptyEditorClass: 'is-editor-empty',
    }),
    ...(mode === 'full'
      ? [
          Image.configure({
            inline: false,
            allowBase64: true,
            HTMLAttributes: {
              class: 'max-w-full h-auto rounded-lg my-4 mx-auto block',
            },
          }),
          Youtube.configure({
            width: 640,
            height: 360,
            nocookie: true,
            HTMLAttributes: {
              class: 'w-full aspect-video rounded-lg my-4',
            },
          }),
        ]
      : []),
  ];

  const editor = useEditor({
    extensions,
    content: value || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      // Don't emit empty paragraph as content
      if (html === '<p></p>' || html === '<p class="mb-2"></p>') {
        onChange('');
      } else {
        onChange(html);
      }
    },
    editorProps: {
      attributes: {
        class: 'focus:outline-none min-h-[inherit] p-4',
        style: `min-height: ${minHeight}`,
      },
    },
  });

  // Sync external value changes
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      const currentContent = editor.getHTML();
      const normalizedValue = value || '';
      const normalizedCurrent = currentContent === '<p></p>' || currentContent === '<p class="mb-2"></p>' ? '' : currentContent;

      if (normalizedValue !== normalizedCurrent) {
        editor.commands.setContent(normalizedValue, false);
      }
    }
  }, [value, editor]);

  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0 || !editor) return;

    const file = files[0];
    if (!file.type.startsWith('image/')) {
      setUploadError('Por favor, selecione um arquivo de imagem.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const url = await uploadImageToStorage(file);
      editor.chain().focus().setImage({ src: url }).run();
      setShowImageModal(false);
      setImageUrl('');
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadError('Erro ao fazer upload da imagem. Tente novamente.');
    } finally {
      setIsUploading(false);
    }
  }, [editor]);

  const addImageFromUrl = useCallback(() => {
    if (imageUrl && editor) {
      editor.chain().focus().setImage({ src: imageUrl }).run();
      setImageUrl('');
      setShowImageModal(false);
    }
  }, [editor, imageUrl]);

  const addYoutube = useCallback(() => {
    if (youtubeUrl && editor) {
      editor.chain().focus().setYoutubeVideo({ src: youtubeUrl }).run();
      setYoutubeUrl('');
      setShowYoutubeModal(false);
    }
  }, [editor, youtubeUrl]);

  const addLink = useCallback(() => {
    if (linkUrl && editor) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
      setLinkUrl('');
      setShowLinkModal(false);
    }
  }, [editor, linkUrl]);

  const removeLink = useCallback(() => {
    if (editor) {
      editor.chain().focus().unsetLink().run();
    }
  }, [editor]);

  if (!editor) {
    return (
      <div className={`border border-neutral-200 rounded-2xl overflow-hidden bg-white ${className}`}>
        <div className="flex items-center justify-center p-8">
          <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
        </div>
      </div>
    );
  }

  const ToolbarButton = ({
    onClick,
    isActive = false,
    disabled = false,
    children,
    title,
  }: {
    onClick: () => void;
    isActive?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
    title: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-2 rounded-lg transition-all ${
        isActive
          ? 'bg-black text-white shadow-sm'
          : disabled
          ? 'bg-neutral-50 text-neutral-300 cursor-not-allowed'
          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900'
      }`}
    >
      {children}
    </button>
  );

  const Divider = () => <div className="w-px h-6 bg-neutral-200 mx-1" />;

  return (
    <div className={`border border-neutral-200 rounded-2xl overflow-hidden bg-white ${className}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-3 border-b border-neutral-100 bg-neutral-50">
        {/* Undo/Redo */}
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Desfazer (Ctrl+Z)"
        >
          <Undo className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Refazer (Ctrl+Y)"
        >
          <Redo className="w-4 h-4" />
        </ToolbarButton>

        <Divider />

        {/* Clear Format / Normal Text */}
        <ToolbarButton
          onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
          title="Texto Normal"
        >
          <Type className="w-4 h-4" />
        </ToolbarButton>

        <Divider />

        {/* Text Formatting */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title="Negrito (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title="Itálico (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
          title="Sublinhado (Ctrl+U)"
        >
          <UnderlineIcon className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
          title="Tachado"
        >
          <Strikethrough className="w-4 h-4" />
        </ToolbarButton>

        <Divider />

        {/* Headings */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive('heading', { level: 1 })}
          title="Título 1"
        >
          <Heading1 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          title="Título 2"
        >
          <Heading2 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive('heading', { level: 3 })}
          title="Título 3"
        >
          <Heading3 className="w-4 h-4" />
        </ToolbarButton>

        <Divider />

        {/* Lists */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          title="Lista com Marcadores"
        >
          <List className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          title="Lista Numerada"
        >
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>

        <Divider />

        {/* Alignment */}
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          isActive={editor.isActive({ textAlign: 'left' })}
          title="Alinhar à Esquerda"
        >
          <AlignLeft className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          isActive={editor.isActive({ textAlign: 'center' })}
          title="Centralizar"
        >
          <AlignCenter className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          isActive={editor.isActive({ textAlign: 'right' })}
          title="Alinhar à Direita"
        >
          <AlignRight className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          isActive={editor.isActive({ textAlign: 'justify' })}
          title="Justificar"
        >
          <AlignJustify className="w-4 h-4" />
        </ToolbarButton>

        {/* Full mode extras */}
        {mode === 'full' && (
          <>
            <Divider />

            {/* Horizontal Rule */}
            <ToolbarButton
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              title="Linha Horizontal"
            >
              <Minus className="w-4 h-4" />
            </ToolbarButton>

            {/* Link */}
            <ToolbarButton
              onClick={() => {
                if (editor.isActive('link')) {
                  removeLink();
                } else {
                  setShowLinkModal(true);
                }
              }}
              isActive={editor.isActive('link')}
              title="Inserir Link"
            >
              <LinkIcon className="w-4 h-4" />
            </ToolbarButton>

            {/* Blockquote */}
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              isActive={editor.isActive('blockquote')}
              title="Citação"
            >
              <Quote className="w-4 h-4" />
            </ToolbarButton>

            {/* Image */}
            <ToolbarButton
              onClick={() => {
                setUploadError(null);
                setShowImageModal(true);
              }}
              title="Inserir Imagem"
            >
              <ImageIcon className="w-4 h-4" />
            </ToolbarButton>

            {/* YouTube */}
            <ToolbarButton
              onClick={() => setShowYoutubeModal(true)}
              title="Inserir Vídeo YouTube"
            >
              <YoutubeIcon className="w-4 h-4" />
            </ToolbarButton>
          </>
        )}
      </div>

      {/* Editor Content */}
      <div
        className="rich-text-editor-content"
        style={{ minHeight }}
      >
        <EditorContent
          editor={editor}
          className="prose prose-sm sm:prose-base max-w-none
            prose-headings:font-bold prose-headings:tracking-tight
            prose-h1:text-2xl prose-h1:mt-6 prose-h1:mb-4
            prose-h2:text-xl prose-h2:mt-5 prose-h2:mb-3
            prose-h3:text-lg prose-h3:mt-4 prose-h3:mb-2
            prose-p:text-neutral-700 prose-p:leading-relaxed
            prose-strong:text-neutral-900 prose-strong:font-bold
            prose-em:italic
            prose-a:text-blue-600 prose-a:underline hover:prose-a:text-blue-800
            prose-ul:my-4 prose-ol:my-4
            prose-li:my-1
            prose-blockquote:border-l-4 prose-blockquote:border-neutral-300 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-neutral-600
            prose-img:rounded-lg prose-img:shadow-md prose-img:my-4
            prose-hr:my-6 prose-hr:border-neutral-200
            [&_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.is-editor-empty:first-child::before]:text-neutral-400 [&_.is-editor-empty:first-child::before]:float-left [&_.is-editor-empty:first-child::before]:h-0 [&_.is-editor-empty:first-child::before]:pointer-events-none"
        />
      </div>

      {/* Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]" onClick={() => setShowImageModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Inserir Imagem</h3>
              <button
                type="button"
                onClick={() => {
                  setShowImageModal(false);
                  setImageUrl('');
                  setUploadError(null);
                }}
                className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all ${
                  activeTab === 'upload'
                    ? 'bg-black text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                <Upload className="w-4 h-4 inline-block mr-2" />
                Upload
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('url')}
                className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all ${
                  activeTab === 'url'
                    ? 'bg-black text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                <LinkIcon className="w-4 h-4 inline-block mr-2" />
                URL
              </button>
            </div>

            {activeTab === 'upload' ? (
              <div className="space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e.target.files)}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full p-8 border-2 border-dashed border-neutral-300 rounded-xl hover:border-black hover:bg-neutral-50 transition-all flex flex-col items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
                      <span className="text-sm text-neutral-500">Enviando imagem...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-neutral-400" />
                      <span className="text-sm text-neutral-500">
                        Clique para selecionar uma imagem
                      </span>
                      <span className="text-xs text-neutral-400">
                        JPG, PNG, GIF, WebP (max 10MB)
                      </span>
                    </>
                  )}
                </button>
                {uploadError && (
                  <p className="text-red-500 text-sm text-center">{uploadError}</p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://exemplo.com/imagem.jpg"
                  className="w-full p-3 border border-neutral-200 rounded-xl focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                  autoFocus
                />
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowImageModal(false);
                      setImageUrl('');
                    }}
                    className="px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded-xl transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={addImageFromUrl}
                    disabled={!imageUrl}
                    className="px-4 py-2 bg-black text-white rounded-xl hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Inserir
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* YouTube Modal */}
      {showYoutubeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]" onClick={() => setShowYoutubeModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Inserir Vídeo YouTube</h3>
              <button
                type="button"
                onClick={() => {
                  setShowYoutubeModal(false);
                  setYoutubeUrl('');
                }}
                className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-neutral-500 mb-4">
              Cole o link do vídeo do YouTube (ex: https://www.youtube.com/watch?v=...)
            </p>
            <input
              type="url"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full p-3 border border-neutral-200 rounded-xl mb-4 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowYoutubeModal(false);
                  setYoutubeUrl('');
                }}
                className="px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={addYoutube}
                disabled={!youtubeUrl}
                className="px-4 py-2 bg-black text-white rounded-xl hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Inserir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]" onClick={() => setShowLinkModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Inserir Link</h3>
              <button
                type="button"
                onClick={() => {
                  setShowLinkModal(false);
                  setLinkUrl('');
                }}
                className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-neutral-500 mb-4">
              Selecione um texto no editor e insira o link
            </p>
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://exemplo.com"
              className="w-full p-3 border border-neutral-200 rounded-xl mb-4 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowLinkModal(false);
                  setLinkUrl('');
                }}
                className="px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={addLink}
                disabled={!linkUrl}
                className="px-4 py-2 bg-black text-white rounded-xl hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Inserir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RichTextEditor;
