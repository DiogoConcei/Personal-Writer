import { useState, useEffect, useRef } from 'react';
import MarkdownIt from 'markdown-it';
import { readFile } from '@/tauri-bridge';
import { useCanvasEntity } from '../../hooks/useCanvasEntity';
import { CanvasNoteItemProps, NoteData } from '@/shared/types';
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
  onSelect, 
  onUpdate,
  onRemove,
  onSplit
}: CanvasNoteItemProps) {
  const data = entity.data as NoteData;
  const [html, setHtml] = useState('');
  const contentRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const startPage = data.startPage || 1;
  const endPage = data.endPage || data.totalPages || 1;

  // Estado interno para folhear a nota dentro do bloco
  const [currentPage, setCurrentPage] = useState(startPage);

  // Sincroniza a página atual se os limites do bloco mudarem
  useEffect(() => {
    if (currentPage < startPage) setCurrentPage(startPage);
    if (currentPage > endPage) setCurrentPage(endPage);
  }, [startPage, endPage]);

  const { handleMouseDown, handleResizeStart } = useCanvasEntity({
    entity,
    minWidth: 200,
    onSelect: isSepararActive ? () => onSplit(currentPage) : onSelect,
    onUpdate,
    onRemove
  });

  useEffect(() => {
    readFile(data.noteId).then(text => {
      const markdown = text.replace(/^---\n[\s\S]*?\n---\n/, '');
      setHtml(md.render(markdown));
    }).catch(err => {
      setHtml('<p>Erro ao carregar nota.</p>');
      console.error(err);
    });
  }, [data.noteId]);
  const [columnWidth, setColumnWidth] = useState<number>(0);
  const paddingValue = 24;

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

  const numPagesInBlock = endPage - startPage + 1;
  const canResize = numPagesInBlock > 1;

  const navigatePage = (e: React.MouseEvent, dir: 'prev' | 'next') => {
    e.stopPropagation();
    if (dir === 'prev' && currentPage > startPage) setCurrentPage(currentPage - 1);
    if (dir === 'next' && currentPage < endPage) setCurrentPage(currentPage + 1);
  };

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
    >
      <h3 className={styles.noteTitle}>{data.title}</h3>
      
      <div 
        ref={wrapperRef}
        className={styles.noteContentWrapper} 
        style={{ padding: `${paddingValue}px` }}
      >
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
        
        {data.totalPages && data.totalPages > 1 && (
          <div className={styles.noteFooter}>
            <button 
              className={styles.navBtn} 
              onClick={(e) => navigatePage(e, 'prev')}
              disabled={currentPage <= startPage}
            >
              &lt;
            </button>
            <div className={styles.noteBadge} title={`Página ${currentPage} de ${data.totalPages}`}>
              {startPage === endPage ? `Pág ${startPage}` : `Pág ${currentPage} (${startPage}-${endPage})`}
            </div>
            <button 
              className={styles.navBtn} 
              onClick={(e) => navigatePage(e, 'next')}
              disabled={currentPage >= endPage}
            >
              &gt;
            </button>
          </div>
        )}
      </div>

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
