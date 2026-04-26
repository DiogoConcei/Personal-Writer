import { useEffect, useRef, useState } from 'react';
import { useWorkspaceStore } from '@/features/workspace/store/workspaceStore';
import { useUIStore } from '@/store/uiStore';
import { useMoodBoardStore } from '../../store/moodBoardStore';
import { MoodBoardItem } from './MoodBoardItem';
import { useNativeDragDrop } from '@/shared/hooks/useNativeDragDrop/useNativeDragDrop';
import { copyFileToWorkspace } from '@/tauri-bridge/fs';
import styles from './MoodBoard.module.scss';
import { Image as ImageIcon, MousePointer2, Plus } from 'lucide-react';

const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'];

export default function MoodBoard() {
  const { rootPath } = useWorkspaceStore();
  const { items, isLoading, addItem, loadBoard, saveBoard } = useMoodBoardStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (rootPath && !isReady) {
      loadBoard(rootPath).then(() => setIsReady(true));
    }
  }, [rootPath, loadBoard, isReady]);

  useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => {
      const { isDragging, sourcePath } = useUIStore.getState().dragInfo;

      if (isDragging && sourcePath && rootPath && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();

        if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
          const isImage = IMAGE_EXTENSIONS.some(ext => sourcePath.toLowerCase().endsWith(ext));

          if (isImage) {
            const dropX = e.clientX - rect.left;
            const dropY = e.clientY - rect.top;

            const relativePath = sourcePath
              .replace(rootPath, '')
              .replace(/^[\\/]/, './')
              .replace(/\\/g, '/');

            addItem({
              path: relativePath,
              x: dropX,
              y: dropY,
              scale: 1,
              rotation: 0
            });

            saveBoard(rootPath);
          }
        }
      }
    };

    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [rootPath, addItem, saveBoard]);

  // Efeito para Drag & Drop Externo
  useNativeDragDrop({
    onDrop: async (paths, position) => {
      if (!containerRef.current || !rootPath) return;

      const rect = containerRef.current.getBoundingClientRect();
      const dropX = position.x - rect.left;
      const dropY = position.y - rect.top;

      for (const path of paths) {
        try {
          const normalizedPath = path.replace(/\\/g, '/').toLowerCase();
          const normalizedRoot = rootPath.replace(/\\/g, '/').toLowerCase();
          const isInsideWorkspace = normalizedPath.startsWith(normalizedRoot);

          let relativePath: string;

          if (isInsideWorkspace) {
            relativePath = path
              .replace(rootPath, '')
              .replace(/^[\\/]/, './')
              .replace(/\\/g, '/');
          } else {
            relativePath = await copyFileToWorkspace(path, rootPath, 'assets/moodboard');
          }

          const isDuplicate = items.some(i => i.path === relativePath && Math.abs(i.x - dropX) < 5 && Math.abs(i.y - dropY) < 5);
          if (isDuplicate) continue;

          addItem({
            path: relativePath,
            x: dropX,
            y: dropY,
            scale: 1,
            rotation: 0
          });

          saveBoard(rootPath);
        } catch (err) {
          console.error('Erro ao adicionar imagem ao moodboard:', err);
        }
      }
    },
    filters: IMAGE_EXTENSIONS,
    disabled: !rootPath
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.header__title}>
          <h1>Mood Board Espacial</h1>
          <span className={styles.count}>{items.length} referências</span>
        </div>

        <div className={styles.instructions}>
          <MousePointer2 size={14} />
          <span>Arraste imagens aqui para fixar</span>
        </div>
      </header>

      <div
        ref={containerRef}
        className={styles.canvas}
        onDragOver={(e) => e.preventDefault()}
      >
        {items.length === 0 && !isLoading && (
          <div className={styles.canvasPlaceholder}>
            <div className={styles.placeholderIcon}>
              <Plus size={48} />
              <ImageIcon size={32} className={styles.subIcon} />
            </div>
            <p>Seu mural está vazio.</p>
            <span>Arraste arquivos de imagem do seu computador diretamente para este espaço.</span>
          </div>
        )}

        {items.map((item) => (
          <MoodBoardItem
            key={item.id}
            item={item}
          />
        ))}

        {isLoading && items.length === 0 && (
          <div className={styles.canvasLoading}>
             <ImageIcon size={48} className={styles.spin} />
             <p>Carregando mural...</p>
          </div>
        )}
      </div>
    </div>
  );
}
