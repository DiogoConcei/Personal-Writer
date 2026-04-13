import React, { useEffect } from 'react';
import { useReferenceStore } from '../store/referenceStore';
import { useWorkspaceStore } from '../../workspace/store/workspaceStore';
import { FileText, Search, Loader2 } from 'lucide-react';
import styles from './PdfLibrary.module.scss';

export const PdfLibrary: React.FC = () => {
  const { rootPath } = useWorkspaceStore();
  const { pdfs, isLoadingPdfs, fetchPdfs, setActivePdf, activePdfPath } = useReferenceStore();

  useEffect(() => {
    if (rootPath) {
      fetchPdfs(rootPath);
    }
  }, [rootPath, fetchPdfs]);

  if (isLoadingPdfs) {
    return (
      <div className={styles.pdf_library__loading}>
        <Loader2 className={styles.pdf_library__loading_icon} />
        <span>Buscando documentos...</span>
      </div>
    );
  }

  return (
    <div className={styles.pdf_library}>
      <div className={styles.pdf_library__header}>
        <div className={styles.pdf_library__search_container}>
          <Search size={14} className={styles.pdf_library__search_icon} />
          <input 
            type="text" 
            placeholder="Buscar no acervo..." 
            className={styles.pdf_library__search_input}
          />
        </div>
      </div>

      <div className={styles.pdf_library__list}>
        {pdfs.length === 0 ? (
          <div className={styles.pdf_library__empty}>
            Nenhum PDF encontrado no workspace.
          </div>
        ) : (
          pdfs.map((pdf) => (
            <div 
              key={pdf.full_path}
              className={`${styles.pdf_library__item} ${activePdfPath === pdf.full_path ? styles['pdf_library__item--active'] : ''}`}
              onClick={() => setActivePdf(pdf.full_path)}
              title={pdf.name}
            >
              <FileText size={16} className={styles.pdf_library__item_icon} />
              <div className={styles.pdf_library__item_info}>
                <span className={styles.pdf_library__item_name}>{pdf.name}</span>
                <span className={styles.pdf_library__item_path}>{pdf.path}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
