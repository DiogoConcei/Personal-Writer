import React from "react";
import AssetGallery from "@/features/imageview/components/AssetGallery/AssetGallery";
import { ImageGalleryProps } from "@/shared/types";
import styles from "./ImageGallery.module.scss";

/**
 * ImageGallery (SlashMenu Version)
 * 
 * Atua como um wrapper (modal overlay) em torno do componente unificado AssetGallery.
 * Reduz a complexidade e garante sincronia visual e funcional entre os domínios.
 */
const ImageGallery: React.FC<ImageGalleryProps> = ({
  onSelect,
  onClose,
  disableOrganization = false,
  largeModal = false,
}) => {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={`${styles.modal} ${largeModal ? styles["modal--large"] : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <AssetGallery 
          pickerMode 
          onSelect={onSelect} 
          onClose={onClose} 
          disableOrganization={disableOrganization}
        />
      </div>
    </div>
  );
};

export default ImageGallery;
