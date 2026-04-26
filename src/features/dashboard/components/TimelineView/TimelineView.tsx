import React from 'react';
import { useEditorStore } from '@/features/editor/store/editorStore';
import { useUIStore } from '@/store/uiStore';
import { TimelineCard } from '../TimelineCard/TimelineCard';
import { useTimelineSorting } from '../../hooks/useTimelineSorting/useTimelineSorting';
import styles from './TimelineView.module.scss';

export default function TimelineView() {
  const { loadContent } = useEditorStore();
  const { setActivePanel } = useUIStore();

  const {
    characters,
    handleMouseDown,
    draggedItem,
    dragPosition,
    isDragging,
    dropTarget,
    shouldIgnoreClick
  } = useTimelineSorting();

  const handleOpenNote = (path: string) => {
    if (shouldIgnoreClick()) return;
    loadContent(path);
    setActivePanel('editor');
  };

  if (characters.length === 0) {
    return (
      <div className={styles.empty}>
        Nenhum personagem encontrado para exibir na linha do tempo.
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.timelineLine} />

      <div className={styles.items}>
        {characters.map((char, index) => (
          <TimelineCard
            key={char.path}
            char={char}
            isEven={index % 2 !== 0}
            isDragging={draggedItem?.path === char.path && isDragging}
            isDragOver={dropTarget?.id === char.path}
            onMouseDown={(e) => handleMouseDown(e, char)}
            onClick={() => handleOpenNote(char.path)}
          />
        ))}
      </div>

      {isDragging && draggedItem && (
        <div
          className={styles.ghost}
          style={{
            '--x': `${dragPosition.x - 150}px`,
            '--y': `${dragPosition.y - 40}px`
          } as React.CSSProperties}
        >
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.name}>{draggedItem.name}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
