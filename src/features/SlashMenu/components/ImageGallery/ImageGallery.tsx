import { useEffect } from "react";
import { useWorkspaceStore } from "@/features/workspace/store/workspaceStore";
import { useUIStore } from "@/store/uiStore";
import { useGalleryStore } from "@/features/image-manager/store/galleryStore";
import { ImageAsset } from "@/tauri-bridge/fs";
import { useImageManager } from "@/shared/hooks/useImageManager/useImageManager";
import { useDragAndDrop } from "@/shared/hooks/useDragAndDrop/useDragAndDrop";
import { useNativeDragDrop } from "@/shared/hooks/useNativeDragDrop/useNativeDragDrop";

// Componentes Shared
import DeleteModal from "@/features/workspace/components/DeleteModal/DeleteModal";
import InputModal from "@/shared/components/Modal/InputModal/InputModal";
import ConfirmModal from "@/shared/components/Modal/ConfirmModal/ConfirmModal";

// Hooks Locais Refatorados
import { useGallerySelection } from "@/features/image-manager/hooks/useGallerySelection";
import { useGalleryModals } from "@/features/image-manager/hooks/useGalleryModals";

// Sub-componentes da Galeria
import { GalleryHeader } from "./components/GalleryHeader";
import { GalleryItem } from "./components/GalleryItem";
import { GallerySelectionBar } from "./components/GallerySelectionBar";
import { GalleryDragGhost } from "./components/GalleryDragGhost";

import { Image as ImageIcon, Search } from "lucide-react";
import styles from "./ImageGallery.module.scss";

const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"];

interface ImageGalleryProps {
  onSelect: (src: string) => void;
  onClose: () => void;
  disableOrganization?: boolean;
  largeModal?: boolean;
}

