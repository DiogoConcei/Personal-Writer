import { useState } from 'react';
import { useWorkspaceStore } from '@/features/workspace/store/workspaceStore';
import { useReferenceStore } from '@/features/references/store/referenceStore';
import { useUIStore } from '@/store/uiStore';
import { PdfAsset, resolveAssetPath } from '@/tauri-bridge/fs';
import { useDocumentManager } from '@/shared/hooks/useDocumentManager';
import styles from './DocumentGallery.module.scss';
import { FileText, Search, RefreshCw, ExternalLink, Plus, Trash2 } from 'lucide-react';
import { PdfThumbnail } from '../PdfThumbnail/PdfThumbnail';
import ConfirmModal from '@/shared/components/Modal/ConfirmModal';

export default function DocumentGallery() {
  const { rootPath } = useWorkspaceStore();
  const { setActivePdf } = useReferenceStore();
  const { toggleRightSidebar, isRightSidebarVisible } = useUIStore();
  
  const { 
    pdfs, 
    isLoading, 
    loadDocuments, 
    handleUpload, 
    handleDelete 
  } = useDocumentManager();

  const [filter, setFilter] = useState('');
  const [pdfToDelete, setPdfToDelete] = useState<PdfAsset | null>(null);

  const handleOpenPdf = (path: string) => {
    setActivePdf(path);
    if (!isRightSidebarVisible) toggleRightSidebar();
  };

  const handleDeleteConfirm = async () => {
    if (!pdfToDelete) return;
    await handleDelete(pdfToDelete);
    setPdfToDelete(null);
  };

  const filteredPdfs = pdfs.filter(pdf =>
    pdf.name.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.header__title}>
          <h1>Documentos</h1>
          <span className={styles.count}>{filteredPdfs.length} arquivos PDF</span>
        </div>

        <div className={styles.actions}>
          <div className={styles.search}>
            <Search size={16} />
            <input
              type="text"
              placeholder="Buscar documentos..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          
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
            title="Atualizar Biblioteca"
          >
            <RefreshCw size={18} className={isLoading ? styles.spin : ''} />
          </button>
        </div>
      </header>

      <div className={styles.content}>
        {isLoading && pdfs.length === 0 ? (
          <div className={styles.loading}>
            <RefreshCw size={48} className={styles.spin} />
            <p>Varrendo workspace em busca de PDFs...</p>
          </div>
        ) : filteredPdfs.length === 0 ? (
          <div className={styles.empty}>
            <FileText size={64} />
            <p>{filter ? 'Nenhum documento corresponde à busca.' : 'Nenhum PDF encontrado no workspace.'}</p>
            {!filter && (
              <button className={styles.emptyAddBtn} onClick={() => handleUpload()}>
                Importar Primeiro PDF
              </button>
            )}
          </div>
        ) : (
          <div className={styles.grid} key={filter}>
            {filteredPdfs.map((pdf, index) => (
              <div
                key={pdf.path}
                className={styles.card}
                style={{ '--delay': `${index * 0.03}s` } as React.CSSProperties}
                onClick={() => handleOpenPdf(pdf.path)}
              >
                <button 
                  className={styles.card__delete}
                  onClick={(e) => {
                    e.stopPropagation();
                    setPdfToDelete(pdf);
                  }}
                  title="Excluir Documento"
                >
                  <Trash2 size={16} />
                </button>

                <div className={styles.card__thumbnail}>
                  <div className={styles.card__thumbnailCover}>
                    <PdfThumbnail fileUrl={resolveAssetPath(pdf.path, rootPath || '')} />
                    <div className={styles.card__thumbnailOverlay}>
                       <ExternalLink size={24} color="white" />
                    </div>
                  </div>
                </div>

                <div className={styles.card__info}>
                  <span className={styles.card__name} title={pdf.name}>
                    {pdf.name.replace(/\.pdf$/i, '')}
                  </span>
                  <span className={styles.card__path}>
                    {pdf.path.replace(rootPath || '', '').replace(/^[\\/]/, '')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal 
        isOpen={!!pdfToDelete}
        onClose={() => setPdfToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Excluir Documento"
        message={`Tem certeza que deseja excluir o documento "${pdfToDelete?.name}"? Esta ação não pode ser desfeita.`}
        variant="danger"
        confirmLabel="Excluir"
      />
    </div>
  );
}
