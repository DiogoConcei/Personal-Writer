import React, { useMemo } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { useWorkspaceStore } from '@/features/workspace/store/workspaceStore';

export default function WikiLinkNode({ node, selected, extension }: NodeViewProps) {
  const label = node.attrs.label || 'Sem nome';
  const { files } = useWorkspaceStore();

  const exists = useMemo(() => {
    if (!label || label === 'Sem nome') return false;
    
    const checkRecursive = (nodeList: any[]): boolean => {
      return nodeList.some(n => {
        if (n.is_dir) return checkRecursive(n.children || []);
        return n.name.replace(/\.md$/, '') === label;
      });
    };
    return checkRecursive(files);
  }, [files, label]);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (extension.options.onLinkClick) {
      extension.options.onLinkClick(label);
    }
  };

  return (
    <NodeViewWrapper as="span" className="wiki-link-node-wrapper" style={{ display: 'inline-block' }}>
      <span 
        className={`wiki-link ${exists ? 'exists' : 'broken'} ${selected ? 'is-selected' : ''}`}
        onClick={handleClick}
        style={{ cursor: 'pointer', position: 'relative', display: 'inline-flex', alignItems: 'center' }}
      >
        <span className={`wiki-link__bracket ${selected ? 'is-visible' : 'is-hidden'}`}>[[</span>
        <span className="wiki-link__text">{label}</span>
        <span className={`wiki-link__bracket ${selected ? 'is-visible' : 'is-hidden'}`}>]]</span>
      </span>
    </NodeViewWrapper>
  );
}
