import React, { useEffect } from 'react';
import styles from './App.module.scss';
import FileTree from '@/features/workspace/components/FileTree';
import Editor from '@/features/editor/components/Editor';
import ImageViewer from '@/features/editor/components/ImageViewer';
import Dashboard from '@/features/dashboard/components/Dashboard';
import MoodBoard from '@/features/dashboard/components/MoodBoard';
import CharacterGallery from '@/features/dashboard/components/CharacterGallery';
import StatusBar from '@/features/editor/components/StatusBar';
import ReferenceSidebar from '@/features/references/components/ReferenceSidebar';
import CommandPalette from '@/features/search/components/CommandPalette';
import { EntityPreview } from '@/features/editor/components/EntityPreview';
import { useWorkspaceStore } from '@/features/workspace/store/workspaceStore';
import { useUniverseStore } from '@/features/universe/store/universeStore';
import { useEditorStore } from '@/features/editor/store/editorStore';
import { useReferenceStore } from '@/features/references/store/referenceStore';
import { useUIStore } from '@/store/uiStore';
import { ToastContainer } from '@/shared/components/Toast/ToastContainer';
import { Type, LayoutGrid, FileEdit, PanelRight, PanelLeft, FolderOpen, Search, Users, Image as ImageIcon } from 'lucide-react';

const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'];

