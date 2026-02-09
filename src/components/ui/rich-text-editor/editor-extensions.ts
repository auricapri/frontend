/**
 * TipTap Editor Extensions Configuration
 */
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Youtube from '@tiptap/extension-youtube';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import type { Extensions } from '@tiptap/react';

export function createEditorExtensions(
  mode: 'simple' | 'full',
  placeholder: string
): Extensions {
  const baseExtensions: Extensions = [
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
  ];

  if (mode === 'full') {
    return [
      ...baseExtensions,
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
    ];
  }

  return baseExtensions;
}

export const EDITOR_PROSE_CLASSES = `prose prose-sm sm:prose-base max-w-none
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
  [&_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.is-editor-empty:first-child::before]:text-neutral-400 [&_.is-editor-empty:first-child::before]:float-left [&_.is-editor-empty:first-child::before]:h-0 [&_.is-editor-empty:first-child::before]:pointer-events-none`;
