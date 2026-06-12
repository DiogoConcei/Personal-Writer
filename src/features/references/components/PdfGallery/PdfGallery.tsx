import AssetGallery from "@/features/imageview/components/AssetGallery/AssetGallery";
import { useUIStore } from "@/store/uiStore";
import { AssetGalleryProps } from "@/shared/types";

interface PdfGalleryProps extends AssetGalleryProps {
  onToggleMode?: () => void;
}

export function PdfGallery({ onSelect, onClose }: PdfGalleryProps = {}) {
  const { setEditorModal } = useUIStore();

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      setEditorModal('showDocuments', false);
    }
  };

  return (
    <AssetGallery 
      assetType="pdf" 
      onSelect={onSelect}
      onClose={handleClose}
    />
  );
}
