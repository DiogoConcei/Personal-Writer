import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import { FontFamily } from '@tiptap/extension-font-family';
import { FontSize } from '../extensions/FontSize';
import EditorBubbleMenu from './EditorBubbleMenu';
import { useEffect } from 'react';
import styles from './SummaryEditor.module.scss';

interface SummaryEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}

export function SummaryEditor({ value, onChange, placeholder, readOnly }: SummaryEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      FontFamily,
      FontSize,
    ],
    content: value,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      if (readOnly) return;
      const html = editor.getHTML();
      // Se o editor estiver vazio (apenas tags <p></p>), enviamos string vazia
      if (editor.isEmpty) {
        onChange('');
      } else {
        onChange(html);
      }
    },
    editorProps: {
      attributes: {
        class: styles.summaryProse,
      },
    },
  });

  // Sincronizar valor externo apenas se for diferente do conteúdo atual do editor
  // para evitar loops de cursor e perda de foco ao digitar
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      // Pequeno ajuste: se o valor for vazio e o editor também, não faz nada
      if (!value && editor.isEmpty) return;
      
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor]);

  return (
    <div className={styles.summaryContainer}>
      {editor && <EditorBubbleMenu editor={editor as Editor} />}
      <EditorContent editor={editor} className={styles.editorContent} />
      {editor && editor.isEmpty && placeholder && (
        <div className={styles.placeholder}>{placeholder}</div>
      )}
    </div>
  );
}
