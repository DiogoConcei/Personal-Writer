import { PostItConfigPanelProps } from '@/shared/types';
import styles from './PostItConfigPanel.module.scss';
import { Bold } from 'lucide-react';

const POST_IT_COLORS = [
  { bg: '#fffb91', text: '#5f5c00', label: 'Canário' },
  { bg: '#d4ff91', text: '#3b5f00', label: 'Lima' },
  { bg: '#91f9ff', text: '#004d53', label: 'Céu' },
  { bg: '#ffd191', text: '#6b3b00', label: 'Pêssego' },
  { bg: '#ff91f7', text: '#5d0056', label: 'Rosa' },
  { bg: '#d191ff', text: '#38006b', label: 'Lavanda' },
];

const FONTS = [
  { label: 'Manuscrita', value: "'Kalam', cursive" },
  { label: 'Casual', value: "'Segoe Print', cursive" },
  { label: 'Sans', value: "var(--font-family-sans)" },
  { label: 'Serif', value: "var(--font-family-serif)" },
];

export function PostItConfigPanel({
  selectedPostItEntity,
  handleFontSizeChange,
  updateSelectedPostItStyle,
  toggleBold,
  handleFontFamilyChange
}: PostItConfigPanelProps) {
  
  const currentBg = selectedPostItEntity.style?.backgroundColor as string;
  const currentFont = selectedPostItEntity.style?.fontFamily as string;
  const isBold = selectedPostItEntity.style?.fontWeight === 'bold' || 
                 selectedPostItEntity.style?.fontWeight === '600' || 
                 selectedPostItEntity.style?.fontWeight === '700';

  return (
    <div className={styles.content}>
      <div className={styles.configSection}>
        <label>Cor do Post-it</label>
        <div className={styles.colorGrid}>
          {POST_IT_COLORS.map((color) => (
            <button
              key={color.bg}
              className={`${styles.colorBtn} ${currentBg === color.bg ? styles.active : ''}`}
              style={{ backgroundColor: color.bg }}
              onClick={() => updateSelectedPostItStyle({ 
                backgroundColor: color.bg,
                color: color.text 
              })}
              title={color.label}
            />
          ))}
        </div>
      </div>

      <div className={styles.configDivider}>Tipografia</div>

      <div className={styles.configSection}>
        <label>Fonte</label>
        <div className={styles.fontList}>
          {FONTS.map((font) => (
            <button
              key={font.value}
              className={`${styles.fontBtn} ${currentFont === font.value ? styles.active : ''}`}
              style={{ fontFamily: font.value }}
              onClick={() => handleFontFamilyChange(font.value)}
            >
              {font.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.row}>
        <div className={styles.configSection}>
          <label>Tamanho</label>
          <div className={styles.numberInput}>
            <button onClick={() => handleFontSizeChange(-2)}>-</button>
            <input
              type="text"
              value={selectedPostItEntity.style?.fontSize || "18px"}
              readOnly
            />
            <button onClick={() => handleFontSizeChange(2)}>+</button>
          </div>
        </div>

        <div className={styles.configSection}>
          <label>Estilo</label>
          <button 
            className={`${styles.iconBtn} ${isBold ? styles.active : ''}`}
            onClick={toggleBold}
            title="Negrito"
          >
            <Bold size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
