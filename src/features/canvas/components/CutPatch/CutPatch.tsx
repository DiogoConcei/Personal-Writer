import React, { useMemo } from 'react';
import styles from './CutPatch.module.scss';
import { CutPatchProps } from '@/shared/types';

export const CutPatch: React.FC<CutPatchProps> = ({ patch, backgroundColor }) => {
  const clipPath = useMemo(() => {
    if (!patch.points || patch.points.length < 3) return undefined;
    
    // Converte os pontos absolutos da entidade em pontos relativos ao container do patch
    return `polygon(${patch.points.map(p => 
      `${p.x - patch.x}px ${p.y - patch.y}px`
    ).join(', ')})`;
  }, [patch.points, patch.x, patch.y]);

  return (
    <div 
      className={styles.cutPatch}
      style={{
        left: patch.x,
        top: patch.y,
        width: patch.width,
        height: patch.height,
        backgroundColor: backgroundColor || undefined,
        clipPath: clipPath
      }}
    />
  );
};
