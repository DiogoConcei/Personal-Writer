import React from 'react';
import { CanvasBaseProps } from '@/shared/types';
import styles from './CanvasBase.module.scss';

/**
 * Componente base que fornece a estrutura visual de um Canvas (Viewport + Background).
 * Unifica a renderização do InfiniteCanvas e da MesaTrabalho.
 */
export const CanvasBase: React.FC<CanvasBaseProps> = ({
  containerRef,
  zoom,
  viewState,
  isPanning,
  isSpacePressed,
  isPanModeActive,
  isPlanning,
  backgroundPattern = 'dots',
  children,
  beforeViewport,
  onMouseDown,
  className = '',
  style,
  viewportStyle
}) => {
  return (
    <div
      ref={containerRef}
      className={`
        ${styles.canvas} 
        ${styles[`canvas--${backgroundPattern}`]} 
        ${isPanning ? styles.panning : ''} 
        ${(isSpacePressed || isPanModeActive) ? styles.spacePressed : ''} 
        ${isPlanning ? styles.planning : ''} 
        ${className}
      `}
      onMouseDown={onMouseDown}
      onDragOver={(e) => e.preventDefault()}
      style={style}
    >
      {beforeViewport}
      <div
        className={`${styles.viewport} canvas-viewport`}
        data-is-viewport="true"
        style={{
          transform: `translate(${viewState.x}px, ${viewState.y}px) scale(${zoom})`,
          ...viewportStyle
        }}
      >
        {children}
      </div>
    </div>
  );
};
