import React, { useEffect } from "react";
import styles from "./App.module.scss";
import FileTree from "@/features/workspace/components/FileTree/FileTree";
import Editor from "@/features/editor/components/Core/Editor/Editor";
import ImageViewer from "@/features/imageview/components/ImageViewer/ImageViewer";
import Dashboard from "@/features/dashboard/components/Dashboard/Dashboard";
import MesaTrabalho from "@/features/universe/components/MesaTrabalho/MesaTrabalho/MesaTrabalho";
import MapaMesas from "@/features/universe/components/MapaMesas/MapaMesas";
import AssetGallery from "@/features/imageview/components/AssetGallery/AssetGallery";
import DocumentGallery from "@/features/docsview/components/DocumentGallery/DocumentGallery";
import CharacterGallery from "@/features/universe/components/CharacterGallery/CharacterGallery";
import InfiniteCanvas from "@/features/canvas/components/InfiniteCanvas/InfiniteCanvas";
import { SettingsPage } from "@/features/settings/components/Settings/Settings";
import { PluginPlaceholder } from "@/features/settings/components/PluginPlaceholder/PluginPlaceholder";
import StatusBar from "@/features/editor/components/Core/StatusBar/StatusBar";
import ReferenceSidebar from "@/features/references/components/ReferenceSidebar/ReferenceSidebar";
import CommandPalette from "@/features/search/components/CommandPalette/CommandPalette";
import { EntityPreview } from "@/features/editor/components/Insights/EntityPreview/EntityPreview";
const DrawingBoard = React.lazy(
  () => import("@/features/drawing/components/DrawingBoard/DrawingBoard"),
);
import { useWorkspaceStore } from "@/features/workspace/store/workspaceStore";
import { useUniverseStore } from "@/features/universe/store/universeStore";
import { useEditorStore } from "@/features/editor/store/editorStore";
import { useReferenceStore } from "@/features/references/store/referenceStore";
import { useUIStore } from "@/store/uiStore";
import { usePluginStore } from "@/features/settings/store/pluginStore";
import { ToastContainer } from "@/shared/components/Toast/ToastContainer/ToastContainer";
import { exportWorkspaceZip } from "@/tauri-bridge";
import {
  Type,
  LayoutGrid,
  FileEdit,
  PanelRight,
  PanelLeft,
  FolderOpen,
  Search,
  Users,
  Image as ImageIcon,
  Download,
  FileSearch,
  Images,
  Pencil,
  Settings as SettingsIcon,
  Infinity,
  ArrowLeft,
} from "lucide-react";

const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"];

