import React from 'react';
import { MoodBoardGroup, MoodBoardItem as IMoodBoardItem } from '@/shared/types';
import { MoodBoardItem } from './MoodBoardItem';
import styles from './MoodBoard.module.scss';

interface Props {
  group: MoodBoardGroup;
  items: IMoodBoardItem[];
}

export const MoodBoardGroupContainer: React.FC<Props> = ({ group, items }) => {
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
            <MoodBoardItem item={item} />
          </div>
        ))}
      </div>
    </div>
  );
};
