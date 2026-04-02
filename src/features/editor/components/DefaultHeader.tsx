import styles from './DefaultHeader.module.scss';
import { useWorkspaceStore } from '@/features/workspace/store/workspaceStore';
import { useEditorStore } from '@/features/editor/store/editorStore';
import { FileText, ChevronRight } from 'lucide-react';
import { AttributeGrid } from './AttributeGrid';

export function DefaultHeader() {
  const { activeFile } = useWorkspaceStore();
  const { metadata, setMetadata } = useEditorStore();

  const noteName = activeFile ? activeFile.split(/[\\/]/).pop()?.replace('.md', '') : 'Nova Nota';

  return (
    <div className={styles.defaultHeader}>
      <div className={styles.hero}>
        <div className={styles.badgeRow}>
          <span className={styles.typeTag}><FileText size={12} /> Documento</span>
          <ChevronRight size={14} className={styles.separator} />
          <span className={styles.statusTag}>Rascunho</span>
        </div>
        <h1 className={styles.name}>{noteName}</h1>
      </div>

      <div className={styles.content}>
        <AttributeGrid metadata={metadata} onUpdate={setMetadata} />
      </div>
    </div>
  );
}
