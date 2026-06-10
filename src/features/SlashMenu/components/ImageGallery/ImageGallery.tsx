import React from "react";
import AssetGallery from "@/features/imageview/components/AssetGallery/AssetGallery";
import { ImageGalleryProps } from "@/shared/types";
import Modal from "@/shared/components/Modal/Modal/Modal";

/**
 * ImageGallery (SlashMenu Version)
 *
 * Atua como um wrapper em torno do componente unificado AssetGallery utilizando o Modal compartilhado.
 * Garante que a galeria seja exibida com proporções corretas e controles de fechamento visíveis.
 */

const ImageGallery: React.FC<ImageGalleryProps> = ({
  onSelect,
  onClose,
  disableOrganization = false,
  title,
  children
}) => {
  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      size="xl"
      padding={false}
      showHeader={!!title}
      title={title}
    >
      {children}
      <AssetGallery
        pickerMode
        onSelect={onSelect}
        onClose={onClose}
        disableOrganization={disableOrganization}
      />
    </Modal>
  );
};

export default ImageGallery;
