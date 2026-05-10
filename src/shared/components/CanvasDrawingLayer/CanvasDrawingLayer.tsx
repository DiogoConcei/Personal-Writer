import { MesaDrawing } from '@/shared/types';

interface CanvasDrawingLayerProps {
  drawings: MesaDrawing[];
  removeDrawing: (id: string) => void;
  isEraserActive?: boolean;
}

export function CanvasDrawingLayer({ drawings, removeDrawing, isEraserActive }: CanvasDrawingLayerProps) {
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
        zIndex: 5
      }}
    >
      {drawings.map((drawing) => {
        if (drawing.points.length < 2) return null;

        const d = drawing.points.reduce((acc: string, point: { x: number, y: number }, i: number) => {
          return i === 0 
            ? `M ${point.x} ${point.y}` 
            : `${acc} L ${point.x} ${point.y}`;
        }, '');

        return (
          <path
            key={drawing.id}
            d={d}
            stroke={drawing.color}
            strokeWidth={drawing.width + (isEraserActive ? 10 : 0)} // Área de clique maior para a borracha
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            opacity={drawing.opacity ?? 1}
            style={{ 
              cursor: isEraserActive ? 'pointer' : 'default',
              pointerEvents: isEraserActive ? 'stroke' : 'none',
              transition: 'stroke-width 0.2s ease'
            }}
            onClick={(e) => {
              if (isEraserActive) {
                e.stopPropagation();
                removeDrawing(drawing.id);
              }
            }}
          />
        );
      })}
    </svg>
  );
}
