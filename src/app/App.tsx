import styles from './App.module.scss';
import FileTree from '@/features/workspace/components/FileTree';
import Editor from '@/features/editor/components/Editor';
import Dashboard from '@/features/dashboard/components/Dashboard';
import StatusBar from '@/features/editor/components/StatusBar';
import ReferenceSidebar from '@/features/references/components/ReferenceSidebar';
import { useWorkspaceStore } from '@/features/workspace/store/workspaceStore';
import { useEditorStore } from '@/features/editor/store/editorStore';
import { useUIStore } from '@/store/uiStore';
import { Type, LayoutGrid, FileEdit, PanelRight } from 'lucide-react';

export default function App() {
  const { activeFile } = useWorkspaceStore();
  const { typography, setTypography } = useEditorStore();
  const { activePanel, setActivePanel, isRightSidebarVisible, toggleRightSidebar } = useUIStore();

  const toggleTypography = () => {
    setTypography(typography === 'sans' ? 'serif' : 'sans');
  };

  return (
    <div className={styles.app}>
      <aside className={styles.app__sidebar}>
        <FileTree />
      </aside>
      
      <main className={styles.app__main}>
        <header className={styles.app__header}>
          <div className={styles.app__breadcrumb}>
            {activePanel === 'dashboard' ? 'Dashboard' : (activeFile || 'Selecione uma nota')}
          </div>
          
          <div className={styles.app__actions}>
            {activePanel === 'editor' && (
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
            <Editor />
          ) : (
            <div className={styles.placeholder}>
              <p>Abra um arquivo .md ou vá para o Dashboard para ver suas notas.</p>
            </div>
          )}
        </div>

        {activePanel === 'editor' && <StatusBar />}
      </main>

      {isRightSidebarVisible && (
        <aside className={styles.app__rightSidebar}>
          <ReferenceSidebar />
        </aside>
      )}
    </div>
  );
}
