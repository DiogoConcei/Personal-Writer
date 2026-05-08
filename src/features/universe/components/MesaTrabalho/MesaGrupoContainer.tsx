import React from 'react';
import { MesaGrupo, MesaItem as IMesaItem } from '@/shared/types';
import { MesaItem } from './MesaItem';
import styles from './MesaTrabalho.module.scss';

interface Props {
  group: MesaGrupo;
  items: IMesaItem[];
  onItemClick?: (id: string) => void;
  connectionSourceId?: string | null;
  isGroupingMode?: boolean;
  onConfirmGroup?: () => void;
  onCancelGroup?: () => void;
}

export const MesaGrupoContainer: React.FC<Props> = ({ 
  group, 
  items, 
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
