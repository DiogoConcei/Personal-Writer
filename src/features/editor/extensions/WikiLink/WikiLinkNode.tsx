import React, { useMemo } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { useWorkspaceStore } from '@/features/workspace/store/workspaceStore';
import { useUIStore } from '@/store/uiStore';
import { useUniverseStore } from '@/features/universe/store/universeStore';

export default function WikiLinkNode({ node, selected, extension }: NodeViewProps) {
  const label = node.attrs.label || 'Sem nome';
  const { files } = useWorkspaceStore();
  const { setPreview } = useUIStore();
  const { entities } = useUniverseStore();

  const entity = useMemo(() => {
    return Object.values(entities).find(e => e.name === label);
  }, [entities, label]);

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

  const handleMouseEnter = (e: React.MouseEvent) => {
    if (entity) {
      setPreview({
        entityPath: entity.path,
        position: { x: e.clientX, y: e.clientY }
      });
    }
  };

  const handleMouseLeave = () => {
    setPreview({ entityPath: null, position: null });
  };

  return (
    <NodeViewWrapper as="span" className="wiki-link-node-wrapper" style={{ display: 'inline-block' }}>
      <span 
        className={`wiki-link ${exists ? 'exists' : 'broken'} ${selected ? 'is-selected' : ''}`}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{ cursor: 'pointer', position: 'relative', display: 'inline-flex', alignItems: 'center' }}
      >
        <span className={`wiki-link__bracket ${selected ? 'is-visible' : 'is-hidden'}`}>[[</span>
        <span className="wiki-link__text">{label}</span>
        <span className={`wiki-link__bracket ${selected ? 'is-visible' : 'is-hidden'}`}>]]</span>
      </span>
    </NodeViewWrapper>
  );
}

