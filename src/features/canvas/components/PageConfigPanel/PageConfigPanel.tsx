import { PageConfigPanelProps } from '@/shared/types';
import styles from './PageConfigPanel.module.scss';
import { Bold, Maximize2, Type, Palette } from 'lucide-react';

const FONTS = [
  { label: 'Sans', value: "var(--font-family-sans)" },
  { label: 'Serif', value: "var(--font-family-serif)" },
  { label: 'Manuscrita', value: "'Kalam', cursive" },
  { label: 'Casual', value: "'Segoe Print', cursive" },
];

export function PageConfigPanel({
  selectedPageEntity,
  handleFontSizeChange,
  updateSelectedPageStyle,
  handleFontFamilyChange,
  toggleBold
}: PageConfigPanelProps) {
  
  const currentFont = (selectedPageEntity.style?.fontFamily as string) || FONTS[0].value;
  const isBold = selectedPageEntity.style?.fontWeight === 'bold' || 
                 selectedPageEntity.style?.fontWeight === '600' || 
                 selectedPageEntity.style?.fontWeight === '700';

  return (
    <div className={styles.content}>
      {/* Layout da Página */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <Maximize2 size={12} /> Tamanho & Margens
        </div>
        <div className={styles.toggleGroup}>
          <button
            className={selectedPageEntity.width === 420 ? styles.active : ""}
            onClick={() => updateSelectedPageStyle({ width: 420, height: 594 })}
          >
            A4
          </button>
          <button
            className={selectedPageEntity.width === 300 ? styles.active : ""}
            onClick={() => updateSelectedPageStyle({ width: 300, height: 420 })}
          >
            A5
          </button>
          <button
            className={selectedPageEntity.width === 800 ? styles.active : ""}
            onClick={() => updateSelectedPageStyle({ width: 800, height: 600 })}
          >
            Web
          </button>
          <button
            className={selectedPageEntity.width === 400 ? styles.active : ""}
            onClick={() => updateSelectedPageStyle({ width: 400, height: 400 })}
          >
            Sq
          </button>
        </div>
        
        <div className={styles.toggleGroup} style={{ marginTop: '4px' }}>
          <button
            className={selectedPageEntity.style?.padding === "12px" ? styles.active : ""}
            onClick={() => updateSelectedPageStyle({ padding: "12px" })}
          >
            Estreita
          </button>
          <button
            className={
              selectedPageEntity.style?.padding === "24px" || !selectedPageEntity.style?.padding
                ? styles.active : ""
            }
            onClick={() => updateSelectedPageStyle({ padding: "24px" })}
          >
            Normal
          </button>
          <button
            className={selectedPageEntity.style?.padding === "48px" ? styles.active : ""}
            onClick={() => updateSelectedPageStyle({ padding: "48px" })}
          >
            Larga
          </button>
        </div>
      </div>

      <div className={styles.divider} />

      {/* Tipografia Compacta */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <Type size={12} /> Tipografia
        </div>
        <div className={styles.typographyRow}>
          <select 
            className={styles.fontSelect} 
            value={currentFont}
            onChange={(e) => handleFontFamilyChange(e.target.value)}
          >
            {FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
          
          <div className={styles.numberInput}>
            <button onClick={() => handleFontSizeChange(-2)}>-</button>
            <input type="text" value={selectedPageEntity.style?.fontSize || "14px"} readOnly />
            <button onClick={() => handleFontSizeChange(2)}>+</button>
          </div>

          <button 
            className={`${styles.iconBtn} ${isBold ? styles.active : ''}`}
            onClick={toggleBold}
          >
            <Bold size={14} />
          </button>
        </div>
      </div>

      <div className={styles.divider} />

      {/* Cores Lado a Lado */}
      <div className={styles.colorsContainer}>
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <Palette size={12} /> Texto
          </div>
          <div className={styles.colorPicker}>
            {[
              { color: "var(--color-text-primary)", hex: "#e8eaf0" },
              { color: "#ffffff", hex: "#ffffff" },
              { color: "#000000", hex: "#000000" }
            ].map(({ color, hex }) => (
              <button
                key={color}
                style={{ backgroundColor: hex }}
                className={selectedPageEntity.style?.color === color ? styles.active : ""}
                onClick={() => updateSelectedPageStyle({ color })}
              />
            ))}
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <Palette size={12} /> Fundo
          </div>
          <div className={styles.colorPicker}>
            {[
              { color: "var(--color-bg-base)", hex: "#1c1f26" },
              { color: "var(--color-bg-elevated)", hex: "#2d3240" },
              { color: "#ffffff", hex: "#ffffff" },
              { color: "#fffb91", hex: "#fffb91" }
            ].map(({ color, hex }) => (
              <button
                key={color}
                style={{ backgroundColor: hex }}
                className={selectedPageEntity.style?.backgroundColor === color ? styles.active : ""}
                onClick={() => updateSelectedPageStyle({ backgroundColor: color })}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
