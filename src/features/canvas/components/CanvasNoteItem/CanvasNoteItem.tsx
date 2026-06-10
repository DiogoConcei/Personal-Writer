import { useState, useEffect, useRef } from 'react';
import MarkdownIt from 'markdown-it';
import { readFile } from '@/tauri-bridge';
import { useCanvasEntity } from '../../hooks/useCanvasEntity';
import { CanvasNoteItemProps, NoteData } from '@/shared/types';
import { useUIStore } from '@/store/uiStore';
import { useWorkspaceStore } from '@/features/workspace/store/workspaceStore';
import { resolveImageUrl } from '@/shared/hooks/useImageManager/useImageManager';
import { CutPatch } from '../CutPatch/CutPatch';
import styles from './CanvasNoteItem.module.scss';

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
});

/**
 * Componente interno para representar uma nota transformável no canvas
 * Agora com suporte a Markdown completo e paginação via CSS Columns.
 */
export function CanvasNoteItem({ 
  entity, 
  isSelected, 
  isSepararActive,
  isScissorsActive,
  onSelect, 
  onUpdate,
  onRemove,
  onStart,
  onEnd,
  onSplit,
  onFocus,
  onPageChange
}: CanvasNoteItemProps) {
  const data = entity.data as NoteData;
  const lastFileSaveTick = useUIStore(state => state.lastFileSaveTick);
  const [html, setHtml] = useState('');
  const [localTotalPages, setLocalTotalPages] = useState(data.totalPages || 1);
  const [currentPage, setCurrentPage] = useState(data.startPage || 1);
  const [columnWidth, setColumnWidth] = useState<number>(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const startPage = data.startPage || 1;
  const effectiveEndPage = (data.endPage === 0 || !data.endPage || data.endPage > localTotalPages) 
                           ? localTotalPages 
                           : data.endPage;
  const paddingValue = 24;

  const handleEntityInteraction = () => {
    if (isScissorsActive) {
      onFocus();
    } else if (isSepararActive) {
      onSplit(currentPage);
    } else {
      onSelect();
    }
  };

  const { handleMouseDown, handleResizeStart } = useCanvasEntity({
    entity,
    minWidth: 200,
    onSelect: handleEntityInteraction,
    onUpdate,
    onRemove,
    onStart,
    onEnd
  });

  const { rootPath } = useWorkspaceStore();

  // Sincroniza a página atual se os limites do bloco mudarem
  useEffect(() => {
    if (currentPage < startPage) setCurrentPage(startPage);
    if (currentPage > effectiveEndPage) setCurrentPage(effectiveEndPage);
  }, [startPage, effectiveEndPage, currentPage]);

  useEffect(() => {
    const loadNote = async () => {
      try {
        const text = await readFile(data.noteId);
        let markdown = text.replace(/^---\n[\s\S]*?\n---\n/, '');

        // Resolução de Imagens (Pre-processamento para paridade com o Editor)
        if (rootPath) {
          // 1. Resolver Links Obsidian ![[imagem.png]]
          const obsidianRegex = /!\[\[(.*?)\]\]/g;
          const obsidianMatches = Array.from(markdown.matchAll(obsidianRegex));
          for (const match of obsidianMatches) {
            const src = match[1];
            const resolved = await resolveImageUrl(src, rootPath);
            if (resolved) {
              markdown = markdown.replace(match[0], `![${src}](${resolved})`);
            }
          }

          // 2. Resolver Links Markdown Padrão ![alt](./caminho)
          const standardRegex = /!\[(.*?)\]\((.*?)\)/g;
          const standardMatches = Array.from(markdown.matchAll(standardRegex));
          for (const match of standardMatches) {
            const alt = match[1];
            const src = match[2];
            if (!src.startsWith('http') && !src.startsWith('asset://')) {
              const resolved = await resolveImageUrl(src, rootPath);
              if (resolved) {
                markdown = markdown.replace(match[0], `![${alt}](${resolved})`);
              }
            }
          }

          // 3. Resolver Tags HTML Brutas <img src="./assets/..." />
          const htmlImgRegex = /<img\s+[^>]*src=["'](.*?)["'][^>]*>/g;
          const htmlImgMatches = Array.from(markdown.matchAll(htmlImgRegex));
          for (const match of htmlImgMatches) {
            const src = match[1];
            if (!src.startsWith('http') && !src.startsWith('asset://')) {
              const resolved = await resolveImageUrl(src, rootPath);
              if (resolved) {
                const newTag = match[0].replace(src, resolved);
                markdown = markdown.replace(match[0], newTag);
              }
            }
          }
        }

        const renderedHtml = md.render(markdown);
        console.log('[CanvasNoteItem] Markdown processado:', markdown);
        console.log('[CanvasNoteItem] HTML renderizado:', renderedHtml);
        setHtml(renderedHtml);
      } catch (err) {
        setHtml('<p>Erro ao carregar nota.</p>');
        console.error(err);
      }
    };

    loadNote();
  }, [data.noteId, lastFileSaveTick, rootPath]);

  // Observer para paginação dinâmica baseada em CSS Columns
  useEffect(() => {
    if (!wrapperRef.current || !html) return;
    
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        requestAnimationFrame(() => {
          if (!wrapperRef.current || !contentRef.current) return;
          
          // A largura da coluna é a largura do container menos o padding lateral
          const clientWidth = wrapperRef.current.clientWidth - (paddingValue * 2);
          setColumnWidth(clientWidth);

          const scrollWidth = contentRef.current.scrollWidth;
          
          if (clientWidth > 0) {
            // No modo colunas, scrollWidth / (width + gap) dá o número de páginas
            const pages = Math.ceil(scrollWidth / (clientWidth + paddingValue));
            
            // Atualiza o estado local para garantir que a UI reflita a realidade imediatamente (especialmente no modo foco)
            setLocalTotalPages(pages);

            if (pages !== data.totalPages && pages > 0) {
              onUpdate(entity.id, { 
                data: { 
                  ...data, 
                  totalPages: pages, 
                  endPage: (data.endPage === 0 || !data.endPage || data.endPage > pages) ? pages : data.endPage 
                } 
              });
            }
          }
        });
      }
    });

    observer.observe(wrapperRef.current);
    return () => observer.disconnect();
  }, [html, entity.id, data, onUpdate]);

  const numPagesInBlock = effectiveEndPage - startPage + 1;
  const canResize = numPagesInBlock > 1;

  const navigatePage = (e: React.MouseEvent, dir: 'prev' | 'next') => {
    e.stopPropagation();
    let nextPage = currentPage;
    if (dir === 'prev' && currentPage > startPage) nextPage = currentPage - 1;
    if (dir === 'next' && currentPage < effectiveEndPage) nextPage = currentPage + 1;
    
    if (nextPage !== currentPage) {
      setCurrentPage(nextPage);
      onPageChange?.(nextPage);
    }
  };

  useEffect(() => {
    onPageChange?.(currentPage);
  }, []);

  return (
    <div 
      className={`${styles.canvasNote} ${isSelected ? styles.selected : ''} ${isSepararActive ? styles.separarMode : ''}`}
      style={{ 
        position: 'absolute', 
        left: entity.x, 
        top: entity.y,
        zIndex: entity.zIndex || (isSelected ? 100 : 5),
        transform: `rotate(${entity.rotation || 0}deg)`,
        fontSize: (entity.style?.fontSize as string) || '14px',
        color: (entity.style?.color as string) || 'var(--color-text-primary)',
        backgroundColor: (entity.style?.backgroundColor as string) || 'var(--color-bg-elevated)',
        ...entity.style,
        width: entity.width,
        height: entity.height,
        padding: 0,
      }}
      onMouseDown={handleMouseDown}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onFocus();
      }}
    >
      <h3 className={styles.noteTitle}>{data.title}</h3>
      
      <div 
        ref={wrapperRef}
        className={styles.noteContentWrapper} 
        style={{ padding: `${paddingValue}px` }}
      >
        {/* Camada de interação para capturar cliques/duplo-cliques uniformemente */}
        <div className={styles.clickOverlay} />

        <div className={styles.noteContentMask}>
          <div 
            ref={contentRef}
            className={styles.noteContent}
            style={{ 
              columnWidth: `${columnWidth}px`,
              columnGap: `${paddingValue}px`,
              transform: `translateX(-${(currentPage - 1) * (columnWidth + paddingValue)}px)`,
            }}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
        
        {localTotalPages && localTotalPages > 1 && (
          <div className={styles.noteFooter}>
            <button 
              className={styles.navBtn} 
              onClick={(e) => navigatePage(e, 'prev')}
              onDoubleClick={(e) => e.stopPropagation()}
              disabled={currentPage <= startPage}
            >
              &lt;
            </button>
            <div className={styles.noteBadge} title={`Página ${currentPage} de ${localTotalPages}`}>
              {startPage === effectiveEndPage ? `Pág ${startPage}` : `Pág ${currentPage} (${startPage}-${effectiveEndPage})`}
            </div>
            <button 
              className={styles.navBtn} 
              onClick={(e) => navigatePage(e, 'next')}
              onDoubleClick={(e) => e.stopPropagation()}
              disabled={currentPage >= effectiveEndPage}
            >
              &gt;
            </button>
          </div>
        )}
      </div>

      {/* Renderizar os remendos (Patches) da página atual no nível da nota para bater com as coordenadas do FocusModal */}
      {(data.patches || [])
        .filter(p => p.page === currentPage)
        .map(patch => (
          <CutPatch 
            key={patch.id} 
            patch={patch} 
            backgroundColor="var(--color-bg-base)"
          />
        ))}

      {isSelected && !isSepararActive && canResize && (
        <>
          <div className={`${styles.handle} ${styles['handle--tl']}`} onMouseDown={(e) => handleResizeStart('tl', e)} />
          <div className={`${styles.handle} ${styles['handle--tr']}`} onMouseDown={(e) => handleResizeStart('tr', e)} />
          <div className={`${styles.handle} ${styles['handle--bl']}`} onMouseDown={(e) => handleResizeStart('bl', e)} />
          <div className={`${styles.handle} ${styles['handle--br']}`} onMouseDown={(e) => handleResizeStart('br', e)} />
        </>
      )}
    </div>
  );
}
