import { PdfAsset } from '@/tauri-bridge';

/**
 * Interface para metadados de referências bibliográficas.
 */
export interface ReferenceMetadata {
  title?: string;
  author?: string;
  year?: string;
  source?: string;
  [key: string]: string | undefined;
}

/**
 * Estado da Store de Referências (PDFs e Citações).
 */
export interface ReferenceState {
  pinnedNotes: string[];
  metadata: Record<string, ReferenceMetadata>;

  pdfs: PdfAsset[];
  activePdfPath: string | null;
  isLoadingPdfs: boolean;
  referenceTab: 'backlinks' | 'metadata' | 'library';

  pinNote: (path: string) => void;
  unpinNote: (path: string) => void;
  updateMetadata: (path: string, data: ReferenceMetadata) => void;
  clearPins: () => void;
  setReferenceTab: (tab: 'backlinks' | 'metadata' | 'library') => void;

  fetchPdfs: (workspaceRoot: string) => Promise<void>;
  setActivePdf: (path: string | null) => void;
  handleUpload: (externalPaths?: string[]) => Promise<string[]>;
  handleDelete: (pdf: PdfAsset) => Promise<boolean>;
}
