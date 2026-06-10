import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { useReferenceStore } from '../../store/referenceStore';
import { useWorkspaceStore } from '../../../workspace/store/workspaceStore';
import { resolveAssetPath } from '../../../../tauri-bridge';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Loader2,
  X,
  Maximize
} from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import styles from './PdfViewer.module.scss';

// Configuração do Worker local para melhor performance e offline
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

export const PdfViewer: React.FC = () => {
  const { activePdfPath, setActivePdf } = useReferenceStore();
  const { rootPath } = useWorkspaceStore();
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [isFitToWidth, setIsFitToWidth] = useState(true);
  const [containerWidth, setContainerWidth] = useState<number | undefined>(undefined);

  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateWidth = () => {
      if (contentRef.current) {
        setContainerWidth(contentRef.current.clientWidth - 40);
      }
    };

    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    if (contentRef.current) observer.observe(contentRef.current);

    return () => observer.disconnect();
  }, []);

  const fileUrl = useMemo(() => {
    if (!activePdfPath || !rootPath) return null;
    return resolveAssetPath(activePdfPath, rootPath);
  }, [activePdfPath, rootPath]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setPageNumber(1);
  }

  const changePage = (offset: number) => {
    setPageNumber(prevPageNumber => {
      const newPage = prevPageNumber + offset;
      if (newPage < 1 || (numPages && newPage > numPages)) return prevPageNumber;
      return newPage;
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Evita disparar se o usuário estiver digitando em um input ou textarea
      if (
        e.target instanceof HTMLInputElement || 
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        changePage(-1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        changePage(1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [numPages, activePdfPath]); // Adicionado dependências para garantir o estado correto

  if (!activePdfPath) return null;

  return (
    <div className={styles.pdf_viewer}>
      <div className={styles.pdf_viewer__toolbar}>
        <div className={styles.pdf_viewer__controls}>
          <button
            onClick={() => changePage(-1)}
            disabled={pageNumber <= 1}
            className={styles.pdf_viewer__button}
          >
            <ChevronLeft size={18} />
          </button>
          <span className={styles.pdf_viewer__page_info}>
            Pág. {pageNumber} / {numPages || '--'}
          </span>
          <button
            onClick={() => changePage(1)}
            disabled={numPages ? pageNumber >= numPages : true}
            className={styles.pdf_viewer__button}
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className={styles.pdf_viewer__zoom_controls}>
          <button
            onClick={() => {
              setIsFitToWidth(false);
              setScale(s => Math.max(0.5, s - 0.1));
            }}
            className={styles.pdf_viewer__button}
          >
            <ZoomOut size={18} />
          </button>

          <button
            onClick={() => setIsFitToWidth(!isFitToWidth)}
            className={`${styles.pdf_viewer__button} ${isFitToWidth ? styles['pdf_viewer__button--active'] : ''}`}
            title="Ajustar à largura"
          >
            <Maximize size={16} />
          </button>

          {!isFitToWidth && (
            <span className={styles.pdf_viewer__zoom_info}>{Math.round(scale * 100)}%</span>
          )}

          <button
            onClick={() => {
              setIsFitToWidth(false);
              setScale(s => Math.min(2.5, s + 0.1));
            }}
            className={styles.pdf_viewer__button}
          >
            <ZoomIn size={18} />
          </button>
        </div>

        <div className={styles.pdf_viewer__actions}>
          <button
            onClick={() => setActivePdf(null)}
            className={`${styles.pdf_viewer__button} ${styles['pdf_viewer__button--close']}`}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div className={styles.pdf_viewer__content} ref={contentRef}>
        <Document
          file={fileUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className={styles.pdf_viewer__loading}>
              <Loader2 className={styles.pdf_viewer__loading_icon} />
              <span>Preparando documento...</span>
            </div>
          }
          error={
            <div className={styles.pdf_viewer__error}>
              <h3>Não foi possível carregar o PDF</h3>
              <p>Verifique se o arquivo ainda existe ou se você tem permissão para acessá-lo.</p>
            </div>
          }
        >
          <Page
            pageNumber={pageNumber}
            scale={!isFitToWidth ? scale : undefined}
            width={isFitToWidth ? containerWidth : undefined}
            className={styles.pdf_viewer__page}
            renderTextLayer={true}
            renderAnnotationLayer={true}
            canvasBackground="white"
          />
        </Document>
      </div>
    </div>
  );
};
