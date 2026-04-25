import { useState, useRef, useEffect } from 'react';
import styles from './InfiniteCanvas.module.scss';
import { useUIStore } from '../../../store/uiStore';
import { useWorkspaceStore } from '@/features/workspace/store/workspaceStore';
import { useUniverseStore } from '@/features/universe/store/universeStore';
import { resolveAssetPath } from '@/tauri-bridge/fs';
import ImageGallery from '../../editor/components/ImageGallery/ImageGallery';
import { PdfGallery } from '../../references/components/PdfGallery';
import { Trash2, ZoomIn, ZoomOut, Pencil, Eraser, Scissors, RotateCcw, RotateCw, RefreshCcw, FileText, X } from 'lucide-react';
import { useTransformable } from '@/shared/hooks/useDragAndDrop';
import { PdfThumbnail } from '@/features/dashboard/components/PdfThumbnail';
import { useZoom } from '@/shared/hooks/useZoom';
import { SplitPanel } from './SplitModal';
import { AnyCanvasEntity, ImageData, PdfData, NoteData } from '../types';
import { readFile } from '@/tauri-bridge';

/**
 * Modal simples para seleção de notas do Universo
 */
function NoteSelectionModal({ 
  isOpen, 
  onClose, 
  onSelect 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  onSelect: (path: string, name: string) => void 
}) {
  const { entities } = useUniverseStore();
  const notes = Object.values(entities).filter(e => !e.type || e.type === 'note' || e.type === 'character' || e.type === 'location');

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.noteModal} onClick={e => e.stopPropagation()}>
        <div className={styles.noteModal__header}>
          <h3>Selecione uma Nota</h3>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        <div className={styles.noteModal__list}>
          {notes.map(note => (
            <button 
              key={note.path} 
              className={styles.noteModal__item}
              onClick={() => onSelect(note.path, note.name)}
            >
              <FileText size={16} />
              <span>{note.name}</span>
            </button>
          ))}
          {notes.length === 0 && (
            <p className={styles.noteModal__empty}>Nenhuma nota encontrada no projeto.</p>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Menu de ações que aparece acima do item selecionado
 */
function CanvasActionMenu({ 
  entity, 
  onRemove, 
  onUpdate,
  handleRotateStart
}: { 
  entity: AnyCanvasEntity, 
  onRemove: (id: string) => void,
  onUpdate: (id: string, updates: Partial<AnyCanvasEntity>) => void,
  handleRotateStart: (e: React.MouseEvent) => void
}) {
  return (
    <div 
      className={styles.actionMenu}
      style={{
        left: entity.x + (entity.width || 200) / 2,
        top: entity.y - 10,
        zIndex: 1000,
        transform: `translate(-50%, -100%) rotate(${entity.rotation || 0}deg)`,
        transformOrigin: `50% ${((entity.height || 200) / 2) + 40}px`
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <button 
        className={styles.actionButton} 
        onMouseDown={handleRotateStart}
        title="Girar Item"
      >
        <RotateCw size={14} />
      </button>
      
      <button 
        className={styles.actionButton} 
        onClick={() => onUpdate(entity.id, { rotation: 0 })}
        title="Resetar Rotação"
      >
        <RefreshCcw size={14} />
      </button>

      <div className={styles.actionSeparator} />

      <button 
        className={`${styles.actionButton} ${styles.delete}`} 
        onClick={() => onRemove(entity.id)}
        title="Deletar Item"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

/**
 * Componente interno para representar uma nota transformável no canvas
 */
function CanvasNoteItem({ 
  entity, 
  isSelected, 
  onSelect, 
  onUpdate 
}: { 
  entity: AnyCanvasEntity, 
  isSelected: boolean, 
  onSelect: () => void, 
  onUpdate: (id: string, updates: Partial<AnyCanvasEntity>) => void
}) {
  const data = entity.data as NoteData;
  const [content, setContent] = useState('Carregando...');
  
  const { handleMouseDown, handleResizeStart } = useTransformable({
    x: entity.x,
    y: entity.y,
    width: entity.width || 300,
    minWidth: 200,
    onSelect,
    onUpdate: (updates) => onUpdate(entity.id, updates)
  });

  useEffect(() => {
    readFile(data.noteId).then(text => {
      // Remove o frontmatter YAML para exibição no canvas
      const cleanText = text.replace(/^---\n[\s\S]*?\n---\n/, '').substring(0, 500);
      setContent(cleanText + (text.length > 500 ? '...' : ''));
    }).catch(err => {
      setContent('Erro ao carregar nota.');
      console.error(err);
    });
  }, [data.noteId]);

  return (
    <div 
      className={`${styles.canvasNote} ${isSelected ? styles.selected : ''}`}
      style={{ 
        position: 'absolute', 
        left: entity.x, 
        top: entity.y,
        zIndex: entity.zIndex || (isSelected ? 100 : 5),
        width: entity.width || 300,
        height: entity.height || 400,
        transform: `rotate(${entity.rotation || 0}deg)`,
        fontSize: (entity.style?.fontSize as string) || '14px',
        padding: (entity.style?.padding as string) || '24px',
        color: (entity.style?.color as string) || 'var(--color-text-primary)',
        backgroundColor: (entity.style?.backgroundColor as string) || 'var(--color-bg-elevated)',
        ...entity.style
      }}
      onMouseDown={handleMouseDown}
      onClick={(e) => e.stopPropagation()}
    >
      <h3 className={styles.noteTitle}>{data.title}</h3>
      <div className={styles.noteContent}>{content}</div>

      {isSelected && (
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

/**
 * Componente interno para representar uma imagem transformável no canvas
 */
function CanvasImageItem({ 
  entity, 
  isSelected, 
  onSelect, 
  onUpdate,
  rootPath 
}: { 
  entity: AnyCanvasEntity, 
  isSelected: boolean, 
  onSelect: () => void, 
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
      <img src={resolveAssetPath(data.path, rootPath)} alt="" draggable={false} />

      {isSelected && (
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

/**
 * Componente interno para representar um PDF transformável no canvas
 */
function CanvasPdfItem({ 
  entity, 
  isSelected, 
  isSepararActive,
  onSelect, 
  onUpdate,
  onSplit,
  rootPath 
}: { 
  entity: AnyCanvasEntity, 
  isSelected: boolean, 
  isSepararActive: boolean,
  onSelect: () => void, 
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
  const [isNoteGalleryOpen, setIsNoteGalleryOpen] = useState(false);
  const [isSepararActive, setIsSepararActive] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [sideMenuMode, setSideMenuMode] = useState<'main' | 'notes'>('main');
  
  // ESTADO UNIFICADO DE ENTIDADES
  const [entities, setEntities] = useState<AnyCanvasEntity[]>([]);
  
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
  const [splittingItem, setSplittingItem] = useState<{ id: string, name: string, total: number } | null>(null);
  
  const { zoom, zoomIn, zoomOut, resetZoom } = useZoom({ initialZoom: 1, minZoom: 0.1, maxZoom: 4 });
  
  const [viewState, setViewState] = useState({ x: 0, y: 0 });

  // Sincronizar painel lateral com seleção
  useEffect(() => {
    const selectedEntity = entities.find(e => e.id === selectedItemId);
    if (selectedEntity?.type === 'note') {
      setSideMenuMode('notes');
    } else {
      setSideMenuMode('main');
    }
  }, [selectedItemId, entities]);

  const handleReset = () => {
    resetZoom();
    setViewState({ x: 0, y: 0 });
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0 || e.target !== containerRef.current?.firstChild) return;
    
    setIsPanning(true);
    const startX = e.clientX - viewState.x;
    const startY = e.clientY - viewState.y;

    const onMouseMove = (moveEvent: MouseEvent) => {
      setViewState({
        x: moveEvent.clientX - startX,
        y: moveEvent.clientY - startY
      });
    };

    const onMouseUp = () => {
      setIsPanning(false);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const handleNoteSelect = (path: string, name: string) => {
    const container = containerRef.current;
    if (!container) return;

    const canvasWidth = container.clientWidth;
    const canvasHeight = container.clientHeight;
    
    const cardWidth = 300; 
    const cardHeight = 400;
    
    const centerX = (canvasWidth / 2 - viewState.x) / zoom;
    const centerY = (canvasHeight / 2 - viewState.y) / zoom;

    const newEntity: AnyCanvasEntity = {
      id: `note-${Math.random().toString(36).substring(2, 9)}`,
      type: 'note',
      x: centerX - (cardWidth / 2),
      y: centerY - (cardHeight / 2),
      width: cardWidth,
      height: cardHeight,
      rotation: 0,
      zIndex: entities.length + 1,
      style: {
        fontSize: '14px',
        padding: '24px',
        color: '#ffffff',
        backgroundColor: '#1a1a1a' // bg-elevated dark theme
      },
      data: {
        noteId: path,
        title: name,
      } as NoteData
    };
    
    setEntities(prev => [...prev, newEntity]);
    setSelectedItemId(newEntity.id);
    setIsNoteGalleryOpen(false);
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

      const centerX = (canvasWidth / 2 - viewState.x) / zoom;
      const centerY = (canvasHeight / 2 - viewState.y) / zoom;

      const newEntity: AnyCanvasEntity = {
        id: `img-${Math.random().toString(36).substring(2, 9)}`,
        type: 'image',
        x: centerX - (defaultWidth / 2),
        y: centerY - (finalHeight / 2),
        width: defaultWidth,
        height: finalHeight,
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
    
    const centerX = (canvasWidth / 2 - viewState.x) / zoom;
    const centerY = (canvasHeight / 2 - viewState.y) / zoom;

    const newEntity: AnyCanvasEntity = {
      id: `pdf-${Math.random().toString(36).substring(2, 9)}`,
      type: 'pdf',
      x: centerX - (cardWidth / 2),
      y: centerY - 120,
      width: cardWidth,
      height: 280, // Altura estimada para PDF
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

  // Funções de manipulação de estilo para a nota selecionada
  const updateSelectedNoteStyle = (styleUpdates: Record<string, string | number>) => {
    if (!selectedItemId) return;
    const entity = entities.find(e => e.id === selectedItemId);
    if (entity?.type === 'note') {
      handleUpdateEntity(selectedItemId, {
        style: { ...entity.style, ...styleUpdates }
      });
    }
  };

  const handleFontSizeChange = (increment: number) => {
    const entity = entities.find(e => e.id === selectedItemId);
    if (!entity || entity.type !== 'note') return;
    const currentSize = parseInt((entity.style?.fontSize as string) || '14', 10);
    const newSize = Math.max(8, Math.min(72, currentSize + increment));
    updateSelectedNoteStyle({ fontSize: `${newSize}px` });
  };

  const selectedNoteEntity = entities.find(e => e.id === selectedItemId && e.type === 'note');

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

    const newItems: AnyCanvasEntity[] = pagesToExtract.map((pageNum, index) => ({
      id: `pdf-page-${Math.random().toString(36).substring(2, 9)}`,
      type: 'pdf',
      x: original.x + (index + 1) * 40,
      y: original.y + (index + 1) * 40,
      width: original.width,
      height: original.height,
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

  const visibleEntities = entities.filter(entity => {
    if (!containerRef.current) return true;
    
    const viewportWidth = containerRef.current.clientWidth / zoom;
    const viewportHeight = containerRef.current.clientHeight / zoom;
    const minX = -viewState.x / zoom;
    const minY = -viewState.y / zoom;
    const maxX = minX + viewportWidth;
    const maxY = minY + viewportHeight;

    const buffer = 500;

    return (
      entity.x + (entity.width || 300) > minX - buffer &&
      entity.x < maxX + buffer &&
      entity.y + (entity.height || 300) > minY - buffer &&
      entity.y < maxY + buffer
    );
  });

  // Ganchos de rotação para o menu
  const selectedEntity = entities.find(e => e.id === selectedItemId);
  const { handleRotateStart } = useTransformable({
    x: selectedEntity?.x || 0,
    y: selectedEntity?.y || 0,
    onUpdate: (updates) => selectedItemId && handleUpdateEntity(selectedItemId, updates)
  });

  return (
    <div className={`${styles.container} ${isPanning ? styles.panning : ''}`} onClick={() => setSelectedItemId(null)}>
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
        {sideMenuMode === 'main' ? (
          <>
            <header>
              <h2>Adicionar</h2>
            </header>
            <div className={styles.content}>
              <button className={styles.menuButton} onClick={() => setIsNoteGalleryOpen(true)}>
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
          </>
        ) : (
          <>
            <header className={styles.subHeader}>
              <button className={styles.subBackButton} onClick={() => setSideMenuMode('main')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
              </button>
              <h2>Configurar Nota</h2>
            </header>
            
            <div className={styles.content}>
              <button className={styles.menuButton} onClick={() => setIsNoteGalleryOpen(true)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                Trocar Nota
              </button>

              {selectedNoteEntity && (
                <>
                  <div className={styles.configDivider}>Configurações de Exibição</div>

                  <div className={styles.configSection}>
                    <label>Tamanho da Fonte</label>
                    <div className={styles.numberInput}>
                      <button onClick={() => handleFontSizeChange(-2)}>-</button>
                      <input type="text" value={selectedNoteEntity.style?.fontSize || '14px'} readOnly />
                      <button onClick={() => handleFontSizeChange(2)}>+</button>
                    </div>
                  </div>

                  <div className={styles.configSection}>
                    <label>Tamanho da Página</label>
                    <div className={styles.toggleGroup}>
                      <button 
                        className={selectedNoteEntity.style?.width === 420 ? styles.active : ''}
                        onClick={() => updateSelectedNoteStyle({ width: 420, height: 594 })}
                      >A4</button>
                      <button 
                        className={selectedNoteEntity.style?.width === 300 && selectedNoteEntity.style?.height === 420 ? styles.active : ''}
                        onClick={() => updateSelectedNoteStyle({ width: 300, height: 420 })}
                      >A5</button>
                      <button 
                        className={selectedNoteEntity.style?.width === 400 && selectedNoteEntity.style?.height === 400 ? styles.active : ''}
                        onClick={() => updateSelectedNoteStyle({ width: 400, height: 400 })}
                      >Sq</button>
                    </div>
                  </div>

                  <div className={styles.configSection}>
                    <label>Margens</label>
                    <div className={styles.toggleGroup}>
                      <button 
                        className={selectedNoteEntity.style?.padding === '12px' ? styles.active : ''}
                        onClick={() => updateSelectedNoteStyle({ padding: '12px' })}
                      >Estreita</button>
                      <button 
                        className={selectedNoteEntity.style?.padding === '24px' || !selectedNoteEntity.style?.padding ? styles.active : ''}
                        onClick={() => updateSelectedNoteStyle({ padding: '24px' })}
                      >Normal</button>
                      <button 
                        className={selectedNoteEntity.style?.padding === '48px' ? styles.active : ''}
                        onClick={() => updateSelectedNoteStyle({ padding: '48px' })}
                      >Larga</button>
                    </div>
                  </div>

                  <div className={styles.configSection}>
                    <label>Cor do Texto</label>
                    <div className={styles.colorPicker}>
                      {['#ffffff', '#a1a1aa', '#ec4899', '#8b5cf6', '#3b82f6'].map(color => (
                        <button 
                          key={color}
                          style={{ backgroundColor: color }} 
                          className={selectedNoteEntity.style?.color === color || (!selectedNoteEntity.style?.color && color === '#ffffff') ? styles.active : ''}
                          onClick={() => updateSelectedNoteStyle({ color })}
                        />
                      ))}
                    </div>
                  </div>
                  
                  <div className={styles.configSection}>
                    <label>Cor de Fundo</label>
                    <div className={styles.colorPicker}>
                      {['#1a1a1a', '#27272a', '#4c1d95', '#1e3a8a', '#064e3b'].map(color => (
                        <button 
                          key={color}
                          style={{ backgroundColor: color }} 
                          className={selectedNoteEntity.style?.backgroundColor === color || (!selectedNoteEntity.style?.backgroundColor && color === '#1a1a1a') ? styles.active : ''}
                          onClick={() => updateSelectedNoteStyle({ backgroundColor: color })}
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </aside>

      <div className={styles.canvas} ref={containerRef} onMouseDown={handleCanvasMouseDown}>
        <div 
          className={styles.grid} 
          style={{ 
            transform: `translate(${viewState.x % (40 * zoom)}px, ${viewState.y % (40 * zoom)}px) scale(${zoom})`,
            backgroundSize: `${40}px ${40}px`
          }} 
        />
        
        <div 
          className={styles.viewport}
          style={{
            transform: `translate(${viewState.x}px, ${viewState.y}px) scale(${zoom})`,
            transformOrigin: '0 0'
          }}
        >
          {visibleEntities.map(entity => {
            const isSelected = selectedItemId === entity.id;
            
            return (
              <div key={entity.id}>
                {entity.type === 'note' && (
                  <CanvasNoteItem 
                    entity={entity}
                    isSelected={isSelected}
                    onSelect={() => setSelectedItemId(entity.id)}
                    onUpdate={handleUpdateEntity}
                  />
                )}
                {entity.type === 'image' && (
                  <CanvasImageItem 
                    entity={entity}
                    isSelected={isSelected}
                    onSelect={() => setSelectedItemId(entity.id)}
                    onUpdate={handleUpdateEntity}
                    rootPath={rootPath}
                  />
                )}
                {entity.type === 'pdf' && (
                  <CanvasPdfItem 
                    entity={entity}
                    isSelected={isSelected}
                    isSepararActive={isSepararActive}
                    onSelect={() => setSelectedItemId(entity.id)}
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
                )}
                
                {isSelected && (
                  <CanvasActionMenu 
                    entity={entity}
                    onRemove={handleRemoveEntity}
                    onUpdate={handleUpdateEntity}
                    handleRotateStart={handleRotateStart}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <NoteSelectionModal 
        isOpen={isNoteGalleryOpen} 
        onClose={() => setIsNoteGalleryOpen(false)} 
        onSelect={handleNoteSelect} 
      />

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
