import React from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import { FileText, ExternalLink } from 'lucide-react';
import { useReferenceStore } from '../../../references/store/referenceStore';
import { useUIStore } from '../../../../store/uiStore';
import styles from './PdfNode.module.scss';

export const PdfNode: React.FC<any> = ({ node }) => {
  const { path, name } = node.attrs;
  const { setActivePdf } = useReferenceStore();
  const { isRightSidebarVisible, toggleRightSidebar } = useUIStore();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (path) {
      setActivePdf(path);

      if (!isRightSidebarVisible) {
        toggleRightSidebar();
      }
    }
  };

  return (
    <NodeViewWrapper className={styles.pdf_node}>
      <div
        className={styles.pdf_node__card}
        onClick={handleClick}
        title={`Abrir ${name}`}
      >
        <div className={styles.pdf_node__icon_container}>
          <FileText size={20} />
        </div>
        <div className={styles.pdf_node__content}>
          <span className={styles.pdf_node__name}>{name}</span>
          <span className={styles.pdf_node__meta}>Documento PDF</span>
        </div>
        <ExternalLink size={16} className={styles.pdf_node__arrow} />
      </div>
    </NodeViewWrapper>
  );
};
