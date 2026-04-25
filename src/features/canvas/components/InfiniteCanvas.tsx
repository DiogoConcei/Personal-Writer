import { useState, useRef } from 'react';
import styles from './InfiniteCanvas.module.scss';
import { useUIStore } from '../../../store/uiStore';
import { useWorkspaceStore } from '@/features/workspace/store/workspaceStore';
import { resolveAssetPath } from '@/tauri-bridge/fs';
import ImageGallery from '../../editor/components/ImageGallery/ImageGallery';
import { PdfGallery } from '../../references/components/PdfGallery';
import { Trash2, ZoomIn, ZoomOut, Pencil, Eraser, Scissors, RotateCcw } from 'lucide-react';
import { useTransformable } from '@/shared/hooks/useDragAndDrop';
import { PdfThumbnail } from '@/features/dashboard/components/PdfThumbnail';
import { useZoom } from '@/shared/hooks/useZoom';
import { SplitPanel } from './SplitModal';
import { AnyCanvasEntity, ImageData, PdfData } from '../types';

/**
 * Componente interno para representar uma imagem transformável no canvas
 */
function CanvasImageItem({ 
  entity, 
  isSelected, 
  onSelect, 
  onRemove, 
  onUpdate,
  rootPath 
}: { 
  entity: AnyCanvasEntity, 
  isSelected: boolean, 
  onSelect: () => void, 
  onRemove: (id: string) => void,
  onUpdate: (id: string, updates: Partial<AnyCanvasEntity>) => void,
  rootPath: string | null
}) {
  const data = entity.data as ImageData;
  const { handleMouseDown, handleResizeStart } = useTransformable({
    x: entity.x,
    y: entity.y,
    width: entity.width,
    onSelect,
    onUpdate: (updates) => onUpdate(entity.id, updates)
  });

  return (
    <div 
      className={`${styles.canvasImage} ${isSelected ? styles.selected : ''}`}
      style={{ 
        position: 'absolute', 
        left: entity.x, 
        top: entity.y,
        zIndex: entity.zIndex || (isSelected ? 100 : 5),
        width: entity.width || 300,
        transform: `rotate(${entity.rotation || 0}deg)`,
        ...entity.style
      }}
      onMouseDown={handleMouseDown}
      onClick={(e) => e.stopPropagation()}
    >
      <button 
        className={styles.deleteBtn}
        onClick={(e) => { e.stopPropagation(); onRemove(entity.id); }}
        title="Remover do Canvas"
      >
        <Trash2 size={14} />
      </button>

      <img src={resolveAssetPath(data.path, rootPath)} alt="" draggable={false} />

      {isSelected && (
        <>
          <div className={`${styles.handle} ${styles['handle--tl']}`} onMouseDown={(e) => handleResizeStart('tl', e)} />
          <div className={`${styles.handle} ${styles['handle--bl']}`} onMouseDown={(e) => handleResizeStart('bl', e)} />
          <div className={`${styles.handle} ${styles['handle--br']}`} onMouseDown={(e) => handleResizeStart('br', e)} />
        </>
      )}
    </div>
  );
}

/**
 * Componente interno para representar um PDF transformável no canvas
 */
