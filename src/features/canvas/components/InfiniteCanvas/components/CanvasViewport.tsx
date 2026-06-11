import React from 'react';
import { CanvasViewportProps } from '@/shared/types';
import { CanvasBase } from '@/shared/components/CanvasBase/CanvasBase';
import { CanvasDrawingLayer } from '@/shared/components/CanvasDrawingLayer/CanvasDrawingLayer';
import { EntityRenderer } from './EntityRenderer';
import { CanvasActionMenu } from '../../CanvasActionMenu/CanvasActionMenu';
import styles from '../InfiniteCanvas.module.scss';

export const CanvasViewport: React.FC<CanvasViewportProps> = ({
  containerRef,
  zoom,
  viewState,
  isPanning,
  isSpacePressed,
  isPanActive,
  isEraserActive,
  isCollageActive,
  isSplitModeActive,
  isScissorsActive,
  rootPath,
  drawings,
  visibleEntities,
  selectedItemId,
  selectedItemIds,
  onMouseDown,
  onSelectItem,
  onUpdateEntity,
  onRemoveEntity,
  onStartTransform,
  onEndTransform,
  onRotateStart,
  onOpenModal,
  bringToFront,
  sendToBack,
  removeDrawing,
  onDropEntityOnNote,
  marquee
}) => {
  return (
    <CanvasBase
      containerRef={containerRef}
      zoom={zoom}
      viewState={viewState}
      isPanning={isPanning}
      isSpacePressed={isSpacePressed}
      isPanModeActive={isPanActive}
      backgroundPattern="none"
      onMouseDown={onMouseDown}
      beforeViewport={
        <div 
          className={styles.grid} 
          style={{ 
            backgroundPosition: `${viewState.x}px ${viewState.y}px`, 
            backgroundSize: `${40 * zoom}px ${40 * zoom}px` 
          }} 
        />
      }
    >
      {visibleEntities.map((entity) => (
        <div key={entity.id}>
          <EntityRenderer
            entity={entity}
            selectedItemIds={selectedItemIds}
            isSplitModeActive={isSplitModeActive}
            isScissorsActive={isScissorsActive}
            rootPath={rootPath}
            onSelect={onSelectItem}
            onUpdate={onUpdateEntity}
            onRemove={onRemoveEntity}
            onStartTransform={onStartTransform}
            onEndTransform={onEndTransform}
            onOpenModal={onOpenModal}
            onDropEntity={(sourceData) => onDropEntityOnNote?.(entity.id, sourceData)}
          />

          {selectedItemId === entity.id && (
            <CanvasActionMenu
              entity={entity}
              onRemove={onRemoveEntity}
              onUpdate={onUpdateEntity}
              onBringToFront={bringToFront}
              onSendToBack={sendToBack}
              handleRotateStart={onRotateStart}
            />
          )}
        </div>
      ))}

      <CanvasDrawingLayer 
        drawings={drawings} 
        removeDrawing={removeDrawing} 
        isEraserActive={isEraserActive} 
        isCollageActive={isCollageActive} 
        selectedItemIds={selectedItemIds} 
        onSelect={onSelectItem} 
      />

      {marquee?.isVisible && (
        <div
          className={styles.marquee}
          style={{
            left: Math.min(marquee.startX, marquee.endX),
            top: Math.min(marquee.startY, marquee.endY),
            width: Math.abs(marquee.endX - marquee.startX),
            height: Math.abs(marquee.endY - marquee.startY),
          }}
        />
      )}
    </CanvasBase>
  );
};
