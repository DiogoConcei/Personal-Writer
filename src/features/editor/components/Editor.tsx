import { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent, ReactRenderer } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import BubbleMenu from '@tiptap/extension-bubble-menu';
import tippy from 'tippy.js';
import { WikiLink } from '../extensions/WikiLink/WikiLink';
import { CustomImage } from '../extensions/Image/Image';
import { PdfLink } from '../extensions/PdfLink/PdfLink';
import { FontSize } from '../extensions/FontSize';
import { Spelling } from '../extensions/Spelling';
import { SlashCommand } from '../extensions/SlashCommand/SlashCommand';
import { SlashMenu } from '../extensions/SlashCommand/SlashMenu';
import { TextStyle } from '@tiptap/extension-text-style';
import { FontFamily } from '@tiptap/extension-font-family';
import { MetadataHeader } from './MetadataHeader';
import { useEditorStore } from '../store/editorStore';
import { parseMarkdownMetadata } from '../store/metadataParser';
import { useWorkspaceStore } from '@/features/workspace/store/workspaceStore';
import { useUIStore } from '@/store/uiStore';
import { copyFileToWorkspace, saveImageFromBytes } from '@/tauri-bridge';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';

const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'];
const PDF_EXTENSIONS = ['.pdf'];
import VersionHistory from './VersionHistory/VersionHistory';
import ImageGallery from './ImageGallery/ImageGallery';
import EditorBubbleMenu from './EditorBubbleMenu';
import { DictionaryContextMenu } from './DictionaryContextMenu';
import { DocumentModal } from './DocumentModal/DocumentModal';
import { TemplateGallery } from '@/features/templates/components/TemplateGallery';
import { PdfGallery } from '@/features/references/components/PdfGallery';
import ConfirmModal from '@/shared/components/Modal/ConfirmModal';
import styles from './Editor.module.scss';
import { History, LayoutTemplate, Image as ImageIcon, FileText } from 'lucide-react';
import { DEFAULT_TEMPLATES } from '@/features/templates/data/defaultTemplates';
import { useReferenceStore } from '@/features/references/store/referenceStore';
import { useUIStore as useGlobalUIStore } from '@/store/uiStore';

