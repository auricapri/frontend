/**
 * Rich Text Editor Component
 *
 * A TipTap-based rich text editor with support for:
 * - Text formatting (bold, italic, underline, strikethrough)
 * - Headings (H1, H2, H3)
 * - Lists (bullet, numbered)
 * - Text alignment
 * - Links, blockquotes, horizontal rules (full mode)
 * - Image upload/URL insertion (full mode)
 * - YouTube video embedding (full mode)
 */
import React, { useCallback, useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { Loader2 } from 'lucide-react';
import { Toolbar } from './Toolbar';
import { ImageModal, YouTubeModal, LinkModal } from './modals';
import { uploadImageToStorage } from './image-utils';
import { createEditorExtensions, EDITOR_PROSE_CLASSES } from './editor-extensions';
import type { RichTextEditorProps } from './types';

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
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const extensions = createEditorExtensions(mode, placeholder);

  const editor = useEditor({
    extensions,
    content: value || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
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
      const normalizedCurrent =
        currentContent === '<p></p>' || currentContent === '<p class="mb-2"></p>'
          ? ''
          : currentContent;

      if (normalizedValue !== normalizedCurrent) {
        editor.commands.setContent(normalizedValue, { emitUpdate: false });
      }
    }
  }, [value, editor]);

  const handleFileUpload = useCallback(
    async (files: FileList | null) => {
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
      } catch (error) {
        console.error('Upload failed:', error);
        setUploadError('Erro ao fazer upload da imagem. Tente novamente.');
      } finally {
        setIsUploading(false);
      }
    },
    [editor]
  );

  const handleInsertImageFromUrl = useCallback(
    (url: string) => {
      if (url && editor) {
        editor.chain().focus().setImage({ src: url }).run();
        setShowImageModal(false);
      }
    },
    [editor]
  );

  const handleInsertYoutube = useCallback(
    (url: string) => {
      if (url && editor) {
        editor.chain().focus().setYoutubeVideo({ src: url }).run();
        setShowYoutubeModal(false);
      }
    },
    [editor]
  );

  const handleInsertLink = useCallback(
    (url: string) => {
      if (url && editor) {
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
        setShowLinkModal(false);
      }
    },
    [editor]
  );

  const handleRemoveLink = useCallback(() => {
    if (editor) {
      editor.chain().focus().unsetLink().run();
    }
  }, [editor]);

  if (!editor) {
    return (
      <div
        className={`border border-neutral-200 rounded-2xl overflow-hidden bg-paper ${className}`}
      >
        <div className="flex items-center justify-center p-8">
          <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`border border-neutral-200 rounded-2xl overflow-hidden bg-paper ${className}`}
    >
      <Toolbar
        editor={editor}
        mode={mode}
        onShowImageModal={() => {
          setUploadError(null);
          setShowImageModal(true);
        }}
        onShowYoutubeModal={() => setShowYoutubeModal(true)}
        onShowLinkModal={() => setShowLinkModal(true)}
        onRemoveLink={handleRemoveLink}
      />

      <div className="rich-text-editor-content" style={{ minHeight }}>
        <EditorContent editor={editor} className={EDITOR_PROSE_CLASSES} />
      </div>

      <ImageModal
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
        onInsertFromUrl={handleInsertImageFromUrl}
        onUpload={handleFileUpload}
        isUploading={isUploading}
        uploadError={uploadError}
      />

      <YouTubeModal
        isOpen={showYoutubeModal}
        onClose={() => setShowYoutubeModal(false)}
        onInsert={handleInsertYoutube}
      />

      <LinkModal
        isOpen={showLinkModal}
        onClose={() => setShowLinkModal(false)}
        onInsert={handleInsertLink}
      />
    </div>
  );
};

export default RichTextEditor;
