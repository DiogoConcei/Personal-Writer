import { useState, useRef, useMemo, useEffect } from 'react';
import { useUniverseStore } from '@/features/universe/store/universeStore';
import { useWorkspaceStore } from '@/features/workspace/store/workspaceStore';
import { useEditorStore } from '@/features/editor/store/editorStore';
import { useUIStore } from '@/store/uiStore';
import { resolveAssetPath } from '@/tauri-bridge';
import styles from './TimelineView.module.scss';
import { User } from 'lucide-react';

export default function TimelineView() {
  const { entities, updateEntitiesOrder } = useUniverseStore();
  const { rootPath } = useWorkspaceStore();
  const { loadContent } = useEditorStore();
  const { setActivePanel } = useUIStore();

  const [draggedPath, setDraggedPath] = useState<string | null>(null);
  const [dragOverPath, setDragOverPath] = useState<string | null>(null);
  const [ghostPos, setGhostPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const dragStartTime = useRef<number>(0);
  const startPos = useRef({ x: 0, y: 0 });

  // Filtrar apenas personagens e ordenar pelo campo 'order'
  const characters = useMemo(() => {
    return Object.values(entities)
      .filter(e => e.type === 'character')
      .sort((a, b) => {
        const orderA = a.fields?.order ?? Infinity;
        const orderB = b.fields?.order ?? Infinity;
        if (orderA === orderB) return a.name.localeCompare(b.name);
        return orderA - orderB;
      });
  }, [entities]);

  const handleMouseDown = (e: React.MouseEvent, path: string) => {
    // Apenas botão esquerdo
    if (e.button !== 0) return;

    dragStartTime.current = Date.now();
    startPos.current = { x: e.clientX, y: e.clientY };
    setDraggedPath(path);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!draggedPath) return;

      const deltaX = Math.abs(e.clientX - startPos.current.x);
      const deltaY = Math.abs(e.clientY - startPos.current.y);
      const timeElapsed = Date.now() - dragStartTime.current;

      // Threshold: 5px de movimento E 150ms de clique (KI-023)
      if (!isDragging && (deltaX > 5 || deltaY > 5) && timeElapsed > 150) {
        setIsDragging(true);
      }

      if (isDragging) {
        setGhostPos({ x: e.clientX, y: e.clientY });

        // Detectar sobre qual item estamos passando
        const element = document.elementFromPoint(e.clientX, e.clientY);
        const itemElement = element?.closest('[data-path]');
        if (itemElement) {
          const path = itemElement.getAttribute('data-path');
          if (path && path !== draggedPath) {
            setDragOverPath(path);
          } else {
            setDragOverPath(null);
          }
        } else {
          setDragOverPath(null);
        }
      }
    };

    const handleMouseUp = async () => {
      if (isDragging && draggedPath && dragOverPath) {
        const oldIndex = characters.findIndex(c => c.path === draggedPath);
        const newIndex = characters.findIndex(c => c.path === dragOverPath);

        if (oldIndex !== -1 && newIndex !== -1) {
          const newOrder = [...characters];
          const [movedItem] = newOrder.splice(oldIndex, 1);
          newOrder.splice(newIndex, 0, movedItem);

          await updateEntitiesOrder(newOrder.map(c => c.path));
        }
      }

      setDraggedPath(null);
      setDragOverPath(null);
      setIsDragging(false);
    };

    if (draggedPath) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggedPath, isDragging, dragOverPath, characters, updateEntitiesOrder]);

  const handleOpenNote = (path: string) => {
    if (isDragging) return;
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

  const draggedEntity = draggedPath ? entities[draggedPath] : null;

  return (
    <div className={styles.container}>
      <div className={styles.timelineLine} />
      
      <div className={styles.items}>
        {characters.map((char) => (
          <div 
            key={char.path} 
            className={`${styles.itemWrapper} ${draggedPath === char.path && isDragging ? styles.dragging : ''} ${dragOverPath === char.path ? styles.dragOver : ''}`}
            data-path={char.path}
          >
            <div className={styles.itemContent}>
              <div 
                className={styles.card}
                onMouseDown={(e) => handleMouseDown(e, char.path)}
                onClick={() => handleOpenNote(char.path)}
              >
                <div className={styles.cardHeader}>
                  {char.icon && char.icon.includes('/') ? (
                    <img 
                      src={resolveAssetPath(char.icon, rootPath)} 
                      alt={char.name} 
                      className={styles.avatar} 
                    />
                  ) : (
                    <div className={styles.noAvatar}>
                      {char.icon || <User size={24} />}
                    </div>
                  )}
                  <span className={styles.name}>{char.name}</span>
                </div>
                <p className={styles.excerpt}>{char.excerpt}</p>
              </div>
              <div className={styles.dot} />
            </div>
          </div>
        ))}
      </div>

      {isDragging && draggedEntity && (
        <div 
          className={styles.ghost}
          style={{ 
            left: ghostPos.x - 150, 
            top: ghostPos.y - 40 
          }}
        >
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.name}>{draggedEntity.name}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