function App() {
  const { activeFile, rootPath, setRootPath, selectWorkspace } = useWorkspaceStore();
  const { typography, setTypography, save } = useEditorStore();
  const { entities } = useUniverseStore();
  const { activePdfPath } = useReferenceStore();
  const { 
    activePanel, 
    setActivePanel, 
    isSidebarVisible, 
    toggleSidebar,
    isRightSidebarVisible, 
    toggleRightSidebar,
    isZenMode,
    toggleZenMode,
    setCommandPaletteOpen,
    preview,
    setPreview,
    addNotification
  } = useUIStore();

  const [rightSidebarWidth, setRightSidebarWidth] = React.useState(300);
  const isResizing = React.useRef(false);

  // Resetar largura ao fechar o PDF
  useEffect(() => {
    if (!activePdfPath) {
      setRightSidebarWidth(300);
    } else {
      setRightSidebarWidth(450); // Largura inicial sugerida para PDF
    }
  }, [activePdfPath]);

  const startResizing = React.useCallback((_e: React.MouseEvent) => {
    isResizing.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', stopResizing);
    document.body.style.cursor = 'col-resize';
  }, []);

  const stopResizing = React.useCallback(() => {
    isResizing.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', stopResizing);
    document.body.style.cursor = 'default';
  }, []);

  const handleMouseMove = React.useCallback((e: MouseEvent) => {
    if (!isResizing.current) return;
    const newWidth = window.innerWidth - e.clientX;
    if (newWidth > 250 && newWidth < 800) {
      setRightSidebarWidth(newWidth);
    }
  }, []);

  const isImage = activeFile && IMAGE_EXTENSIONS.some(ext => activeFile.toLowerCase().endsWith(ext));

  // Resetar preview ao trocar de aba ou arquivo
  useEffect(() => {
    setPreview({ entityPath: null, position: null });
  }, [activePanel, activeFile, setPreview]);

  // Carregar workspace salvo ao iniciar
  useEffect(() => {
    if (rootPath) {
      setRootPath(rootPath);
    }
  }, []);

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle Modo Zen: Ctrl + \
      if (e.ctrlKey && e.key === '\\') {
        e.preventDefault();
        toggleZenMode();
      }
      
      // Atalhos rápidos para painéis
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        setActivePanel('dashboard');
      }
      if (e.ctrlKey && e.key === 'g') {
        e.preventDefault();
        setActivePanel('gallery');
      }
      if (e.ctrlKey && e.key === 'm') {
        e.preventDefault();
        setActivePanel('moodboard');
      }
      if (e.ctrlKey && e.key === 'e') {
        e.preventDefault();
        setActivePanel('editor');
      }

      // Salvamento Manual: Ctrl + S
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        if (activeFile && activePanel === 'editor' && !isImage) {
          save(activeFile, rootPath || undefined).then((success) => {
            if (success) {
              addNotification('Alterações salvas com sucesso', 'success');
            } else {
              addNotification('Erro ao salvar arquivo', 'error');
            }
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleZenMode, toggleSidebar, activePanel, setActivePanel, activeFile, isImage, rootPath, save, addNotification]);

  const toggleTypography = () => {
    setTypography(typography === 'sans' ? 'serif' : 'sans');
  };

  const handleBreadcrumbClick = (path: string | null) => {
    const { setDashboardFilterPath } = useWorkspaceStore.getState();
    setDashboardFilterPath(path);
    setActivePanel('dashboard');
  };

  const renderBreadcrumb = () => {
    if (activePanel === 'dashboard' || activePanel === 'gallery' || activePanel === 'moodboard') {
      const { dashboardFilterPath } = useWorkspaceStore.getState();
      let prefix = 'Dashboard';
      if (activePanel === 'gallery') prefix = 'Galeria';
      if (activePanel === 'moodboard') prefix = 'Mood Board';
      
      if (!dashboardFilterPath || !rootPath || activePanel === 'moodboard') return <span>{prefix}</span>;
      
      const relativePath = dashboardFilterPath.replace(rootPath, '').replace(/^[\\/]/, '');
      const parts = relativePath.split(/[\\/]/);
      
      return (
        <div className={styles.app__breadcrumbList}>
          <button onClick={() => handleBreadcrumbClick(null)}>{prefix}</button>
          {parts.map((part, index) => {
            const currentPath = rootPath + (rootPath.includes('\\') ? '\\' : '/') + parts.slice(0, index + 1).join(rootPath.includes('\\') ? '\\' : '/');
            return (
              <React.Fragment key={currentPath}>
                <span className={styles.app__breadcrumbSeparator}>/</span>
                <button onClick={() => handleBreadcrumbClick(currentPath)}>{part}</button>
              </React.Fragment>
            );
          })}
        </div>
      );
    }

    if (!activeFile) return <span>Selecione uma nota</span>;
    
    if (rootPath && activeFile.startsWith(rootPath)) {
      const relativePath = activeFile.replace(rootPath, '').replace(/^[\\/]/, '');
      const parts = relativePath.split(/[\\/]/);
      const fileName = parts.pop();
      
      return (
        <div className={styles.app__breadcrumbList}>
          <button onClick={() => handleBreadcrumbClick(null)}>Dashboard</button>
          {parts.map((part, index) => {
            const separator = rootPath.includes('\\') ? '\\' : '/';
            const currentPath = rootPath + separator + parts.slice(0, index + 1).join(separator);
            return (
              <React.Fragment key={currentPath}>
                <span className={styles.app__breadcrumbSeparator}>/</span>
                <button onClick={() => handleBreadcrumbClick(currentPath)}>{part}</button>
              </React.Fragment>
            );
          })}
          <span className={styles.app__breadcrumbSeparator}>/</span>
          <span className={styles.app__breadcrumbActive}>{fileName}</span>
        </div>
      );
    }

    return <span>{activeFile}</span>;
  };

  return (
    <div className={`
      ${styles.app} 
      ${!isSidebarVisible ? styles['app--sidebar-hidden'] : ''}
      ${isZenMode ? styles['app--zen-mode'] : ''}
    `}>
      {isSidebarVisible && !isZenMode && (
        <aside className={styles.app__sidebar}>
          <FileTree />
        </aside>
      )}
      
      <main className={styles.app__main}>
        {!isZenMode && (
          <header className={styles.app__header}>
            <div className={styles.app__headerLeft}>
              <button 
                className={`${styles.app__iconBtn} ${!isSidebarVisible ? styles['app__iconBtn--active'] : ''}`}
                onClick={toggleSidebar}
                title="Alternar Sidebar"
              >
                <PanelLeft size={18} />
              </button>
              <div className={styles.app__breadcrumb}>
                {renderBreadcrumb()}
              </div>
            </div>
            
            <div className={styles.app__actions}>
              <button 
                className={styles.app__iconBtn} 
                onClick={() => setCommandPaletteOpen(true)}
                title="Busca Rápida e Comandos (Ctrl+P)"
              >
                <Search size={18} />
              </button>

              <button 
                className={styles.app__iconBtn} 
                onClick={selectWorkspace}
                title="Trocar Workspace"
              >
                <FolderOpen size={18} />
              </button>

              {activePanel === 'editor' && !isImage && (
                <>
                  <button 
                    className={styles.app__iconBtn} 
                    onClick={toggleTypography}
                    title="Alternar Tipografia"
                  >
                    <Type size={18} />
                  </button>
                </>
              )}
              
              <nav className={styles.app__nav}>
                <button 
                  className={`${styles.app__iconBtn} ${activePanel === 'editor' ? styles['app__iconBtn--active'] : ''}`}
                  onClick={() => setActivePanel('editor')}
                  title="Editor (Ctrl+E)"
                >
                  <FileEdit size={18} />
                </button>
                <button 
                  className={`${styles.app__iconBtn} ${activePanel === 'dashboard' ? styles['app__iconBtn--active'] : ''}`}
                  onClick={() => setActivePanel('dashboard')}
                  title="Dashboard (Ctrl+D)"
                >
                  <LayoutGrid size={18} />
                </button>
                <button 
                  className={`${styles.app__iconBtn} ${activePanel === 'gallery' ? styles['app__iconBtn--active'] : ''}`}
                  onClick={() => setActivePanel('gallery')}
                  title="Galeria de Personagens (Ctrl+G)"
                >
                  <Users size={18} />
                </button>
                <button 
                  className={`${styles.app__iconBtn} ${activePanel === 'moodboard' ? styles['app__iconBtn--active'] : ''}`}
                  onClick={() => setActivePanel('moodboard')}
                  title="Mood Board Espacial (Ctrl+M)"
                >
                  <ImageIcon size={18} />
                </button>
              </nav>

              <button 
                className={`${styles.app__iconBtn} ${isRightSidebarVisible ? styles['app__iconBtn--active'] : ''}`}
                onClick={toggleRightSidebar}
                title="Referências Lateral"
              >
                <PanelRight size={18} />
              </button>
            </div>
          </header>
        )}
        
        <div className={styles.app__content}>
          {activePanel === 'dashboard' ? (
            <Dashboard />
          ) : activePanel === 'gallery' ? (
            <CharacterGallery />
          ) : activePanel === 'moodboard' ? (
            <MoodBoard />
          ) : activeFile ? (
            isImage ? <ImageViewer path={activeFile} /> : <Editor />
          ) : (
            <div className={styles.placeholder}>
              <p>Abra um arquivo .md ou vá para a Galeria/Dashboard para ver suas notas.</p>
            </div>
          )}
        </div>

        {activePanel === 'editor' && !isImage && <StatusBar />}
      </main>

      {isRightSidebarVisible && !isZenMode && (
        <>
          {activePdfPath && <div className={styles.app__resizer} onMouseDown={startResizing} />}
          <aside className={styles.app__rightSidebar} style={{ width: rightSidebarWidth }}>
            <ReferenceSidebar />
          </aside>
        </>
      )}

      <CommandPalette />

      <ToastContainer />

      {preview.entityPath && preview.position && entities[preview.entityPath] && (
        <EntityPreview 
          entity={entities[preview.entityPath]} 
          position={preview.position} 
        />
      )}
    </div>
  );
}

export default App;