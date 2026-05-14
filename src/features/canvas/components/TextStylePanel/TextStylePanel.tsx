import styles from './TextStylePanel.module.scss';
import { Bold, Minus, Plus } from 'lucide-react';
import { AnyCanvasEntity, TextStylePanelProps } from '@/shared/types';

const FONTS = [
  { label: 'Sans Serif', value: 'sans-serif' },
  { label: 'Serif', value: 'serif' },
  { label: 'Monospace', value: 'monospace' },
  { label: 'Inter', value: 'Inter, sans-serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
];

export function TextStylePanel({
  selectedTextEntity,
  handleFontSizeChange,
  handleFontFamilyChange,
  toggleBold
}: TextStylePanelProps) {
  
  const currentFontSize = parseInt((selectedTextEntity?.style?.fontSize as string) || '16', 10);
  const currentFontFamily = (selectedTextEntity?.style?.fontFamily as string) || 'sans-serif';
  const isBold = selectedTextEntity?.style?.fontWeight === 'bold' || 
                 selectedTextEntity?.style?.fontWeight === '600' || 
                 selectedTextEntity?.style?.fontWeight === '700';

  return (
    <div className={styles.panel}>
      <h3 className={styles.title}>Estilo do Texto</h3>

      <div className={styles.section}>
        <label className={styles.label}>Fonte</label>
        <select 
          className={styles.select}
          value={currentFontFamily}
          onChange={(e) => handleFontFamilyChange(e.target.value)}
        >
          {FONTS.map(font => (
            <option key={font.value} value={font.value}>{font.label}</option>
          ))}
        </select>
      </div>

      <div className={styles.section}>
        <label className={styles.label}>Tamanho: {currentFontSize}px</label>
        <div className={styles.controls}>
          <button 
            className={styles.controlBtn}
            onClick={() => handleFontSizeChange(Math.max(8, currentFontSize - 1))}
          >
            <Minus size={16} />
          </button>
          <button 
            className={styles.controlBtn}
            onClick={() => handleFontSizeChange(Math.min(72, currentFontSize + 1))}
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      <div className={styles.section}>
        <label className={styles.label}>Formatação</label>
        <button 
          className={`${styles.formatBtn} ${isBold ? styles.active : ''}`}
          onClick={toggleBold}
          title="Negrito"
        >
          <Bold size={18} />
          Negrito
        </button>
      </div>
    </div>
  );
}