function CanvasPdfItem({ 
  entity, 
  isSelected, 
  isSepararActive,
  onSelect, 
  onRemove, 
  onUpdate,
  onSplit,
  rootPath 
}: { 
  entity: AnyCanvasEntity, 
  isSelected: boolean, 
  isSepararActive: boolean,
  onSelect: () => void, 
  onRemove: (id: string) => void,
  onUpdate: (id: string, updates: Partial<AnyCanvasEntity>) => void,
  onSplit: () => void,
  rootPath: string | null
}) {
  const data = entity.data as PdfData;
  const { handleMouseDown, handleResizeStart } = useTransformable({
    x: entity.x,
    y: entity.y,
    width: entity.width || 250,
    minWidth: 150,
    onSelect: isSepararActive ? onSplit : onSelect,
    onUpdate: (updates) => onUpdate(entity.id, updates)
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
      <button 
        className={styles.deleteBtn}
        onClick={(e) => { e.stopPropagation(); onRemove(entity.id); }}
        title="Remover do Canvas"
      >
        <Trash2 size={14} />
      </button>

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

export default function InfiniteCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { rootPath } = useWorkspaceStore();
  const setActivePanel = useUIStore((state) => state.setActivePanel);
  
  const [isImageGalleryOpen, setIsImageGalleryOpen] = useState(false);
  const [isPdfGalleryOpen, setIsPdfGalleryOpen] = useState(false);
  const [isSepararActive, setIsSepararActive] = useState(false);
  
  // ESTADO UNIFICADO DE ENTIDADES
  const [entities, setEntities] = useState<AnyCanvasEntity[]>([]);
  
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
  const [splittingItem, setSplittingItem] = useState<{ id: string, name: string, total: number } | null>(null);
  
  const { zoom, zoomIn, zoomOut, resetZoom } = useZoom({ initialZoom: 1, minZoom: 0.2, maxZoom: 3 });
  
  const [viewState, setViewState] = useState({ x: 0, y: 0 });

  const handleReset = () => {
    resetZoom();
    setViewState({ x: 0, y: 0 });
  };

  const handleImageSelect = (path: string) => {
    const container = containerRef.current;
    if (!container) return;

    const img = new Image();
    img.onload = () => {
      const naturalWidth = img.naturalWidth;
      const naturalHeight = img.naturalHeight;
      const canvasWidth = container.clientWidth;
      const canvasHeight = container.clientHeight;

      const defaultWidth = 300;
      const ratio = defaultWidth / naturalWidth;
      const finalHeight = naturalHeight * ratio;

      const newEntity: AnyCanvasEntity = {
        id: `img-${Math.random().toString(36).substring(2, 9)}`,
        type: 'image',
        x: (canvasWidth / 2) - (defaultWidth / 2),
        y: (canvasHeight / 2) - (finalHeight / 2),
        width: defaultWidth,
        rotation: 0,
        zIndex: entities.length + 1,
        data: { path, naturalWidth, naturalHeight } as ImageData
      };
      
      setEntities(prev => [...prev, newEntity]);
      setIsImageGalleryOpen(false);
    };
    img.src = resolveAssetPath(path, rootPath);
  };

  const handlePdfSelect = (path: string) => {
    const container = containerRef.current;
    if (!container) return;

    const canvasWidth = container.clientWidth;
    const canvasHeight = container.clientHeight;
    
    const cardWidth = 200; 
    const cardHeight = 240;

    const newEntity: AnyCanvasEntity = {
      id: `pdf-${Math.random().toString(36).substring(2, 9)}`,
      type: 'pdf',
      x: (canvasWidth / 2) - (cardWidth / 2),
      y: (canvasHeight / 2) - (cardHeight / 2),
      width: cardWidth,
      rotation: 0,
      zIndex: entities.length + 1,
      data: {
        path,
        startPage: 1,
        endPage: 0,
        totalPages: 0
      } as PdfData
    };
    
    setEntities(prev => [...prev, newEntity]);
    setIsPdfGalleryOpen(false);
  };

  const handleUpdateEntity = (id: string, updates: Partial<AnyCanvasEntity>) => {
    setEntities(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  const handleRemoveEntity = (id: string) => {
    setEntities(prev => prev.filter(e => e.id !== id));
    if (selectedItemId === id) setSelectedItemId(null);
  };

  const handleConfirmSplit = (data: any) => {
    if (!splittingItem) return;
    const original = entities.find(e => e.id === splittingItem.id);
    if (!original || original.type !== 'pdf') return;

    const pdfData = original.data as PdfData;
    let pagesToExtract: number[] = [];
    
    if (data.mode === 'amount') {
      const start = data.startPage || pdfData.startPage;
      for (let i = 0; i < data.amount; i++) {
        const page = start + i;
        if (page <= pdfData.endPage) pagesToExtract.push(page);
      }
    } else if (data.mode === 'single') {
      pagesToExtract.push(data.singlePage);
    } else if (data.mode === 'range') {
      for (let i = data.startPage; i <= data.endPage; i++) {
        if (i >= pdfData.startPage && i <= pdfData.endPage) pagesToExtract.push(i);
      }
    }

    if (pagesToExtract.length === 0) return;

    // Criar novos itens para cada página extraída
    const newItems: AnyCanvasEntity[] = pagesToExtract.map((pageNum, index) => ({
      id: `pdf-page-${Math.random().toString(36).substring(2, 9)}`,
      type: 'pdf',
      x: original.x + (index + 1) * 40,
      y: original.y + (index + 1) * 40,
      width: original.width,
      rotation: 0,
      zIndex: entities.length + index + 1,
      data: {
        path: pdfData.path,
        startPage: pageNum,
        endPage: pageNum,
        totalPages: pdfData.totalPages
      } as PdfData
    }));

    setEntities(prev => {
      const filtered = prev.filter(e => e.id !== original.id);
      const maxExtracted = Math.max(...pagesToExtract);

      if (maxExtracted < pdfData.endPage) {
         filtered.push({
           ...original,
           id: `pdf-remainder-${Math.random().toString(36).substring(2, 9)}`,
           x: original.x + (pagesToExtract.length + 1) * 40,
           y: original.y + (pagesToExtract.length + 1) * 40,
           data: {
             ...pdfData,
             startPage: maxExtracted + 1
           }
         });
      }

      return [...filtered, ...newItems];
    });

    setIsSplitModalOpen(false);
    setIsSepararActive(false);
  };

  return (
    <div className={styles.container} onClick={() => setSelectedItemId(null)}>
      <button 
        className={styles.backButton} 
        onClick={() => setActivePanel('dashboard')}
        title="Voltar ao Dashboard"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </button>

      <div className={styles.toolbar}>
        <button className={styles.toolButton} onClick={zoomIn} title="Aumentar Zoom">
          <ZoomIn size={18} />
        </button>
        <button className={styles.toolButton} onClick={zoomOut} title="Diminuir Zoom">
          <ZoomOut size={18} />
        </button>
        <div className={styles.separator} />
        <button className={styles.toolButton} title="Lápis">
          <Pencil size={18} />
        </button>
        <button className={styles.toolButton} title="Borracha">
          <Eraser size={18} />
        </button>
        <button className={styles.toolButton} title="Tesoura">
          <Scissors size={18} />
        </button>
        <div className={styles.separator} />
        <button className={styles.toolButton} onClick={handleReset} title="Resetar Visualização">
          <RotateCcw size={18} />
        </button>
      </div>

      <aside className={styles.sideMenu} onClick={(e) => e.stopPropagation()}>
        <header>
          <h2>Adicionar</h2>
        </header>
        <div className={styles.content}>
          <button className={styles.menuButton}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            Nota
          </button>
          
          <button className={styles.menuButton} onClick={() => setIsPdfGalleryOpen(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <path d="M9 15h3a2 2 0 0 1 0 4h-3V12h3a2 2 0 0 1 0 4" />
            </svg>
            PDF
          </button>

          <button className={styles.menuButton}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-8.5L15.5 3Z" />
              <path d="M15 3v6h6" />
            </svg>
            Post-it
          </button>

          <button className={styles.menuButton} onClick={() => setIsImageGalleryOpen(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            Imagem
          </button>

          <div style={{ height: '1px', backgroundColor: 'var(--color-border)', margin: 'var(--spacing-xs) 0', opacity: 0.5 }} />

          <button className={styles.menuButton}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
              <path d="m13 18 6-6-6-6" />
            </svg>
            Vínculo
          </button>

          <button className={styles.menuButton}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.51a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
            Anexar
          </button>

          <button 
            className={`${styles.menuButton} ${isSepararActive ? styles.active : ''}`}
            onClick={() => setIsSepararActive(!isSepararActive)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              <line x1="15" y1="9" x2="9" y2="15" />
            </svg>
            Separar
          </button>

          <button className={styles.menuButton}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <path d="M3 9h18" />
              <path d="M9 21V9" />
            </svg>
            Agrupar
          </button>
        </div>
      </aside>

      <div className={styles.canvas} ref={containerRef}>
        <div className={styles.grid} />
        
        <div 
          className={styles.viewport}
          style={{
            transform: `translate(${viewState.x}px, ${viewState.y}px) scale(${zoom})`,
            transformOrigin: '0 0'
          }}
        >
          {entities.map(entity => {
            if (entity.type === 'image') {
              return (
                <CanvasImageItem 
                  key={entity.id}
                  entity={entity}
                  isSelected={selectedItemId === entity.id}
                  onSelect={() => setSelectedItemId(entity.id)}
                  onRemove={handleRemoveEntity}
                  onUpdate={handleUpdateEntity}
                  rootPath={rootPath}
                />
              );
            }
            if (entity.type === 'pdf') {
              return (
                <CanvasPdfItem 
                  key={entity.id}
                  entity={entity}
                  isSelected={selectedItemId === entity.id}
                  isSepararActive={isSepararActive}
                  onSelect={() => setSelectedItemId(entity.id)}
                  onRemove={handleRemoveEntity}
                  onUpdate={handleUpdateEntity}
                  onSplit={() => {
                    const data = entity.data as PdfData;
                    setSplittingItem({ 
                      id: entity.id, 
                      name: data.path.split(/[\\/]/).pop() || 'PDF', 
                      total: data.endPage - data.startPage + 1
                    });
                    setIsSplitModalOpen(true);
                  }}
                  rootPath={rootPath}
                />
              );
            }
            return null;
          })}
        </div>
      </div>

      <SplitPanel 
        isOpen={isSplitModalOpen}
        onClose={() => setIsSplitModalOpen(false)}
        onConfirm={handleConfirmSplit}
        totalItems={splittingItem?.total || 0}
        itemName={splittingItem?.name || ''}
      />

      {isImageGalleryOpen && (
        <ImageGallery 
          disableOrganization 
          largeModal 
          onSelect={handleImageSelect} 
          onClose={() => setIsImageGalleryOpen(false)} 
        />
      )}

      {isPdfGalleryOpen && (
        <PdfGallery 
          onSelect={handlePdfSelect} 
          onClose={() => setIsPdfGalleryOpen(false)} 
        />
      )}
    </div>
  );
}
