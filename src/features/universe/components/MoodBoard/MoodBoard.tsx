import { useEffect, useRef, useState } from 'react';
import { useWorkspaceStore } from '@/features/workspace/store/workspaceStore';
import { useUIStore } from '@/store/uiStore';
import { useMoodBoardStore } from '../../store/moodBoardStore';
import { MoodBoardItem } from './MoodBoardItem';
import { MoodBoardGroupContainer } from './MoodBoardGroupContainer';
import { useNativeDragDrop } from '@/shared/hooks/useNativeDragDrop/useNativeDragDrop';
import { copyFileToWorkspace, resolveAssetPath } from '@/tauri-bridge/fs';
import ImageGallery from '@/features/SlashMenu/components/ImageGallery/ImageGallery';
import styles from './MoodBoard.module.scss';
import { Image as ImageIcon, MousePointer2, Plus, ImagePlus, Image as Wallpaper, Link, Map, Save, Type, Layers, RotateCw, ZoomOut } from 'lucide-react';

const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'];

export default function MoodBoard() {
  const { rootPath } = useWorkspaceStore();
  const { 
    items, 
    groups, 
    selectedItems, 
    backgroundImage,
    backgroundRotation,
    backgroundZoom,
    isLoading, 
    addItem, 
    loadBoard, 
    saveBoard, 
    groupSelectedItems,
    clearSelection,
    setBackgroundImage,
    setBackgroundRotation,
    setBackgroundZoom
  } = useMoodBoardStore();
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [galleryMode, setGalleryMode] = useState<'item' | 'background' | null>(null);

  useEffect(() => {
    if (rootPath && !isReady) {
      loadBoard(rootPath).then(() => setIsReady(true));
    }
  }, [rootPath, loadBoard, isReady]);

  // Itens que não pertencem a nenhum grupo
  const independentItems = items.filter(i => !i.groupId);

  const handleGroupAction = () => {
    const groupId = groupSelectedItems();
    if (groupId && rootPath) saveBoard(rootPath);
  };

  const handleRotateBackground = () => {
    const newRotation = (backgroundRotation + 90) % 360;
    setBackgroundRotation(newRotation);
    if (rootPath) saveBoard(rootPath);
  };

  const handleZoomBackground = () => {
    // Ciclar entre 1x, 0.75x, 0.5x
    const newZoom = backgroundZoom === 1 ? 0.75 : backgroundZoom === 0.75 ? 0.5 : 1;
    setBackgroundZoom(newZoom);
    if (rootPath) saveBoard(rootPath);
  };

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
      <div className={styles.floatingToolbar}>
        <div className={styles.toolbar}>
          <button className={styles.toolbarBtn} title="Nome do Quadro"><Type size={16} /><span>Mural Principal</span></button>
          <div className={styles.divider}></div>
          <button className={styles.toolbarBtn} title="Adicionar Imagem" onClick={() => setGalleryMode('item')}><ImagePlus size={16} /></button>
          
          <div className={styles.bgControls}>
            <button 
              className={`${styles.toolbarBtn} ${backgroundImage ? styles.active : ''}`} 
              title="Adicionar Imagem de Fundo" 
              onClick={() => setGalleryMode('background')}
            >
              <Wallpaper size={16} />
            </button>
            {backgroundImage && (
              <>
                <button 
                  className={styles.bgActionBtn} 
                  style={{ bottom: '-4px', right: '-4px' }}
                  title="Rotacionar Fundo"
                  onClick={handleRotateBackground}
                >
                  <RotateCw size={12} />
                </button>
                <button 
                  className={styles.bgActionBtn} 
                  style={{ bottom: '-4px', right: '18px' }}
                  title="Reduzir Zoom do Fundo"
                  onClick={handleZoomBackground}
                >
                  <ZoomOut size={12} />
                </button>
                <button 
                  className={styles.removeBgBtn} 
                  title="Remover Fundo"
                  onClick={() => { setBackgroundImage(null); setBackgroundRotation(0); setBackgroundZoom(1); if (rootPath) saveBoard(rootPath); }}
                >
                  <Plus size={10} style={{ transform: 'rotate(45deg)' }} />
                </button>
              </>
            )}
          </div>

          <button className={styles.toolbarBtn} title="Conectar Itens"><Link size={16} /></button>
          
          {selectedItems.length > 1 && (
            <>
              <div className={styles.divider}></div>
              <button 
                className={`${styles.toolbarBtn} ${styles.groupBtn}`} 
                title="Agrupar Seleção"
                onClick={handleGroupAction}
              >
                <Layers size={16} />
                <span>Agrupar ({selectedItems.length})</span>
              </button>
            </>
          )}

          <button className={styles.toolbarBtn} title="Mapa"><Map size={16} /></button>
          <div className={styles.divider}></div>
          <button className={styles.toolbarBtn} title="Salvar" onClick={() => saveBoard(rootPath)}><Save size={16} /></button>
        </div>
      </div>

      <div
        ref={containerRef}
        className={styles.canvas}
        onDragOver={(e) => e.preventDefault()}
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) clearSelection();
        }}
        style={{
          backgroundImage: backgroundImage ? `url(${resolveAssetPath(backgroundImage, rootPath)})` : undefined,
          backgroundSize: backgroundZoom === 1 ? 'cover' : `${backgroundZoom * 100}%`,
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          rotate: `${backgroundRotation}deg`
        } as React.CSSProperties}
      >
        {items.length === 0 && !isLoading && !backgroundImage && (
          <div className={styles.canvasPlaceholder}>
            <div className={styles.placeholderIcon}>
              <Plus size={48} />
              <ImageIcon size={32} className={styles.subIcon} />
            </div>
            <p>Seu mural está vazio.</p>
            <span>Arraste arquivos de imagem do seu computador diretamente para este espaço.</span>
          </div>
        )}

        {/* Renderizar Grupos */}
        {groups.map(group => (
          <MoodBoardGroupContainer 
            key={group.id}
            group={group}
            items={items.filter(i => i.groupId === group.id)}
          />
        ))}

        {/* Renderizar Itens Independentes */}
        {independentItems.map((item) => (
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

      {galleryMode && (
        <ImageGallery
          onSelect={(src) => {
            const relativePath = src.replace(rootPath || '', '').replace(/^[\\/]/, './').replace(/\\/g, '/');
            
            if (galleryMode === 'item') {
              const container = containerRef.current;
              const dropX = container ? container.scrollLeft + (container.clientWidth / 2) - 100 : 100;
              const dropY = container ? container.scrollTop + (container.clientHeight / 2) - 100 : 100;

              addItem({
                path: relativePath,
                x: dropX,
                y: dropY,
                scale: 1,
                rotation: 0
              });
            } else if (galleryMode === 'background') {
              setBackgroundImage(relativePath);
            }
            
            if (rootPath) saveBoard(rootPath);
          }}
          onClose={() => setGalleryMode(null)}
        />
      )}
    </div>
  );
}
