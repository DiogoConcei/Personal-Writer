import { useEffect, useState, useMemo } from "react";
import { useWorkspaceStore } from "@/features/workspace/store/workspaceStore";
import { useUIStore } from "@/store/uiStore";
import { useReferenceStore } from "@/features/references/store/referenceStore";
import { useGalleryStore } from "../../store/galleryStore";
import { resolveAssetPath } from "@/tauri-bridge/fs";
import { useMediaManager } from "@/shared/hooks/useMediaManager/useMediaManager";
import { useDragAndDrop } from "@/shared/hooks/useDragAndDrop/useDragAndDrop";
import { useNativeDragDrop } from "@/shared/hooks/useNativeDragDrop/useNativeDragDrop";
import { AssetGalleryProps, GalleryItem, MediaAsset, ImageAsset } from "@/shared/types";
import ImageViewer from "../ImageViewer/ImageViewer";
import InputModal from "@/shared/components/Modal/InputModal/InputModal";
import ConfirmModal from "@/shared/components/Modal/ConfirmModal/ConfirmModal";
import { SectionTabs } from "./components/SectionTabs/SectionTabs";
import styles from "./AssetGallery.module.scss";
import {
  Search,
  RefreshCw,
  FolderPlus,
  CheckSquare,
  Folder,
  Upload,
  ImagePlus,
  Edit2,
  Trash2,
  Layers,
  MoreHorizontal,
  ChevronRight,
  X,
  FileText,
} from "lucide-react";

import { VirtualMasonry } from "./components/VirtualMasonry/VirtualMasonry";
import { LazyImage } from "./components/LazyImage";

const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"];
const ALL_EXTENSIONS = [...IMAGE_EXTENSIONS, ".pdf"];

