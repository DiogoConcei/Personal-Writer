import React from 'react';
import { Type, MousePointer2, Hand, ZoomIn, ZoomOut, RotateCcw, ImagePlus, Pencil, Eraser, Link, Layers, Map, Settings2, Layout, LayoutPanelLeft, Save } from 'lucide-react';
import { ActivePanel } from '@/shared/types';
import styles from './MesaTrabalho.module.scss';

import { MesaToolbarProps } from '@/shared/types';

export const MesaToolbar: React.FC<MesaToolbarProps> = ({
  boardName,
  boardMode,
  isEditingName,
  tempName,
  isPencilActive,
  isEraserActive,
  isTextToolActive,
  isConnecting,
  isGroupingMode,
  isPanModeActive,
  isSettingsOpen,
  onSetTempName,
  onSaveName,
  onSetIsEditingName,
  activateSelectTool,
  activatePanTool,
  zoomIn,
  zoomOut,
  handleResetView,
  onOpenGallery,
  activatePencilTool,
  activateEraserTool,
  activateTextTool,
  handleToggleConnectionMode,
  handleToggleGroupingMode,
  setActivePanel,
  setIsSettingsOpen,
  setBoardMode,
  onSaveBoard
}) => {
  return (
    <div className={styles.floatingToolbar}>
      <div className={styles.toolbar}>
        {isEditingName ? (
          <input
            autoFocus
            className={styles.boardTitleInput}
            value={tempName}
            onChange={(e) => onSetTempName(e.target.value)}
            onBlur={onSaveName}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSaveName();
              if (e.key === 'Escape') {
                onSetIsEditingName(false);
                onSetTempName(boardName);
              }
            }}
          />
        ) : (
          <button 
            className={styles.toolbarBtn} 
            title="Renomear Mesa" 
            onClick={() => onSetIsEditingName(true)}
          >
            <Type size={16} />
            <span>{boardName}</span>
          </button>
        )}
        <div className={styles.divider}></div>
        
        {/* 1. Selecionar */}
        <button 
          className={`${styles.toolbarBtn} ${!isPencilActive && !isEraserActive && !isTextToolActive && !isConnecting && !isGroupingMode && !isPanModeActive ? styles.active : ''}`} 
          title="Selecionar"
          onClick={activateSelectTool}
        >
          <MousePointer2 size={16} />
        </button>

        {/* 2. Mão */}
        <button 
          className={`${styles.toolbarBtn} ${isPanModeActive ? styles.active : ''}`} 
          title="Mover Tela (H)"
          onClick={activatePanTool}
        >
          <Hand size={16} />
        </button>

        <div className={styles.divider}></div>

        {/* 3. Lápis */}
        <button 
          className={`${styles.toolbarBtn} ${isPencilActive ? styles.active : ''}`} 
          title="Desenhar (Lápis)"
          onClick={activatePencilTool}
        >
          <Pencil size={16} />
        </button>

        {/* 4. Borracha */}
        <button 
          className={`${styles.toolbarBtn} ${isEraserActive ? styles.active : ''}`} 
          title="Borracha (Excluir Desenho)"
          onClick={activateEraserTool}
        >
          <Eraser size={16} />
        </button>

        {/* 5. Texto */}
        <button 
          className={`${styles.toolbarBtn} ${isTextToolActive ? styles.active : ''}`} 
          title="Adicionar Texto"
          onClick={activateTextTool}
        >
          <Type size={16} />
        </button>

        <div className={styles.divider}></div>

        {/* 6. Zoom-in */}
        <button className={styles.toolbarBtn} title="Aumentar Zoom" onClick={zoomIn}><ZoomIn size={16} /></button>
        
        {/* 7. Zoom-out */}
        <button className={styles.toolbarBtn} title="Diminuir Zoom" onClick={zoomOut}><ZoomOut size={16} /></button>
        
        {/* 8. Botão de reset do zoom */}
        <button className={styles.toolbarBtn} title="Resetar Visualização" onClick={handleResetView}><RotateCcw size={16} /></button>
        
        <div className={styles.divider}></div>

        {/* 9. Botão de agrupamento */}
        <button 
          className={`${styles.toolbarBtn} ${isGroupingMode ? styles.active : ''}`} 
          title={isGroupingMode ? "Cancelar Agrupamento" : "Iniciar Agrupamento"}
          onClick={handleToggleGroupingMode}
        >
          <Layers size={16} />
        </button>

        {/* 10. Conectar items */}
        <button 
          className={`${styles.toolbarBtn} ${isConnecting ? styles.active : ''}`} 
          title={isConnecting ? "Selecione o segundo item" : "Conectar Itens"} 
          onClick={handleToggleConnectionMode}
        >
          <Link size={16} />
        </button>

        <div className={styles.divider}></div>
        <button className={styles.toolbarBtn} title="Adicionar Imagem" onClick={() => onOpenGallery('item')}><ImagePlus size={16} /></button>
        <button className={styles.toolbarBtn} title="Mapa" onClick={() => setActivePanel('moodboard-map')}><Map size={16} /></button>
        
        <div className={styles.divider}></div>
        
        <div className={styles.settingsWrapper}>
          <button 
            className={`${styles.toolbarBtn} ${isSettingsOpen ? styles.active : ''}`} 
            title="Configurações da Mesa" 
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          >
            <Settings2 size={16} />
          </button>

          {isSettingsOpen && (
            <div className={styles.settingsPopover}>
              <div className={styles.settingsHeader}>Configurações</div>
              <div className={styles.settingsSection}>
                <label>Modelo da Mesa</label>
                <div className={styles.modeToggle}>
                  <button 
                    className={boardMode === 'free' ? styles.active : ''} 
                    onClick={() => setBoardMode('free')}
                  >
                    <Layout size={14} />
                    Livre
                  </button>
                  <button 
                    className={boardMode === 'planning' ? styles.active : ''} 
                    onClick={() => setBoardMode('planning')}
                  >
                    <LayoutPanelLeft size={14} />
                    Planejamento
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className={styles.divider}></div>
        <button className={styles.toolbarBtn} title="Salvar Mesa (Manual)" onClick={onSaveBoard}><Save size={16} /></button>
      </div>
    </div>
  );
};
