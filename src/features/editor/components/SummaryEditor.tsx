import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import { FontFamily } from '@tiptap/extension-font-family';
import { FontSize } from '../extensions/FontSize';
import { Spelling } from '../extensions/Spelling';
import { WikiLink } from '../extensions/WikiLink/WikiLink';
import { CustomImage } from '../extensions/Image/Image';
import { useWorkspaceStore } from '@/features/workspace/store/workspaceStore';
import EditorBubbleMenu from './EditorBubbleMenu';
import { DictionaryContextMenu } from './DictionaryContextMenu';
import { useEffect, useState } from 'react';
import styles from './SummaryEditor.module.scss';

interface SummaryEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}

export function SummaryEditor({ value, onChange, placeholder, readOnly }: SummaryEditorProps) {
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, word: string } | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      FontFamily,
      FontSize,
      Spelling.configure({ debounce: 500 }),
      WikiLink.configure({
        onLinkClick: (noteName: string) => {
          const findFile = (nodeList: any[]): any => {
            for (const node of nodeList) {
              if (node.is_dir) {
                const found = findFile(node.children || []);
                if (found) return found;
              } else if (node.name.replace(/\.md$/, '') === noteName) return node;
            }
            return null;
          };
          const file = findFile(useWorkspaceStore.getState().files);
          if (file) useWorkspaceStore.getState().setActiveFile(file.path);
          else useWorkspaceStore.getState().createFile(noteName);
        },
      } as any),
      CustomImage.configure({ inline: true, allowBase64: true }),
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
        spellcheck: 'false',
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

  const handleContextMenu = (e: React.MouseEvent) => {
    if (readOnly) return;
    e.preventDefault();
    e.stopPropagation(); // Impedir que o menu do editor principal apareça
    
    if (!editor) return;

    // Tentar encontrar a palavra sob o mouse
    const target = e.target as HTMLElement;
    const isMisspelled = target.classList.contains('misspelled');
    
    let word = '';

    if (isMisspelled) {
      word = target.getAttribute('data-word') || '';
    } else {
      const selection = window.getSelection();
      word = selection?.toString().trim() || '';
      
      if (!word) {
        const { view } = editor;
        const pos = view.posAtCoords({ left: e.clientX, top: e.clientY });
        if (pos) {
          const $pos = view.state.doc.resolve(pos.pos);
          const text = $pos.parent.textContent;
          const offset = $pos.parentOffset;
          const before = text.slice(0, offset).match(/[\p{L}\p{N}]+$/u);
          const after = text.slice(offset).match(/^[\p{L}\p{N}]+/u);
          word = (before ? before[0] : '') + (after ? after[0] : '');
        }
      }
    }

    if (word) {
      setContextMenu({ x: e.clientX, y: e.clientY, word });
    }
  };

  return (
    <div 
      className={styles.summaryContainer} 
      onContextMenu={handleContextMenu}
      onClick={() => setContextMenu(null)}
    >
      {editor && <EditorBubbleMenu editor={editor as Editor} />}
      {editor && contextMenu && (
        <DictionaryContextMenu 
          editor={editor as Editor} 
          {...contextMenu} 
          onClose={() => setContextMenu(null)} 
        />
      )}
      <EditorContent editor={editor} className={styles.editorContent} />
      {editor && editor.isEmpty && placeholder && (
        <div className={styles.placeholder}>{placeholder}</div>
      )}
    </div>
  );
}
