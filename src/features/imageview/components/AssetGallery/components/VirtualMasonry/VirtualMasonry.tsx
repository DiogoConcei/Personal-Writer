import { useState, useEffect, useMemo, useRef } from 'react';
import { VirtualMasonryProps } from '@/shared/types';
import styles from './VirtualMasonry.module.scss';

export function VirtualMasonry<T>({
  items,
  columnWidth,
  gap,
  renderItem,
  getItemKey,
  getItemHeight,
  buffer = 400,
}: VirtualMasonryProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);

  // Observar redimensionamento do container
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    observer.observe(containerRef.current);
    setViewportHeight(window.innerHeight); // Fallback inicial

    return () => observer.disconnect();
  }, []);

  // Monitorar scroll
  useEffect(() => {
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      setScrollTop(target.scrollTop);
      setViewportHeight(target.clientHeight);
    };

    const scrollEl = scrollRef.current;
    if (scrollEl) {
      scrollEl.addEventListener('scroll', handleScroll);
      setViewportHeight(scrollEl.clientHeight);
    }

    return () => {
      if (scrollEl) scrollEl.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Calcular posições
  const { layoutItems, totalHeight } = useMemo(() => {
    if (containerWidth === 0) return { layoutItems: [], totalHeight: 0 };

    const numColumns = Math.max(1, Math.floor((containerWidth + gap) / (columnWidth + gap)));
    const actualColumnWidth = (containerWidth - (numColumns - 1) * gap) / numColumns;
    
    const columnHeights = new Array(numColumns).fill(0);
    const calculatedItems = items.map((item) => {
      // Encontrar a coluna com menor altura
      let minHeight = columnHeights[0];
      let columnIndex = 0;
      for (let i = 1; i < numColumns; i++) {
        if (columnHeights[i] < minHeight) {
          minHeight = columnHeights[i];
          columnIndex = i;
        }
      }

      const x = columnIndex * (actualColumnWidth + gap);
      const y = minHeight;
      const height = getItemHeight(item, actualColumnWidth);

      columnHeights[columnIndex] = y + height + gap;

      return {
        item,
        rect: { x, y, width: actualColumnWidth, height },
        key: getItemKey(item)
      };
    });

    return {
      layoutItems: calculatedItems,
      totalHeight: Math.max(...columnHeights)
    };
  }, [items, containerWidth, columnWidth, gap, getItemHeight, getItemKey]);

  // Filtrar itens visíveis
  const visibleItems = useMemo(() => {
    return layoutItems.filter((li) => {
      const isVisible = 
        li.rect.y + li.rect.height >= scrollTop - buffer && 
        li.rect.y <= scrollTop + viewportHeight + buffer;
      return isVisible;
    });
  }, [layoutItems, scrollTop, viewportHeight, buffer]);

  return (
    <div ref={scrollRef} className={styles.scrollContainer}>
      <div 
        ref={containerRef} 
        className={styles.masonryContainer} 
        style={{ height: totalHeight }}
      >
        {visibleItems.map((li, index) => (
          <div
            key={li.key}
            className={styles.masonryItem}
            style={{
              position: 'absolute',
              top: li.rect.y,
              left: li.rect.x,
              width: li.rect.width,
              height: li.rect.height,
            }}
          >
            {renderItem(li.item, { width: '100%', height: '100%' }, index)}
          </div>
        ))}
      </div>
    </div>
  );
}
