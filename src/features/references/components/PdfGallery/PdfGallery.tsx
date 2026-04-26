import React, { useState } from 'react';
import { FileText, X, Search, Loader2, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { PdfAsset, resolveAssetPath } from '@/tauri-bridge/fs';
import { useWorkspaceStore } from '@/features/workspace/store/workspaceStore';
import { useDocumentManager } from '@/shared/hooks/useDocumentManager/useDocumentManager';
import { PdfThumbnail } from '@/features/docs-manager/components/PdfThumbnail/PdfThumbnail';
import ConfirmModal from '@/shared/components/Modal/ConfirmModal/ConfirmModal';
import styles from './PdfGallery.module.scss';

interface PdfGalleryProps {
  onSelect: (path: string) => void;
  onClose: () => void;
}

export const PdfGallery: React.FC<PdfGalleryProps> = ({ onSelect, onClose }) => {
  const { rootPath } = useWorkspaceStore();
  const { 
    pdfs, 
    isLoading, 
    loadDocuments, 
    handleUpload, 
    handleDelete 
  } = useDocumentManager();

  const [search, setSearch] = useState('');
  const [pdfToDelete, setPdfToDelete] = useState<PdfAsset | null>(null);

  const filteredPdfs = pdfs.filter(pdf => 
    pdf.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleDeleteConfirm = async () => {
    if (!pdfToDelete) return;
    await handleDelete(pdfToDelete);
    setPdfToDelete(null);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <h2>Biblioteca de Documentos</h2>
            <span className={styles.count}>{pdfs.length} arquivos</span>
          </div>
          
          <div className={styles.headerActions}>
            <button 
              className={styles.addBtn}
              onClick={() => handleUpload()}
              title="Adicionar Documento"
            >
              <Plus size={18} />
              <span>Adicionar</span>
            </button>
            <button 
              className={styles.refreshBtn} 
              onClick={loadDocuments} 
              disabled={isLoading} 
              title="Atualizar biblioteca"
            >
              <RefreshCw size={18} className={isLoading ? styles.spin : ''} />
            </button>
            <button className={styles.closeBtn} onClick={onClose}><X size={20} /></button>
          </div>
        </div>

        <div className={styles.searchBar}>
          <Search size={18} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Buscar documentos ou arraste um PDF aqui..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        <div className={styles.content}>
          {isLoading && pdfs.length === 0 ? (
            <div className={styles.loader}>
              <Loader2 className={styles.spin} />
              <p>Escaneando workspace...</p>
            </div>
          ) : filteredPdfs.length > 0 ? (
            <div className={styles.grid}>
              {filteredPdfs.map(pdf => (
                <div key={pdf.full_path} className={styles.pdfCardWrapper}>
                  <button 
                    className={styles.pdfCard}
                    onClick={() => onSelect(pdf.path)}
                  >
                    <div className={styles.pdfCard__thumbnail}>
                      <PdfThumbnail fileUrl={resolveAssetPath(pdf.path, rootPath)} />
                      <div className={styles.pdfCard__thumbnailOverlay} />
                    </div>
                    <div className={styles.pdfCard__info}>
                      <span className={styles.pdfCard__name}>{pdf.name.replace(/\.pdf$/i, '')}</span>
                      <span className={styles.pdfCard__meta}>PDF Document</span>
                    </div>
                  </button>
                  <button 
                    className={styles.cardDeleteBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      setPdfToDelete(pdf);
                    }}
                    title="Excluir do Workspace"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.empty}>
              <FileText size={48} />
              <p>{search ? 'Nenhum resultado encontrado.' : 'Nenhum PDF encontrado.'}</p>
              {!search && (
                <button className={styles.emptyAddBtn} onClick={() => handleUpload()}>
                  Importar Primeiro PDF
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <ConfirmModal 
        isOpen={!!pdfToDelete}
        onClose={() => setPdfToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Excluir Documento"
        message={`Tem certeza que deseja excluir o documento "${pdfToDelete?.name}"? Esta ação não pode ser desfeita e removerá o arquivo do disco.`}
        variant="danger"
        confirmLabel="Excluir"
      />
    </div>
  );
};

