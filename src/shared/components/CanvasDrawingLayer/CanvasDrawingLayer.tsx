import { MesaDrawing } from '@/shared/types';

interface CanvasDrawingLayerProps {
  drawings: MesaDrawing[];
  removeDrawing: (id: string) => void;
  isEraserActive?: boolean;
  isCollageActive?: boolean;
  selectedItemIds?: string[];
  onSelect?: (id: string) => void;
}

export function CanvasDrawingLayer({ 
  drawings, 
  removeDrawing, 
  isEraserActive,
  isCollageActive,
  selectedItemIds = [],
  onSelect
}: CanvasDrawingLayerProps) {
  if (drawings.length === 0) return null;

  return (
    <svg 
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 200
      }}
    >
      {drawings.map((drawing) => {
        if (drawing.points.length < 2) return null;
        const isSelected = selectedItemIds.includes(drawing.id);

        const d = drawing.points.reduce((acc: string, point: { x: number, y: number }, i: number) => {
          return i === 0 
            ? `M ${point.x} ${point.y}` 
            : `${acc} L ${point.x} ${point.y}`;
        }, '');

        return (
          <path
            key={drawing.id}
            d={d}
            stroke={isSelected ? 'var(--color-accent)' : drawing.color}
            strokeWidth={drawing.width + (isEraserActive ? 10 : isCollageActive ? 6 : 0)} 
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            opacity={drawing.opacity ?? 1}
            style={{ 
              cursor: isEraserActive || isCollageActive ? 'pointer' : 'default',
              pointerEvents: (isEraserActive || isCollageActive) ? 'stroke' : 'none',
              transition: drawing.x === undefined ? 'all 0.2s ease' : 'none', // Desabilita transição durante movimento otimizado
              transform: `translate(${drawing.x || 0}px, ${drawing.y || 0}px)`,
              filter: isSelected ? 'drop-shadow(0 0 4px var(--color-accent))' : 'none'
            }}
            onClick={(e) => {
              if (isEraserActive) {
                e.stopPropagation();
                removeDrawing(drawing.id);
              } else if (isCollageActive && onSelect) {
                e.stopPropagation();
                onSelect(drawing.id);
              }
            }}
          />
        );
      })}
    </svg>
  );
}
