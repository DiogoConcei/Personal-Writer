import { useState, useEffect } from 'react';
import { resolveAssetPath } from '@/tauri-bridge/fs';
import { PdfThumbnail } from '@/features/docs-manager/components/PdfThumbnail/PdfThumbnail';
import { useCanvasEntity } from '../../hooks/useCanvasEntity';
import { CanvasPdfItemProps, PdfData } from '@/shared/types';
import styles from './CanvasPdfItem.module.scss';

/**
 * Componente interno para representar um PDF transformável no canvas
 */
export function CanvasPdfItem({ 
  entity, 
  isSelected, 
  isSepararActive,
  onSelect, 
  onUpdate,
  onRemove,
  onSplit,
  rootPath 
}: CanvasPdfItemProps) {
  const data = entity.data as PdfData;
  const startPage = data.startPage || 1;
  const endPage = data.endPage || data.totalPages || 1;
  
  // Estado interno para folhear o PDF dentro do bloco
  const [currentPage, setCurrentPage] = useState(startPage);

  // Sincroniza a página atual se os limites do bloco mudarem
  useEffect(() => {
    if (currentPage < startPage) setCurrentPage(startPage);
    if (currentPage > endPage) setCurrentPage(endPage);
  }, [startPage, endPage]);

  const { handleMouseDown, handleResizeStart } = useCanvasEntity({
    entity,
    minWidth: 150,
    onSelect: isSepararActive ? () => onSplit(currentPage) : onSelect,
    onUpdate,
    onRemove
  });

  const isSinglePage = startPage === endPage;

  const navigatePage = (e: React.MouseEvent, dir: 'prev' | 'next') => {
    e.stopPropagation();
    if (dir === 'prev' && currentPage > startPage) setCurrentPage(currentPage - 1);
    if (dir === 'next' && currentPage < endPage) setCurrentPage(currentPage + 1);
  };

  return (
    <div 
      className={`${styles.canvasPdf} ${isSelected ? styles.selected : ''} ${isSepararActive ? styles.separarMode : ''}`}
      style={{ 
        position: 'absolute', 
        left: entity.x, 
        top: entity.y,
        zIndex: entity.zIndex || (isSelected ? 100 : 5),
        width: entity.width || 250,
        transform: `rotate(${entity.rotation || 0}deg)`,
        ...entity.style
      }}
      onMouseDown={handleMouseDown}
      onClick={(e) => e.stopPropagation()}
    >
      <div className={styles.canvasPdf__content}>
        <PdfThumbnail 
          fileUrl={resolveAssetPath(data.path, rootPath)} 
          width={entity.width || 250}
          pageNumber={currentPage}
          onLoadSuccess={({ numPages }) => {
            if (data.totalPages === 0) {
              onUpdate(entity.id, { 
                data: { ...data, totalPages: numPages, endPage: numPages } 
              });
            }
          }}
        />

        {data.totalPages && data.totalPages > 1 && (
          <div className={styles.pdfFooter}>
            <button 
              className={styles.navBtn} 
              onClick={(e) => navigatePage(e, 'prev')}
              disabled={currentPage <= startPage}
            >
              &lt;
            </button>
            <div className={styles.pdfBadge} title={`Página ${currentPage} de ${data.totalPages}`}>
              {isSinglePage ? `Pág ${startPage}` : `Pág ${currentPage}`}
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

      {isSelected && !isSepararActive && (
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
