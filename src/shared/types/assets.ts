export interface PdfData {
  path: string;
  startPage: number;
  endPage: number;
  totalPages: number;
}

export interface ImageData {
  path: string;
  naturalWidth?: number;
  naturalHeight?: number;
}

export type SplitMode = 'amount' | 'single' | 'range';
