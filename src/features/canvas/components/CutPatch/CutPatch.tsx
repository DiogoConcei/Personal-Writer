import React from 'react';
import styles from './CutPatch.module.scss';
import { CutPatch as CutPatchType } from '@/shared/types';

interface CutPatchProps {
  patch: CutPatchType;
  backgroundColor?: string;
}

export const CutPatch: React.FC<CutPatchProps> = ({ patch, backgroundColor }) => {
  return (
    <div 
      className={styles.cutPatch}
      style={{
        left: patch.x,
        top: patch.y,
        width: patch.width,
        height: patch.height,
        backgroundColor: backgroundColor || undefined
      }}
    />
  );
};
