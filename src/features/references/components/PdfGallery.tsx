import React, { useEffect, useState } from 'react';
import { FileText, X, Search, Loader2 } from 'lucide-react';
import { scanWorkspacePdfs, PdfAsset } from '@/tauri-bridge';
import { useWorkspaceStore } from '@/features/workspace/store/workspaceStore';
import styles from './PdfGallery.module.scss';

interface PdfGalleryProps {
  onSelect: (path: string) => void;
  onClose: () => void;
}

export const PdfGallery: React.FC<PdfGalleryProps> = ({ onSelect, onClose }) => {
  const [pdfs, setPdfs] = useState<PdfAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { rootPath } = useWorkspaceStore();

  useEffect(() => {
    if (rootPath) {
      scanWorkspacePdfs(rootPath)
        .then(setPdfs)
        .finally(() => setLoading(false));
    }
  }, [rootPath]);

  const filteredPdfs = pdfs.filter(pdf => 
    pdf.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <h2>Biblioteca de Documentos</h2>
            <span className={styles.count}>{pdfs.length} arquivos</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose}><X size={20} /></button>
        </div>

        <div className={styles.searchBar}>
          <Search size={18} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Buscar documentos..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        <div className={styles.content}>
          {loading ? (
            <div className={styles.loader}>
              <Loader2 className={styles.spin} />
              <p>Escaneando workspace...</p>
            </div>
          ) : filteredPdfs.length > 0 ? (
            <div className={styles.grid}>
              {filteredPdfs.map(pdf => (
                <button 
                  key={pdf.full_path} 
                  className={styles.pdfCard}
                  onClick={() => onSelect(pdf.path)}
                >
                  <div className={styles.pdfCard__icon}>
                    <FileText size={24} />
                  </div>
                  <div className={styles.pdfCard__info}>
                    <span className={styles.pdfCard__name}>{pdf.name}</span>
                    <span className={styles.pdfCard__meta}>PDF Document</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className={styles.empty}>
              <p>Nenhum PDF encontrado.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
