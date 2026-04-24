import { useState, useMemo } from 'react';
import { NodeViewWrapper, NodeViewContent, NodeViewProps } from '@tiptap/react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import styles from './CodeBlockComponent.module.scss';

export default function CodeBlockComponent({ node }: NodeViewProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const lines = useMemo(() => {
    return node.textContent.split('\n').length;
  }, [node.textContent]);

  const isCollapsible = lines > 10;
  const showOverlay = isCollapsible && !isExpanded;

  return (
    <NodeViewWrapper className={`${styles.wrapper} ${showOverlay ? styles.collapsed : ''}`}>
      <pre className={styles.pre}>
        <code>
          <NodeViewContent />
        </code>
      </pre>

      {isCollapsible && (
        <div className={styles.actions}>
          <button 
            type="button" 
            onClick={() => setIsExpanded(!isExpanded)}
            className={styles.toggleBtn}
          >
            {isExpanded ? (
              <><ChevronUp size={14} /> Recolher</>
            ) : (
              <><ChevronDown size={14} /> Mostrar tudo ({lines} linhas)</>
            )}
          </button>
        </div>
      )}
      
      {showOverlay && <div className={styles.overlay} onClick={() => setIsExpanded(true)} />}
    </NodeViewWrapper>
  );
}
