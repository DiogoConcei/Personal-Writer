import React from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Loader2, FileWarning } from 'lucide-react';
import styles from '../DocumentGallery/DocumentGallery.module.scss';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface Props {
  fileUrl: string;
  width?: number;
  pageNumber?: number;
  onLoadSuccess?: (data: { numPages: number }) => void;
}

export const PdfThumbnail: React.FC<Props> = ({ fileUrl, width = 200, pageNumber = 1, onLoadSuccess }) => {
  return (
    <div className={styles.thumbnailContainer}>
      <Document
        file={fileUrl}
        onLoadSuccess={onLoadSuccess}
        loading={
          <div className={styles.thumbnailLoading}>
            <Loader2 className={styles.spin} size={20} />
          </div>
        }
        error={
          <div className={styles.thumbnailError}>
            <FileWarning size={20} />
          </div>
        }
      >
        <Page
          pageNumber={pageNumber}
          width={width}
          renderTextLayer={false}
          renderAnnotationLayer={false}
          canvasBackground="transparent"
          className={styles.pdfPage}
        />
      </Document>
    </div>
  );
};
