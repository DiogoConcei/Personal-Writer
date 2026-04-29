import { NoteConfigPanelProps } from '@/shared/types';
import styles from './NoteConfigPanel.module.scss';

export function NoteConfigPanel({
  selectedNoteEntity,
  handleFontSizeChange,
  updateSelectedNoteStyle,
  setIsNoteGalleryOpen,
}: NoteConfigPanelProps) {
  return (
    <div className={styles.content}>
      <button
        className={styles.menuButton}
        onClick={() => setIsNoteGalleryOpen(true)}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        Trocar Nota
      </button>

      <div className={styles.configDivider}>Configurações de Exibição</div>

      <div className={styles.configSection}>
        <label>Tamanho da Fonte</label>
        <div className={styles.numberInput}>
          <button onClick={() => handleFontSizeChange(-2)}>-</button>
          <input
            type="text"
            value={selectedNoteEntity.style?.fontSize || "14px"}
            readOnly
          />
          <button onClick={() => handleFontSizeChange(2)}>+</button>
        </div>
      </div>

      <div className={styles.configSection}>
        <label>Tamanho da Página</label>
        <div className={styles.toggleGroup}>
          <button
            className={
              selectedNoteEntity.width === 420 ? styles.active : ""
            }
            onClick={() => updateSelectedNoteStyle({ width: 420, height: 594 })}
          >
            A4
          </button>
          <button
            className={
              selectedNoteEntity.width === 300 &&
              selectedNoteEntity.height === 420
                ? styles.active
                : ""
            }
            onClick={() => updateSelectedNoteStyle({ width: 300, height: 420 })}
          >
            A5
          </button>
          <button
            className={
              selectedNoteEntity.width === 400 &&
              selectedNoteEntity.height === 400
                ? styles.active
                : ""
            }
            onClick={() => updateSelectedNoteStyle({ width: 400, height: 400 })}
          >
            Sq
          </button>
        </div>
      </div>

      <div className={styles.configSection}>
        <label>Margens</label>
        <div className={styles.toggleGroup}>
          <button
            className={
              selectedNoteEntity.style?.padding === "12px" ? styles.active : ""
            }
            onClick={() => updateSelectedNoteStyle({ padding: "12px" })}
          >
            Estreita
          </button>
          <button
            className={
              selectedNoteEntity.style?.padding === "24px" ||
              !selectedNoteEntity.style?.padding
                ? styles.active
                : ""
            }
            onClick={() => updateSelectedNoteStyle({ padding: "24px" })}
          >
            Normal
          </button>
          <button
            className={
              selectedNoteEntity.style?.padding === "48px" ? styles.active : ""
            }
            onClick={() => updateSelectedNoteStyle({ padding: "48px" })}
          >
            Larga
          </button>
        </div>
      </div>

      <div className={styles.configSection}>
        <label>Cor do Texto</label>
        <div className={styles.colorPicker}>
          {[
            { color: "var(--color-text-primary)", hex: "#e8eaf0", label: "Principal" },
            { color: "var(--color-text-secondary)", hex: "#9da3b8", label: "Secundário" }
          ].map(
            ({ color, hex }) => (
              <button
                key={color}
                style={{ backgroundColor: hex }}
                className={
                  selectedNoteEntity.style?.color === color ||
                  (!selectedNoteEntity.style?.color && color === "var(--color-text-primary)")
                    ? styles.active
                    : ""
                }
                onClick={() => updateSelectedNoteStyle({ color })}
              />
            ),
          )}
        </div>
      </div>

      <div className={styles.configSection}>
        <label>Cor de Fundo</label>
        <div className={styles.colorPicker}>
          {[
            { color: "#000000", hex: "#000000", label: "Preto" },
            { color: "var(--color-bg-base)", hex: "#1c1f26", label: "Base" },
            { color: "var(--color-bg-elevated)", hex: "#2d3240", label: "Elevado" }
          ].map(
            ({ color, hex }) => (
              <button
                key={color}
                style={{ backgroundColor: hex }}
                className={
                  selectedNoteEntity.style?.backgroundColor === color ||
                  (!selectedNoteEntity.style?.backgroundColor &&
                    color === "var(--color-bg-elevated)")
                    ? styles.active
                    : ""
                }
                onClick={() =>
                  updateSelectedNoteStyle({ backgroundColor: color })
                }
              />
            ),
          )}
        </div>
      </div>
    </div>
  );
}
