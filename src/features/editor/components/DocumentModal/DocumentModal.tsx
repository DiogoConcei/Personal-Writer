import React from 'react';
import { FileText, X, ExternalLink, Trash2 } from 'lucide-react';
import styles from './DocumentModal.module.scss';

interface DocumentModalProps {
  documents: string[];
  onClose: () => void;
  onOpen: (path: string) => void;
  onRemove: (path: string) => void;
}

export const DocumentModal: React.FC<DocumentModalProps> = ({ documents, onClose, onOpen, onRemove }) => {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.title}>
            <FileText size={20} className={styles.icon} />
            <h2>Documentos Vinculados</h2>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.content}>
          {documents.length > 0 ? (
            <div className={styles.list}>
              {documents.map((doc, idx) => {
                const fileName = doc.split(/[\\/]/).pop() || doc;
                return (
                  <div key={idx} className={styles.item}>
                    <div className={styles.itemInfo} onClick={() => onOpen(doc)}>
                      <FileText size={16} className={styles.fileIcon} />
                      <span className={styles.fileName}>{fileName}</span>
                      <ExternalLink size={14} className={styles.openIcon} />
                    </div>
                    <button 
                      className={styles.removeBtn} 
                      onClick={() => onRemove(doc)}
                      title="Desanexar documento"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={styles.empty}>
              <FileText size={48} />
              <p>Nenhum documento vinculado a esta nota.</p>
              <span>Arraste um PDF para o editor para anexá-lo automaticamente.</span>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <button className={styles.doneBtn} onClick={onClose}>Concluído</button>
        </div>
      </div>
    </div>
  );
};
