import React from 'react';
import { MesaGrupoContainerProps } from '@/shared/types';
import { MesaItem } from './MesaItem';
import styles from './MesaTrabalho.module.scss';

export const MesaGrupoContainer: React.FC<MesaGrupoContainerProps> = ({ 
  group, 
  items, 
  zoom = 1,
  onItemClick, 
  connectionSourceId,
  isGroupingMode,
  onConfirmGroup,
  onCancelGroup
}) => {
  const sortedItems = [...items].sort((a, b) => (a.groupOrder || 0) - (b.groupOrder || 0));

  return (
    <div 
      className={styles.groupContainer}
      style={{
        '--x': `${group.x}px`,
        '--y': `${group.y}px`,
        '--z-index': group.zIndex
      } as React.CSSProperties}
    >
      <div className={styles.groupContent}>
        {sortedItems.map((item) => (
          <div key={item.id} className={styles.groupedItemWrapper}>
            <MesaItem 
              item={item} 
              zoom={zoom}
              onClick={onItemClick ? () => onItemClick(item.id) : undefined}
              isConnectingSource={connectionSourceId === item.id}
              isGroupingMode={isGroupingMode}
              onConfirmGroup={onConfirmGroup}
              onCancelGroup={onCancelGroup}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
