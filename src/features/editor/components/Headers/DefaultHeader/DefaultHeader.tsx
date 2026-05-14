import styles from './DefaultHeader.module.scss';
import { useWorkspaceStore } from '@/features/workspace/store/workspaceStore';
import { useEditorStore } from '@/features/editor/store/editorStore';
import { FileText } from 'lucide-react';
import { AttributeGrid } from "../../Metadata/AttributeGrid/AttributeGrid";
import { DefaultHeaderProps } from '@/shared/types';

export function DefaultHeader({ metadata: propMetadata, readOnly }: DefaultHeaderProps) {
  const { activeFile } = useWorkspaceStore();
  const { metadata: storeMetadata, setMetadata } = useEditorStore();

  const metadata = propMetadata || storeMetadata;

  const noteName = activeFile ? activeFile.split(/[\\/]/).pop()?.replace('.md', '') : 'Nova Nota';

  const displayType = metadata.type || 'Nota';

  return (
    <div className={styles.defaultHeader}>
      <div className={styles.hero}>
        <div className={styles.badgeRow}>
          <span className={styles.typeTag}>
            <FileText size={12} /> {displayType}
          </span>
        </div>
        <h1 className={styles.name}>{noteName}</h1>
      </div>

      <div className={styles.content}>
        <AttributeGrid metadata={metadata} onUpdate={setMetadata} readOnly={readOnly} />
      </div>
    </div>
  );
}
