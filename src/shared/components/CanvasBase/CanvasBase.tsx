import React, { ReactNode, RefObject } from 'react';
import styles from './CanvasBase.module.scss';

interface CanvasBaseProps {
  containerRef: RefObject<HTMLDivElement | null>;
  zoom: number;
  viewState: { x: number; y: number };
  isPanning: boolean;
  isSpacePressed?: boolean;
  isPanModeActive?: boolean;
  isPlanning?: boolean;
  backgroundPattern?: 'dots' | 'grid' | 'cork' | 'none';
  children: ReactNode;
  beforeViewport?: ReactNode;
  onMouseDown?: (e: React.MouseEvent) => void;
  className?: string;
  style?: React.CSSProperties;
  viewportStyle?: React.CSSProperties;
}

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
        className={styles.viewport}
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
