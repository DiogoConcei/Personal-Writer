import { useState } from 'react';
import { useReferenceStore } from '../../store/referenceStore';
import { PdfLibrary } from '../PdfLibrary/PdfLibrary';
import { PdfViewer } from '../PdfViewer/PdfViewer';
import styles from './ReferenceSidebar.module.scss';
import { X, User, Tag } from 'lucide-react';

export default function ReferenceSidebar() {
  const { pinnedNotes, activePdfPath } = useReferenceStore();
  
  const [activeTab, setActiveTab] = useState<'backlinks' | 'metadata' | 'library'>('backlinks');

  if (activePdfPath) {
    return <PdfViewer />;
  }

  return (
    <div className={styles.sidebar}>
      <header className={styles.header}>
        <div className={styles.tabs}>
          <button 
            className={`${styles.tab} ${activeTab === 'backlinks' ? styles['tab--active'] : ''}`}
            onClick={() => setActiveTab('backlinks')}
          >
            Conexões
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'metadata' ? styles['tab--active'] : ''}`}
            onClick={() => setActiveTab('metadata')}
          >
            Fixados
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'library' ? styles['tab--active'] : ''}`}
            onClick={() => setActiveTab('library')}
          >
            Acervo
          </button>
        </div>
      </header>

      <div className={styles.content}>
        {activeTab === 'backlinks' && (
          <div className={styles.empty}>
            <Tag size={32} />
            <p>Nenhuma retro-referência encontrada para esta nota.</p>
          </div>
        )}

        {activeTab === 'metadata' && (
          <div className={styles.pinnedList}>
            {pinnedNotes.length === 0 ? (
              <div className={styles.empty}>
                <User size={32} />
                <p>Nenhuma nota fixada para referência rápida.</p>
              </div>
            ) : (
              pinnedNotes.map((notePath: string) => (
                <div key={notePath} className={styles.pinnedItem}>
                  <span>{notePath.split(/[\\/]/).pop()?.replace('.md', '')}</span>
                  <button className={styles.btnUnpin}><X size={14} /></button>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'library' && (
          <PdfLibrary />
        )}
      </div>
    </div>
  );
}
