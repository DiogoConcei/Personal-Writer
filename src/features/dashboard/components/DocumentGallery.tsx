import { useEffect, useState } from 'react';
import { useWorkspaceStore } from '@/features/workspace/store/workspaceStore';
import { useReferenceStore } from '@/features/references/store/referenceStore';
import { useUIStore } from '@/store/uiStore';
import { listDirectory, PdfAsset, resolveAssetPath } from '@/tauri-bridge/fs';
import styles from './DocumentGallery.module.scss';
import { FileText, Search, RefreshCw, ExternalLink } from 'lucide-react';
import { PdfThumbnail } from './PdfThumbnail';

export default function DocumentGallery() {
  const { rootPath } = useWorkspaceStore();
  const { setActivePdf } = useReferenceStore();
  const { toggleRightSidebar, isRightSidebarVisible } = useUIStore();

  const [pdfs, setPdfs] = useState<PdfAsset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState('');

  const loadDocuments = async () => {
    if (!rootPath) return;
    setIsLoading(true);
    try {
      const scanFolder = async (path: string): Promise<PdfAsset[]> => {
        const entries = await listDirectory(path);
        let results: PdfAsset[] = [];

        for (const entry of entries) {
          if (entry.is_dir) {

            if (entry.name.startsWith('.')) continue;
            const subResults = await scanFolder(entry.path);
            results = [...results, ...subResults];
          } else {
            if (entry.name.toLowerCase().endsWith('.pdf')) {
              results.push({
                name: entry.name,
                path: entry.path
              });
            }
          }
        }
        return results;
      };

      const allPdfs = await scanFolder(rootPath);
      setPdfs(allPdfs);
    } catch (err) {
      console.error('Erro ao carregar PDFs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [rootPath]);

  const handleOpenPdf = (path: string) => {
    setActivePdf(path);
    if (!isRightSidebarVisible) toggleRightSidebar();
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
    </div>
  );
}
