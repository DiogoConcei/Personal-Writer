import { NodeViewWrapper, NodeViewContent, NodeViewProps } from '@tiptap/react';
import styles from './PostItNodeView.module.scss';

export default function PostItNodeView({ node, selected }: NodeViewProps) {
  const { backgroundColor, color } = node.attrs;

  return (
    <NodeViewWrapper className={`${styles.postItWrapper} ${selected ? styles.selected : ''}`}>
      <div 
        className={styles.postIt}
        style={{ backgroundColor, color }}
      >
        <NodeViewContent className={styles.content} />
      </div>
    </NodeViewWrapper>
  );
}