export default function Editor() {
  const { activeFile, rootPath } = useWorkspaceStore();
  const [showHistory, setShowHistory] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [showDocuments, setShowDocuments] = useState(false);
  const [showDocumentList, setShowDocumentList] = useState(false);
  const [templateToApply, setTemplateToApply] = useState<string | null>(null);

  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, word: string } | null>(null);

  const { metadata, setMarkdownContent, loadContent, save, typography, setWordCount, setMetadata } = useEditorStore();
  const { setActivePdf } = useReferenceStore();
  const { toggleRightSidebar, isRightSidebarVisible } = useGlobalUIStore();
  const saveTimeoutRef = useRef<any>(null);

  const handleAddPdfFromLibrary = (path: string) => {
    const currentDocs = metadata.documents || [];
    if (!currentDocs.includes(path)) {
      setMetadata({
        ...metadata,
        documents: [...currentDocs, path]
      });
      const activeFile = useWorkspaceStore.getState().activeFile;
      if (activeFile) save(activeFile, rootPath || undefined);
    }
    setShowDocuments(false);
  };

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
      Spelling.configure({ debounce: 150 }),
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
      PdfLink,
      SlashCommand.configure({
        suggestion: {
          render: () => {
            let component: any;
            let popup: any;

            return {
              onStart: (props: any) => {
                component = new ReactRenderer(SlashMenu, {
                  props,
                  editor: props.editor,
                });

                if (!props.clientRect) {
                  return;
                }

                popup = tippy('body', {
                  getReferenceClientRect: props.clientRect,
                  appendTo: () => document.body,
                  content: component.element,
                  showOnCreate: true,
                  interactive: true,
                  trigger: 'manual',
                  placement: 'bottom-start',
                });
              },

              onUpdate(props: any) {
                component.updateProps(props);

                if (!props.clientRect) {
                  return;
                }

                popup[0].setProps({
                  getReferenceClientRect: props.clientRect,
                });
              },

              onKeyDown(props: any) {
                if (props.event.key === 'Escape') {
                  popup[0].hide();
                  return true;
                }
                return component.ref?.onKeyDown(props);
              },

              onExit() {
                if (popup && popup[0] && !popup[0].state.isDestroyed) {
                  popup[0].destroy();
                }
                if (component) {
                  component.destroy();
                }
              },
            };
          },
        },
      }),
    ],
    content: '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setMarkdownContent(html);
      const text = editor.getText();
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      setWordCount(words);

      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

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
      handleDrop: (_view, event) => {

        event.preventDefault();
        event.stopPropagation();
        return true;
      },
    },
  }, [rootPath]);

  useEffect(() => {
    const openGallery = () => setShowGallery(true);
    const openTemplates = () => setShowTemplates(true);
    const openDocuments = () => setShowDocuments(true);

    window.addEventListener('open-gallery', openGallery);
    window.addEventListener('open-templates', openTemplates);
    window.addEventListener('open-documents', openDocuments);

    return () => {
      window.removeEventListener('open-gallery', openGallery);
      window.removeEventListener('open-templates', openTemplates);
      window.removeEventListener('open-documents', openDocuments);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const appWindow = getCurrentWebviewWindow();
    let unlistenFn: (() => void) | undefined;

    const handleGlobalDrag = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    window.addEventListener('dragenter', handleGlobalDrag);
    window.addEventListener('dragover', handleGlobalDrag);
    window.addEventListener('drop', handleGlobalDrag);

    const setupDragDrop = async () => {
      try {
        const unlisten = await appWindow.onDragDropEvent(async (event) => {
          if (!isMounted) return;
          if (event.payload.type === 'drop') {
            const paths = event.payload.paths;
            if (!paths || paths.length === 0 || !rootPath || !editor) return;

            for (const path of paths) {
              const isImage = IMAGE_EXTENSIONS.some(ext => path.toLowerCase().endsWith(ext));
              const isPdf = PDF_EXTENSIONS.some(ext => path.toLowerCase().endsWith(ext));

              if (isImage || isPdf) {
                const x = event.payload.position?.x || window.innerWidth / 2;
                const y = event.payload.position?.y || window.innerHeight / 2;
                const coordinates = editor.view.posAtCoords({ left: x, top: y });
                const pos = coordinates ? coordinates.pos : editor.state.selection.from;

                const normalizedPath = path.replace(/\\/g, '/').toLowerCase();
                const normalizedRoot = rootPath.replace(/\\/g, '/').toLowerCase();
                const isInsideWorkspace = normalizedPath.startsWith(normalizedRoot);

                let relativePath: string;

                if (isInsideWorkspace) {

                  relativePath = path
                    .replace(rootPath, '')
                    .replace(/^[\\/]/, './')
                    .replace(/\\/g, '/');
                } else {

                  const folderName = isImage ? 'assets' : 'docs';
                  const subFolder = getRelativeSubfolder();
                  try {
                    relativePath = await copyFileToWorkspace(path, rootPath, folderName, subFolder);
                  } catch (err) {
                    console.error(`Erro ao copiar ${folderName}:`, err);
                    continue;
                  }
                }

                if (isImage) {
                  editor.chain().focus().insertContentAt(pos, {
                    type: 'image',
                    attrs: { src: relativePath }
                  }).run();

                  useWorkspaceStore.getState().scanWorkspace();
                } else if (isPdf) {

                  const currentMetadata = useEditorStore.getState().metadata;
                  const currentDocs = currentMetadata.documents || [];

                  if (!currentDocs.includes(relativePath)) {
                    setMetadata({
                      ...currentMetadata,
                      documents: [...currentDocs, relativePath]
                    });
                    const activeFile = useWorkspaceStore.getState().activeFile;
                    if (activeFile) save(activeFile, rootPath || undefined);
                  }
                }
              }
            }
          }
        });
        unlistenFn = unlisten;
      } catch (err) {
        console.error('Erro ao configurar drag-and-drop nativo:', err);
      }
    };

    setupDragDrop();

    return () => {
      isMounted = false;
      window.removeEventListener('dragenter', handleGlobalDrag);
      window.removeEventListener('dragover', handleGlobalDrag);
      window.removeEventListener('drop', handleGlobalDrag);
      if (unlistenFn) unlistenFn();
    };
  }, [editor, rootPath]);

  useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => {
      const { isDragging, sourcePath } = useUIStore.getState().dragInfo;

      if (isDragging && sourcePath && editor && rootPath) {

        const editorElement = document.querySelector(`.${styles.scrollContainer}`);
        const rect = editorElement?.getBoundingClientRect();

        if (rect && e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
          const isImage = IMAGE_EXTENSIONS.some(ext => sourcePath.toLowerCase().endsWith(ext));
          const isPdf = PDF_EXTENSIONS.some(ext => sourcePath.toLowerCase().endsWith(ext));

          if (isImage || isPdf) {
            const coordinates = editor.view.posAtCoords({ left: e.clientX, top: e.clientY });
            if (coordinates) {

              const relativePath = sourcePath
                .replace(rootPath, '')
                .replace(/^[\\/]/, './')
                .replace(/\\/g, '/');

              if (isImage) {
                editor.chain().focus().insertContentAt(coordinates.pos, {
                  type: 'image',
                  attrs: { src: relativePath }
                }).run();
              } else if (isPdf) {

                const currentMetadata = useEditorStore.getState().metadata;
                const currentDocs = currentMetadata.documents || [];

                if (!currentDocs.includes(relativePath)) {
                  setMetadata({
                    ...currentMetadata,
                    documents: [...currentDocs, relativePath]
                  });
                  const activeFile = useWorkspaceStore.getState().activeFile;
                  if (activeFile) save(activeFile, rootPath || undefined);
                }
              }
            }
          }
        }
      }
    };

    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [editor, rootPath]);

  useEffect(() => {
    let isMounted = true;
    if (activeFile && editor) {

      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

      loadContent(activeFile).then(() => {
        if (!isMounted) return;
        try {
          const markdown = useEditorStore.getState().markdownContent || '';

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

    const target = e.target as HTMLElement;
    const isMisspelled = target.classList.contains('misspelled');

    let word = '';

    if (isMisspelled) {
      word = target.getAttribute('data-word') || '';
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
      setContextMenu({ x: e.clientX, y: e.clientY, word });
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

      if (activeFile) save(activeFile, rootPath || undefined);
      setTemplateToApply(null);
      setShowTemplates(false);
    }
  };

  const handleRemoveDocument = (path: string) => {
    const currentDocs = metadata.documents || [];
    const newDocs = currentDocs.filter(d => d !== path);
    setMetadata({
      ...metadata,
      documents: newDocs
    });
    if (activeFile) save(activeFile, rootPath || undefined);
  };

  const openPdfAnexo = (path: string) => {
    setActivePdf(path);
    if (!isRightSidebarVisible) toggleRightSidebar();
    setShowDocuments(false);
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

          <div className={styles.templateDropdown}>
            <button className={styles.historyBtn} onClick={() => setShowDocumentList(true)}>
              <FileText size={14} /> Documentos
              {metadata.documents && metadata.documents.length > 0 && (
                <span className={styles.badge}>{metadata.documents.length}</span>
              )}
            </button>
          </div>

          <button className={styles.historyBtn} onClick={() => setShowGallery(true)}><ImageIcon size={14} /> Galeria</button>
          <button className={styles.historyBtn} onClick={() => setShowHistory(true)}><History size={14} /> Histórico</button>
        </div>
      </div>

      <div
        className={styles.scrollContainer}
        onContextMenu={handleContextMenu}
        onClick={() => {
          setContextMenu(null);
          setShowDocuments(false);
          setShowDocumentList(false);
          setShowTemplates(false);
        }}
      >
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
      {showTemplates && (
        <TemplateGallery onSelect={applyTemplate} onClose={() => setShowTemplates(false)} />
      )}
      {showDocuments && (
        <PdfGallery onSelect={handleAddPdfFromLibrary} onClose={() => setShowDocuments(false)} />
      )}
      {showDocumentList && (
        <DocumentModal
          documents={metadata.documents || []}
          onClose={() => setShowDocumentList(false)}
          onOpen={openPdfAnexo}
          onRemove={handleRemoveDocument}
        />
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
