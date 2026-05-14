import { Editor } from '@tiptap/react';
import { useEffect, useState, useRef } from 'react';
import styles from './TableOfContents.module.scss';
import { List, GripHorizontal, ChevronDown, ChevronUp } from 'lucide-react';

import { TableOfContentsProps, TOCItem } from '@/shared/types';

export function TableOfContents({ editor, onClose }: TableOfContentsProps) {
  const [items, setItems] = useState<TOCItem[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Estados para arrastar
  const [position, setPosition] = useState({ x: window.innerWidth - 320, y: 100 });
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // Estados para redimensionar
  const [size, setSize] = useState({ width: 250, height: 300 });
  const lastExpandedSize = useRef({ width: 250, height: 300 });
  const isResizing = useRef(false);

  useEffect(() => {
    if (!editor) return;

    const updateTOC = () => {
      const headings: TOCItem[] = [];
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === 'heading') {
          headings.push({
            id: `heading-${pos}`,
            text: node.textContent,
            level: node.attrs.level,
            pos,
          });
        }
      });
      setItems(headings);
    };

    updateTOC();
    editor.on('update', updateTOC);
    return () => {
      editor.off('update', updateTOC);
    };
  }, [editor]);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    dragStart.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging.current) {
      setPosition({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y
      });
    } else if (isResizing.current && !isCollapsed) {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newWidth = Math.min(300, Math.max(200, e.clientX - rect.left));
      const newHeight = Math.min(300, Math.max(200, e.clientY - rect.top));
      setSize({ width: newWidth, height: newHeight });
      lastExpandedSize.current = { width: newWidth, height: newHeight };
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    isResizing.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isResizing.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const toggleCollapse = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsCollapsed(!isCollapsed);
  };

  const scrollToHeading = (pos: number) => {
    if (!editor) return;
    editor.chain().focus().setTextSelection(pos).scrollIntoView().run();
  };

  if (items.length === 0) {
    return (
      <div 
        className={styles.tocEmpty}
        style={{ transform: `translate(${position.x}px, ${position.y}px)`, position: 'fixed', top: 0, left: 0 }}
      >
        <div className={styles.dragHandle} onMouseDown={handleMouseDown}>
          <GripHorizontal size={14} />
        </div>
        <List size={24} />
        <p>Nenhum título encontrado nesta nota.</p>
        <button onClick={onClose} className={styles.closeBtn}>Fechar</button>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`${styles.toc} ${isCollapsed ? styles.collapsed : ''}`}
      style={{ 
        transform: `translate(${position.x}px, ${position.y}px)`,
        width: isCollapsed ? '200px' : `${size.width}px`,
        height: isCollapsed ? 'auto' : `${size.height}px`,
        position: 'fixed',
        top: 0,
        left: 0
      }}
    >
      <header className={styles.tocHeader} onMouseDown={handleMouseDown}>
        <div className={styles.headerTitle}>
          <GripHorizontal size={14} className={styles.grip} />
          <h3>Sumário</h3>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.actionBtn} onClick={toggleCollapse} title={isCollapsed ? "Expandir" : "Recolher"}>
            {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
          <button className={styles.actionBtn} onClick={onClose} title="Fechar">
            &times;
          </button>
        </div>
      </header>
      {!isCollapsed && (
        <>
          <nav className={styles.tocNav}>
            {items.map((item) => (
              <button
                key={item.id}
                className={`${styles.tocItem} ${styles[`level-${item.level}`]}`}
                onClick={() => scrollToHeading(item.pos)}
              >
                {item.text}
              </button>
            ))}
          </nav>
          <div className={styles.resizer} onMouseDown={handleResizeStart} />
        </>
      )}
    </div>
  );
}
