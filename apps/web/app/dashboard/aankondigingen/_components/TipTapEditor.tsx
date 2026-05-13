'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import {
  Bold,
  Image as ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  Redo,
  Undo,
} from 'lucide-react';

interface TipTapEditorProps {
  content: string;
  onChange: (html: string) => void;
  announcementId?: string;
  disabled?: boolean;
}

export function TipTapEditor({ content, onChange, announcementId, disabled }: TipTapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Image.configure({ inline: false }),
    ],
    content,
    editable: !disabled,
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
  });

  if (!editor) return null;

  async function handleImageUpload() {
    if (!announcementId) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/webp,image/gif';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const formData = new FormData();
      formData.append('file', file);
      try {
        const res = await fetch(`/api/cms/announcements/${announcementId}/afbeelding`, {
          method: 'POST',
          body: formData,
        });
        if (!res.ok) throw new Error('Upload mislukt');
        const { url } = await res.json() as { url: string };
        editor?.chain().focus().setImage({ src: url }).run();
      } catch {
        alert('Afbeelding kon niet worden geüpload. Controleer je verbinding.');
      }
    };
    input.click();
  }

  function setLink() {
    const url = window.prompt('URL');
    if (!url) return;
    editor.chain().focus().setLink({ href: url }).run();
  }

  return (
    <div className="tiptap-wrapper">
      <div className="tiptap-toolbar">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'active' : ''}
          title="Vet"
        >
          <Bold size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'active' : ''}
          title="Cursief"
        >
          <Italic size={16} />
        </button>
        <span className="tiptap-sep" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive('heading', { level: 2 }) ? 'active' : ''}
          title="Kop 2"
        >
          <Heading2 size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={editor.isActive('heading', { level: 3 }) ? 'active' : ''}
          title="Kop 3"
        >
          <Heading3 size={16} />
        </button>
        <span className="tiptap-sep" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'active' : ''}
          title="Ongenummerde lijst"
        >
          <List size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? 'active' : ''}
          title="Genummerde lijst"
        >
          <ListOrdered size={16} />
        </button>
        <span className="tiptap-sep" />
        <button type="button" onClick={setLink} title="Link invoegen">
          <Link2 size={16} />
        </button>
        {announcementId && (
          <button type="button" onClick={handleImageUpload} title="Afbeelding uploaden">
            <ImageIcon size={16} />
          </button>
        )}
        <span className="tiptap-sep" />
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Ongedaan maken"
        >
          <Undo size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Opnieuw"
        >
          <Redo size={16} />
        </button>
      </div>
      <EditorContent editor={editor} className="tiptap-content" />
      <style>{`
        .tiptap-wrapper {
          border: 1px solid var(--color-mid);
          border-radius: var(--radius-md);
          overflow: hidden;
        }
        .tiptap-toolbar {
          display: flex;
          align-items: center;
          gap: 2px;
          padding: 8px 12px;
          border-bottom: 1px solid var(--color-mid);
          background: var(--color-light);
          flex-wrap: wrap;
        }
        .tiptap-toolbar button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          border: none;
          background: transparent;
          border-radius: var(--radius-sm);
          cursor: pointer;
          color: var(--color-text);
        }
        .tiptap-toolbar button:hover:not(:disabled) {
          background: var(--color-mid);
        }
        .tiptap-toolbar button.active {
          background: var(--color-navy-12);
          color: var(--color-navy);
        }
        .tiptap-toolbar button:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }
        .tiptap-sep {
          width: 1px;
          height: 20px;
          background: var(--color-mid);
          margin: 0 4px;
        }
        .tiptap-content .ProseMirror {
          min-height: 320px;
          padding: 16px;
          outline: none;
          font-family: var(--font-body);
          font-size: var(--text-base);
          color: var(--color-text);
          line-height: 1.6;
        }
        .tiptap-content .ProseMirror p {
          margin: 0 0 12px;
        }
        .tiptap-content .ProseMirror h2 {
          font-family: var(--font-display);
          font-size: var(--text-2xl);
          margin: 16px 0 8px;
        }
        .tiptap-content .ProseMirror h3 {
          font-family: var(--font-display);
          font-size: var(--text-xl);
          margin: 12px 0 6px;
        }
        .tiptap-content .ProseMirror a {
          color: var(--color-blue);
          text-decoration: underline;
        }
        .tiptap-content .ProseMirror img {
          max-width: 100%;
          border-radius: var(--radius-md);
        }
        .tiptap-content .ProseMirror ul,
        .tiptap-content .ProseMirror ol {
          padding-left: 24px;
          margin-bottom: 12px;
        }
        .tiptap-content .ProseMirror p.is-editor-empty:first-child::before {
          color: var(--color-text-2);
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
