import styles from './DrawingStylePanel.module.scss';
import { useDrawingStore } from '@/shared/store/useDrawingStore';
import { Minus, Plus, Trash2 } from 'lucide-react';

const COLORS = [
  '#ef4444', // Red
  '#f97316', // Orange
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#3b82f6', // Blue
  '#6366f1', // Indigo
  '#a855f7', // Purple
  '#ec4899', // Pink
  '#ffffff', // White
  '#000000', // Black
];

export function DrawingStylePanel() {
  const { 
    strokeColor, setStrokeColor, 
    strokeWidth, setStrokeWidth,
    clearDrawings, drawings
  } = useDrawingStore();

  const handleWidthChange = (delta: number) => {
    setStrokeWidth(Math.max(1, Math.min(20, strokeWidth + delta)));
  };

  return (
    <div className={styles.panel}>
      <h3 className={styles.title}>Estilo do Desenho</h3>
      
      <div className={styles.section}>
        <label className={styles.label}>Cor do Traço</label>
        <div className={styles.colorGrid}>
          {COLORS.map(color => (
            <button
              key={color}
              className={`${styles.colorButton} ${strokeColor === color ? styles.active : ''}`}
              style={{ backgroundColor: color }}
              onClick={() => setStrokeColor(color)}
              title={color}
            />
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <label className={styles.label}>Espessura: {strokeWidth}px</label>
        <div className={styles.widthControls}>
          <button 
            className={styles.controlBtn} 
            onClick={() => handleWidthChange(-1)}
            disabled={strokeWidth <= 1}
          >
            <Minus size={16} />
          </button>
          
          <div className={styles.previewContainer}>
            <div 
              className={styles.previewCircle} 
              style={{ 
                width: `${strokeWidth}px`, 
                height: `${strokeWidth}px`,
                backgroundColor: strokeColor 
              }} 
            />
          </div>

          <button 
            className={styles.controlBtn} 
            onClick={() => handleWidthChange(1)}
            disabled={strokeWidth >= 20}
          >
            <Plus size={16} />
          </button>
        </div>
        <input 
          type="range" 
          min="1" 
          max="20" 
          value={strokeWidth} 
          onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
          className={styles.slider}
        />
      </div>

      <div className={styles.actions}>
        <button 
          className={styles.clearBtn}
          onClick={clearDrawings}
          disabled={drawings.length === 0}
        >
          <Trash2 size={16} />
          Limpar Desenhos
        </button>
      </div>
    </div>
  );
}