export default function AssetGallery({
  pickerMode = false,
  onSelect,
  onClose,
  disableOrganization = false,
  assetType = 'all',
}: AssetGalleryProps = {}) {
  const { rootPath, isScanning, scanImages, scanPdfs, invalidateImageCache, invalidatePdfCache } =
    useWorkspaceStore();
  const { addNotification, toggleRightSidebar, isRightSidebarVisible } = useUIStore();
  const { setActivePdf } = useReferenceStore();
  const {
    collections,
    loadCollections,
    createCollection,
    updateCollection,
    deleteCollection,
    addToCollection,
  } = useGalleryStore();
  
  const {
    uploadMedia,
    handleMediaDrop,
    activeTarget,
    activeSection,
    handleSectionChange,
    filter,
    setFilter,
    isPickingExisting,
    setIsPickingExisting,
    filteredMedia,
    filteredCollections,
    handleTargetClick,
    getBreadcrumbs,
  } = useMediaManager(assetType);

  const [activeImage, setActiveImage] = useState<string | null>(null);

  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedPaths, setSelectedPaths] = useState<string[]>([]);

  const [isInputModalOpen, setIsInputModalOpen] = useState(false);
  const [inputModalMode, setInputModalMode] = useState<"create" | "rename">(
    "create",
  );
  const [pendingCollectionImages, setPendingCollectionImages] = useState<
    string[]
  >([]);
  const [collectionToRename, setCollectionToRename] = useState<string | null>(
    null,
  );
  const [collectionToDelete, setCollectionToDelete] = useState<string | null>(
    null,
  );

  // Configuração do Drag & Drop Desacoplado
  const {
    handleMouseDown,
    draggedItem,
    dragPosition,
    isDragging,
    dropTarget,
    shouldIgnoreClick,
  } = useDragAndDrop<MediaAsset>({
    onDrop: async (item, targetType, targetId) => {
      if (disableOrganization) return;
      
      const handled = await handleMediaDrop(
        item,
        targetType,
        targetId,
        selectedPaths,
      );

      if (handled) {
        if (isSelectionMode) {
          setSelectedPaths([]);
          setIsSelectionMode(false);
        }
      } else if (targetType === "media") {
        // Fallback: Criar coleção virtual ao soltar item sobre item
        const sourceItems = selectedPaths.includes(item.path)
          ? selectedPaths
          : [item.path];
        setPendingCollectionImages([...sourceItems, targetId]);
        setInputModalMode("create");
        setIsInputModalOpen(true);
      }
    },
    isValidTarget: (item, type, id) => {
      if (disableOrganization) return false;
      if (
        (type === "image" || type === "pdf" || type === "media") &&
        (id === item.path || selectedPaths.includes(id))
      ) {
        return false;
      }
      return true;
    },
  });

  useEffect(() => {
    if (rootPath) {
      if (assetType === 'image' || assetType === 'all') scanImages();
      if (assetType === 'pdf' || assetType === 'all') scanPdfs();
      loadCollections();
    }
  }, [rootPath, assetType, scanImages, scanPdfs, loadCollections]);

  const handleUpload = async () => {
    const importedPaths = await uploadMedia();
    if (importedPaths && activeTarget?.type === "virtual") {
      await addToCollection(activeTarget.id, importedPaths);
    }
  };

  // Efeito para Drag & Drop Externo (Desktop -> App)
  useNativeDragDrop({
    onDrop: async (mediaPaths, position) => {
      if (disableOrganization) return;
      const element = document.elementFromPoint(position.x, position.y);
      const folderId = element
        ?.closest('[data-drag-type="folder"]')
        ?.getAttribute("data-drag-id");

      const importedPaths = await uploadMedia("", mediaPaths);

      if (importedPaths) {
        if (folderId) await addToCollection(folderId, importedPaths);
        else if (activeTarget?.type === "virtual")
          await addToCollection(activeTarget.id, importedPaths);
      }
    },
    filters: ALL_EXTENSIONS,
    disabled: !rootPath || disableOrganization,
  });

  const handleInputConfirm = async (name: string) => {
    if (inputModalMode === "create") {
      let parentId =
        activeTarget?.type === "virtual" ? activeTarget.id : undefined;

      if (!parentId && activeSection !== "geral") {
        const siloName = activeSection === "collages" ? "Colagens" : "Edições";
        const siloCol = collections.find((c) => c.name === siloName);
        if (siloCol) parentId = siloCol.id;
      }

      await createCollection(name, pendingCollectionImages, parentId);
      addNotification("Pasta criada com sucesso", "success");
      setPendingCollectionImages([]);
    } else {
      if (collectionToRename) {
        await updateCollection(collectionToRename, { name });
        addNotification("Pasta renomeada", "success");
        setCollectionToRename(null);
      }
    }
    setIsInputModalOpen(false);
    if (isSelectionMode) {
      setSelectedPaths([]);
      setIsSelectionMode(false);
    }
  };

  const handleOpenRename = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCollectionToRename(id);
    setInputModalMode("rename");
    setIsInputModalOpen(true);
  };

  const handleDeleteCollection = async (id: string) => {
    try {
      await deleteCollection(id);
      addNotification("Pasta excluída", "success");
      if (activeTarget?.type === "virtual" && activeTarget.id === id) {
        handleTargetClick(null);
      }
      setCollectionToDelete(null);
    } catch (err) {
      addNotification("Erro ao excluir pasta", "error");
    }
  };

  // Combinar itens para o Masonry
  const allItems = useMemo(() => {
    const items: GalleryItem[] = [
      ...filteredCollections.map((col) => ({
        type: "collection" as const,
        data: col,
      })),
      ...filteredMedia.map((m): GalleryItem => {
        const isPdf = m.path.toLowerCase().endsWith('.pdf');
        if (isPdf) return { type: 'pdf', data: m };
        return { type: 'image', data: m as ImageAsset };
      }),
    ];
    return items;
  }, [filteredCollections, filteredMedia]);

  const getItemHeight = (item: GalleryItem, width: number) => {
    if (item.type === "collection") {
      return width / 1.4 + 60; 
    }
    if (item.type === 'pdf') {
      return width * 1.41; // Proporção A4
    }
    const img = item.data as ImageAsset;
    if (img.width && img.height) {
      const ratio = img.height / img.width;
      return width * ratio;
    }
    return width; 
  };

  const renderGalleryItem = (
    item: GalleryItem,
    _style: React.CSSProperties,
    index: number,
  ) => {
    if (item.type === "collection") {
      const col = item.data;
      return (
        <div
          className={`${styles.folderCard} ${dropTarget?.id === col.id ? styles["folderCard--dragOver"] : ""}`}
          data-drag-type="folder"
          data-drag-id={col.id}
          onClick={() => handleTargetClick({ type: "virtual", id: col.id })}
        >
          {!disableOrganization && (
            <button
              className={styles.folderCard__delete}
              onClick={(e) => {
                e.stopPropagation();
                setCollectionToDelete(col.id);
              }}
            >
              <Trash2 size={14} />
            </button>
          )}
          <div className={styles.folderCard__previews}>
            {col.images.length > 0 ? (
              <div className={styles.folderCard__heroLayout}>
                <div className={styles.folderCard__hero}>
                  <LazyImage
                    src={resolveAssetPath(col.images[0], rootPath) || ""}
                    alt=""
                  />
                </div>
                <div className={styles.folderCard__sidebar}>
                  {col.images.slice(1, 4).map((p: string, i: number) => (
                    <div key={i} className={styles.folderCard__sideItem}>
                      <LazyImage
                        src={resolveAssetPath(p, rootPath) || ""}
                        alt=""
                      />
                    </div>
                  ))}
                  {col.images.length > 4 && (
                    <div className={styles.folderCard__more}>
                      <MoreHorizontal size={16} />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className={styles.folderCard__empty}>
                <Folder size={48} strokeWidth={1} />
              </div>
            )}
          </div>
          <div className={styles.folderCard__glassInfo}>
            <div
              className={styles.folderCard__text}
              onClick={(e) =>
                !disableOrganization && handleOpenRename(col.id, e)
              }
            >
              <span className={styles.folderCard__name}>{col.name}</span>
              <span className={styles.folderCard__count}>
                {col.images.length} itens
              </span>
            </div>
            <div className={styles.folderCard__icon}>
              <Layers size={14} />
            </div>
          </div>
        </div>
      );
    }

    const media = item.data;
    const isPdf = item.type === 'pdf';

    return (
      <div
        data-drag-type="media"
        data-drag-id={media.path}
        onMouseDown={(e) => !disableOrganization && !isSelectionMode && handleMouseDown(e, media)}
        onDragStart={(e) => e.preventDefault()}
        className={`${styles.card} ${isPdf ? styles['card--pdf'] : ''} ${selectedPaths.includes(media.path) ? styles["card--selected"] : ""} ${draggedItem?.path === media.path ? styles["card--dragging"] : ""} ${dropTarget?.id === media.path ? styles["card--dragOver"] : ""}`}
        style={{ "--delay": `${index * 0.02}s` } as React.CSSProperties}
        onClick={() => {
          if (shouldIgnoreClick()) return;
          if (isSelectionMode) {
            setSelectedPaths((prev) =>
              prev.includes(media.path)
                ? prev.filter((p) => p !== media.path)
                : [...prev, media.path],
            );
          } else if (pickerMode && onSelect) {
            onSelect(media.path);
          } else if (isPdf) {
            setActivePdf(media.path);
            if (!isRightSidebarVisible) toggleRightSidebar();
          } else {
            setActiveImage(media.full_path);
          }
        }}
      >
        <div className={styles.card__preview}>
          {isPdf ? (
            <div className={styles.pdfPlaceholder}>
              <FileText size={48} strokeWidth={1} />
              <span className={styles.pdfBadge}>PDF</span>
            </div>
          ) : (
            <LazyImage
              src={resolveAssetPath(media.path, rootPath) || ""}
              alt={media.name}
            />
          )}
        </div>
        <div className={styles.card__overlay}>
          <span className={styles.card__name}>{media.name}</span>
        </div>
      </div>
    );
  };

  if (activeImage)
    return (
      <div className={styles.viewerWrapper}>
        <ImageViewer
          path={activeImage}
          onBack={() => {
            setActiveImage(null);
            scanImages();
          }}
        />
      </div>
    );

  return (
    <div
      className={`${styles.container} ${pickerMode ? styles["container--picker"] : ""}`}
    >
      <header className={styles.header}>
        <div className={styles.header__title}>
          <div className={styles.breadcrumbs}>
            {getBreadcrumbs().map((crumb, i) => (
              <div key={i} className={styles.breadcrumbItem}>
                {i > 0 && (
                  <ChevronRight
                    size={14}
                    className={styles.breadcrumbSeparator}
                  />
                )}
                <button
                  className={`${styles.breadcrumbBtn} ${crumb.target === activeTarget ? styles["breadcrumbBtn--active"] : ""}`}
                  onClick={() =>
                    handleTargetClick(crumb.target, () => {
                      setIsSelectionMode(false);
                      setSelectedPaths([]);
                    })
                  }
                >
                  {crumb.label}
                </button>
              </div>
            ))}
            {isPickingExisting && (
              <>
                <ChevronRight
                  size={14}
                  className={styles.breadcrumbSeparator}
                />
                <span className={styles.breadcrumbPicking}>
                  Adicionando itens
                </span>
              </>
            )}
          </div>
          <span className={styles.count}>{filteredMedia.length} itens</span>
        </div>

        <SectionTabs
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
        />

        <div className={styles.actions}>
          {!disableOrganization && (
            <div className={styles.collectionActions}>
              <button
                className={styles.actionBtn}
                title="Upload"
                onClick={handleUpload}
              >
                <Upload size={18} />
                {activeTarget && <span>Upload</span>}
              </button>
              {activeTarget?.type === "virtual" && !isPickingExisting && (
                <button
                  className={styles.actionBtn}
                  title="Adicionar"
                  onClick={() => {
                    setIsPickingExisting(true);
                    setIsSelectionMode(true);
                  }}
                >
                  <ImagePlus size={18} />
                  <span>Adicionar</span>
                </button>
              )}
              {activeTarget?.type === "virtual" && !isPickingExisting && (
                <>
                  <button
                    className={styles.actionBtn}
                    title="Renomear Pasta"
                    onClick={() => handleOpenRename(activeTarget.id)}
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    className={`${styles.actionBtn} ${styles["actionBtn--danger"]}`}
                    title="Excluir Pasta"
                    onClick={() => setCollectionToDelete(activeTarget.id)}
                  >
                    <Trash2 size={18} />
                  </button>
                </>
              )}
              <div className={styles.divider} />
            </div>
          )}
          <div className={styles.search}>
            <Search size={16} />
            <input
              type="text"
              placeholder="Buscar..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          {!disableOrganization && (
            <button
              className={`${styles.actionBtn} ${isSelectionMode ? styles["actionBtn--active"] : ""}`}
              onClick={() => {
                setIsSelectionMode(!isSelectionMode);
                setIsPickingExisting(false);
                setSelectedPaths([]);
              }}
            >
              {isSelectionMode ? (
                <>
                  <div className={styles.pulseDot} />
                  <CheckSquare size={18} />
                  <span>Finalizar</span>
                </>
              ) : (
                <>
                  <CheckSquare size={18} />
                  <span>Organizar</span>
                </>
              )}
            </button>
          )}
          <button
            className={styles.refreshBtn}
            onClick={() => {
              if (assetType === 'image' || assetType === 'all') invalidateImageCache();
              if (assetType === 'pdf' || assetType === 'all') invalidatePdfCache();
              if (assetType === 'image' || assetType === 'all') scanImages();
              if (assetType === 'pdf' || assetType === 'all') scanPdfs();
            }}
            disabled={isScanning}
          >
            <RefreshCw size={18} className={isScanning ? styles.spin : ""} />
          </button>
          {onClose && (
            <button
              className={styles.closeBtn}
              onClick={onClose}
              title="Fechar Galeria"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </header>

      <div className={styles.content}>
        <VirtualMasonry
          items={allItems}
          columnWidth={pickerMode ? 260 : 320}
          gap={pickerMode ? 16 : 24}
          getItemKey={(item) =>
            item.type === "collection" ? item.data.id : item.data.path
          }
          getItemHeight={getItemHeight}
          renderItem={renderGalleryItem}
        />
        {isDragging && draggedItem && (
          <div
            className={styles.dragGhost}
            style={{ left: dragPosition.x, top: dragPosition.y }}
          >
            <div className={styles.dragGhost__stack}>
              {draggedItem.path.toLowerCase().endsWith('.pdf') ? (
                <div className={styles.pdfGhost}>
                  <FileText size={24} />
                </div>
              ) : (
                <img
                  src={resolveAssetPath(draggedItem.path, rootPath) || undefined}
                  alt=""
                />
              )}
              {selectedPaths.length > 1 && (
                <div className={styles.dragGhost__count}>
                  <Layers size={14} /> {selectedPaths.length}
                </div>
              )}
            </div>
            {dropTarget && (
              <div className={styles.dragGhost__label}>
                {dropTarget.type === "folder"
                  ? "Adicionar à pasta"
                  : "Criar nova pasta"}
              </div>
            )}
          </div>
        )}
      </div>

      {isSelectionMode && selectedPaths.length > 0 && (
        <div className={styles.selectionBar}>
          <span>{selectedPaths.length} itens selecionados</span>
          <div className={styles.actions}>
            <button
              className={styles.btn}
              onClick={() => {
                setSelectedPaths([]);
                if (isPickingExisting) setIsPickingExisting(false);
              }}
            >
              Cancelar
            </button>
            {isPickingExisting && activeTarget?.type === "virtual" ? (
              <button
                className={`${styles.btn} ${styles["btn--primary"]}`}
                onClick={async () => {
                  await addToCollection(activeTarget.id, selectedPaths);
                  setIsPickingExisting(false);
                  setIsSelectionMode(false);
                  setSelectedPaths([]);
                }}
              >
                Confirmar Adição
              </button>
            ) : (
              <button
                className={`${styles.btn} ${styles["btn--primary"]}`}
                onClick={() => {
                  setPendingCollectionImages(selectedPaths);
                  setInputModalMode("create");
                  setIsInputModalOpen(true);
                }}
              >
                <FolderPlus size={16} /> Criar Pasta
              </button>
            )}
          </div>
        </div>
      )}

      <InputModal
        isOpen={isInputModalOpen}
        onClose={() => {
          setIsInputModalOpen(false);
          setPendingCollectionImages([]);
          setCollectionToRename(null);
        }}
        onConfirm={handleInputConfirm}
        title={inputModalMode === "create" ? "Nova Pasta" : "Renomear Pasta"}
        placeholder="Dê um nome para sua coleção..."
        confirmLabel={inputModalMode === "create" ? "Criar Pasta" : "Renomear"}
        defaultValue={
          inputModalMode === "rename"
            ? collections.find(
                (c) =>
                  c.id === collectionToRename ||
                  (activeTarget?.type === "virtual" &&
                    c.id === activeTarget.id),
              )?.name || ""
            : ""
        }
      />
      <ConfirmModal
        isOpen={!!collectionToDelete}
        onClose={() => setCollectionToDelete(null)}
        onConfirm={() =>
          collectionToDelete && handleDeleteCollection(collectionToDelete)
        }
        title="Excluir Pasta"
        message="Tem certeza que deseja excluir esta pasta? Os itens originais não serão apagados."
        variant="danger"
        confirmLabel="Excluir"
      />
    </div>
  );
}
