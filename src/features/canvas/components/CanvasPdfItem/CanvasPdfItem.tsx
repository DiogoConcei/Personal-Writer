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
  const { handleMouseDown, handleResizeStart } = useCanvasEntity({
    entity,
    minWidth: 150,
    onSelect: isSepararActive ? onSplit : onSelect,
    onUpdate,
    onRemove
  });

  const isSinglePage = data.startPage === data.endPage;

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
          pageNumber={data.startPage}
          onLoadSuccess={({ numPages }) => {
            if (data.totalPages === 0) {
              onUpdate(entity.id, { 
                data: { ...data, totalPages: numPages, endPage: numPages } 
              });
            }
          }}
        />
        {!isSinglePage && (
          <div className={styles.pdfBadge} title="Este item contém múltiplas páginas">
            {data.endPage - data.startPage + 1}
          </div>
        )}
      </div>

      {isSelected && !isSepararActive && (
        <>
          <div className={`${styles.handle} ${styles['handle--tl']}`} onMouseDown={(e) => handleResizeStart('tl', e)} />
          <div className={`${styles.handle} ${styles['handle--bl']}`} onMouseDown={(e) => handleResizeStart('bl', e)} />
          <div className={`${styles.handle} ${styles['handle--br']}`} onMouseDown={(e) => handleResizeStart('br', e)} />
        </>
      )}
    </div>
  );
}
