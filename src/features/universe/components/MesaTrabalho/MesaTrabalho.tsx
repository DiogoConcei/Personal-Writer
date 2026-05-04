import { useEffect, useRef, useState } from 'react';
import { useWorkspaceStore } from '@/features/workspace/store/workspaceStore';
import { useUIStore } from '@/store/uiStore';
import { useMesaTrabalhoStore } from '../../store/moodBoardStore';
import { MesaItem } from './MesaItem';
import { MesaGrupoContainer } from './MesaGrupoContainer';
import { useNativeDragDrop } from '@/shared/hooks/useNativeDragDrop/useNativeDragDrop';
import { copyFileToWorkspace, resolveAssetPath } from '@/tauri-bridge/fs';
import ImageGallery from '@/features/SlashMenu/components/ImageGallery/ImageGallery';
import styles from './MesaTrabalho.module.scss';
import { Image as ImageIcon, Plus, ImagePlus, Image as Wallpaper, Link, Map, Save, Type, Layers, RotateCw, ZoomOut, Settings2, Layout, LayoutPanelLeft } from 'lucide-react';

import { CharacterDetailsModal } from './CharacterDetailsModal';

const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'];

export default function MesaTrabalho() {
  const { rootPath } = useWorkspaceStore();
  const { 
    items, 
    groups, 
    selectedItems, 
    boardName,
    boardMode,
    backgroundImage,
    backgroundRotation,
    backgroundZoom,
    activeDetailsIds,
    isLoading, 
    addItem, 
    loadBoard, 
    saveBoard, 
    setBoardName,
    setBoardMode,
    toggleDetailsId,
    groupSelectedItems,
    clearSelection,
    setBackgroundImage,
    setBackgroundRotation,
    setBackgroundZoom
  } = useMesaTrabalhoStore();

  const setActivePanel = useUIStore((state) => state.setActivePanel);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [galleryMode, setGalleryMode] = useState<'item' | 'background' | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(boardName);

  useEffect(() => {
    if (rootPath && !isReady) {
      loadBoard(rootPath).then(() => {
        setIsReady(true);
      });
    }
  }, [rootPath, loadBoard, isReady]);

  // Sincronizar tempName quando boardName carregar
  useEffect(() => {
    setTempName(boardName);
  }, [boardName]);

  // Itens que não pertencem a nenhum grupo e não estão em inventários
  const independentItems = items.filter(i => !i.groupId && !i.ownerId);

  const handleGroupAction = () => {
    groupSelectedItems();
  };

  const handleRotateBackground = () => {
    const newRotation = (backgroundRotation + 90) % 360;
    setBackgroundRotation(newRotation);
  };

  const handleZoomBackground = () => {
    // Ciclar entre 1x, 0.75x, 0.5x
    const newZoom = backgroundZoom === 1 ? 0.75 : backgroundZoom === 0.75 ? 0.5 : 1;
    setBackgroundZoom(newZoom);
  };

  const handleSaveName = () => {
    setIsEditingName(false);
    if (tempName.trim() && tempName !== boardName) {
      setBoardName(tempName);
    }
  };

  // Salvamento Automático a cada 20 minutos
  useEffect(() => {
    if (!rootPath) return;
    const interval = setInterval(() => {
      saveBoard(rootPath);
    }, 1200000); // 20 minutos
    
    return () => clearInterval(interval);
  }, [rootPath, saveBoard]);

  // Atalho Ctrl+S para salvamento manual
  useEffect(() => {
    const handleSaveShortcut = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (rootPath) {
          saveBoard(rootPath);
        }
      }
    };

    window.addEventListener('keydown', handleSaveShortcut);
    return () => window.removeEventListener('keydown', handleSaveShortcut);
  }, [rootPath, saveBoard]);

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
          }
        }
      }
    };

    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [rootPath, addItem]);

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
          {isEditingName ? (
            <input
              autoFocus
              className={styles.boardTitleInput}
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onBlur={handleSaveName}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveName();
                if (e.key === 'Escape') {
                  setIsEditingName(false);
                  setTempName(boardName);
                }
              }}
            />
          ) : (
            <button 
              className={styles.toolbarBtn} 
              title="Renomear Mesa" 
              onClick={() => setIsEditingName(true)}
            >
              <Type size={16} />
              <span>{boardName}</span>
            </button>
          )}
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
                  onClick={() => { setBackgroundImage(null); setBackgroundRotation(0); setBackgroundZoom(1); }}
                >
                  <Plus size={10} style={{ transform: 'rotate(45deg)' }} />
                </button>
              </>
            )}
          </div>

          {boardMode === 'planning' && (
            <button className={styles.toolbarBtn} title="Conectar Itens"><Link size={16} /></button>
          )}
          
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

          <button className={styles.toolbarBtn} title="Mapa" onClick={() => setActivePanel('moodboard-map')}><Map size={16} /></button>
          
          <div className={styles.divider}></div>
          
          <div className={styles.settingsWrapper}>
            <button 
              className={`${styles.toolbarBtn} ${isSettingsOpen ? styles.active : ''}`} 
              title="Configurações da Mesa" 
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            >
              <Settings2 size={16} />
            </button>

            {isSettingsOpen && (
              <div className={styles.settingsPopover}>
                <div className={styles.settingsHeader}>Configurações</div>
                <div className={styles.settingsSection}>
                  <label>Modelo da Mesa</label>
                  <div className={styles.modeToggle}>
                    <button 
                      className={boardMode === 'free' ? styles.active : ''} 
                      onClick={() => setBoardMode('free')}
                    >
                      <Layout size={14} />
                      Livre
                    </button>
                    <button 
                      className={boardMode === 'planning' ? styles.active : ''} 
                      onClick={() => setBoardMode('planning')}
                    >
                      <LayoutPanelLeft size={14} />
                      Planejamento
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className={styles.divider}></div>
          <button className={styles.toolbarBtn} title="Salvar Mesa (Manual)" onClick={() => rootPath && saveBoard(rootPath)}><Save size={16} /></button>
        </div>
      </div>

      <div
        ref={containerRef}
        className={`${styles.canvas} ${boardMode === 'planning' ? styles['canvas--planning'] : ''}`}
        onDragOver={(e) => e.preventDefault()}
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) clearSelection();
        }}
        style={{
          backgroundImage: backgroundImage ? `url(${resolveAssetPath(backgroundImage, rootPath)})` : undefined,
          backgroundSize: backgroundImage ? (backgroundZoom === 1 ? 'cover' : `${backgroundZoom * 100}%`) : undefined,
          backgroundPosition: 'center',
          backgroundRepeat: backgroundImage ? 'no-repeat' : 'repeat',
          rotate: backgroundImage ? `${backgroundRotation}deg` : undefined
        } as React.CSSProperties}
      >
        {items.length === 0 && !isLoading && !backgroundImage && (
          <div className={styles.canvasPlaceholder}>
            <div className={styles.placeholderIcon}>
              <Plus size={48} />
              <ImageIcon size={32} className={styles.subIcon} />
            </div>
            <p>Sua mesa está vazia.</p>
            <span>Arraste arquivos de imagem do seu computador diretamente para este espaço.</span>
          </div>
        )}

        {/* Renderizar Grupos */}
        {groups.map(group => (
          <MesaGrupoContainer 
            key={group.id}
            group={group}
            items={items.filter(i => i.groupId === group.id)}
          />
        ))}

        {/* Renderizar Itens Independentes */}
        {independentItems.map((item) => (
          <MesaItem
            key={item.id}
            item={item}
          />
        ))}

        {isLoading && items.length === 0 && (
          <div className={styles.canvasLoading}>
             <ImageIcon size={48} className={styles.spin} />
             <p>Organizando mesa...</p>
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
          }}
          onClose={() => setGalleryMode(null)}
        />
      )}

      {activeDetailsIds.map(id => (
        <CharacterDetailsModal 
          key={id}
          characterId={id} 
          onClose={() => toggleDetailsId(id, true)} 
        />
      ))}
    </div>
  );
}
