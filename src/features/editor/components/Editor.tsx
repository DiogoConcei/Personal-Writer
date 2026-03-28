import React, { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { WikiLink } from '../extensions/WikiLink/WikiLink';
import { CustomImage } from '../extensions/Image/Image';
import { useEditorStore } from '../store/editorStore';
import { useWorkspaceStore } from '@/features/workspace/store/workspaceStore';
import { copyImageToAssets, createSnapshot } from '@/tauri-bridge';
import { getCurrentWindow } from '@tauri-apps/api/window';
import VersionHistory from './VersionHistory/VersionHistory';
import styles from './Editor.module.scss';
import { History, LayoutTemplate } from 'lucide-react';
import { DEFAULT_TEMPLATES } from '@/features/templates/data/defaultTemplates';

export default function Editor() {
  const { activeFile, rootPath } = useWorkspaceStore();
  const [showHistory, setShowHistory] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const { 
    setContent, 
    loadContent, 
    save, 
    typography,
    setWordCount 
  } = useEditorStore();
  
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      WikiLink.configure({
        onLinkClick: (noteName: string) => {
          const findFile = (nodeList: any[]): any => {
            for (const node of nodeList) {
              if (node.is_dir) {
                const found = findFile(node.children || []);
                if (found) return found;
              } else if (node.name.replace(/\.md$/, '') === noteName) {
                return node;
              }
            }
            return null;
          };

          const file = findFile(useWorkspaceStore.getState().files);
          if (file) {
            useWorkspaceStore.getState().setActiveFile(file.path);
          } else {
            useWorkspaceStore.getState().createFile(noteName);
          }
        },
        checkFileExists: (noteName: string) => {
          const checkRecursive = (nodeList: any[]): boolean => {
            return nodeList.some(node => {
              if (node.is_dir) return checkRecursive(node.children || []);
              return node.name.replace(/\.md$/, '') === noteName;
            });
          };
          return checkRecursive(useWorkspaceStore.getState().files);
        }
      }),
      CustomImage.configure({
        inline: false,
        allowBase64: true,
      }),
    ],
    content: '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setContent(html);
      
      const text = editor.getText();
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      setWordCount(words);

      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      if (activeFile) {
        saveTimeoutRef.current = setTimeout(() => {
          save(activeFile);
        }, 1500);
      }
    },
    editorProps: {
      attributes: {
        class: styles.prose,
        spellcheck: 'true',
        lang: 'pt-BR',
      },
    },
  }, [activeFile, rootPath]);

  // Lógica de Drop de Arquivos (Tauri)
  useEffect(() => {
    if (!editor || !rootPath) return;

    const unlisten = getCurrentWindow().onDragDropEvent(async (event) => {
      if (event.payload.type === 'drop' && event.payload.paths.length > 0) {
        const filePath = event.payload.paths[0];
        const isImage = /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(filePath);
        
        if (isImage) {
          try {
            const relativePath = await copyImageToAssets(filePath, rootPath);
            editor.chain().focus().setImage({ src: relativePath }).run();
          } catch (error) {
            console.error('Erro ao copiar imagem:', error);
          }
        }
      }
    });

    return () => {
      unlisten.then(u => u());
    };
  }, [editor, rootPath]);

  // Carregar conteúdo quando o arquivo ativo mudar
  useEffect(() => {
    let isMounted = true;

    if (activeFile && editor) {
      loadContent(activeFile).then(() => {
        if (!isMounted) return;
        
        try {
          const currentContent = useEditorStore.getState().content;
          editor.commands.setContent(currentContent || '', false);
          
          const text = editor.getText();
          const words = text.trim() ? text.trim().split(/\s+/).length : 0;
          setWordCount(words);
        } catch (error) {
          console.error('Erro ao injetar conteúdo no editor:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [activeFile, editor, loadContent, setWordCount]);

  // Atalho Ctrl+S com Snapshot
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (activeFile && rootPath) {
          if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
          
          await save(activeFile);
          
          const currentContent = useEditorStore.getState().content;
          await createSnapshot(activeFile, rootPath, currentContent);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeFile, rootPath, save]);

  const applyTemplate = (templateContent: string) => {
    if (confirm('Aplicar template? Isso substituirá TODO o conteúdo atual desta nota.')) {
      editor?.commands.setContent(templateContent);
      setContent(templateContent);
      setShowTemplates(false);
      if (activeFile) save(activeFile);
    }
  };

  if (!activeFile) return null;

  return (
    <div 
      className={`${styles.container} ${styles[`container--${typography}`]}`}
      onClick={() => editor?.commands.focus()}
    >
      <div className={styles.editorHeader}>
        <div className={styles.editorHeader__actions}>
          <div className={styles.templateDropdown}>
            <button 
              className={styles.historyBtn} 
              onClick={() => setShowTemplates(!showTemplates)}
              title="Aplicar Modelo"
            >
              <LayoutTemplate size={14} /> Modelo
            </button>
            
            {showTemplates && (
              <div className={styles.templateMenu}>
                {DEFAULT_TEMPLATES.map(t => (
                  <button 
                    key={t.id} 
                    className={styles.templateMenu__item}
                    onClick={() => applyTemplate(t.content)}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button 
            className={styles.historyBtn} 
            onClick={() => setShowHistory(true)}
            title="Histórico de Versões"
          >
            <History size={14} /> Histórico
          </button>
        </div>
      </div>

      <EditorContent editor={editor} className={styles.editor} />

      {showHistory && (
        <VersionHistory 
          editor={editor} 
          onClose={() => setShowHistory(false)} 
        />
      )}
    </div>
  );
}
