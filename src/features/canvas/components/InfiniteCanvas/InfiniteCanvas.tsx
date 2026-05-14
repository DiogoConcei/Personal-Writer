import styles from "./InfiniteCanvas.module.scss";

// Hooks
import { useCanvasOrchestrator } from "../../hooks/useCanvasOrchestrator";

// Componentes
import { CanvasControls } from "../CanvasControls/CanvasControls";
import { CanvasToolbar } from "./components/CanvasToolbar/CanvasToolbar";
import { CollageControls } from "./components/CollageControls/CollageControls";
import { CanvasViewport } from "./components/CanvasViewport";

/**
 * InfiniteCanvas (Refatorado v1.5)
 * ADR-018: Componente orquestrador modularizado.
 * Agora utiliza o useCanvasOrchestrator para gerenciar a lógica complexa.
 */
export default function InfiniteCanvas() {
  const {
    containerRef,
    rootPath,
    setActivePanel,
    drawings,
    removeDrawing,
    modalControl,
    engine,
    tools,
    ui,
    entities,
    collage,
    styles: canvasStyles,
    history,
    drawing,
    handlers
  } = useCanvasOrchestrator();

  const { zoom, viewState, isPanning, isSpacePressed, zoomIn, zoomOut, resetView, handleMouseDown, screenToCanvas } = engine;
  const { activeTool, isPencilActive, isEraserActive, isScissorsActive, isTextActive, isPanActive, isCollageActive } = tools;
  const { open } = modalControl;

  return (
    <div className={`${styles.container} ${isPanning ? styles.panning : ""}`} onClick={() => ui.setSelectedItemId(null)}>
      <button 
        className={styles.backButton} 
        onClick={() => setActivePanel("dashboard")} 
        title="Voltar ao Dashboard"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </button>

      {!ui.isCollageConfirmed && (
        <CanvasToolbar
          activeTool={activeTool}
          isScissorsActive={isScissorsActive}
          onActivateSelect={tools.activateSelect}
          onActivatePan={tools.activatePan}
          onActivatePencil={tools.activatePencil}
          onActivateEraser={tools.activateEraser}
          onActivateText={tools.activateText}
          onToggleScissors={ui.handleToggleScissors}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onResetView={resetView}
        />
      )}

      {ui.isCollageConfirmed && (
        <CollageControls
          activeTool={activeTool}
          onActivatePencil={tools.activatePencil}
          onActivateEraser={tools.activateEraser}
          onActivateText={tools.activateText}
          onOpenImageGallery={() => open("image")}
          onFinalize={collage.handleFinalizeCollage}
          onCancel={collage.handleCancelCollage}
        />
      )}

      <CanvasControls value={modalControl}>
        {!isScissorsActive && !ui.isCollageConfirmed && (
          <CanvasControls.Sidebar
            isSepararActive={ui.isSplitModeActive}
            setIsSepararActive={ui.handleToggleSplitMode}
            selectedNoteEntity={canvasStyles.selectedNoteEntity}
            handleFontSizeChange={canvasStyles.handleFontSizeChange}
            updateSelectedNoteStyle={canvasStyles.updateSelectedNoteStyle}
            selectedTextEntity={canvasStyles.selectedTextEntity}
            handleTextFontSizeChange={canvasStyles.handleTextFontSizeChange}
            handleTextFontFamilyChange={canvasStyles.handleTextFontFamilyChange}
            toggleTextBold={canvasStyles.toggleTextBold}
            onAddPostIt={() => {
              const id = entities.addPostIt();
              if (id) ui.handleSelectItem(id);
            }}
            selectedPostItEntity={canvasStyles.selectedPostItEntity}
            handlePostItFontSizeChange={canvasStyles.handlePostItFontSizeChange}
            updateSelectedPostItStyle={canvasStyles.updateSelectedPostItStyle}
            togglePostItBold={canvasStyles.togglePostItBold}
            handlePostItFontFamilyChange={canvasStyles.handlePostItFontFamilyChange}
            onAddPage={() => {
              const id = entities.addPage();
              if (id) ui.handleSelectItem(id);
            }}
            isCollageActive={isCollageActive}
            activateCollage={tools.activateCollage}
            selectedItemIds={ui.selectedItemIds}
            canConfirmCollage={collage.canConfirmCollage}
            onConfirmCollage={collage.handleConfirmCollage}
          />
        )}

        <CanvasControls.Modals
          entities={entities.entities}
          onNoteSelect={(path, name) => ui.handleSelectItem(entities.addNote(path, name))}
          onImageSelect={(path) => entities.addImage(path)}
          onPdfSelect={(path) => entities.addPdf(path)}
          onConfirmSplit={handlers.handleConfirmSplit}
          onUpdate={handlers.handleUpdateWithSnapshot}
          onAddPendingCollage={collage.handleAddPendingCollage}
          rootPath={rootPath}
        />
      </CanvasControls>

      <CanvasViewport
        containerRef={containerRef}
        zoom={zoom}
        viewState={viewState}
        isPanning={isPanning}
        isSpacePressed={isSpacePressed}
        isPanActive={isPanActive}
        isPencilActive={isPencilActive}
        isTextActive={isTextActive}
        isEraserActive={isEraserActive}
        isCollageActive={isCollageActive}
        isSplitModeActive={ui.isSplitModeActive}
        isScissorsActive={isScissorsActive}
        rootPath={rootPath || ""}
        entities={entities.entities}
        drawings={drawings}
        visibleEntities={entities.visibleEntities}
        selectedItemId={ui.selectedItemId}
        selectedItemIds={ui.selectedItemIds}
        onMouseDown={(e) => {
          if (handleMouseDown(e, isPanActive)) return;
          if (isPencilActive) drawing.startDrawing(e);
          else if (isTextActive) {
            if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('canvas-viewport')) {
              const pos = screenToCanvas(e.clientX, e.clientY);
              const id = entities.addText({ text: '' }, pos);
              if (id) ui.setSelectedItemId(id as string);
            }
          } else ui.setSelectedItemId(null);
        }}
        onSelectItem={ui.handleSelectItem}
        onDeselect={() => ui.setSelectedItemId(null)}
        onUpdateEntity={handlers.handleUpdateWithSnapshot}
        onRemoveEntity={handlers.handleRemoveWithSnapshot}
        onStartTransform={history.takeSnapshot}
        onEndTransform={handlers.handleTransformEnd}
        onRotateStart={handlers.handleRotateStart}
        onOpenModal={open}
        bringToFront={entities.bringToFront}
        sendToBack={entities.sendToBack}
        removeDrawing={removeDrawing}
      />
    </div>
  );
}