function App() {
  const {
    activeFile,
    rootPath,
    selectWorkspace,
    isPathInvalid,
    validateWorkspace,
  } = useWorkspaceStore();

  const { typography, setTypography, save } = useEditorStore();
  const { entities } = useUniverseStore();
  const { activePdfPath } = useReferenceStore();
  const {
    activePanel,
    setActivePanel,
    isSidebarVisible,
    toggleSidebar,
    isRightSidebarVisible,
    toggleRightSidebar,
    isZenMode,
    toggleZenMode,
    setCommandPaletteOpen,
    preview,
    setPreview,
    addNotification,
  } = useUIStore();

  const { plugins } = usePluginStore();
  const isMoodBoardEnabled =
    plugins.find((p) => p.id === "mood-board")?.status === "enabled";
  const isInfiniteCanvasEnabled =
    plugins.find((p) => p.id === "infinite-canvas")?.status === "enabled";
  const isDrawingEnabled =
    plugins.find((p) => p.id === "drawing-board")?.status === "enabled";
  const isDashboardEnabled =
    plugins.find((p) => p.id === "universe-dashboard")?.status === "enabled";
  const isGalleryEnabled =
    plugins.find((p) => p.id === "character-gallery")?.status === "enabled";

  const [rightSidebarWidth, setRightSidebarWidth] = React.useState(300);
  const isResizing = React.useRef(false);

  useEffect(() => {
    if (!activePdfPath) {
      setRightSidebarWidth(300);
    } else {
      setRightSidebarWidth(450);
    }
  }, [activePdfPath]);

  const startResizing = React.useCallback((_e: React.MouseEvent) => {
    isResizing.current = true;
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", stopResizing);
    document.body.style.cursor = "col-resize";
  }, []);

  const stopResizing = React.useCallback(() => {
    isResizing.current = false;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", stopResizing);
    document.body.style.cursor = "default";
  }, []);

  const handleMouseMove = React.useCallback((e: MouseEvent) => {
    if (!isResizing.current) return;
    const newWidth = window.innerWidth - e.clientX;
    if (newWidth > 250 && newWidth < 800) {
      setRightSidebarWidth(newWidth);
    }
  }, []);

  const isImage =
    activeFile &&
    IMAGE_EXTENSIONS.some((ext) => activeFile.toLowerCase().endsWith(ext));

  useEffect(() => {
    setPreview({ entityPath: null, position: null });

    // Fecha a sidebar automaticamente ao mudar para painéis de visualização (foco total)
    if (activePanel !== "editor" && isSidebarVisible) {
      toggleSidebar();
    }

    // Fecha a sidebar de referências ao entrar no canvas para liberar espaço
    const isCanvasActive =
      activePanel === "canvas" ||
      activePanel === "moodboard" ||
      activePanel === "moodboard-map";
    if (isCanvasActive && isRightSidebarVisible) {
      toggleRightSidebar();
    }
  }, [activePanel, activeFile, setPreview]);

  useEffect(() => {
    if (rootPath) {
      validateWorkspace();
    }
  }, []);

  useEffect(() => {
    // KI-034: Bloqueia a interceptação do Windows Shell Overlay ("Drop here to share")
    // e garante que o drop chegue ao aplicativo.
    const handleGlobalDrag = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    window.addEventListener("dragenter", handleGlobalDrag);
    window.addEventListener("dragover", handleGlobalDrag);

    return () => {
      window.removeEventListener("dragenter", handleGlobalDrag);
      window.removeEventListener("dragover", handleGlobalDrag);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "\\") {
        e.preventDefault();
        toggleZenMode();
      }

      if (e.ctrlKey && e.key === "d") {
        e.preventDefault();
        if (isDashboardEnabled) {
          setActivePanel("dashboard");
        } else {
          addNotification('Plugin "Dashboard" não está ativado.', "info");
        }
      }
      if (e.ctrlKey && e.key === "g") {
        e.preventDefault();
        if (isGalleryEnabled) {
          setActivePanel("gallery");
        } else {
          addNotification(
            'Plugin "Galeria de Personagens" não está ativado.',
            "info",
          );
        }
      }
      if (e.ctrlKey && e.key === "m") {
        e.preventDefault();
        if (isMoodBoardEnabled) {
          setActivePanel("moodboard");
        } else {
          addNotification('Plugin "Infinite Canvas" não está ativado.', "info");
        }
      }
      if (e.ctrlKey && e.key === "e") {
        e.preventDefault();
        setActivePanel("editor");
      }
      if (e.ctrlKey && e.key === "i") {
        e.preventDefault();
        setActivePanel("assets");
      }
      if (e.ctrlKey && e.key === "q") {
        e.preventDefault();
        setActivePanel("documents");
      }
      if (e.ctrlKey && e.key === ",") {
        e.preventDefault();
        setActivePanel("settings");
      }

      if (e.ctrlKey && e.key === "s") {
        e.preventDefault();
        if (activeFile && activePanel === "editor" && !isImage) {
          save(activeFile, rootPath || undefined).then((success) => {
            if (success) {
              addNotification("Alterações salvas com sucesso", "success");
            } else {
              addNotification("Erro ao salvar arquivo", "error");
            }
          });
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    toggleZenMode,
    toggleSidebar,
    activePanel,
    setActivePanel,
    activeFile,
    isImage,
    rootPath,
    save,
    addNotification,
  ]);

  const toggleTypography = () => {
    setTypography(typography === "sans" ? "serif" : "sans");
  };

  const handleBackup = async () => {
    if (!rootPath) return;
    try {
      await exportWorkspaceZip(rootPath);
      addNotification("Backup exportado com sucesso!", "success");
    } catch (err) {
      console.error("Erro ao exportar backup:", err);
      addNotification("Falha ao exportar backup.", "error");
    }
  };

  const handleBreadcrumbClick = (path: string | null) => {
    const { setDashboardFilterPath } = useWorkspaceStore.getState();
    setDashboardFilterPath(path);
    setActivePanel("dashboard");
  };

  const renderBreadcrumb = () => {
    if (
      activePanel === "dashboard" ||
      activePanel === "gallery" ||
      activePanel === "moodboard" ||
      activePanel === "moodboard-map" ||
      activePanel === "assets" ||
      activePanel === "documents" ||
      activePanel === "drawing" ||
      activePanel === "settings"
    ) {
      const { dashboardFilterPath } = useWorkspaceStore.getState();
      let prefix = "Dashboard";
      if (activePanel === "gallery") prefix = "Personagens";
      if (activePanel === "moodboard") prefix = "Mesa de Trabalho";
      if (activePanel === "moodboard-map") prefix = "Mapa de Mesas";
      if (activePanel === "assets") prefix = "Galeria";
      if (activePanel === "documents") prefix = "Documentos";
      if (activePanel === "drawing") prefix = "Desenho";
      if (activePanel === "settings") prefix = "Ajustes";

      if (
        !dashboardFilterPath ||
        !rootPath ||
        activePanel === "moodboard" ||
        activePanel === "moodboard-map" ||
        activePanel === "assets" ||
        activePanel === "documents" ||
        activePanel === "drawing" ||
        activePanel === "settings"
      )
        return <span>{prefix}</span>;

      const relativePath = dashboardFilterPath
        .replace(rootPath, "")
        .replace(/^[\\/]/, "");
      const parts = relativePath.split(/[\\/]/);

      return (
        <div className={styles.app__breadcrumbList}>
          <button onClick={() => handleBreadcrumbClick(null)}>{prefix}</button>
          {parts.map((part, index) => {
            const currentPath =
              rootPath +
              (rootPath.includes("\\") ? "\\" : "/") +
              parts
                .slice(0, index + 1)
                .join(rootPath.includes("\\") ? "\\" : "/");
            return (
              <React.Fragment key={currentPath}>
                <span className={styles.app__breadcrumbSeparator}>/</span>
                <button onClick={() => handleBreadcrumbClick(currentPath)}>
                  {part}
                </button>
              </React.Fragment>
            );
          })}
        </div>
      );
    }

    if (!activeFile) return <span>Selecione uma nota</span>;

    if (rootPath && activeFile.startsWith(rootPath)) {
      const relativePath = activeFile
        .replace(rootPath, "")
        .replace(/^[\\/]/, "");
      const parts = relativePath.split(/[\\/]/);
      const fileName = parts.pop()?.replace(/\.md$/, "");

      return (
        <div className={styles.app__breadcrumbList}>
          <button onClick={() => handleBreadcrumbClick(null)}>Dashboard</button>
          {parts.map((part, index) => {
            const separator = rootPath.includes("\\") ? "\\" : "/";
            const currentPath =
              rootPath + separator + parts.slice(0, index + 1).join(separator);
            return (
              <React.Fragment key={currentPath}>
                <span className={styles.app__breadcrumbSeparator}>/</span>
                <button onClick={() => handleBreadcrumbClick(currentPath)}>
                  {part}
                </button>
              </React.Fragment>
            );
          })}
          <span className={styles.app__breadcrumbSeparator}>/</span>
          <span className={styles.app__breadcrumbActive}>{fileName}</span>
        </div>
      );
    }

    return <span>{activeFile}</span>;
  };

  if (isPathInvalid) {
    return (
      <div className={styles.app__error}>
        <div className={styles.app__errorContent}>
          <FolderOpen size={48} color="var(--color-amethyst)" />
          <h1>Workspace não encontrado</h1>
          <p>
            A pasta configurada anteriormente (<strong>{rootPath}</strong>) não
            existe mais ou está inacessível.
          </p>
          <button className={styles.app__btnPrimary} onClick={selectWorkspace}>
            Selecionar Novo Workspace
          </button>
        </div>
      </div>
    );
  }

  const isCanvasActive =
    activePanel === "canvas" ||
    activePanel === "moodboard" ||
    activePanel === "moodboard-map";

  return (
    <div
      className={`
      ${styles.app}
      ${!isSidebarVisible || isCanvasActive ? styles["app--sidebar-hidden"] : ""}
      ${isZenMode ? styles["app--zen-mode"] : ""}
    `}
    >
      {isSidebarVisible && !isZenMode && !isCanvasActive && (
        <aside className={styles.app__sidebar}>
          <FileTree />
        </aside>
      )}

      <main className={styles.app__main}>
        {!isZenMode && (
          <header
            className={`${styles.app__header} ${isCanvasActive ? styles["app__header--transparent"] : ""}`}
          >
            <div className={styles.app__headerLeft}>
              {isCanvasActive ? (
                <button
                  className={styles.app__iconBtn}
                  onClick={() => setActivePanel("dashboard")}
                  title="Voltar ao Dashboard"
                >
                  <ArrowLeft size={18} />
                </button>
              ) : (
                <button
                  className={`${styles.app__iconBtn} ${!isSidebarVisible ? styles["app__iconBtn--active"] : ""}`}
                  onClick={toggleSidebar}
                  title="Alternar Sidebar"
                >
                  <PanelLeft size={18} />
                </button>
              )}
              <div className={styles.app__breadcrumb}>
                {!isCanvasActive && renderBreadcrumb()}
              </div>
            </div>

            <div className={styles.app__actions}>
              {!isCanvasActive && (
                <div className={styles.app__toolGroup}>
                  <button
                    className={styles.app__iconBtn}
                    onClick={() => setCommandPaletteOpen(true)}
                    title="Busca Rápida e Comandos (Ctrl+P)"
                  >
                    <Search size={18} />
                  </button>

                  <button
                    className={styles.app__iconBtn}
                    onClick={handleBackup}
                    title="Exportar Backup (ZIP)"
                  >
                    <Download size={18} />
                  </button>

                  {activePanel === "editor" && !isImage && (
                    <button
                      className={styles.app__iconBtn}
                      onClick={toggleTypography}
                      title="Alternar Tipografia"
                    >
                      <Type size={18} />
                    </button>
                  )}

                  <button
                    className={`${styles.app__iconBtn} ${activePanel === "assets" ? styles["app__iconBtn--active"] : ""}`}
                    onClick={() => setActivePanel("assets")}
                    title="Galeria de Assets (Ctrl+I)"
                  >
                    <Images size={18} />
                  </button>

                  <button
                    className={`${styles.app__iconBtn} ${activePanel === "documents" ? styles["app__iconBtn--active"] : ""}`}
                    onClick={() => setActivePanel("documents")}
                    title="Galeria de Documentos (Ctrl+Q)"
                  >
                    <FileSearch size={18} />
                  </button>

                  {isDrawingEnabled && (
                    <button
                      className={`${styles.app__iconBtn} ${activePanel === "drawing" ? styles["app__iconBtn--active"] : ""}`}
                      onClick={() => setActivePanel("drawing")}
                      title="Desenho (Excalidraw)"
                    >
                      <Pencil size={18} />
                    </button>
                  )}

                  <button
                    className={`${styles.app__iconBtn} ${activePanel === "settings" ? styles["app__iconBtn--active"] : ""}`}
                    onClick={() => setActivePanel("settings")}
                    title="Configurações e Plugins (Ctrl+,)"
                  >
                    <SettingsIcon size={18} />
                  </button>
                </div>
              )}

              {!isCanvasActive && (
                <button
                  className={styles.app__iconBtn}
                  onClick={selectWorkspace}
                  title="Trocar Workspace"
                >
                  <FolderOpen size={18} />
                </button>
              )}

              {!isCanvasActive && (
                <nav className={styles.app__nav}>
                  <button
                    className={`${styles.app__iconBtn} ${activePanel === "editor" ? styles["app__iconBtn--active"] : ""}`}
                    onClick={() => setActivePanel("editor")}
                    title="Editor (Ctrl+E)"
                  >
                    <FileEdit size={18} />
                  </button>
                  {isDashboardEnabled && (
                    <button
                      className={`${styles.app__iconBtn} ${activePanel === "dashboard" ? styles["app__iconBtn--active"] : ""}`}
                      onClick={() => setActivePanel("dashboard")}
                      title="Dashboard (Ctrl+D)"
                    >
                      <LayoutGrid size={18} />
                    </button>
                  )}
                  {isGalleryEnabled && (
                    <button
                      className={`${styles.app__iconBtn} ${activePanel === "gallery" ? styles["app__iconBtn--active"] : ""}`}
                      onClick={() => setActivePanel("gallery")}
                      title="Galeria de Personagens (Ctrl+G)"
                    >
                      <Users size={18} />
                    </button>
                  )}
                  {isMoodBoardEnabled && (
                    <button
                      className={`${styles.app__iconBtn} ${(activePanel as string) === "moodboard" ? styles["app__iconBtn--active"] : ""}`}
                      onClick={() => setActivePanel("moodboard")}
                      title="Mesa de Trabalho (Ctrl+M)"
                    >
                      <ImageIcon size={18} />
                    </button>
                  )}
                  {isInfiniteCanvasEnabled && (
                    <button
                      className={`${styles.app__iconBtn} ${(activePanel as string) === "canvas" ? styles["app__iconBtn--active"] : ""}`}
                      onClick={() => setActivePanel("canvas")}
                      title="Infinite Canvas (Beta)"
                    >
                      <Infinity size={18} />
                    </button>
                  )}
                </nav>
              )}

              {!isCanvasActive && (
                <button
                  className={`${styles.app__iconBtn} ${isRightSidebarVisible ? styles["app__iconBtn--active"] : ""}`}
                  onClick={toggleRightSidebar}
                  title="Referências Lateral"
                >
                  <PanelRight size={18} />
                </button>
              )}
            </div>
          </header>
        )}

        <div className={styles.app__content}>
          {activePanel === "dashboard" ? (
            isDashboardEnabled ? (
              <Dashboard />
            ) : (
              <PluginPlaceholder
                name="Dashboard & Timeline"
                id="universe-dashboard"
              />
            )
          ) : activePanel === "gallery" ? (
            isGalleryEnabled ? (
              <CharacterGallery />
            ) : (
              <PluginPlaceholder
                name="Galeria de Personagens"
                id="character-gallery"
              />
            )
          ) : activePanel === "moodboard" ? (
            isMoodBoardEnabled ? (
              <MesaTrabalho />
            ) : (
              <PluginPlaceholder name="Mesa de Trabalho" id="mood-board" />
            )
          ) : activePanel === "moodboard-map" ? (
            isMoodBoardEnabled ? (
              <MapaMesas />
            ) : (
              <PluginPlaceholder name="Mapa de Mesas" id="mood-board" />
            )
          ) : activePanel === "assets" ? (
            <AssetGallery />
          ) : activePanel === "documents" ? (
            <DocumentGallery />
          ) : activePanel === "drawing" ? (
            isDrawingEnabled ? (
              <DrawingBoard />
            ) : (
              <PluginPlaceholder name="Desenho" id="drawing-board" />
            )
          ) : activePanel === "canvas" ? (
            isInfiniteCanvasEnabled ? (
              <InfiniteCanvas />
            ) : (
              <PluginPlaceholder name="Infinite Canvas" id="infinite-canvas" />
            )
          ) : activePanel === "settings" ? (
            <SettingsPage />
          ) : activeFile ? (
            isImage ? (
              <ImageViewer path={activeFile} />
            ) : (
              <Editor />
            )
          ) : (
            <div className={styles.placeholder}>
              <p>
                Abra um arquivo .md ou vá para a Galeria/Dashboard para ver suas
                notas.
              </p>
            </div>
          )}
        </div>

        {activePanel === "editor" && !isImage && <StatusBar />}
      </main>

      {isRightSidebarVisible && !isZenMode && (
        <>
          {activePdfPath && (
            <div className={styles.app__resizer} onMouseDown={startResizing} />
          )}
          <aside
            className={styles.app__rightSidebar}
            style={
              {
                "--sidebar-width": `${rightSidebarWidth}px`,
              } as React.CSSProperties
            }
          >
            <ReferenceSidebar />
          </aside>
        </>
      )}

      <CommandPalette />

      <ToastContainer />

      {preview.entityPath &&
        preview.position &&
        entities[preview.entityPath] && (
          <EntityPreview
            entity={entities[preview.entityPath]}
            position={preview.position}
          />
        )}
    </div>
  );
}

export default App;
