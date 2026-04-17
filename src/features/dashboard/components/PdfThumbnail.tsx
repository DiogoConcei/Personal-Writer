import React from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Loader2, FileWarning } from 'lucide-react';
import styles from './DocumentGallery.module.scss';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface Props {
  fileUrl: string;
}

export const PdfThumbnail: React.FC<Props> = ({ fileUrl }) => {
  return (
    <div className={styles.thumbnailContainer}>
      <Document
        file={fileUrl}
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
          pageNumber={1}
          width={200}
          renderTextLayer={false}
          renderAnnotationLayer={false}
          className={styles.pdfPage}
        />
      </Document>
    </div>
  );
};
