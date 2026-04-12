import { BubbleMenu } from '@tiptap/react/menus';
import { Editor } from '@tiptap/core';
import { Bold, Italic, Strikethrough, Code, Heading1, Heading2, Heading3, Quote } from 'lucide-react';
import styles from './EditorBubbleMenu.module.scss';

interface EditorBubbleMenuProps {
  editor: Editor | null;
}

export default function EditorBubbleMenu({ editor }: EditorBubbleMenuProps) {
  if (!editor) return null;

  const currentFont = editor.getAttributes('textStyle').fontFamily || '';
  const currentSize = editor.getAttributes('textStyle').fontSize || '';

  return (
    <BubbleMenu 
      editor={editor} 
      shouldShow={({ from, to }) => {
        if (from === to) return false;
        if (editor.isActive('image') || editor.isActive('customImage')) return false;

        // Ocultar se houver erro ortográfico no range selecionado de forma segura via storage
        const spellingStorage = (editor.storage as any).spelling;
        if (spellingStorage && spellingStorage.pluginKey) {
          const pluginState = spellingStorage.pluginKey.getState(editor.state);
          if (pluginState?.decorations) {
            const decos = pluginState.decorations.find(from, to);
            if (decos.length > 0) return false;
          }
        }

        return !editor.state.selection.empty;
      }}
      className={styles.bubbleMenu}
    >
      <div className={styles.group}>
        <select 
          className={`${styles.select} ${styles['select--font']}`}
          value={currentFont}
          onChange={(e) => {
            if (e.target.value) {
              editor.chain().focus().setFontFamily(e.target.value).run();
            } else {
              editor.chain().focus().unsetFontFamily().run();
            }
          }}
        >
          <option value="">Fonte Padrão</option>
          <option value="Inter, sans-serif">Inter (Sans)</option>
          <option value="'Lora', serif">Lora (Serif)</option>
          <option value="'JetBrains Mono', monospace">JetBrains (Mono)</option>
          <option value="cursive">Escrita</option>
        </select>

        <select 
          className={`${styles.select} ${styles['select--size']}`}
          value={currentSize}
          onChange={(e) => {
            if (e.target.value) {
              editor.chain().focus().setFontSize(e.target.value).run();
            } else {
              editor.chain().focus().unsetFontSize().run();
            }
          }}
        >
          <option value="">Tam.</option>
          <option value="12px">12px</option>
          <option value="14px">14px</option>
          <option value="16px">16px</option>
          <option value="18px">18px</option>
          <option value="20px">20px</option>
          <option value="24px">24px</option>
          <option value="30px">30px</option>
          <option value="36px">36px</option>
        </select>
      </div>

      <div className={styles.divider} />

      <div className={styles.group}>
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? styles.active : ''}
          title="Negrito (Ctrl+B)"
        >
          <Bold size={14} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? styles.active : ''}
          title="Itálico (Ctrl+I)"
        >
          <Italic size={14} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={editor.isActive('strike') ? styles.active : ''}
          title="Riscado"
        >
          <Strikethrough size={14} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={editor.isActive('code') ? styles.active : ''}
          title="Código (Ctrl+E)"
        >
          <Code size={14} />
        </button>
      </div>

      <div className={styles.divider} />

      <div className={styles.group}>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={editor.isActive('heading', { level: 1 }) ? styles.active : ''}
          title="Título 1 (Ctrl+Alt+1)"
        >
          <Heading1 size={14} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive('heading', { level: 2 }) ? styles.active : ''}
          title="Título 2 (Ctrl+Alt+2)"
        >
          <Heading2 size={14} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={editor.isActive('heading', { level: 3 }) ? styles.active : ''}
          title="Título 3 (Ctrl+Alt+3)"
        >
          <Heading3 size={14} />
        </button>
      </div>

      <div className={styles.divider} />

      <div className={styles.group}>
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={editor.isActive('blockquote') ? styles.active : ''}
          title="Citação"
        >
          <Quote size={14} />
        </button>
      </div>
    </BubbleMenu>
  );
}
