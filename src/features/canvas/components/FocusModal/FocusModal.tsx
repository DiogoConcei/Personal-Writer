import React, { useState } from 'react';
import styles from './FocusModal.module.scss';
import { X, Check } from 'lucide-react';
import { AnyCanvasEntity } from '@/shared/types';
import { CanvasNoteItem } from '../CanvasNoteItem/CanvasNoteItem';
import { CanvasPdfItem } from '../CanvasPdfItem/CanvasPdfItem';
import { CanvasImageItem } from '../CanvasImageItem/CanvasImageItem';
import { FocusToolbar, FocusTool } from './FocusToolbar';
import { CutPatch } from '../CutPatch/CutPatch';
import { CutPatch as CutPatchType } from '@/shared/types';
import { useGalleryStore } from '@/features/image-manager/store/galleryStore';
import { saveBase64Image } from '@/tauri-bridge/fs';

interface FocusModalProps {
  isOpen: boolean;
  onClose: () => void;
  entity: AnyCanvasEntity | null;
  rootPath: string | null;
  onUpdate: (id: string, updates: Partial<AnyCanvasEntity>) => void;
  onAddPendingCollage?: (sourceEntity: AnyCanvasEntity, boundingBox: { x: number, y: number, width: number, height: number }) => string | void;
}

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
  const [boundingBox, setBoundingBox] = useState<{ x: number, y: number, width: number, height: number } | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const registerCollage = useGalleryStore(state => state.registerCollage);

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

  if (!isOpen || !entity) return null;

  const handleConfirmSelection = async () => {
    if (!boundingBox || !entity || !containerRef.current) return;
    
    setIsSimulatingCut(true);
    const pendingId = onAddPendingCollage?.(entity, boundingBox);

    // Registrar o "remendo" na entidade original (o buraco)
    const newPatch: CutPatchType = {
      id: `patch-${Math.random().toString(36).substring(2, 9)}`,
      ...boundingBox,
      page: currentPage
    };
    
    const entityData = entity.data as { patches?: CutPatchType[] };
    const currentPatches = entityData.patches || [];

    const processExtraction = async () => {
      try {
        if (!containerRef.current || !rootPath || !pendingId) return;

        const { default: html2canvas } = await import('html2canvas');

        // 1. Capturamos o elemento INTEIRO ignorando a escala do CSS.
        // O truque 'onclone' permite modificar o DOM clonado antes da renderização.
        const fullCanvas = await html2canvas(containerRef.current, {
          useCORS: true,
          allowTaint: true,
          scale: 1, // Garantir 1:1 pixels
          backgroundColor: null,
          logging: false,
          onclone: (clonedDoc) => {
            const el = clonedDoc.querySelector(`.${styles.focusArea}`) as HTMLElement;
            if (el) {
              // Removemos a escala do clone para que o html2canvas 
              // renderize as coordenadas reais (1:1)
              el.style.transform = 'none';
            }
          }
        });

        // 2. Criamos o canvas final apenas para a região do recorte (crop manual)
        const cropCanvas = document.createElement('canvas');
        cropCanvas.width = boundingBox.width;
        cropCanvas.height = boundingBox.height;
        const cropCtx = cropCanvas.getContext('2d');

        if (!cropCtx) throw new Error('Could not get crop canvas context');

        // Copiamos apenas a região selecionada do canvas grande para o pequeno
        cropCtx.drawImage(
          fullCanvas,
          boundingBox.x, boundingBox.y, boundingBox.width, boundingBox.height, // Source (1:1)
          0, 0, boundingBox.width, boundingBox.height // Destination
        );

        const base64Data = cropCanvas.toDataURL('image/png').split(',')[1];
        const fileName = `collage_${Date.now()}.png`;

        // 3. Salvar via Bridge (que já lida com o invoke correto)
        const savedPath = await saveBase64Image(
          fileName,
          base64Data,
          rootPath
        );

        await registerCollage(savedPath);

        onUpdate(pendingId as string, {
          data: {
            path: savedPath,
            isPending: false,
            progress: 100
          }
        });

      } catch (err) {
        console.error('Erro na extração html2canvas:', err);
        if (pendingId) {
          onUpdate(pendingId as string, { 
            data: { 
              isPending: false, 
              error: true 
            } as unknown as AnyCanvasEntity['data']
          });
        }
      }
    };

    processExtraction();

    setTimeout(() => {
      onUpdate(entity.id, {
        data: {
          ...entity.data as object,
          patches: [...currentPatches, newPatch]
        }
      });
      setIsSimulatingCut(false);
      setStartPoint(null);
      setCurrentPoint(null);
      setBoundingBox(null);
    }, 600);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    if (activeTool !== 'square' || !containerRef.current || isSimulatingCut) return;
    
    // Intercepta o evento para que a nota não inicie um arraste (stopPropagation)
    e.stopPropagation();

    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / (rect.width / entityWidth);
    const y = (e.clientY - rect.top) / (rect.height / entityHeight);
    
    setIsDragging(true);
    setStartPoint({ x, y });
    setCurrentPoint({ x, y });
    setBoundingBox(null);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(entityWidth, (e.clientX - rect.left) / (rect.width / entityWidth)));
    const y = Math.max(0, Math.min(entityHeight, (e.clientY - rect.top) / (rect.height / entityHeight)));
    
    setCurrentPoint({ x, y });
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);

    if (startPoint && currentPoint) {
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
    }
  };

  const handleCancelSelection = () => {
    setStartPoint(null);
    setCurrentPoint(null);
    setBoundingBox(null);
  };

  const renderSelection = () => {
    if (!startPoint || !currentPoint) return null;

    const x = Math.min(startPoint.x, currentPoint.x);
    const y = Math.min(startPoint.y, currentPoint.y);
    const width = Math.abs(currentPoint.x - startPoint.x);
    const height = Math.abs(currentPoint.y - startPoint.y);

    return (
      <svg className={styles.selectionLayer}>
        <rect 
          x={x} 
          y={y} 
          width={width} 
          height={height} 
          className={`${styles.selectionRect} ${isSimulatingCut ? styles.simulatingCut : ''}`}
        />
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
          onToolChange={setActiveTool} 
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
            
            {activeTool === 'square' && (
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