export default function ImageGallery({
  onSelect,
  onClose,
  disableOrganization = false,
  largeModal = false,
}: ImageGalleryProps) {
  const {
    rootPath,
    cachedImages,
    isScanning,
    scanImages,
    invalidateImageCache,
  } = useWorkspaceStore();
  const { addNotification } = useUIStore();
  const { createCollection, addToCollection, loadCollections } =
    useGalleryStore();

  const {
    isProcessing,
    uploadImages,
    deleteImage,
    deletePhysicalFolder,
    handleImageDrop,
    activeTarget,
    filter,
    setFilter,
    filteredImages,
    filteredCollections,
    filteredPhysicalFolders,
    handleTargetClick,
    getBreadcrumbs,
  } = useImageManager();

  // Estados extraídos para hooks
  const selection = useGallerySelection();
  const modals = useGalleryModals();

  useEffect(() => {
    if (rootPath) {
      scanImages();
      loadCollections();
    }
  }, [rootPath, scanImages, loadCollections]);

  // Configuração do Drag & Drop Interno
  const dnd = useDragAndDrop<ImageAsset>({
    onDrop: async (item, targetType, targetId) => {
      if (disableOrganization) return;

      const success = await handleImageDrop(
        item,
        targetType,
        targetId,
        selection.selectedPaths,
      );

      if (success) {
        if (selection.isSelectionMode) selection.toggleSelectionMode(false);
      } else if (targetType === "image") {
        const sourceItems = selection.selectedPaths.includes(item.path)
          ? selection.selectedPaths
          : [item.path];
        modals.openInputModal(sourceItems);
      }
    },
    isValidTarget: (item, type, id) => {
      if (disableOrganization) return false;
      if (
        type === "image" &&
        (id === item.path || selection.selectedPaths.includes(id))
      )
        return false;
      return true;
    },
  });

  // Drag & Drop Nativo (OS -> App)
  useNativeDragDrop({
    onDrop: async (imagePaths, position) => {
      const element = document.elementFromPoint(position.x, position.y);
      const folderTarget = element?.closest("[data-drag-type]");
      const targetType = folderTarget?.getAttribute("data-drag-type");
      const targetId = folderTarget?.getAttribute("data-drag-id");

      const physicalFolder =
        targetType === "folder"
          ? targetId || ""
          : activeTarget?.type === "physical"
            ? activeTarget.path
            : "";
      const importedPaths = await uploadImages(physicalFolder, imagePaths);

      if (importedPaths) {
        if (targetType === "collection" && targetId) {
          await addToCollection(targetId, importedPaths);
        } else if (activeTarget?.type === "virtual") {
          await addToCollection(activeTarget.id, importedPaths);
        }
      }
    },
    filters: IMAGE_EXTENSIONS,
    disabled: !rootPath,
    targetSelector: `.${styles.modal}`,
  });

  const handleUpload = async () => {
    const physicalFolder =
      activeTarget?.type === "physical" ? activeTarget.path : "";
    const importedPaths = await uploadImages(physicalFolder);
    if (importedPaths && activeTarget?.type === "virtual") {
      await addToCollection(activeTarget.id, importedPaths);
    }
  };

  const handleCreateVirtualFolder = async (name: string) => {
    const parentId =
      activeTarget?.type === "virtual" ? activeTarget.id : undefined;
    await createCollection(
      name.trim(),
      modals.pendingCollectionImages,
      parentId,
    );
    modals.closeInputModal();
    if (selection.isSelectionMode) selection.toggleSelectionMode(false);
    addNotification("Pasta virtual criada", "success");
  };

  const confirmDeleteImage = async () => {
    if (!modals.itemToDelete) return;
    await deleteImage(modals.itemToDelete);
    modals.closeDeleteImage();
  };

  const confirmDeleteFolder = async () => {
    if (!modals.folderToDelete || !rootPath) return;
    await deletePhysicalFolder(modals.folderToDelete);
    modals.closeDeleteFolder();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={`${styles.modal} ${largeModal ? styles["modal--large"] : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <GalleryHeader
          breadcrumbs={getBreadcrumbs()}
          activeTarget={activeTarget}
          isSelectionMode={selection.isSelectionMode}
          isScanning={isScanning}
          isProcessing={isProcessing}
          disableOrganization={disableOrganization}
          onTargetClick={handleTargetClick}
          onToggleSelectionMode={selection.toggleSelectionMode}
          onOpenInputModal={() => modals.openInputModal()}
          onRefresh={() => {
            invalidateImageCache();
            scanImages();
          }}
          onUpload={handleUpload}
          onClose={onClose}
        />

        <div className={styles.searchBar}>
          <div className={styles.searchBar__input}>
            <Search size={16} />
            <input
              placeholder="Buscar imagens ou pastas..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.content}>
          {isScanning && !cachedImages ? (
            <div className={styles.empty}>Escaneando workspace...</div>
          ) : filteredImages.length +
              filteredCollections.length +
              filteredPhysicalFolders.length ===
            0 ? (
            <div className={styles.empty}>
              <ImageIcon size={48} />
              <p>
                {filter
                  ? "Nenhum resultado encontrado."
                  : "Nenhuma imagem nesta pasta."}
              </p>
              {!activeTarget && !filter && (
                <button
                  className={styles.emptyUploadBtn}
                  onClick={handleUpload}
                >
                  Fazer Upload da Primeira Imagem
                </button>
              )}
            </div>
          ) : (
            <div className={styles.grid}>
              {/* Coleções Virtuais */}
              {filteredCollections.map((col) => (
                <GalleryItem
                  key={col.id}
                  type="collection"
                  id={col.id}
                  label={col.name}
                  isDragOver={dnd.dropTarget?.id === col.id}
                  disableOrganization={disableOrganization}
                  onSelect={() =>
                    handleTargetClick({ type: "virtual", id: col.id })
                  }
                  onDelete={(e) => {
                    e.stopPropagation();
                    useGalleryStore.getState().deleteCollection(col.id);
                  }}
                  rootPath={rootPath}
                />
              ))}

              {/* Pastas Físicas */}
              {filteredPhysicalFolders.map((folderPath) => (
                <GalleryItem
                  key={folderPath}
                  type="folder"
                  id={folderPath}
                  label={folderPath.split(/[\\/]/).pop() || ""}
                  isDragOver={dnd.dropTarget?.id === folderPath}
                  disableOrganization={disableOrganization}
                  onSelect={() =>
                    handleTargetClick({ type: "physical", path: folderPath })
                  }
                  onDelete={(e) => {
                    e.stopPropagation();
                    modals.openDeleteFolder(folderPath);
                  }}
                  rootPath={rootPath}
                />
              ))}

              {/* Imagens */}
              {filteredImages.map((item) => (
                <GalleryItem
                  key={item.full_path}
                  type="image"
                  id={item.path}
                  label={item.name}
                  imageItem={item}
                  isSelected={selection.selectedPaths.includes(item.path)}
                  isDragging={dnd.draggedItem?.path === item.path}
                  isDragOver={dnd.dropTarget?.id === item.path}
                  isSelectionMode={selection.isSelectionMode}
                  disableOrganization={disableOrganization}
                  onMouseDown={(e) => dnd.handleMouseDown(e, item)}
                  onSelect={() => {
                    if (dnd.shouldIgnoreClick()) return;
                    if (selection.isSelectionMode) {
                      selection.togglePath(item.path);
                    } else {
                      onSelect(item.path);
                      onClose();
                    }
                  }}
                  onDelete={(e) => {
                    e.stopPropagation();
                    modals.openDeleteImage(item);
                  }}
                  rootPath={rootPath}
                />
              ))}
            </div>
          )}
        </div>

        <GallerySelectionBar
          count={selection.selectedPaths.length}
          onClear={selection.clearSelection}
          onGroup={() => modals.openInputModal(selection.selectedPaths)}
        />

        <GalleryDragGhost
          draggedItem={dnd.draggedItem}
          dragPosition={dnd.dragPosition}
          rootPath={rootPath}
          selectedCount={selection.selectedPaths.length}
          dropTargetLabel={
            dnd.dropTarget
              ? dnd.dropTarget.type === "image"
                ? "Criar nova pasta virtual"
                : "Mover para pasta"
              : null
          }
        />
      </div>

      <DeleteModal
        isOpen={!!modals.itemToDelete}
        onClose={modals.closeDeleteImage}
        onConfirm={confirmDeleteImage}
        itemName={modals.itemToDelete?.name || ""}
        isDir={false}
      />

      <InputModal
        isOpen={modals.isInputModalOpen}
        onClose={modals.closeInputModal}
        onConfirm={handleCreateVirtualFolder}
        title="Nova Pasta Virtual"
        placeholder="Dê um nome para a pasta..."
        confirmLabel="Criar"
      />

      <ConfirmModal
        isOpen={!!modals.folderToDelete}
        onClose={modals.closeDeleteFolder}
        onConfirm={confirmDeleteFolder}
        title="Excluir Pasta Física"
        message="Deseja excluir esta pasta? As imagens originais não serão apagadas, elas serão movidas para a raiz da galeria."
        variant="danger"
        confirmLabel="Excluir e Resgatar Imagens"
      />
    </div>
  );
}
