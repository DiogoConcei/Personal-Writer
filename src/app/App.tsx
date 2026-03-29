import { useEffect } from 'react';
import styles from './App.module.scss';
import FileTree from '@/features/workspace/components/FileTree';
import Editor from '@/features/editor/components/Editor';
import ImageViewer from '@/features/editor/components/ImageViewer';
import Dashboard from '@/features/dashboard/components/Dashboard';
import StatusBar from '@/features/editor/components/StatusBar';
import ReferenceSidebar from '@/features/references/components/ReferenceSidebar';
import { useWorkspaceStore } from '@/features/workspace/store/workspaceStore';
import { useEditorStore } from '@/features/editor/store/editorStore';
import { useUIStore } from '@/store/uiStore';
import { Type, LayoutGrid, FileEdit, PanelRight, PanelLeft, FolderOpen } from 'lucide-react';

const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];

export default function App() {
  const { activeFile, rootPath, setRootPath, selectWorkspace } = useWorkspaceStore();
  const { typography, setTypography } = useEditorStore();
  const { 
    activePanel, 
    setActivePanel, 
    isSidebarVisible, 
    toggleSidebar,
    isRightSidebarVisible, 
    toggleRightSidebar 
  } = useUIStore();

  const isImage = activeFile && IMAGE_EXTENSIONS.some(ext => activeFile.toLowerCase().endsWith(ext));

  // Carregar workspace salvo ao iniciar
  useEffect(() => {
    if (rootPath) {
      setRootPath(rootPath);
    }
  }, []);

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle Sidebar: Ctrl + \
      if (e.ctrlKey && e.key === '\\') {
        e.preventDefault();
        toggleSidebar();
      }
      
      // Toggle Dashboard: Ctrl + D (opcional, para conveniência)
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        setActivePanel(activePanel === 'editor' ? 'dashboard' : 'editor');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar, activePanel, setActivePanel]);

  const toggleTypography = () => {
    setTypography(typography === 'sans' ? 'serif' : 'sans');
  };

  const getBreadcrumb = () => {
    if (activePanel === 'dashboard') return 'Dashboard';
    if (!activeFile) return 'Selecione uma nota';
    
    // Mostra apenas o nome do arquivo, removendo o caminho raiz se possível
    if (rootPath && activeFile.startsWith(rootPath)) {
      return activeFile.replace(rootPath, '').replace(/^[\\/]/, '').replace(/\\/g, ' / ');
    }
    return activeFile;
  };

  return (
    <div className={`${styles.app} ${!isSidebarVisible ? styles['app--sidebar-hidden'] : ''}`}>
      <aside className={styles.app__sidebar}>
        <FileTree />
      </aside>
      
      <main className={styles.app__main}>
        <header className={styles.app__header}>
          <div className={styles.app__headerLeft}>
            <button 
              className={`${styles.app__iconBtn} ${!isSidebarVisible ? styles['app__iconBtn--active'] : ''}`}
              onClick={toggleSidebar}
              title="Alternar Sidebar (Ctrl+\)"
            >
              <PanelLeft size={18} />
            </button>
            <div className={styles.app__breadcrumb}>
              {getBreadcrumb()}
            </div>
          </div>
          
          <div className={styles.app__actions}>
            <button 
              className={styles.app__iconBtn} 
              onClick={selectWorkspace}
              title="Trocar Workspace"
            >
              <FolderOpen size={18} />
            </button>

            {activePanel === 'editor' && !isImage && (
              <button 
                className={styles.app__iconBtn} 
                onClick={toggleTypography}
                title="Alternar Tipografia"
              >
                <Type size={18} />
              </button>
            )}
            
            <button 
              className={`${styles.app__iconBtn} ${activePanel === 'dashboard' ? styles['app__iconBtn--active'] : ''}`}
              onClick={() => setActivePanel(activePanel === 'editor' ? 'dashboard' : 'editor')}
              title={activePanel === 'editor' ? 'Ver Dashboard' : 'Voltar ao Editor'}
            >
              {activePanel === 'editor' ? <LayoutGrid size={18} /> : <FileEdit size={18} />}
            </button>

            <button 
              className={`${styles.app__iconBtn} ${isRightSidebarVisible ? styles['app__iconBtn--active'] : ''}`}
              onClick={toggleRightSidebar}
              title="Referências Lateral"
            >
              <PanelRight size={18} />
            </button>
          </div>
        </header>
        
        <div className={styles.app__content}>
          {activePanel === 'dashboard' ? (
            <Dashboard />
          ) : activeFile ? (
            isImage ? <ImageViewer path={activeFile} /> : <Editor />
          ) : (
            <div className={styles.placeholder}>
              <p>Abra um arquivo .md ou vá para o Dashboard para ver suas notas.</p>
            </div>
          )}
        </div>

        {activePanel === 'editor' && !isImage && <StatusBar />}
      </main>

      {isRightSidebarVisible && (
        <aside className={styles.app__rightSidebar}>
          <ReferenceSidebar />
        </aside>
      )}
    </div>
  );
}
