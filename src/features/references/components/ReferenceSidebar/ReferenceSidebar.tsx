import { useReferenceStore } from '../../store/referenceStore';
import { PdfLibrary } from '../PdfLibrary/PdfLibrary';
import { PdfViewer } from '../PdfViewer/PdfViewer';
import styles from './ReferenceSidebar.module.scss';
import { X, User, Tag } from 'lucide-react';
import { useWorkspaceStore } from '@/features/workspace/store/workspaceStore';
import { useUIStore } from '@/store/uiStore';

export default function ReferenceSidebar() {
  const { pinnedNotes, activePdfPath, referenceTab, setReferenceTab, unpinNote } = useReferenceStore();
  const { setActiveFile } = useWorkspaceStore();
  const { setActivePanel } = useUIStore();

  if (activePdfPath) {
    return <PdfViewer />;
  }

  const handleOpenNote = (path: string) => {
    setActiveFile(path);
    setActivePanel('editor');
  };

  return (
    <div className={styles.sidebar}>
      <header className={styles.header}>
        <div className={styles.tabs}>
          <button 
            className={`${styles.tab} ${referenceTab === 'backlinks' ? styles['tab--active'] : ''}`}
            onClick={() => setReferenceTab('backlinks')}
          >
            Conexões
          </button>
          <button 
            className={`${styles.tab} ${referenceTab === 'metadata' ? styles['tab--active'] : ''}`}
            onClick={() => setReferenceTab('metadata')}
          >
            Fixados
          </button>
          <button 
            className={`${styles.tab} ${referenceTab === 'library' ? styles['tab--active'] : ''}`}
            onClick={() => setReferenceTab('library')}
          >
            Acervo
          </button>
        </div>
      </header>

      <div className={styles.content}>
        {referenceTab === 'backlinks' && (
          <div className={styles.empty}>
            <Tag size={32} />
            <p>Nenhuma retro-referência encontrada para esta nota.</p>
          </div>
        )}

        {referenceTab === 'metadata' && (
          <div className={styles.pinnedList}>
            {pinnedNotes.length === 0 ? (
              <div className={styles.empty}>
                <User size={32} />
                <p>Nenhuma nota fixada para referência rápida.</p>
              </div>
            ) : (
              pinnedNotes.map((notePath: string) => (
                <div key={notePath} className={styles.pinnedItem} onClick={() => handleOpenNote(notePath)}>
                  <span>{notePath.split(/[\\/]/).pop()?.replace('.md', '')}</span>
                  <button 
                    className={styles.btnUnpin}
                    onClick={(e) => {
                      e.stopPropagation();
                      unpinNote(notePath);
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {referenceTab === 'library' && (
          <PdfLibrary />
        )}
      </div>
    </div>
  );
}
