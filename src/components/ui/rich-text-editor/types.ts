/**
 * Rich Text Editor Types
 */
import { Editor } from '@tiptap/react';

export interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  mode: 'simple' | 'full';
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

export interface ToolbarProps {
  editor: Editor;
  mode: 'simple' | 'full';
  onShowImageModal: () => void;
  onShowYoutubeModal: () => void;
  onShowLinkModal: () => void;
  onRemoveLink: () => void;
}

export interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title: string;
}

export interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertFromUrl: (url: string) => void;
  onUpload: (files: FileList | null) => Promise<void>;
  isUploading: boolean;
  uploadError: string | null;
}

export interface YouTubeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (url: string) => void;
}

export interface LinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (url: string) => void;
}
