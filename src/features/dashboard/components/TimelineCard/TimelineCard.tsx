import React from 'react';
import { User } from 'lucide-react';
import { TimelineCardProps } from '@/shared/types';
import { useEntityIcon } from '@/shared/hooks/useEntityIcon';
import styles from './TimelineCard.module.scss';

export interface ExtendedTimelineCardProps extends TimelineCardProps {
  isEven: boolean;
}

export const TimelineCard: React.FC<ExtendedTimelineCardProps> = ({
  char,
  isDragging,
  isDragOver,
  onMouseDown,
  onClick,
  isEven
}) => {
  const { resolveEntityIcon } = useEntityIcon();
  const { imageUrl, isEmoji } = resolveEntityIcon(char);

  return (
    <div
      className={`
        ${styles.itemWrapper} 
        ${isDragging ? styles.dragging : ''} 
        ${isDragOver ? styles.dragOver : ''}
        ${isEven ? styles.even : ''}
      `}
      data-drag-id={char.path}
      data-drag-type="character"
    >
      <div className={styles.itemContent}>
        <div
          className={styles.card}
          onMouseDown={onMouseDown}
          onClick={onClick}
        >
          <div className={styles.cardHeader}>
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={char.name}
                className={styles.avatar}
              />
            ) : (
              <div className={styles.noAvatar}>
                {isEmoji ? char.icon : <User size={24} />}
              </div>
            )}
            <span className={styles.name}>{char.name}</span>
          </div>
          <p className={styles.excerpt}>{char.excerpt}</p>
        </div>
        <div className={styles.dot} />
      </div>
    </div>
  );
};
