import React, { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { WikiLink } from '../extensions/WikiLink/WikiLink';
import { CustomImage } from '../extensions/Image/Image';
import { MetadataHeader } from '../extensions/MetadataHeader/MetadataHeader';
import { useEditorStore } from '../store/editorStore';
import { useWorkspaceStore } from '@/features/workspace/store/workspaceStore';
import { copyImageToAssets, createSnapshot, saveImageFromBytes } from '@/tauri-bridge';
import { getCurrentWindow } from '@tauri-apps/api/window';
import VersionHistory from './VersionHistory/VersionHistory';
import ImageGallery from './ImageGallery/ImageGallery';
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
  const { setContent, loadContent, save, typography, setWordCount } = useEditorStore();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const parseMarkdownMetadata = (content: string) => {
    const yamlMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!yamlMatch) return null;

    const yamlStr = yamlMatch[1];
    const data: any = { fields: {} };
    const typeMatch = yamlStr.match(/type:\s*["']?([^"'\r\n]+)["']?/i);
    const iconMatch = yamlStr.match(/icon:\s*["']?([^"'\r\n]+)["']?/i);

    if (typeMatch) data.type = typeMatch[1].trim();
    if (iconMatch) data.icon = iconMatch[1].trim();

    const fieldsBlock = yamlStr.match(/fields:\r?\n([\s\S]*?)(?=\r?\n[a-z]|$)/i);
    if (fieldsBlock) {
      const lines = fieldsBlock[1].split('\n');
      lines.forEach(line => {
        const parts = line.split(':');
        if (parts.length >= 2) {
          const k = parts[0].trim();
          const v = parts.slice(1).join(':').trim().replace(/["']/g, '');
          if (k) data.fields[k] = isNaN(Number(v)) ? v : Number(v);
        }
      });
    }
    return { data, yamlStr: yamlMatch[0] };
  };

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
              } else if (node.name.replace(/\.md$/, '') === noteName) return node;
            }
            return null;
          };
          const file = findFile(useWorkspaceStore.getState().files);
          if (file) useWorkspaceStore.getState().setActiveFile(file.path);
          else useWorkspaceStore.getState().createFile(noteName);
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
      CustomImage.configure({ inline: true, allowBase64: true }),
      MetadataHeader,
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
        saveTimeoutRef.current = setTimeout(() => save(activeFile), 1500);
      }
    },
    editorProps: {
      attributes: { class: styles.prose, spellcheck: 'true', lang: 'pt-BR' },
    },
  }, [activeFile, rootPath]);

  useEffect(() => {
    let isMounted = true;
    if (activeFile && editor) {
      loadContent(activeFile).then(() => {
        if (!isMounted) return;
        try {
          const rawContent = useEditorStore.getState().content || '';
          
          // Se for Markdown puro (ex: vindo de template ou arquivo externo)
          if (rawContent.startsWith('---')) {
            const meta = parseMarkdownMetadata(rawContent);
            if (meta) {
              const contentAfterYaml = rawContent.replace(meta.yamlStr, '').trim();
              editor.commands.setContent([
                { type: 'metadataHeader', attrs: { content: meta.yamlStr, data: meta.data } },
                { type: 'paragraph' }
              ], false);
              if (contentAfterYaml) editor.commands.insertContentAt(editor.state.doc.content.size, contentAfterYaml);
              return;
            }
          }
          
          // Se for HTML (salvo pelo editor), o TipTap processa as extensões automaticamente
          editor.commands.setContent(rawContent, false);
          
          const text = editor.getText();
          setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0);
        } catch (error) {
          console.error('Erro ao injetar conteúdo no editor:', error);
        }
      });
    }
    return () => { isMounted = false; };
  }, [activeFile, editor, loadContent, setWordCount]);

  const applyTemplate = (templateContent: string) => {
    setTemplateToApply(templateContent);
    setShowTemplates(false);
  };

  const handleConfirmTemplate = () => {
    if (templateToApply && editor) {
      editor.commands.clearContent();
      const meta = parseMarkdownMetadata(templateToApply);
      if (meta) {
        const contentAfterYaml = templateToApply.replace(meta.yamlStr, '').trim();
        editor.commands.setContent([
          { type: 'metadataHeader', attrs: { content: meta.yamlStr, data: meta.data } },
          { type: 'paragraph' }
        ]);
        if (contentAfterYaml) editor.commands.insertContent(contentAfterYaml);
      } else {
        editor.commands.setContent(templateToApply);
      }
      const newHtml = editor.getHTML();
      setContent(newHtml);
      if (activeFile) save(activeFile);
      setTemplateToApply(null);
      setShowTemplates(false);
    }
  };

  if (!activeFile) return null;

  return (
    <div className={`${styles.container} ${styles[`container--${typography}`]}`} onClick={() => editor?.commands.focus()}>
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
      <EditorContent editor={editor} className={styles.editor} />
      {showGallery && (
        <ImageGallery onSelect={(src) => editor?.chain().focus().setImage({ src }).run()} onClose={() => setShowGallery(false)} />
      )}
      {showHistory && <VersionHistory editor={editor} onClose={() => setShowHistory(false)} />}
      <ConfirmModal 
        isOpen={!!templateToApply} onClose={() => setTemplateToApply(null)} onConfirm={handleConfirmTemplate}
        title="Aplicar Modelo" message="Deseja aplicar este modelo? Isso substituirá TODO o conteúdo atual desta nota." confirmLabel="Aplicar Modelo"
      />
    </div>
  );
}
