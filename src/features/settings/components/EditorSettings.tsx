import React from 'react';
import styles from './EditorSettings.module.scss';

export const EditorSettings: React.FC = () => {
  return (
    <div className={styles.container}>
      <section className={styles.section}>
        <h2>Tipografia</h2>
        <div className={styles.grid}>
          <div className={styles.settingGroup}>
            <label>Família da Fonte</label>
            <select defaultValue="Inter">
              <option value="Inter">Inter (Padrão)</option>
              <option value="Roboto">Roboto</option>
              <option value="Merriweather">Merriweather (Serif)</option>
              <option value="Fira Code">Fira Code (Monospace)</option>
            </select>
          </div>
          <div className={styles.settingGroup}>
            <label>Tamanho da Fonte (px)</label>
            <input type="number" defaultValue={16} min={8} max={72} />
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2>Layout da Página</h2>
        <div className={styles.settingGroup}>
          <label>Tamanho da Página</label>
          <select defaultValue="a4">
            <option value="a4">A4</option>
            <option value="letter">Carta (Letter)</option>
            <option value="custom">Personalizado / Sem Limite</option>
          </select>
        </div>

        <h3>Margens (mm)</h3>
        <div className={styles.marginGrid}>
          <div className={styles.settingGroup}>
            <label>Superior</label>
            <input type="number" defaultValue={25} />
          </div>
          <div className={styles.settingGroup}>
            <label>Inferior</label>
            <input type="number" defaultValue={25} />
          </div>
          <div className={styles.settingGroup}>
            <label>Esquerda</label>
            <input type="number" defaultValue={30} />
          </div>
          <div className={styles.settingGroup}>
            <label>Direita</label>
            <input type="number" defaultValue={20} />
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2>Comportamento</h2>
        <div className={styles.settingGroup}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input type="checkbox" defaultChecked />
            Exibir contador de palavras na barra de status
          </label>
        </div>
        <div className={styles.settingGroup}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input type="checkbox" defaultChecked />
            Salvar automaticamente ao fechar a nota
          </label>
        </div>
      </section>
    </div>
  );
};
