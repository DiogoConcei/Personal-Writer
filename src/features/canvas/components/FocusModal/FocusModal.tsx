import React, { useState, useMemo } from 'react';
import styles from './FocusModal.module.scss';
import { X, Check } from 'lucide-react';
import { AnyCanvasEntity, Point, FocusModalProps } from '@/shared/types';
import { CanvasNoteItem } from '../CanvasNoteItem/CanvasNoteItem';
import { CanvasPdfItem } from '../CanvasPdfItem/CanvasPdfItem';
import { CanvasImageItem } from '../CanvasImageItem/CanvasImageItem';
import { FocusToolbar } from './FocusToolbar';
import { FocusTool } from '@/shared/types';
import { CutPatch } from '../CutPatch/CutPatch';
import { CutPatch as CutPatchType } from '@/shared/types';
import { useCanvasCropPersistence } from '../../hooks/useCanvasCropPersistence';

export const FocusModal: React.FC<FocusModalProps> = ({
  isOpen,
  onClose,
  entity,
  rootPath,
  onUpdate,
  onAddPendingCollage
}) => {
  const [activeTool, setActiveTool] = useState<FocusTool>('select');
  const [isDragging, setIsDragging] = useState(false);
  const [isSimulatingCut, setIsSimulatingCut] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1);
  const [startPoint, setStartPoint] = useState<{ x: number, y: number } | null>(null);
  const [currentPoint, setCurrentPoint] = useState<{ x: number, y: number } | null>(null);
  const [lassoPoints, setLassoPoints] = useState<Point[]>([]);
  const [boundingBox, setBoundingBox] = useState<{ x: number, y: number, width: number, height: number } | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { persistCrop } = useCanvasCropPersistence({ onUpdate, rootPath });

  const entityWidth = (entity?.width as number) || 400;
  const entityHeight = (entity?.height as number) || 500;

  // Cálculo de escala dinâmica para preencher o modal sem alterar o layout interno da nota
  React.useEffect(() => {
    if (!isOpen) return;

    const handleResize = () => {
      const padding = 160;
      const availableWidth = window.innerWidth - padding;
      const availableHeight = window.innerHeight - padding;
      
      const scaleX = availableWidth / entityWidth;
      const scaleY = availableHeight / entityHeight;
      const optimalScale = Math.min(scaleX, scaleY, 2.5); // Zoom máximo de 2.5x para não pixelizar demais
      
      setScale(optimalScale);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen, entityWidth, entityHeight]);

  const lassoPathData = useMemo(() => {
    if (lassoPoints.length < 2) return '';
    return `M ${lassoPoints[0].x} ${lassoPoints[0].y} ` + 
           lassoPoints.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ') + 
           ' Z';
  }, [lassoPoints]);

  if (!isOpen || !entity) return null;

  const handleConfirmSelection = async () => {
    if (!boundingBox || !entity || !containerRef.current || !rootPath) return;
    
    setIsSimulatingCut(true);
    const pendingId = onAddPendingCollage?.(entity, boundingBox);

    if (pendingId) {
      // Chamar o hook descentralizado para persistência
      await persistCrop(pendingId, {
        points: lassoPoints,
        boundingBox,
        container: containerRef.current
      });
    }

    // Registrar o "remendo" na entidade original (o buraco)
    const newPatch: CutPatchType = {
      id: `patch-${Math.random().toString(36).substring(2, 9)}`,
      ...boundingBox,
      page: currentPage,
      points: lassoPoints.length > 2 ? lassoPoints : undefined
    };
    
    const entityData = entity.data as { patches?: CutPatchType[] };
    const currentPatches = entityData.patches || [];

    // Pequeno delay para a animação de "flash" do corte
    setTimeout(() => {
      onUpdate(entity.id, {
        data: {
          ...entity.data as object,
          patches: [...currentPatches, newPatch]
        }
      });
      setIsSimulatingCut(false);
      handleCancelSelection();
    }, 600);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    if ((activeTool !== 'square' && activeTool !== 'lasso') || !containerRef.current || isSimulatingCut) return;
    
    // Intercepta o evento para que a nota não inicie um arraste (stopPropagation)
    e.stopPropagation();

    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(entityWidth, (e.clientX - rect.left) / (rect.width / entityWidth)));
    const y = Math.max(0, Math.min(entityHeight, (e.clientY - rect.top) / (rect.height / entityHeight)));
    
    setIsDragging(true);
    setBoundingBox(null);

    if (activeTool === 'square') {
      setStartPoint({ x, y });
      setCurrentPoint({ x, y });
      setLassoPoints([]);
    } else if (activeTool === 'lasso') {
      setLassoPoints([{ x, y }]);
      setStartPoint(null);
      setCurrentPoint(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(entityWidth, (e.clientX - rect.left) / (rect.width / entityWidth)));
    const y = Math.max(0, Math.min(entityHeight, (e.clientY - rect.top) / (rect.height / entityHeight)));
    
    if (activeTool === 'square') {
      setCurrentPoint({ x, y });
    } else if (activeTool === 'lasso') {
      setLassoPoints(prev => [...prev, { x, y }]);
    }
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);

    if (activeTool === 'square' && startPoint && currentPoint) {
      const x = Math.min(startPoint.x, currentPoint.x);
      const y = Math.min(startPoint.y, currentPoint.y);
      const width = Math.abs(currentPoint.x - startPoint.x);
      const height = Math.abs(currentPoint.y - startPoint.y);

      if (width >= 10 && height >= 10) {
        setBoundingBox({ x, y, width, height });
      } else {
        setStartPoint(null);
        setCurrentPoint(null);
      }
    } else if (activeTool === 'lasso' && lassoPoints.length > 2) {
      const xs = lassoPoints.map(p => p.x);
      const ys = lassoPoints.map(p => p.y);
      const minX = Math.min(...xs);
      const minY = Math.min(...ys);
      const maxX = Math.max(...xs);
      const maxY = Math.max(...ys);
      
      const width = maxX - minX;
      const height = maxY - minY;

      if (width >= 10 && height >= 10) {
        setBoundingBox({ x: minX, y: minY, width, height });
      } else {
        setLassoPoints([]);
      }
    }
  };

  const handleCancelSelection = () => {
    setStartPoint(null);
    setCurrentPoint(null);
    setLassoPoints([]);
    setBoundingBox(null);
  };

  const renderSelection = () => {
    return (
      <svg className={styles.selectionLayer} data-html2canvas-ignore="true">
        {activeTool === 'square' && startPoint && currentPoint && (
          <rect 
            x={Math.min(startPoint.x, currentPoint.x)} 
            y={Math.min(startPoint.y, currentPoint.y)} 
            width={Math.abs(currentPoint.x - startPoint.x)} 
            height={Math.abs(currentPoint.y - startPoint.y)} 
            className={`${styles.selectionRect} ${isSimulatingCut ? styles.simulatingCut : ''}`}
          />
        )}
        {activeTool === 'lasso' && lassoPoints.length > 1 && (
          <path 
            d={lassoPathData}
            className={`${styles.selectionRect} ${isSimulatingCut ? styles.simulatingCut : ''}`}
          />
        )}
      </svg>
    );
  };

  const renderActionMenu = () => {
    if (!boundingBox || isDragging || isSimulatingCut) return null;

    return (
      <div 
        className={styles.cutActionMenu}
        style={{
          left: boundingBox.x + boundingBox.width,
          top: boundingBox.y,
          // Contra-escala para os botões não ficarem gigantes no zoom
          transform: `translate(-100%, -100%) scale(${1 / scale})`,
          transformOrigin: 'bottom right'
        }}
      >
        <button className={styles.confirmBtn} onClick={handleConfirmSelection}>
          <Check size={18} />
        </button>
        <button className={styles.cancelBtn} onClick={handleCancelSelection}>
          <X size={18} />
        </button>
      </div>
    );
  };

  const renderFocusedEntity = () => {
    const focusedEntity: AnyCanvasEntity = {
      ...entity,
      x: 0,
      y: 0,
      rotation: 0,
      zIndex: 10,
    };

    const commonProps = {
      entity: focusedEntity,
      isSelected: false,
      isSepararActive: false,
      isScissorsActive: false,
      onSelect: () => {},
      onUpdate: () => {},
      onRemove: () => {},
      onStart: () => {},
      onEnd: () => {},
      onFocus: () => {},
      onPageChange: setCurrentPage
    };

    switch (entity.type) {
      case 'note':
        return <CanvasNoteItem {...commonProps} onSplit={() => {}} />;
      case 'pdf':
        return <CanvasPdfItem {...commonProps} onSplit={() => {}} rootPath={rootPath} />;
      case 'image':
        return <CanvasImageItem {...commonProps} rootPath={rootPath} />;
      default:
        return null;
    }
  };

  return (
    <div 
      className={styles.overlay} 
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>
          <X size={24} />
        </button>

        <FocusToolbar 
          activeTool={activeTool} 
          onToolChange={(tool) => {
            setActiveTool(tool);
            handleCancelSelection();
          }} 
        />

        <div className={styles.content}>
          <div 
            ref={containerRef}
            className={styles.focusArea}
            style={{ 
              width: entityWidth, 
              height: entityHeight, 
              position: 'relative',
              transform: `scale(${scale})`,
              transformOrigin: 'center center'
            }}
          >
            {renderFocusedEntity()}

            {/* Renderizar os remendos (Patches) da página atual */}
            {((entity.data as { patches?: CutPatchType[] }).patches || [])
              .filter((p: CutPatchType) => p.page === currentPage)
              .map((patch: CutPatchType) => (
                <CutPatch 
                  key={patch.id} 
                  patch={patch} 
                  backgroundColor="var(--color-bg-base)"
                />
              ))}
            
            {(activeTool === 'square' || activeTool === 'lasso') && (
              <div 
                className={styles.activeOverlay}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{ cursor: 'crosshair' }}
              />
            )}

            {renderSelection()}
            {renderActionMenu()}
          </div>
        </div>
      </div>
    </div>
  );
};
