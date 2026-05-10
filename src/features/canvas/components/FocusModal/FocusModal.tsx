import React, { useState, useMemo } from 'react';
import styles from './FocusModal.module.scss';
import { X, MousePointer2, Square, Scissors, Check } from 'lucide-react';
import { AnyCanvasEntity } from '@/shared/types';
import { CanvasNoteItem } from '../CanvasNoteItem/CanvasNoteItem';
import { CanvasPdfItem } from '../CanvasPdfItem/CanvasPdfItem';
import { CanvasImageItem } from '../CanvasImageItem/CanvasImageItem';
import { useScissorsTrace } from '../../hooks/useScissorsTrace';
import { processCanvasCrop } from '../../utils/canvasCropUtils';

interface FocusModalProps {
  isOpen: boolean;
  onClose: () => void;
  entity: AnyCanvasEntity | null;
  rootPath: string | null;
  onExtractCrop?: (base64: string | null, status?: 'start' | 'finish', id?: string) => string | void;
}

export const FocusModal: React.FC<FocusModalProps> = ({
  isOpen,
  onClose,
  entity,
  rootPath,
  onExtractCrop
}) => {
  const [activeTool, setActiveTool] = useState<'select' | 'square' | 'scissors'>('select');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { points, isDragging, containerRef, clearTrace, handlers } = useScissorsTrace({
    isEnabled: (activeTool === 'scissors' || activeTool === 'square') && !isProcessing,
    mode: activeTool === 'square' ? 'square' : 'path',
    fadeDelay: -1 // Persiste até limpar manualmente
  });

  const boundingBox = useMemo(() => {
    if (points.length < 2 || isDragging) return null;

    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }, [points, isDragging]);

  if (!isOpen || !entity) return null;

  const handleConfirmCut = async () => {
    if (!boundingBox || !containerRef.current || isProcessing) return;

    // Validação de tamanho mínimo (10x10 pixels)
    if (boundingBox.width < 10 || boundingBox.height < 10) {
      if (onExtractCrop) onExtractCrop(null, 'finish');
      clearTrace();
      return;
    }

    setIsProcessing(true);

    // Sinaliza o início do processo para criar o placeholder no canvas de fundo
    let pendingId: string | undefined;
    if (onExtractCrop) {
      const result = onExtractCrop(null, 'start');
      if (typeof result === 'string') pendingId = result;
    }

    const base64 = await processCanvasCrop({
      points,
      boundingBox,
      container: containerRef.current
    });

    // Fecha o modal conforme solicitado
    onClose();

    if (base64 && onExtractCrop) {
      // Executa a finalização após o fechamento
      setTimeout(() => {
        onExtractCrop(base64, 'finish', pendingId);
        setIsProcessing(false);
        clearTrace();
      }, 300);
    } else {
      setIsProcessing(false);
      clearTrace();
    }
  };

  const handleCancelCut = () => {
    clearTrace();
  };

  const renderFocusedEntity = () => {
    // Criamos uma versão da entidade para o foco com dimensões maiores e posição 0,0
    const focusedEntity: AnyCanvasEntity = {
      ...entity,
      x: 0,
      y: 0,
      rotation: 0,
      width: 800, // Largura maior para o foco
      height: 1000, // Altura maior para o foco
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

        <div className={styles.focusToolbar}>
          <button 
            className={`${styles.toolBtn} ${activeTool === 'select' ? styles.active : ''}`} 
            onClick={() => setActiveTool('select')}
            title="Selecionar"
          >
            <MousePointer2 size={20} />
          </button>
          <button 
            className={`${styles.toolBtn} ${activeTool === 'square' ? styles.active : ''}`} 
            onClick={() => setActiveTool('square')}
            title="Quadrado"
          >
            <Square size={20} />
          </button>
          <button 
            className={`${styles.toolBtn} ${activeTool === 'scissors' ? styles.active : ''}`} 
            onClick={() => setActiveTool('scissors')}
            title="Tesoura (Corte Livre)"
          >
            <Scissors size={20} />
          </button>
        </div>

        <div 
          ref={containerRef}
          className={styles.content}
          onMouseDownCapture={(e) => {
            const isTraceTool = activeTool === 'scissors' || activeTool === 'square';
            if (isTraceTool && !(e.target as HTMLElement).closest('button')) {
              handlers.onMouseDown(e);
              e.stopPropagation();
            }
          }}
          onMouseMove={handlers.onMouseMove}
          onMouseUp={handlers.onMouseUp}
          onMouseLeave={handlers.onMouseUp}
          style={{ cursor: activeTool !== 'select' ? 'crosshair' : 'default' }}
        >
          {renderFocusedEntity()}

          {/* Camada do Rastro (Tesoura ou Quadrado) */}
          {points.length > 1 && points[0] && (
            <svg className={styles.scissorsLayer}>
              {activeTool === 'square' && points[1] ? (
                <rect
                  x={Math.min(points[0].x, points[1].x)}
                  y={Math.min(points[0].y, points[1].y)}
                  width={Math.abs(points[1].x - points[0].x)}
                  height={Math.abs(points[1].y - points[0].y)}
                  className={styles.scissorsPath}
                />
              ) : activeTool === 'scissors' ? (
                <polyline
                  points={points.filter(p => !!p).map(p => `${p.x},${p.y}`).join(' ')}
                  className={styles.scissorsPath}
                />
              ) : null}
            </svg>
          )}

          {/* Menu de Ação do Recorte */}
          {boundingBox && !isProcessing && (
            <div 
              className={styles.cutActionMenu}
              style={{
                left: boundingBox.x + boundingBox.width,
                top: boundingBox.y
              }}
              onMouseDown={e => e.stopPropagation()} // Evita iniciar novo rastro ao clicar nos botões
            >
              <button className={styles.confirmBtn} onClick={handleConfirmCut} title="Confirmar Recorte">
                <Check size={18} />
              </button>
              <button className={styles.cancelBtn} onClick={handleCancelCut} title="Cancelar">
                <X size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
