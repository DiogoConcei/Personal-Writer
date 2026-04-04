import { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import BubbleMenu from '@tiptap/extension-bubble-menu';
import { WikiLink } from '../extensions/WikiLink/WikiLink';
import { CustomImage } from '../extensions/Image/Image';
import { FontSize } from '../extensions/FontSize';
import { Spelling } from '../extensions/Spelling';
import { TextStyle } from '@tiptap/extension-text-style';
import { FontFamily } from '@tiptap/extension-font-family';
import { MetadataHeader } from './MetadataHeader';
import { useEditorStore } from '../store/editorStore';
import { parseMarkdownMetadata } from '../store/metadataParser';
import { useWorkspaceStore } from '@/features/workspace/store/workspaceStore';
import { saveImageFromBytes } from '@/tauri-bridge';
import VersionHistory from './VersionHistory/VersionHistory';
import ImageGallery from './ImageGallery/ImageGallery';
import EditorBubbleMenu from './EditorBubbleMenu';
import { DictionaryContextMenu } from './DictionaryContextMenu';
import ConfirmModal from '@/shared/components/Modal/ConfirmModal';
import styles from './Editor.module.scss';
import { History, LayoutTemplate, Image as ImageIcon } from 'lucide-react';
import { DEFAULT_TEMPLATES } from '@/features/templates/data/defaultTemplates';

export default function Editor() {
  const { activeFile, rootPath } = useWorkspaceStore();
  const [showHistory, setShowHistory] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [templateToApply, setTemplateToApply] = useState<string | null>(null);
  
  // Estado do Menu de Contexto do Dicionário
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, word: string, suggestions: string[] } | null>(null);

  const { setMarkdownContent, loadContent, save, typography, setWordCount, setMetadata } = useEditorStore();
  const saveTimeoutRef = useRef<any>(null);

  const getRelativeSubfolder = () => {
    if (!activeFile || !rootPath) return undefined;
    const separator = rootPath.includes('\\') ? '\\' : '/';
    const folderPath = activeFile.substring(0, activeFile.lastIndexOf(separator));
    
    if (folderPath.toLowerCase().startsWith(rootPath.toLowerCase())) {
      let sub = folderPath.substring(rootPath.length);
      if (sub.startsWith(separator)) sub = sub.substring(1);
      return sub || undefined;
    }
    return undefined;
  };

  const editor = useEditor({
    extensions: [
      StarterKit,
      BubbleMenu,
      TextStyle,
      FontFamily,
      FontSize,
      Spelling.configure({ debounce: 800 }),
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
    content: '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setMarkdownContent(html);
      const text = editor.getText();
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      setWordCount(words);

      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      // Usamos a ref para o path para evitar dependência circular no onUpdate
      const currentPath = useWorkspaceStore.getState().activeFile;
      if (currentPath) {
        saveTimeoutRef.current = setTimeout(() => save(currentPath, rootPath || undefined), 1500);
      }
    },
    editorProps: {
      attributes: { class: styles.prose, spellcheck: 'false', lang: 'pt-BR' },
      handlePaste: (view, event) => {
        const items = Array.from(event.clipboardData?.items || []);
        const imageItem = items.find(item => item.type.startsWith('image'));

        if (imageItem && rootPath) {
          const file = imageItem.getAsFile();
          if (file) {
            event.preventDefault();
            const reader = new FileReader();
            reader.onload = async (e) => {
              const buffer = e.target?.result as ArrayBuffer;
              const bytes = Array.from(new Uint8Array(buffer));
              const fileName = `pasted_${Date.now()}.png`;
              const subFolder = getRelativeSubfolder();
              try {
                const relativePath = await saveImageFromBytes(fileName, bytes, rootPath, subFolder);
                view.dispatch(view.state.tr.replaceSelectionWith(
                  view.state.schema.nodes.image.create({ src: relativePath })
                ));
              } catch (err) {
                console.error('Erro ao salvar imagem colada:', err);
              }
            };
            reader.readAsArrayBuffer(file);
            return true;
          }
        }
        return false;
      },
      handleDrop: (view, event) => {
        const files = Array.from(event.dataTransfer?.files || []);
        const imageFile = files.find(file => file.type.startsWith('image'));

        if (imageFile && rootPath) {
          event.preventDefault();
          const reader = new FileReader();
          reader.onload = async (e) => {
            const buffer = e.target?.result as ArrayBuffer;
            const bytes = Array.from(new Uint8Array(buffer));
            const fileName = `dropped_${Date.now()}_${imageFile.name}`;
            const subFolder = getRelativeSubfolder();
            try {
              const relativePath = await saveImageFromBytes(fileName, bytes, rootPath, subFolder);
              const { schema } = view.state;
              const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
              if (coordinates) {
                view.dispatch(view.state.tr.insert(coordinates.pos, schema.nodes.image.create({ src: relativePath })));
              }
            } catch (err) {
              console.error('Erro ao salvar imagem solta:', err);
            }
          };
          reader.readAsArrayBuffer(imageFile);
          return true;
        }
        return false;
      }
    },
  }, [rootPath]); // activeFile removido das dependências para não recriar o editor

  useEffect(() => {
    let isMounted = true;
    if (activeFile && editor) {
      // Limpar timeout de save anterior ao trocar de nota para não salvar conteúdo da nota nova na nota antiga
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

      loadContent(activeFile).then(() => {
        if (!isMounted) return;
        try {
          const markdown = useEditorStore.getState().markdownContent || '';
          // setContent é muito mais rápido que recriar o editor
          editor.commands.setContent(markdown, { emitUpdate: false });
          
          const text = editor.getText();
          setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0);
        } catch (error) {
          console.error('Erro ao injetar conteúdo no editor:', error);
        }
      });
    }
    return () => { isMounted = false; };
  }, [activeFile, editor, loadContent, setWordCount]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Tentar encontrar a palavra sob o mouse
    const target = e.target as HTMLElement;
    const isMisspelled = target.classList.contains('misspelled');
    
    let word = '';
    let suggestions: string[] = [];

    if (isMisspelled) {
      word = target.getAttribute('data-word') || '';
      try {
        suggestions = JSON.parse(target.getAttribute('data-suggestions') || '[]');
      } catch (err) {}
    } else {
      const selection = window.getSelection();
      word = selection?.toString().trim() || '';
      
      if (!word && editor) {
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
      setContextMenu({ x: e.clientX, y: e.clientY, word, suggestions });
    }
  };

  const applyTemplate = (templateContent: string) => {
    setTemplateToApply(templateContent);
    setShowTemplates(false);
  };

  const handleConfirmTemplate = () => {
    if (templateToApply && editor) {
      editor.commands.clearContent();
      
      const { metadata, markdown } = parseMarkdownMetadata(templateToApply);
      
      setMetadata(metadata);
      editor.commands.setContent(markdown);
      
      const newHtml = editor.getHTML();
      setMarkdownContent(newHtml);
      
      if (activeFile) save(activeFile);
      setTemplateToApply(null);
      setShowTemplates(false);
    }
  };

  if (!activeFile) return null;

  return (
    <div className={`${styles.container} ${styles[`container--${typography}`]}`}>
      <div className={styles.editorHeader}>
        <div className={styles.editorHeader__actions}>
          <div className={styles.templateDropdown}>
            <button className={styles.historyBtn} onClick={() => setShowTemplates(!showTemplates)}>
              <LayoutTemplate size={14} /> Modelo
            </button>
            {showTemplates && (
              <div className={styles.templateMenu}>
                {DEFAULT_TEMPLATES.map(t => (
                  <button key={t.id} className={styles.templateMenu__item} onClick={() => applyTemplate(t.content)}>
                    {t.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button className={styles.historyBtn} onClick={() => setShowGallery(true)}><ImageIcon size={14} /> Galeria</button>
          <button className={styles.historyBtn} onClick={() => setShowHistory(true)}><History size={14} /> Histórico</button>
        </div>
      </div>
      
      <div className={styles.scrollContainer} onContextMenu={handleContextMenu} onClick={() => setContextMenu(null)}>
        <MetadataHeader />
        <EditorBubbleMenu editor={editor} />
        {editor && contextMenu && (
          <DictionaryContextMenu 
            editor={editor} 
            {...contextMenu} 
            onClose={() => setContextMenu(null)} 
          />
        )}
        <EditorContent editor={editor} className={styles.editor} />
      </div>

      {showGallery && (
        <ImageGallery onSelect={(src) => editor?.chain().focus().setImage({ src }).run()} onClose={() => setShowGallery(false)} />
      )}
      {showHistory && <VersionHistory editor={editor} onClose={() => setShowHistory(false)} />}
      <ConfirmModal 
        isOpen={!!templateToApply} 
        onClose={() => setTemplateToApply(null)} 
        onConfirm={handleConfirmTemplate}
        title="Aplicar Modelo" 
        message="Deseja aplicar este modelo? Isso substituirá TODO o conteúdo atual desta nota." 
        confirmLabel="Aplicar Modelo"
      />
    </div>
  );
}
